"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { CashflowOutput } from "@/lib/types";
import type { MetricsOutput } from "@/lib/types";

interface IRRChartProps {
  cashflows: CashflowOutput[];
  metrics: MetricsOutput;
  equityInvestment: number;
  targetIRR?: number;
}

export function IRRChart({
  cashflows,
  metrics,
  equityInvestment,
  targetIRR,
}: IRRChartProps) {
  const equity = Math.abs(equityInvestment) || 1;
  const data = cashflows.map((c) => ({
    name: `Year ${c.period}`,
    "Cash-on-Cash": (c.levered_cf / equity) * 100,
    value: (c.levered_cf / equity) * 100,
  }));

  const target = targetIRR ?? metrics.irr_pct;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            domain={[0, "auto"]}
          />
          <Tooltip
            formatter={(v: number) => [`${v.toFixed(1)}%`, "CoC Return"]}
          />
          <ReferenceLine
            y={target}
            stroke="#22c55e"
            strokeDasharray="5 5"
            label={{ value: `Target IRR (${target.toFixed(1)}%)`, position: "right" }}
          />
          <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
