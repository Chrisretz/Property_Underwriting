"use client";

import { useState } from "react";
import { NumericInput } from "./NumericInput";

export type IndexationType = "cpi" | "fixed";

export interface TenantLease {
  id: string;
  unitName: string;
  gla: number; // Gross Leasable Area in sqm
  rentPerSqm: number; // DKK per sqm per year
  nonTerminabilityDate?: string; // Date when lease expires / non-terminability ends (formerly leaseExpiry)
  status: "occupied" | "vacant" | "notice";
  ervPerSqm: number; // ERV per sqm (DKK/sqm/yr)
  tisPerSqm: number; // Tenant improvements per sqm
  noticePeriodMonths: number;
  unexpiredTermMonths: number; // Manual fallback when no date; otherwise derived from non-terminability + notice
  structuralVacancyPct: number; // Structural vacancy % at lease level
  indexationType: IndexationType;
  indexationFixedPct?: number; // If fixed, annual %
  minRentalRegulation?: number;
  maxRentalRegulation?: number;
  regulationMonth?: number; // 1–12, month when regulation applies
}

const DEFAULT_TENANT: Omit<TenantLease, "id"> = {
  unitName: "",
  gla: 0,
  rentPerSqm: 0,
  status: "occupied",
  ervPerSqm: 0,
  tisPerSqm: 0,
  noticePeriodMonths: 0,
  unexpiredTermMonths: 0,
  structuralVacancyPct: 0.05,
  indexationType: "cpi",
};

