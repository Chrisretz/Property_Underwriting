"""
Pydantic models for property underwriting assumptions.
"""

from pydantic import BaseModel, Field


class DealSetup(BaseModel):
    """Deal setup assumptions."""
    purchase_price: float = Field(..., gt=0, description="Purchase price in USD")
    hold_period_years: int = Field(..., ge=1, le=30)
    acquisition_costs_pct: float = Field(default=0.03, ge=0, le=0.10)


class IncomeAssumptions(BaseModel):
    """Income assumptions."""
    gross_rent: float = Field(..., gt=0)
    vacancy_pct: float = Field(default=0.05, ge=0, le=0.30)
    rent_growth_pct: float = Field(default=0.03, ge=-0.10, le=0.15)


class OperatingCostAssumptions(BaseModel):
    """Operating cost assumptions."""
    opex_per_sf: float = Field(default=0, ge=0)
    opex_pct_of_egi: float = Field(default=0.35, ge=0, le=0.60)
    inflation_pct: float = Field(default=0.025, ge=0, le=0.10)


class CapexAssumptions(BaseModel):
    """Capital expenditure assumptions."""
    capex_reserve_pct: float = Field(default=0.05, ge=0, le=0.15)
    capex_timing: list[float] = Field(default_factory=list)


class FinancingAssumptions(BaseModel):
    """Financing assumptions."""
    ltv_pct: float = Field(default=0.65, ge=0, le=0.90)
    interest_rate_pct: float = Field(default=0.055, ge=0, le=0.15)
    amortization_years: int = Field(default=30, ge=1, le=30)
    interest_only: bool = Field(default=False)


class ExitAssumptions(BaseModel):
    """Exit assumptions."""
    exit_cap_rate_pct: float = Field(default=0.05, ge=0.02, le=0.12)
    exit_costs_pct: float = Field(default=0.04, ge=0, le=0.10)


class UnderwritingInput(BaseModel):
    """Full underwriting input model."""
    deal: DealSetup
    income: IncomeAssumptions
    operating: OperatingCostAssumptions
    capex: CapexAssumptions = CapexAssumptions()
    financing: FinancingAssumptions
    exit: ExitAssumptions
