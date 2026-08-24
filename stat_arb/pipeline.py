"""Wires the pipeline together end to end:

NQ historical data -> trading signals -> simulated Lucid account ->
account-state calculator -> Monte Carlo engine -> payout/failure
probabilities -> EV -> position sizing -> results.
"""

from __future__ import annotations

from typing import List, Optional, Sequence

from .account import LUCID_TIER_PRESETS, LucidAccountConfig
from .data import load_ohlcv_csv, synthetic_nq_data
from .monte_carlo import build_day_blocks
from .position_sizing import sweep_position_sizes
from .report import print_summary, save_results
from .signals import SignalParams, generate_trades


def run_pipeline(
    data_path: Optional[str],
    account_size: int,
    contract_sizes: Sequence[int],
    point_value: float,
    n_sims: int,
    max_days: int,
    seed: int,
    out_dir: str,
    signal_params: Optional[SignalParams] = None,
) -> None:
    if data_path:
        df = load_ohlcv_csv(data_path)
        data_source = f"CSV: {data_path}"
    else:
        df = synthetic_nq_data(seed=seed)
        data_source = "SYNTHETIC demo data -- not real NQ history, replace with --data <csv>"

    params = signal_params or SignalParams(point_value=point_value)
    trades = generate_trades(df, params)
    if trades.empty:
        raise RuntimeError("No trades were generated from this dataset/parameter set -- nothing to simulate")

    day_blocks = build_day_blocks(trades)

    if account_size not in LUCID_TIER_PRESETS:
        raise ValueError(f"Unknown account_size {account_size}; choose from {sorted(LUCID_TIER_PRESETS)}")
    eval_config: LucidAccountConfig = LUCID_TIER_PRESETS[account_size]

    sweep = sweep_position_sizes(
        day_blocks=day_blocks,
        eval_config=eval_config,
        contract_sizes=contract_sizes,
        n_sims=n_sims,
        max_days=max_days,
        seed=seed,
    )

    print(f"Backtested trades: {len(trades)} across {len(day_blocks)} trading day(s)")
    print_summary(sweep, eval_config, data_source)
    save_results(sweep, eval_config, out_dir, data_source)
    print(f"\nSaved: {out_dir}/position_sizing_sweep.csv, summary.json, position_sizing.png")
