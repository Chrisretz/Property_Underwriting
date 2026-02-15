"use client";

import { KPICard } from "./KPICard";
import { CashflowTable } from "./CashflowTable";
import { SensitivityHeatmap } from "./SensitivityHeatmap";
import { NOICashflowChart } from "./charts/NOICashflowChart";
import { EquityDebtChart } from "./charts/EquityDebtChart";
import { IRRChart } from "./charts/IRRChart";
import type { UnderwritingOutput } from "@/lib/types";
import { formatScaledCompact, type ValueScale } from "@/lib/scale";

interface DashboardProps {
  output: UnderwritingOutput;
  scale?: ValueScale;
}

export function Dashboard({ output, scale = "actual" }: DashboardProps) {
  const { metrics, equity_investment, debt_amount, equity_debt_ratio } = output;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Property Underwriting Dashboard
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Key metrics and projections from your underwriting analysis.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Equity Investment"
          value={formatScaledCompact(equity_investment, scale)}
          subtitle="Initial equity required"
          variant="highlight"
        />
        <KPICard
          title="Gross IRR"
          value={`${metrics.irr_pct.toFixed(2)}%`}
          subtitle="Internal rate of return"
          variant="highlight"
        />
        <KPICard
          title="Equity Multiple"
          value={metrics.equity_multiple.toFixed(2)}x
          subtitle="Total return multiple"
        />
        <KPICard
          title="DSCR"
          value={metrics.dscr.toFixed(2)}
          subtitle="Debt service coverage"
        />
        <KPICard
          title="Cash-on-Cash"
          value={`${metrics.cash_on_cash_pct.toFixed(1)}%`}
          subtitle="Annual return on equity"
        />
        <KPICard
          title="Debt Amount"
          value={formatScaledCompact(debt_amount, scale)}
          subtitle="Loan amount"
        />
      </div>

      <CashflowTable output={output} scale={scale} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <h3 className="mb-4 font-medium text-gray-900">
            NOI & Levered Cashflow
          </h3>
          <NOICashflowChart cashflows={output.cashflows} scale={scale} />
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <h3 className="mb-4 font-medium text-gray-900">
            Capital Structure (Equity vs Debt)
          </h3>
          <EquityDebtChart
            equityPct={equity_debt_ratio.equity_pct}
            debtPct={equity_debt_ratio.debt_pct}
          />
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        <h3 className="mb-4 font-medium text-gray-900">
          Internal Rate of Return Over Hold Period
        </h3>
        <IRRChart
          cashflows={output.cashflows}
          metrics={metrics}
          equityInvestment={output.equity_investment}
          targetIRR={metrics.irr_pct}
        />
      </div>

      {output.sensitivity && output.sensitivity.length > 0 && (
        <SensitivityHeatmap
          sensitivity={output.sensitivity}
          scale={scale}
        />
      )}
    </div>
  );
}
