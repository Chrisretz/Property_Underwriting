"use client";

import type { CashflowOutput, UnderwritingOutput } from "@/lib/types";
import {
  formatScaledTable,
  type ValueScale,
} from "@/lib/scale";

interface CashflowTableProps {
  output: UnderwritingOutput;
  scale?: ValueScale;
}

export function CashflowTable({ output, scale = "actual" }: CashflowTableProps) {
  const { cashflows, purchase_price, exit_value, exit_proceeds } = output;

  const rows: { label: string; values: (number | null)[] }[] = [
    {
      label: "Purchase / sale value",
      values: [purchase_price, ...cashflows.map(() => null), exit_value ?? null],
    },
    {
      label: "Rental income (EGI)",
      values: [null, ...cashflows.map((c) => c.egi), null],
    },
    {
      label: "OPEX",
      values: [null, ...cashflows.map((c) => c.opex), null],
    },
    {
      label: "NOI",
      values: [null, ...cashflows.map((c) => c.noi), null],
    },
    {
      label: "Interest",
      values: [null, ...cashflows.map((c) => c.interest_expense), null],
    },
    {
      label: "Amortization",
      values: [null, ...cashflows.map((c) => c.principal_amortization), null],
    },
    {
      label: "Loan (begin)",
      values: [
        cashflows[0]?.loan_balance_begin ?? null,
        ...cashflows.map((c) => c.loan_balance_begin),
        null,
      ],
    },
    {
      label: "Loan (end)",
      values: [
        null,
        ...cashflows.map((c) => c.loan_balance_end),
        0,
      ],
    },
    {
      label: "Levered CF",
      values: [null, ...cashflows.map((c) => c.levered_cf), null],
    },
    {
      label: "Net proceeds",
      values: [...Array(cashflows.length + 1).fill(null), exit_proceeds],
    },
  ];

  const columns = [
    "Purchase",
    ...cashflows.map((c) => `Year ${c.period}`),
    "Sale",
  ];

  const scaleLabel =
    scale === "thousands"
      ? " (thousands DKK)"
      : scale === "millions"
        ? " (millions DKK)"
        : " (DKK)";

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <h3 className="mb-4 font-medium text-gray-900">
        Cashflow & key metrics by period
      </h3>
      <p className="mb-4 text-sm text-gray-500">Values{scaleLabel}</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-4 text-left font-medium text-gray-700">
                Item
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="py-2 px-3 text-right font-medium text-gray-700"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium text-gray-900">
                  {row.label}
                </td>
                {row.values.map((val, j) => (
                  <td
                    key={j}
                    className="py-2 px-3 text-right tabular-nums text-gray-700"
                  >
                    {val !== null ? formatScaledTable(val, scale) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
