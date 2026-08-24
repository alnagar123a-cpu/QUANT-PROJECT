"""Stage 9: results -- print, save, and plot the position-sizing sweep."""

from __future__ import annotations

import json
import os
from dataclasses import asdict
from typing import Optional

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

from .account import LucidAccountConfig


def print_summary(sweep: pd.DataFrame, config: LucidAccountConfig, data_source: str) -> None:
    best = sweep.loc[sweep["ev"].idxmax()]
    print("=" * 72)
    print("NQ statistical mean-reversion x Lucid account -- simulation results")
    print("=" * 72)
    print(f"Data source: {data_source}")
    print(
        f"Account: ${config.account_size:,.0f} | target ${config.profit_target:,.0f} | "
        f"trailing DD ${config.trailing_drawdown:,.0f} | "
        f"daily loss limit {'none' if config.daily_loss_limit is None else f'${config.daily_loss_limit:,.0f}'}"
    )
    print("(account numbers are best-effort estimates -- verify against your own Lucid dashboard)")
    print()
    print(sweep.to_string(index=False, float_format=lambda x: f"{x:,.3f}"))
    print()
    print(
        f"Best EV: {int(best['contracts'])} contract(s) -> EV ${best['ev']:,.2f} per attempt "
        f"(P(pass eval) {best['p_pass_eval']:.1%}, P(reach payout) {best['p_reach_payout']:.1%})"
    )


def save_results(sweep: pd.DataFrame, config: LucidAccountConfig, out_dir: str, data_source: str) -> None:
    os.makedirs(out_dir, exist_ok=True)

    sweep.to_csv(os.path.join(out_dir, "position_sizing_sweep.csv"), index=False)

    best = sweep.loc[sweep["ev"].idxmax()].to_dict()
    with open(os.path.join(out_dir, "summary.json"), "w") as f:
        json.dump(
            {
                "data_source": data_source,
                "account_config": asdict(config),
                "best_by_ev": best,
                "sweep": sweep.to_dict(orient="records"),
            },
            f,
            indent=2,
            default=str,
        )

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))

    axes[0].plot(sweep["contracts"], sweep["ev"], marker="o", color="#2563eb")
    axes[0].axhline(0, color="#94a3b8", linewidth=1, linestyle="--")
    axes[0].set_xlabel("Contracts")
    axes[0].set_ylabel("Expected value per attempt ($)")
    axes[0].set_title("EV vs. position size")

    axes[1].plot(sweep["contracts"], sweep["p_pass_eval"], marker="o", label="P(pass eval)", color="#16a34a")
    axes[1].plot(sweep["contracts"], sweep["p_reach_payout"], marker="o", label="P(reach payout)", color="#0891b2")
    axes[1].plot(
        sweep["contracts"], sweep["p_failed_drawdown_eval"], marker="o", label="P(fail: drawdown)", color="#dc2626"
    )
    axes[1].set_xlabel("Contracts")
    axes[1].set_ylabel("Probability")
    axes[1].set_title("Outcome probabilities vs. position size")
    axes[1].legend(fontsize=8)

    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "position_sizing.png"), dpi=150)
    plt.close(fig)
