"""
Investment metrics calculation: IRR, equity multiple, cash-on-cash, DSCR.
"""

import math
from typing import NamedTuple

from services.cashflow import CashflowPeriod


class InvestmentMetrics(NamedTuple):
    """Investment metrics output."""
    irr_pct: float
    equity_multiple: float
    cash_on_cash_pct: float
    dscr: float
    noi_yield_pct: float
    cap_rate_pct: float


def calculate_irr(cashflows: list[float], initial_investment: float, tolerance: float = 1e-6) -> float:
    """Calculate IRR using Newton-Raphson method."""
    def npv(rate: float) -> float:
        total = -initial_investment
        for i, cf in enumerate(cashflows, 1):
            total += cf / (1 + rate) ** i
        return total

    def dnpv(rate: float) -> float:
        total = 0
        for i, cf in enumerate(cashflows, 1):
            total -= i * cf / (1 + rate) ** (i + 1)
        return total

    rate = 0.10
    for _ in range(100):
        n = npv(rate)
        if abs(n) < tolerance:
            return rate
        d = dnpv(rate)
        if abs(d) < tolerance:
            break
        rate = rate - n / d

    return 0.0


def calculate_equity_multiple(total_proceeds: float, initial_equity: float) -> float:
    """Equity multiple = total proceeds / initial equity (initial_equity is negative for outflow)."""
    eq = abs(initial_equity)
    if eq <= 0:
        return 0.0
    return total_proceeds / eq


def calculate_cash_on_cash(annual_cashflow: float, initial_equity: float) -> float:
    """Cash-on-cash return = annual cashflow / initial equity (initial_equity is negative for outflow)."""
    eq = abs(initial_equity)
    if eq <= 0:
        return 0.0
    return annual_cashflow / eq


def calculate_dscr(noi: float, debt_service: float) -> float:
    """DSCR = NOI / debt service."""
    if debt_service <= 0:
        return 0.0
    return noi / debt_service


def compute_metrics(
    periods: list[CashflowPeriod],
    initial_equity: float,
    exit_proceeds: float,
) -> InvestmentMetrics:
    """Compute all investment metrics."""
    if not periods:
        return InvestmentMetrics(0, 0, 0, 0, 0, 0)

    cashflows = [p.levered_cf for p in periods]
    total_proceeds = sum(cashflows) + exit_proceeds
    avg_noi = sum(p.noi for p in periods) / len(periods)
    avg_ds = periods[0].debt_service if periods else 0
    year1_noi = periods[0].noi
    purchase_price_est = initial_equity / 0.35  # rough estimate for cap rate

    irr = calculate_irr(cashflows + [exit_proceeds], abs(initial_equity))
    equity_mult = calculate_equity_multiple(total_proceeds, initial_equity)
    coc = calculate_cash_on_cash(periods[0].levered_cf if periods else 0, initial_equity)
    dscr = calculate_dscr(year1_noi, avg_ds)
    noi_yield = year1_noi / abs(initial_equity) if initial_equity else 0
    cap_rate = year1_noi / purchase_price_est if purchase_price_est else 0

    return InvestmentMetrics(
        irr_pct=irr * 100,
        equity_multiple=round(equity_mult, 2),
        cash_on_cash_pct=coc * 100,
        dscr=round(dscr, 2),
        noi_yield_pct=noi_yield * 100,
        cap_rate_pct=cap_rate * 100,
    )
