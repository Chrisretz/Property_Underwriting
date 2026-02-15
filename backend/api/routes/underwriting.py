"""
Underwriting API routes.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from models.assumptions import UnderwritingInput
from services.cashflow import (
    calculate_cashflows,
    calculate_exit,
    CashflowPeriod,
)
from services.metrics import compute_metrics, InvestmentMetrics

router = APIRouter()


class CashflowOutput(BaseModel):
    """Single period cashflow output."""
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


class MetricsOutput(BaseModel):
    """Investment metrics output."""
    irr_pct: float
    equity_multiple: float
    cash_on_cash_pct: float
    dscr: float
    noi_yield_pct: float
    cap_rate_pct: float


class SensitivityPoint(BaseModel):
    """Single sensitivity analysis point."""
    exit_cap_rate: float
    rent_growth: float
    irr_pct: float
    equity_multiple: float
    cash_on_cash_pct: float
    net_profit: float


class UnderwritingOutput(BaseModel):
    """Full underwriting output."""
    cashflows: list[CashflowOutput]
    metrics: MetricsOutput
    purchase_price: float
    equity_investment: float
    debt_amount: float
    exit_value: float
    exit_proceeds: float
    net_to_equity: float
    equity_debt_ratio: dict[str, float]
    sensitivity: list[SensitivityPoint] | None = None


@router.post("/underwrite", response_model=UnderwritingOutput)
def run_underwriting(input_data: UnderwritingInput):
    """Run full property underwriting and return projections."""
    deal = input_data.deal
    income = input_data.income
    operating = input_data.operating
    capex = input_data.capex
    financing = input_data.financing
    exit_a = input_data.exit

    purchase = deal.purchase_price
    hold = deal.hold_period_years
    acq_cost = deal.acquisition_costs_pct

    total_cost = purchase * (1 + acq_cost)
    equity = total_cost * (1 - financing.ltv_pct)
    debt = total_cost * financing.ltv_pct

    periods = calculate_cashflows(
        purchase_price=purchase,
        hold_period=hold,
        gross_rent=income.gross_rent,
        vacancy_pct=income.vacancy_pct,
        rent_growth_pct=income.rent_growth_pct,
        opex_pct=operating.opex_pct_of_egi,
        capex_reserve_pct=capex.capex_reserve_pct,
        ltv_pct=financing.ltv_pct,
        interest_rate=financing.interest_rate_pct,
        amortization_years=financing.amortization_years,
        interest_only=financing.interest_only,
        exit_cap_rate=exit_a.exit_cap_rate_pct,
        exit_costs_pct=exit_a.exit_costs_pct,
        acquisition_costs_pct=acq_cost,
    )

    final_noi = periods[-1].noi if periods else 0
    loan_balance_at_exit = periods[-1].loan_balance_end if periods else debt
    exit_proceeds_val, net_to_equity_val = calculate_exit(
        noi_final=final_noi,
        exit_cap_rate=exit_a.exit_cap_rate_pct,
        exit_costs_pct=exit_a.exit_costs_pct,
        loan_amount=loan_balance_at_exit,
    )

    exit_value = final_noi / exit_a.exit_cap_rate_pct
    metrics = compute_metrics(periods, -equity, net_to_equity_val)

    equity_pct = (1 - financing.ltv_pct) * 100
    debt_pct = financing.ltv_pct * 100
    equity_debt = {"equity_pct": round(equity_pct, 1), "debt_pct": round(debt_pct, 1)}

    sensitivity = run_sensitivity(input_data)

    return UnderwritingOutput(
        cashflows=[
            CashflowOutput(
                period=p.period,
                egi=p.egi,
                opex=p.opex,
                noi=p.noi,
                debt_service=p.debt_service,
                interest_expense=p.interest_expense,
                principal_amortization=p.principal_amortization,
                loan_balance_begin=p.loan_balance_begin,
                loan_balance_end=p.loan_balance_end,
                capex=p.capex,
                levered_cf=p.levered_cf,
                unlevered_cf=p.unlevered_cf,
                cumulative_equity=p.cumulative_equity,
            )
            for p in periods
        ],
        metrics=MetricsOutput(**metrics._asdict()),
        purchase_price=purchase,
        equity_investment=equity,
        debt_amount=debt,
        exit_value=exit_value,
        exit_proceeds=exit_proceeds_val,
        net_to_equity=net_to_equity_val,
        equity_debt_ratio=equity_debt,
        sensitivity=sensitivity,
    )


def run_sensitivity(input_data: UnderwritingInput) -> list[SensitivityPoint]:
    """Run sensitivity analysis: exit cap rate vs rent growth."""
    results = []
    exit_rates = [0.04, 0.05, 0.06, 0.07]
    rent_growths = [0.02, 0.03, 0.04, 0.05]

    for exit_rate in exit_rates:
        for rg in rent_growths:
            deal = input_data.deal
            financing = input_data.financing

            total_cost = deal.purchase_price * (1 + deal.acquisition_costs_pct)
            equity = total_cost * (1 - financing.ltv_pct)
            debt = total_cost * financing.ltv_pct

            periods = calculate_cashflows(
                purchase_price=deal.purchase_price,
                hold_period=deal.hold_period_years,
                gross_rent=input_data.income.gross_rent,
                vacancy_pct=input_data.income.vacancy_pct,
                rent_growth_pct=rg,
                opex_pct=input_data.operating.opex_pct_of_egi,
                capex_reserve_pct=input_data.capex.capex_reserve_pct,
                ltv_pct=financing.ltv_pct,
                interest_rate=financing.interest_rate_pct,
                amortization_years=financing.amortization_years,
                interest_only=financing.interest_only,
                exit_cap_rate=exit_rate,
                exit_costs_pct=input_data.exit.exit_costs_pct,
                acquisition_costs_pct=deal.acquisition_costs_pct,
            )

            if not periods:
                continue
            final_noi = periods[-1].noi
            loan_bal = periods[-1].loan_balance_end
            _, net_eq = calculate_exit(
                final_noi, exit_rate, input_data.exit.exit_costs_pct, loan_bal
            )
            m = compute_metrics(periods, -equity, net_eq)
            total_proceeds = sum(p.levered_cf for p in periods) + net_eq
            net_profit = total_proceeds - equity
            results.append(
                SensitivityPoint(
                    exit_cap_rate=exit_rate,
                    rent_growth=rg,
                    irr_pct=round(m.irr_pct, 2),
                    equity_multiple=round(m.equity_multiple, 2),
                    cash_on_cash_pct=round(m.cash_on_cash_pct, 1),
                    net_profit=round(net_profit, 0),
                )
            )

    return results