function generateId() {
  return `tenant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const INITIAL_RENT_ROLL_TENANTS: TenantLease[] = [
  { ...DEFAULT_TENANT, id: generateId(), unitName: "Unit 101", gla: 85, rentPerSqm: 1200 },
  { ...DEFAULT_TENANT, id: generateId(), unitName: "Unit 102", gla: 120, rentPerSqm: 1100 },
  { ...DEFAULT_TENANT, id: generateId(), unitName: "Unit 201", gla: 95, rentPerSqm: 1150 },
];

export interface RentRollProps {
  tenants?: TenantLease[];
  onTenantsChange?: (tenants: TenantLease[]) => void;
  opexPctOfEgi?: number;
  onOpexPctOfEgiChange?: (value: number) => void;
}

export function RentRoll({
  tenants: controlledTenants,
  onTenantsChange,
  opexPctOfEgi: controlledOpexPct,
  onOpexPctOfEgiChange,
}: RentRollProps = {}) {
  const [internalTenants, setInternalTenants] = useState<TenantLease[]>(INITIAL_RENT_ROLL_TENANTS);
  const [internalOpexPct, setInternalOpexPct] = useState(0.35);

  const tenants = controlledTenants ?? internalTenants;
  const setTenants = onTenantsChange ?? setInternalTenants;
  const opexPctOfEgi = controlledOpexPct ?? internalOpexPct;
  const setOpexPctOfEgi = onOpexPctOfEgiChange ?? setInternalOpexPct;

  const addTenant = () => {
    setTenants([
      ...tenants,
      { ...DEFAULT_TENANT, id: generateId(), unitName: `Unit ${tenants.length + 1}` },
    ]);
  };

  const removeTenant = (id: string) => {
    setTenants(tenants.filter((t) => t.id !== id));
  };

  const moveTenant = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tenants.length) return;
    const copy = [...tenants];
    [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
    setTenants(copy);
  };

  const updateTenant = (id: string, updates: Partial<TenantLease>) => {
    setTenants(
      tenants.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const totalGla = tenants.reduce((sum, t) => sum + t.gla, 0);
  const totalBaseRent = tenants.reduce((sum, t) => sum + t.gla * t.rentPerSqm, 0);
  const occupiedCount = tenants.filter((t) => t.status === "occupied").length;

  /** Months from today to a given YYYY-MM-DD date */
  function monthsToDate(dateStr: string): number {
    const d = new Date(dateStr);
    const today = new Date();
    const months = (d.getFullYear() - today.getFullYear()) * 12 + (d.getMonth() - today.getMonth()) + (d.getDate() - today.getDate()) / 30;
    return Math.max(0, Math.round(months));
  }

  /** Effective unexpired months for WAULT: non-terminability (months to expiry) + notice period */
  function effectiveUnexpiredMonths(t: TenantLease): number {
    if (t.nonTerminabilityDate) {
      return monthsToDate(t.nonTerminabilityDate) + t.noticePeriodMonths;
    }
    return t.unexpiredTermMonths;
  }

  let waultYears = 0;
  if (totalBaseRent > 0) {
    const sumMonths = tenants.reduce(
      (sum, t) => sum + (t.gla * t.rentPerSqm * effectiveUnexpiredMonths(t)) * (1 / 12),
      0
    );
    waultYears = sumMonths * (1 / totalBaseRent);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Rent Roll</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add or remove tenants/leases. Enter GLA, rent per sqm, and other details.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Tenants / Leases</h3>
          <button
            type="button"
            onClick={addTenant}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            + Add tenant
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-2 w-14 text-center font-medium text-gray-700">
                  Order
                </th>
                <th className="py-2 pr-3 text-left font-medium text-gray-700 whitespace-nowrap">
                  Unit / Tenant
                </th>
                <th className="py-2 pr-3 text-left font-medium text-gray-700 whitespace-nowrap">
                  Status
                </th>
                <th className="py-2 pr-3 text-right font-medium text-gray-700 whitespace-nowrap">
                  GLA (sqm)
                </th>
                <th className="py-2 pr-3 text-right font-medium text-gray-700 whitespace-nowrap">
                  Rent (DKK/sqm/yr)
                </th>
                <th className="py-2 pr-3 text-right font-medium text-gray-700 whitespace-nowrap">
                  Base rent (DKK)
                </th>
                <th className="py-2 pr-3 text-right font-medium text-gray-700 whitespace-nowrap">
                  Structural vacancy %
                </th>
                <th className="py-2 pr-3 text-right font-medium text-gray-700 whitespace-nowrap">
                  ERV / sqm
                </th>
                <th className="py-2 pr-3 text-right font-medium text-gray-700 whitespace-nowrap">
                  ERV
                </th>
                <th className="py-2 pr-3 text-right font-medium text-gray-700 whitespace-nowrap">
                  TIs per sqm
                </th>
                <th className="py-2 pr-3 text-right font-medium text-gray-700 whitespace-nowrap">
                  Total TIs
                </th>
                <th className="py-2 pr-3 text-left font-medium text-gray-700 whitespace-nowrap">
                  Non-terminability
                </th>
                <th className="py-2 pr-3 text-right font-medium text-gray-700 whitespace-nowrap">
                  Notice (months)
                </th>
                <th className="py-2 pr-3 text-right font-medium text-gray-700 whitespace-nowrap">
                  Unexpired (months)
                </th>
                <th className="py-2 pr-3 text-left font-medium text-gray-700 whitespace-nowrap">
                  Indexation
                </th>
                <th className="py-2 pr-3 text-right font-medium text-gray-700 whitespace-nowrap">
                  Min reg.
                </th>
                <th className="py-2 pr-3 text-right font-medium text-gray-700 whitespace-nowrap">
                  Max reg.
                </th>
                <th className="py-2 pr-3 text-center font-medium text-gray-700 whitespace-nowrap">
                  Reg. month
                </th>
                <th className="py-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant, index) => (
                <tr key={tenant.id} className="border-b border-gray-100">
                  <td className="py-2 pr-2 w-14">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveTenant(index, "up")}
                        disabled={index === 0}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                        title="Move up"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTenant(index, "down")}
                        disabled={index === tenants.length - 1}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                        title="Move down"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={tenant.unitName}
                      onChange={(e) =>
                        updateTenant(tenant.id, { unitName: e.target.value })
                      }
                      placeholder="Unit name"
                      className="w-full min-w-[80px] rounded border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      value={tenant.status}
                      onChange={(e) =>
                        updateTenant(tenant.id, {
                          status: e.target.value as TenantLease["status"],
                        })
                      }
                      className="rounded border border-gray-300 px-2 py-1.5 text-sm capitalize"
                    >
                      <option value="occupied">Occupied</option>
                      <option value="vacant">Vacant</option>
                      <option value="notice">Notice</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex justify-end">
                      <NumericInput
                        value={tenant.gla}
                        onChange={(v) => updateTenant(tenant.id, { gla: v })}
                        multiplier={1}
                        decimals={0}
                        min={0}
                        className="w-20 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex justify-end">
                      <NumericInput
                        value={tenant.rentPerSqm}
                        onChange={(v) =>
                          updateTenant(tenant.id, { rentPerSqm: v })
                        }
                        multiplier={1}
                        decimals={0}
                        min={0}
                        className="w-24 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-gray-700">
                    {(tenant.gla * tenant.rentPerSqm).toLocaleString("da-DK", {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex justify-end">
                      <NumericInput
                        value={tenant.structuralVacancyPct * 100}
                        onChange={(v) =>
                          updateTenant(tenant.id, { structuralVacancyPct: v * 0.01 })
                        }
                        multiplier={1}
                        decimals={1}
                        min={0}
                        max={30}
                        className="w-20 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex justify-end">
                      <NumericInput
                        value={tenant.ervPerSqm}
                        onChange={(v) =>
                          updateTenant(tenant.id, { ervPerSqm: v })
                        }
                        multiplier={1}
                        decimals={0}
                        min={0}
                        className="w-24 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-gray-700">
                    {(tenant.gla * tenant.ervPerSqm).toLocaleString("da-DK", {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex justify-end">
                      <NumericInput
                        value={tenant.tisPerSqm}
                        onChange={(v) =>
                          updateTenant(tenant.id, { tisPerSqm: v })
                        }
                        multiplier={1}
                        decimals={0}
                        min={0}
                        className="w-24 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-gray-700">
                    {(tenant.gla * tenant.tisPerSqm).toLocaleString("da-DK", {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="date"
                      value={tenant.nonTerminabilityDate ?? ""}
                      onChange={(e) =>
                        updateTenant(tenant.id, {
                          nonTerminabilityDate: e.target.value || undefined,
                        })
                      }
                      className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                      title="Date when lease expires / non-terminability ends"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex justify-end">
                      <NumericInput
                        value={tenant.noticePeriodMonths}
                        onChange={(v) =>
                          updateTenant(tenant.id, { noticePeriodMonths: v })
                        }
                        multiplier={1}
                        decimals={0}
                        min={0}
                        className="w-20 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    {tenant.nonTerminabilityDate ? (
                      <span className="block text-right tabular-nums text-gray-700">
                        {effectiveUnexpiredMonths(tenant).toFixed(1)}
                      </span>
                    ) : (
                      <div className="flex justify-end">
                        <NumericInput
                          value={tenant.unexpiredTermMonths}
                          onChange={(v) =>
                            updateTenant(tenant.id, { unexpiredTermMonths: v })
                          }
                          multiplier={1}
                          decimals={1}
                          min={0}
                          className="w-20 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                        />
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-col gap-1 min-w-[90px]">
                      <select
                        value={tenant.indexationType}
                        onChange={(e) =>
                          updateTenant(tenant.id, {
                            indexationType: e.target.value as TenantLease["indexationType"],
                          })
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                      >
                        <option value="cpi">CPI</option>
                        <option value="fixed">Fixed %</option>
                      </select>
                      {tenant.indexationType === "fixed" && (
                        <NumericInput
                          value={(tenant.indexationFixedPct ?? 0) * 100}
                          onChange={(v) =>
                            updateTenant(tenant.id, {
                              indexationFixedPct: v / 100,
                            })
                          }
                          multiplier={1}
                          decimals={1}
                          min={0}
                          max={20}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm"
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex justify-end">
                      <NumericInput
                        value={(tenant.minRentalRegulation ?? 0) * 100}
                        onChange={(v) =>
                          updateTenant(tenant.id, {
                            minRentalRegulation: v > 0 ? v / 100 : undefined,
                          })
                        }
                        multiplier={1}
                        decimals={1}
                        min={0}
                        className="w-20 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                        placeholder="—"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex justify-end">
                      <NumericInput
                        value={(tenant.maxRentalRegulation ?? 0) * 100}
                        onChange={(v) =>
                          updateTenant(tenant.id, {
                            maxRentalRegulation: v > 0 ? v / 100 : undefined,
                          })
                        }
                        multiplier={1}
                        decimals={1}
                        min={0}
                        className="w-20 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                        placeholder="—"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      value={tenant.regulationMonth ?? ""}
                      onChange={(e) =>
                        updateTenant(tenant.id, {
                          regulationMonth: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full min-w-[70px] rounded border border-gray-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">—</option>
                      {[
                        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                      ].map((m, i) => (
                        <option key={m} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeTenant(tenant.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove tenant"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <span className="block text-sm font-medium text-gray-700 mb-3">
              Cost assumption (used for underwriting)
            </span>
            <div className="flex flex-wrap items-end gap-6">
              <label>
                <span className="block text-xs text-gray-500 mb-1">OpEx % of EGI</span>
                <NumericInput
                  value={opexPctOfEgi * 100}
                  onChange={(v) => setOpexPctOfEgi(v * 0.01)}
                  multiplier={1}
                  decimals={1}
                  min={0}
                  max={60}
                  className="w-24 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                />
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 rounded-lg bg-gray-50 p-4">
            <div>
              <span className="text-sm font-medium text-gray-500">
                Gross rent (from roll):{" "}
              </span>
              <span className="font-semibold text-gray-900">
                {totalBaseRent.toLocaleString("da-DK")} DKK/yr
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Total GLA:{" "}
              </span>
              <span className="font-semibold text-gray-900">
                {totalGla.toLocaleString("da-DK")} sqm
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Occupied units:{" "}
              </span>
              <span className="font-semibold text-gray-900">
                {occupiedCount} / {tenants.length}
              </span>
            </div>
            {tenants.length > 0 && totalGla > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Blended rent:{" "}
                </span>
                <span className="font-semibold text-gray-900">
                  {(totalBaseRent / totalGla).toLocaleString("da-DK", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  DKK/sqm/yr
                </span>
              </div>
            )}
            {totalBaseRent > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">
                  WAULT:{" "}
                </span>
                <span className="font-semibold text-gray-900">
                  {waultYears.toFixed(1)} years
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
