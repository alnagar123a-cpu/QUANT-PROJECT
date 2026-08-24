"""Stages 7-8: expected value + position sizing sweep.

Chains an evaluation-phase Monte Carlo with a funded-phase Monte Carlo
(same historical day-blocks, funded account rules) to get the probability
of reaching an actual payout, then sweeps contract count to see how size
trades off EV against failure probability.

Simplifying assumptions (see account.py's module docstring on why the
account numbers themselves are best-effort):
  - The funded stage reuses the eval's profit_target as the payout trigger.
  - `assume_retry=True` models buying a fresh evaluation after every failed
    attempt until one passes (expected attempts = 1 / p_pass), which is the
    common way retail traders actually use these challenges.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Sequence

import numpy as np
import pandas as pd

from .account import LucidAccountConfig, Outcome, funded_config_from_eval
from .monte_carlo import MCResult, run_monte_carlo


@dataclass
class EVResult:
    contracts: int
    p_pass_eval: float
    p_payout_given_funded: float
    p_reach_payout: float
    avg_payout_gain: float
    expected_cost: float
    expected_gross_payout: float
    ev: float


def expected_value(
    eval_mc: MCResult,
    funded_mc: MCResult,
    config: LucidAccountConfig,
    assume_retry: bool = True,
) -> EVResult:
    p_pass = eval_mc.probability(Outcome.PASSED)
    p_payout = funded_mc.probability(Outcome.PASSED)
    payout_balances = funded_mc.final_balances_for(Outcome.PASSED)
    avg_gain = float(np.mean([b - config.account_size for b in payout_balances])) if payout_balances else 0.0

    if assume_retry and p_pass > 0:
        expected_attempts = 1.0 / p_pass
    else:
        expected_attempts = 1.0

    expected_cost = expected_attempts * config.challenge_fee + p_pass * config.activation_fee
    expected_gross_payout = p_pass * p_payout * avg_gain * config.payout_split
    ev = expected_gross_payout - expected_cost

    return EVResult(
        contracts=eval_mc.contracts,
        p_pass_eval=p_pass,
        p_payout_given_funded=p_payout,
        p_reach_payout=p_pass * p_payout,
        avg_payout_gain=avg_gain,
        expected_cost=expected_cost,
        expected_gross_payout=expected_gross_payout,
        ev=ev,
    )


def sweep_position_sizes(
    day_blocks: Sequence[Sequence[float]],
    eval_config: LucidAccountConfig,
    contract_sizes: Sequence[int],
    n_sims: int = 5000,
    max_days: int = 120,
    seed: int = 42,
    assume_retry: bool = True,
) -> pd.DataFrame:
    funded_config = funded_config_from_eval(eval_config)
    rows: List[dict] = []

    for contracts in contract_sizes:
        eval_mc = run_monte_carlo(day_blocks, eval_config, contracts, n_sims, max_days, seed)
        funded_mc = run_monte_carlo(day_blocks, funded_config, contracts, n_sims, max_days, seed + 1)
        ev = expected_value(eval_mc, funded_mc, eval_config, assume_retry)

        rows.append(
            {
                "contracts": contracts,
                "p_pass_eval": ev.p_pass_eval,
                "p_failed_drawdown_eval": eval_mc.probability(Outcome.FAILED_DRAWDOWN),
                "p_failed_daily_loss_eval": eval_mc.probability(Outcome.FAILED_DAILY_LOSS),
                "p_payout_given_funded": ev.p_payout_given_funded,
                "p_reach_payout": ev.p_reach_payout,
                "avg_payout_gain": ev.avg_payout_gain,
                "expected_cost": ev.expected_cost,
                "expected_gross_payout": ev.expected_gross_payout,
                "ev": ev.ev,
            }
        )

    return pd.DataFrame(rows)
