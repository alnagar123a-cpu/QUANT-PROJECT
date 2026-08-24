"""Stages 3-4: simulated Lucid account + account-state calculator.

Models a Lucid-style evaluation/funded account as a small state machine:
an end-of-day trailing max-loss line (ratchets up with the account's
highest closed daily balance, per Lucid's published EOD-trailing rule),
an optional intraday daily loss limit, and a profit target.

IMPORTANT -- verify these numbers yourself: this sandbox has no outbound
network access to lucidtrading.com (blocked by the egress proxy) or a live
data feed, so the tier presets below were assembled from third-party review
sites, which do not agree with each other and read as SEO/affiliate content
rather than primary documentation. Treat LUCID_TIER_PRESETS as a rough
starting point, not ground truth -- pull the real numbers from your own
Lucid dashboard/agreement before relying on this for sizing decisions.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from enum import Enum
from typing import List, Optional, Sequence


class Outcome(str, Enum):
    PASSED = "passed"                    # hit profit target with enough trading days
    FAILED_DRAWDOWN = "failed_drawdown"  # breached the trailing max-loss line
    FAILED_DAILY_LOSS = "failed_daily_loss"
    INCOMPLETE = "incomplete"            # ran out of simulated days unresolved


@dataclass
class LucidAccountConfig:
    account_size: float
    profit_target: float
    trailing_drawdown: float
    daily_loss_limit: Optional[float] = None
    min_trading_days: int = 5
    payout_split: float = 0.90
    challenge_fee: float = 0.0
    activation_fee: float = 0.0
    reset_fee: float = 0.0


@dataclass
class AccountResult:
    outcome: Outcome
    days_taken: int
    final_balance: float
    trading_days: int
    max_drawdown_seen: float


# Best-effort defaults for LucidTest evaluation accounts -- see module
# docstring. profit_target is estimated at 5% of account size except the
# $25K tier (confirmed by multiple sources at $1,250); flag anything you
# haven't personally verified.
LUCID_TIER_PRESETS = {
    25_000: LucidAccountConfig(
        account_size=25_000, profit_target=1_250, trailing_drawdown=1_000,
        daily_loss_limit=None, min_trading_days=5, payout_split=0.90,
    ),
    50_000: LucidAccountConfig(
        account_size=50_000, profit_target=2_500, trailing_drawdown=2_000,
        daily_loss_limit=1_200, min_trading_days=5, payout_split=0.90,
    ),
    100_000: LucidAccountConfig(
        account_size=100_000, profit_target=5_000, trailing_drawdown=3_000,
        daily_loss_limit=1_800, min_trading_days=5, payout_split=0.90,
    ),
    150_000: LucidAccountConfig(
        account_size=150_000, profit_target=9_000, trailing_drawdown=4_500,
        daily_loss_limit=2_700, min_trading_days=5, payout_split=0.90,
    ),
}


def funded_config_from_eval(eval_cfg: LucidAccountConfig) -> LucidAccountConfig:
    """Best-effort funded-stage config: same size/DD/DLL, target treated as the
    profit level that triggers a payout rather than passing an evaluation."""
    return replace(eval_cfg, min_trading_days=0)


def simulate_account(
    day_blocks: Sequence[Sequence[float]],
    config: LucidAccountConfig,
    contracts: int,
    max_days: int,
) -> AccountResult:
    """Replay a sequence of simulated trading days through the account rules.

    day_blocks: list of days, each a list of per-trade $ P&L at 1 contract.
    Trades are scaled by `contracts` here so the same historical day-blocks
    can be reused across a position-size sweep.
    """
    balance = config.account_size
    high_water = config.account_size
    trailing_line = config.account_size - config.trailing_drawdown
    max_dd_seen = 0.0
    trading_days = 0

    for day_idx, day_trades in enumerate(day_blocks[:max_days]):
        if day_trades:
            trading_days += 1
        day_start_balance = balance

        for pnl_1x in day_trades:
            balance += pnl_1x * contracts
            max_dd_seen = max(max_dd_seen, high_water - balance)

            if config.daily_loss_limit is not None and (day_start_balance - balance) >= config.daily_loss_limit:
                return AccountResult(Outcome.FAILED_DAILY_LOSS, day_idx + 1, balance, trading_days, max_dd_seen)
            if balance <= trailing_line:
                return AccountResult(Outcome.FAILED_DRAWDOWN, day_idx + 1, balance, trading_days, max_dd_seen)

        # trailing line only ratchets at end-of-day, per Lucid's EOD-trailing rule
        high_water = max(high_water, balance)
        trailing_line = max(trailing_line, high_water - config.trailing_drawdown)

        if (balance - config.account_size) >= config.profit_target and trading_days >= config.min_trading_days:
            return AccountResult(Outcome.PASSED, day_idx + 1, balance, trading_days, max_dd_seen)

    return AccountResult(Outcome.INCOMPLETE, min(len(day_blocks), max_days), balance, trading_days, max_dd_seen)
