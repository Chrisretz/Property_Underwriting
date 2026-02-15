"""
Cashflow engine for property underwriting.
Generates levered and unlevered cashflow projections with loan schedule.
"""

from typing import NamedTuple


class CashflowPeriod(NamedTuple):
    """Single period cashflow data."""
    period: int
    egi: float
    opex: float
    noi: float
    debt_service: float
    interest_expense: float
    principal_amortization: float
    loan_balance_begin: float
    loan_balance_end: float
    capex: float
    levered_cf: float
    unlevered_cf: float
    cumulative_equity: float


def calculate_cashflows(
    purchase_price: float,
    hold_period: int,
    gross_rent: float,
    vacancy_pct: float,
    rent_growth_pct: float,
    opex_pct: float,
    capex_reserve_pct: float,
    ltv_pct: float,
    interest_rate: float,
    amortization_years: int,
    interest_only: bool,
    exit_cap_rate: float,
    exit_costs_pct: float,
    acquisition_costs_pct: float,
) -> list[CashflowPeriod]:
    """Generate levered and unlevered cashflows with full loan schedule."""
    periods: list[CashflowPeriod] = []
    equity = purchase_price * (1 + acquisition_costs_pct) * (1 - ltv_pct)
    loan_amount = purchase_price * (1 + acquisition_costs_pct) * ltv_pct

    # Annual debt service
    if interest_only:
        annual_debt_service = loan_amount * interest_rate
    else:
        monthly_rate = interest_rate / 12
        n_payments = amortization_years * 12
        monthly_payment = loan_amount * (
            monthly_rate * (1 + monthly_rate) ** n_payments
        ) / ((1 + monthly_rate) ** n_payments - 1)
        annual_debt_service = monthly_payment * 12

    cumulative_equity = -equity - purchase_price * acquisition_costs_pct
    egi = gross_rent * (1 - vacancy_pct)
    balance = loan_amount

    for period in range(1, hold_period + 1):
        egi = egi * (1 + rent_growth_pct)
        opex = egi * opex_pct
        noi = egi - opex
        capex = gross_rent * (1 - vacancy_pct) * capex_reserve_pct * (1 + rent_growth_pct) ** (period - 1)

        balance_begin = balance
        interest_expense = balance_begin * interest_rate
        principal_amortization = annual_debt_service - interest_expense
        if interest_only:
            principal_amortization = 0.0
        balance_end = max(0.0, balance_begin - principal_amortization)
        balance = balance_end

        debt_service = interest_expense + principal_amortization
        levered_cf = noi - debt_service - capex
        unlevered_cf = noi - capex

        cumulative_equity += levered_cf

        periods.append(
            CashflowPeriod(
                period=period,
                egi=egi,
                opex=opex,
                noi=noi,
                debt_service=debt_service,
                interest_expense=interest_expense,
                principal_amortization=principal_amortization,
                loan_balance_begin=balance_begin,
                loan_balance_end=balance_end,
                capex=capex,
                levered_cf=levered_cf,
                unlevered_cf=unlevered_cf,
                cumulative_equity=cumulative_equity,
            )
        )

    return periods


def calculate_exit(
    noi_final: float,
    exit_cap_rate: float,
    exit_costs_pct: float,
    loan_amount: float,
) -> tuple[float, float]:
    """Calculate exit proceeds and net to equity."""
    exit_value = noi_final / exit_cap_rate
    exit_proceeds = exit_value * (1 - exit_costs_pct)
    net_to_equity = exit_proceeds - loan_amount
    return exit_proceeds, net_to_equity
