#!/usr/bin/env python3
"""CLI entry point for the NQ stat-arb -> Lucid account simulation pipeline.

Examples:
    python run_pipeline.py                                   # synthetic demo data
    python run_pipeline.py --data my_nq_5m.csv --account-size 50000
    python run_pipeline.py --contracts 1 2 3 5 8 --n-sims 10000
"""

from __future__ import annotations

import argparse

from stat_arb.account import LUCID_TIER_PRESETS
from stat_arb.pipeline import run_pipeline


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data", default=None, help="Path to a CSV of NQ OHLCV bars. Omit to use synthetic demo data.")
    parser.add_argument(
        "--account-size", type=int, default=50_000, choices=sorted(LUCID_TIER_PRESETS),
        help="Lucid account tier to simulate.",
    )
    parser.add_argument(
        "--contracts", type=int, nargs="+", default=[1, 2, 3, 5, 8, 12, 16, 20],
        help="Contract sizes to sweep for position sizing.",
    )
    parser.add_argument(
        "--point-value", type=float, default=2.0,
        help="$ per index point per contract (2.0 = MNQ micro, 20.0 = NQ e-mini).",
    )
    parser.add_argument("--n-sims", type=int, default=5000, help="Monte Carlo simulations per contract size.")
    parser.add_argument("--max-days", type=int, default=120, help="Max simulated trading days per attempt.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    parser.add_argument("--out-dir", default="stat_arb_results", help="Directory to write results into.")
    args = parser.parse_args()

    run_pipeline(
        data_path=args.data,
        account_size=args.account_size,
        contract_sizes=args.contracts,
        point_value=args.point_value,
        n_sims=args.n_sims,
        max_days=args.max_days,
        seed=args.seed,
        out_dir=args.out_dir,
    )


if __name__ == "__main__":
    main()
