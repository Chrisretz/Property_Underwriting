"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CashflowOutput } from "@/lib/types";
import { scaleValue, type ValueScale } from "@/lib/scale";

interface NOICashflowChartProps {
  cashflows: CashflowOutput[];
  scale?: ValueScale;
}

export function NOICashflowChart({ cashflows, scale = "actual" }: NOICashflowChartProps) {
  const divisor = scale === "thousands" ? 1000 : scale === "millions" ? 1e6 : 1;
  const suffix = scale === "thousands" ? "k" : scale === "millions" ? "M" : "";
  const data = cashflows.map((c) => ({
    name: `Year ${c.period}`,
    NOI: Math.round(scaleValue(c.noi, scale)),
    "Levered CF": Math.round(scaleValue(c.levered_cf, scale)),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => {
              if (scale === "millions") return `${v.toFixed(2)}M`;
              if (scale === "thousands") return `${v.toLocaleString("da-DK")}k`;
              return v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
            }}
          />
          <Tooltip
            formatter={(v: number) => [
              `${v.toLocaleString("da-DK")}${suffix} DKK`,
              undefined,
            ]}
            labelFormatter={(label) => label}
          />
          <Legend />
          <Bar dataKey="NOI" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Levered CF" fill="#a78bfa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
