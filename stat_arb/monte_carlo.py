"""Stage 5-6: Monte Carlo engine + payout/failure probabilities.

Bootstraps whole trading days (not individual trades, to preserve
within-day correlation) from the historical backtest and replays each
resampled sequence through the account-state calculator, many times, to
build an empirical distribution of outcomes.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Dict, List, Sequence

import numpy as np
import pandas as pd

from .account import AccountResult, LucidAccountConfig, Outcome, simulate_account


def build_day_blocks(trades: pd.DataFrame) -> List[List[float]]:
    """Group a trades DataFrame (from signals.generate_trades) into a list of
    days, each a list of per-trade $ P&L at 1 contract, ordered by date."""
    if trades.empty:
        return []
    grouped = trades.sort_values("entry_time").groupby("date")["pnl_dollars_1x"]
    return [list(vals) for _, vals in grouped]


@dataclass
class MCResult:
    n_sims: int
    contracts: int
    outcomes: Counter
    outcome_list: List[Outcome]
    days_taken: List[int]
    final_balances: List[float]
    max_drawdowns: List[float]

    def probability(self, outcome: Outcome) -> float:
        return self.outcomes.get(outcome, 0) / self.n_sims if self.n_sims else 0.0

    def final_balances_for(self, outcome: Outcome) -> List[float]:
        return [b for o, b in zip(self.outcome_list, self.final_balances) if o == outcome]

    def summary(self) -> Dict[str, float]:
        return {
            "p_passed": self.probability(Outcome.PASSED),
            "p_failed_drawdown": self.probability(Outcome.FAILED_DRAWDOWN),
            "p_failed_daily_loss": self.probability(Outcome.FAILED_DAILY_LOSS),
            "p_incomplete": self.probability(Outcome.INCOMPLETE),
            "avg_days_to_resolution": float(np.mean(self.days_taken)) if self.days_taken else float("nan"),
            "avg_final_balance": float(np.mean(self.final_balances)) if self.final_balances else float("nan"),
        }


def run_monte_carlo(
    day_blocks: Sequence[Sequence[float]],
    config: LucidAccountConfig,
    contracts: int,
    n_sims: int = 5000,
    max_days: int = 120,
    seed: int = 42,
) -> MCResult:
    if not day_blocks:
        raise ValueError("day_blocks is empty -- no historical trades to bootstrap from")

    rng = np.random.default_rng(seed)
    n_available = len(day_blocks)

    outcomes: Counter = Counter()
    outcome_list: List[Outcome] = []
    days_taken: List[int] = []
    final_balances: List[float] = []
    max_drawdowns: List[float] = []

    for _ in range(n_sims):
        idx = rng.integers(0, n_available, size=max_days)
        sampled_days = [day_blocks[i] for i in idx]
        result: AccountResult = simulate_account(sampled_days, config, contracts, max_days)
        outcomes[result.outcome] += 1
        outcome_list.append(result.outcome)
        days_taken.append(result.days_taken)
        final_balances.append(result.final_balance)
        max_drawdowns.append(result.max_drawdown_seen)

    return MCResult(
        n_sims=n_sims,
        contracts=contracts,
        outcomes=outcomes,
        outcome_list=outcome_list,
        days_taken=days_taken,
        final_balances=final_balances,
        max_drawdowns=max_drawdowns,
    )
