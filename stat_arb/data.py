"""Stage 1: NQ historical data.

Loads OHLCV bars from a user-supplied CSV, or falls back to a synthetic
random-walk series so the rest of the pipeline is runnable without a real
data feed. This sandbox has no outbound network access to a market data
provider (Yahoo Finance, Stooq, broker APIs are all egress-blocked), so real
history has to come from a file you provide -- e.g. an export from
TradingView, your broker, or a vendor like Databento.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

REQUIRED_COLUMNS = ["open", "high", "low", "close", "volume"]


def load_ohlcv_csv(path: str) -> pd.DataFrame:
    """Load OHLCV bars from a CSV.

    Expects a timestamp column (named timestamp/datetime/date/time, any case)
    and open/high/low/close/volume columns. Returns a DataFrame indexed by
    UTC-naive timestamp, sorted ascending, with lowercase column names.
    """
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]

    ts_col = next((c for c in ("timestamp", "datetime", "date", "time") if c in df.columns), None)
    if ts_col is None:
        raise ValueError(
            f"No timestamp column found in {path}; expected one of "
            "timestamp/datetime/date/time plus open/high/low/close/volume"
        )
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"{path} is missing required column(s): {missing}")

    df[ts_col] = pd.to_datetime(df[ts_col])
    df = df.set_index(ts_col).sort_index()
    df.index.name = "timestamp"
    return df[REQUIRED_COLUMNS]


def synthetic_nq_data(
    start: str = "2025-01-02",
    n_days: int = 90,
    bars_per_day: int = 78,
    bar_minutes: int = 5,
    start_price: float = 21000.0,
    daily_vol_pts: float = 220.0,
    seed: int = 7,
) -> pd.DataFrame:
    """Generate a synthetic NQ-like 5-minute OHLCV series for demo/dev use.

    NOT real market data -- illustrative only, calibrated to a rough NQ price
    level and daily point range so the pipeline produces plausible-looking
    numbers. Replace with load_ohlcv_csv(your_real_data.csv) for anything
    that should inform an actual trading or sizing decision.
    """
    rng = np.random.default_rng(seed)
    bar_vol = daily_vol_pts / np.sqrt(bars_per_day)

    session_start = pd.Timestamp(start) + pd.Timedelta(hours=9, minutes=30)
    rows = []
    price = start_price
    for day in range(n_days):
        day_open = session_start + pd.Timedelta(days=day)
        if day_open.weekday() >= 5:  # skip weekends
            continue
        # mild mean-reverting drift around the session's opening price so the
        # z-score signal has something to trade intraday
        day_anchor = price
        for bar in range(bars_per_day):
            ts = day_open + pd.Timedelta(minutes=bar_minutes * bar)
            pull = (day_anchor - price) * 0.02
            shock = rng.normal(0, bar_vol)
            price = max(price + pull + shock, 100.0)
            o = price
            h = price + abs(rng.normal(0, bar_vol * 0.3))
            l = price - abs(rng.normal(0, bar_vol * 0.3))
            c = price + rng.normal(0, bar_vol * 0.2)
            price = c
            vol = max(int(rng.normal(1500, 400)), 50)
            rows.append((ts, o, h, l, c, vol))

    df = pd.DataFrame(rows, columns=["timestamp", "open", "high", "low", "close", "volume"])
    df = df.set_index("timestamp")
    return df
