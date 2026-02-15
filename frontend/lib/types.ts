export interface DealSetup {
  purchase_price: number;
  hold_period_years: number;
  acquisition_costs_pct: number;
}

export interface IncomeAssumptions {
  gross_rent: number;
  vacancy_pct: number;
  rent_growth_pct: number;
}

export interface OperatingCostAssumptions {
  opex_per_sf: number;
  opex_pct_of_egi: number;
  inflation_pct: number;
}

export interface CapexAssumptions {
  capex_reserve_pct: number;
  capex_timing: number[];
}

export interface FinancingAssumptions {
  ltv_pct: number;
  interest_rate_pct: number;
  amortization_years: number;
  interest_only: boolean;
}

export interface ExitAssumptions {
  exit_cap_rate_pct: number;
  exit_costs_pct: number;
}

export interface UnderwritingInput {
  deal: DealSetup;
  income: IncomeAssumptions;
  operating: OperatingCostAssumptions;
  capex: CapexAssumptions;
  financing: FinancingAssumptions;
  exit: ExitAssumptions;
}

export interface CashflowOutput {
  period: number;
  egi: number;
  opex: number;
  noi: number;
  debt_service: number;
  interest_expense: number;
  principal_amortization: number;
  loan_balance_begin: number;
  loan_balance_end: number;
  capex: number;
  levered_cf: number;
  unlevered_cf: number;
  cumulative_equity: number;
}

export interface MetricsOutput {
  irr_pct: number;
  equity_multiple: number;
  cash_on_cash_pct: number;
  dscr: number;
  noi_yield_pct: number;
  cap_rate_pct: number;
}

export interface UnderwritingOutput {
  cashflows: CashflowOutput[];
  metrics: MetricsOutput;
  purchase_price: number;
  equity_investment: number;
  debt_amount: number;
  exit_value: number;
  exit_proceeds: number;
  net_to_equity: number;
  equity_debt_ratio: { equity_pct: number; debt_pct: number };
  sensitivity: SensitivityPoint[] | null;
}

export interface SensitivityPoint {
  exit_cap_rate: number;
  rent_growth: number;
  irr_pct: number;
  equity_multiple: number;
  cash_on_cash_pct: number;
  net_profit: number;
}
