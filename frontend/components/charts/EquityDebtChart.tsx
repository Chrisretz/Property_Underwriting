"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface EquityDebtChartProps {
  equityPct: number;
  debtPct: number;
}

const COLORS = ["#7c3aed", "#4338ca"];

export function EquityDebtChart({ equityPct, debtPct }: EquityDebtChartProps) {
  const data = [
    { name: "Equity", value: equityPct },
    { name: "Debt", value: debtPct },
  ];

  return (
    <div className="h-56 min-h-[224px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={60}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "Share"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
