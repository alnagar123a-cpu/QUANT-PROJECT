"""Stage 2: trading signals -- z-score mean reversion on NQ.

Single-instrument statistical mean reversion: track how far price has
deviated from its own rolling mean in standard-deviation units (z-score),
enter betting on reversion back toward the mean, exit on reversion or an
ATR-based stop. This is the "statistical" half of statistical arbitrage
without a second pairs leg -- swap in a spread series here later if you want
classic two-instrument stat arb instead.

Every position is force-flattened at the last bar of its calendar day,
matching Lucid Trading's no-swing-trading rule (positions must close
intraday).
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass
class SignalParams:
    zscore_window: int = 50       # bars used for the rolling mean/std
    entry_z: float = 2.0          # |z| beyond this opens a position
    exit_z: float = 0.25          # |z| back inside this closes on reversion
    atr_len: int = 14
    stop_atr_mult: float = 1.5    # stop distance, in ATRs, from entry
    max_hold_bars: int = 96       # safety timeout (96 * 5m = 8h)
    point_value: float = 2.0      # $/point; 2.0 = MNQ micro, 20.0 = NQ e-mini
    contracts: int = 1
    session_flatten: bool = True  # force-close at the last bar of each day


def _atr(df: pd.DataFrame, length: int) -> pd.Series:
    prev_close = df["close"].shift(1)
    tr = pd.concat(
        [df["high"] - df["low"], (df["high"] - prev_close).abs(), (df["low"] - prev_close).abs()],
        axis=1,
    ).max(axis=1)
    return tr.rolling(length).mean()


def compute_zscore(df: pd.DataFrame, window: int) -> pd.Series:
    mean = df["close"].rolling(window).mean()
    std = df["close"].rolling(window).std(ddof=0)
    return (df["close"] - mean) / std.replace(0, np.nan)


def generate_trades(df: pd.DataFrame, params: SignalParams) -> pd.DataFrame:
    """Replay the z-score strategy bar-by-bar and return one row per closed trade."""
    z = compute_zscore(df, params.zscore_window)
    atr = _atr(df, params.atr_len)
    dates = df.index.date

    warmup = max(params.zscore_window, params.atr_len)
    trades = []

    direction = 0  # 0 flat, 1 long, -1 short
    entry_price = entry_idx = stop_price = None

    n = len(df)
    for i in range(warmup, n):
        zi = z.iloc[i]
        if np.isnan(zi):
            continue

        is_last_bar_of_day = (i == n - 1) or (dates[i + 1] != dates[i])

        if direction == 0:
            if zi <= -params.entry_z:
                direction = 1
                entry_price = df["close"].iloc[i]
                entry_idx = i
                stop_price = entry_price - atr.iloc[i] * params.stop_atr_mult
            elif zi >= params.entry_z:
                direction = -1
                entry_price = df["close"].iloc[i]
                entry_idx = i
                stop_price = entry_price + atr.iloc[i] * params.stop_atr_mult
            continue

        # in a position: check exit conditions in priority order
        exit_price = None
        reason = None
        if direction == 1:
            if df["low"].iloc[i] <= stop_price:
                exit_price, reason = stop_price, "stop"
            elif abs(zi) <= params.exit_z:
                exit_price, reason = df["close"].iloc[i], "reversion"
        else:
            if df["high"].iloc[i] >= stop_price:
                exit_price, reason = stop_price, "stop"
            elif abs(zi) <= params.exit_z:
                exit_price, reason = df["close"].iloc[i], "reversion"

        if exit_price is None and i - entry_idx >= params.max_hold_bars:
            exit_price, reason = df["close"].iloc[i], "timeout"
        if exit_price is None and params.session_flatten and is_last_bar_of_day:
            exit_price, reason = df["close"].iloc[i], "session_flatten"

        if exit_price is not None:
            pnl_points = (exit_price - entry_price) * direction
            trades.append(
                {
                    "entry_time": df.index[entry_idx],
                    "exit_time": df.index[i],
                    "date": dates[entry_idx],
                    "direction": "long" if direction == 1 else "short",
                    "entry_price": entry_price,
                    "exit_price": exit_price,
                    "pnl_points": pnl_points,
                    "pnl_dollars_1x": pnl_points * params.point_value,
                    "pnl_dollars": pnl_points * params.point_value * params.contracts,
                    "exit_reason": reason,
                }
            )
            direction = 0
            entry_price = entry_idx = stop_price = None

    return pd.DataFrame(trades)
