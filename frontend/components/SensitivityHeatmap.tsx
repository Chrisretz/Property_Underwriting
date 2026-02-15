"use client";

import { useState } from "react";
import type { SensitivityPoint } from "@/lib/types";
import type { ValueScale } from "@/lib/scale";
import { formatScaledTable } from "@/lib/scale";

type SensitivityMetric = "irr_pct" | "equity_multiple" | "cash_on_cash_pct" | "net_profit";

interface SensitivityHeatmapProps {
  sensitivity: SensitivityPoint[];
  scale?: ValueScale;
}

const METRIC_LABELS: Record<SensitivityMetric, string> = {
  irr_pct: "IRR %",
  equity_multiple: "Equity Multiple",
  cash_on_cash_pct: "Cash on Cash %",
  net_profit: "Net Profit",
};

function getHeatmapColor(
  value: number,
  min: number,
  max: number,
): string {
  if (min === max) return "rgb(221 214 254)"; // primary-200
  const t = (value - min) / (max - min);
  // For all metrics, higher is better - green at high, red at low
  const hue = 120 * t; // 0 = red (0°), 120 = green (120°)
  const saturation = 70;
  const lightness = 88 - t * 20; // 88% at low, 68% at high
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getMetricValue(point: SensitivityPoint, metric: SensitivityMetric): number {
  switch (metric) {
    case "irr_pct":
      return point.irr_pct;
    case "equity_multiple":
      return point.equity_multiple;
    case "cash_on_cash_pct":
      return point.cash_on_cash_pct;
    case "net_profit":
      return point.net_profit;
    default:
      return 0;
  }
}

function formatValue(
  value: number,
  metric: SensitivityMetric,
  scale?: ValueScale
): string {
  switch (metric) {
    case "irr_pct":
      return `${value.toFixed(1)}%`;
    case "equity_multiple":
      return `${value.toFixed(2)}x`;
    case "cash_on_cash_pct":
      return `${value.toFixed(1)}%`;
    case "net_profit":
      return scale ? formatScaledTable(value, scale) : value.toLocaleString("da-DK", { maximumFractionDigits: 0 });
    default:
      return String(value);
  }
}

export function SensitivityHeatmap({ sensitivity, scale = "actual" }: SensitivityHeatmapProps) {
  const [metric, setMetric] = useState<SensitivityMetric>("irr_pct");

  const exitRates = Array.from(new Set(sensitivity.map((s) => s.exit_cap_rate))).sort(
    (a, b) => a - b
  );
  const rentGrowths = Array.from(new Set(sensitivity.map((s) => s.rent_growth))).sort(
    (a, b) => a - b
  );

  const lookup = new Map<string, SensitivityPoint>();
  sensitivity.forEach((p) => {
    lookup.set(`${p.exit_cap_rate}-${p.rent_growth}`, p);
  });

  const values = sensitivity.map((p) => getMetricValue(p, metric));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const metrics: SensitivityMetric[] = [
    "irr_pct",
    "equity_multiple",
    "cash_on_cash_pct",
    "net_profit",
  ];

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <h3 className="mb-4 font-medium text-gray-900">
        Sensitivity Analysis (Exit Cap Rate vs Rent Growth)
      </h3>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700">Show:</span>
        {metrics.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              metric === m
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {METRIC_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="py-2 pr-3 text-left font-medium text-gray-700 border-b border-r border-gray-200 bg-gray-50">
                Exit Cap Rate \
              </th>
              {rentGrowths.map((rg) => (
                <th
                  key={rg}
                  className="py-2 px-3 text-center font-medium text-gray-700 border-b border-gray-200 bg-gray-50"
                >
                  {(rg * 100).toFixed(1)}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exitRates.map((er) => (
              <tr key={er}>
                <td className="py-2 pr-3 font-medium text-gray-700 border-b border-r border-gray-200">
                  {(er * 100).toFixed(1)}%
                </td>
                {rentGrowths.map((rg) => {
                  const point = lookup.get(`${er}-${rg}`);
                  if (!point) return <td key={rg} className="p-0" />;
                  const value = getMetricValue(point, metric);
                  const bgColor = getHeatmapColor(value, minVal, maxVal);
                  return (
                    <td
                      key={rg}
                      className="py-2 px-3 text-center font-medium border-b border-gray-200 min-w-[80px]"
                      style={{ backgroundColor: bgColor }}
                    >
                      {formatValue(value, metric, scale)}
                      {metric === "net_profit" && (
                        <span className="ml-1 text-xs text-gray-500">DKK</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Rows: Exit cap rate (yield). Columns: Rent growth.
        {metric === "net_profit" && scale !== "actual" && ` Values in ${scale}.`}
      </p>
    </div>
  );
}
