"use client";

import { useState } from "react";
import { NumericInput } from "./NumericInput";

export interface TenantLease {
  id: string;
  unitName: string;
  gla: number; // Gross Leasable Area in sqm
  rentPerSqm: number; // DKK per sqm per year
  leaseExpiry?: string;
  status: "occupied" | "vacant" | "notice";
}

const DEFAULT_TENANT: Omit<TenantLease, "id"> = {
  unitName: "",
  gla: 0,
  rentPerSqm: 0,
  status: "occupied",
};

function generateId() {
  return `tenant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function RentRoll() {
  const [tenants, setTenants] = useState<TenantLease[]>([
    { ...DEFAULT_TENANT, id: generateId(), unitName: "Unit 101", gla: 85, rentPerSqm: 1200 },
    { ...DEFAULT_TENANT, id: generateId(), unitName: "Unit 102", gla: 120, rentPerSqm: 1100 },
    { ...DEFAULT_TENANT, id: generateId(), unitName: "Unit 201", gla: 95, rentPerSqm: 1150 },
  ]);

  const addTenant = () => {
    setTenants((prev) => [
      ...prev,
      { ...DEFAULT_TENANT, id: generateId(), unitName: `Unit ${prev.length + 1}` },
    ]);
  };

  const removeTenant = (id: string) => {
    setTenants((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTenant = (id: string, updates: Partial<TenantLease>) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const totalGla = tenants.reduce((sum, t) => sum + t.gla, 0);
  const totalBaseRent = tenants.reduce((sum, t) => sum + t.gla * t.rentPerSqm, 0);
  const occupiedCount = tenants.filter((t) => t.status === "occupied").length;

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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-4 text-left font-medium text-gray-700">
                  Unit / Tenant
                </th>
                <th className="py-2 pr-4 text-right font-medium text-gray-700">
                  GLA (sqm)
                </th>
                <th className="py-2 pr-4 text-right font-medium text-gray-700">
                  Rent (DKK/sqm/yr)
                </th>
                <th className="py-2 pr-4 text-right font-medium text-gray-700">
                  Base rent (DKK)
                </th>
                <th className="py-2 pr-4 text-left font-medium text-gray-700">
                  Status
                </th>
                <th className="py-2 pr-4 text-left font-medium text-gray-700">
                  Lease expiry
                </th>
                <th className="py-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">
                    <input
                      type="text"
                      value={tenant.unitName}
                      onChange={(e) =>
                        updateTenant(tenant.id, { unitName: e.target.value })
                      }
                      placeholder="Unit name"
                      className="w-full min-w-[100px] rounded border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex justify-end">
                      <NumericInput
                        value={tenant.gla}
                        onChange={(v) => updateTenant(tenant.id, { gla: v })}
                        multiplier={1}
                        decimals={0}
                        min={0}
                        className="w-24 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex justify-end">
                      <NumericInput
                        value={tenant.rentPerSqm}
                        onChange={(v) =>
                          updateTenant(tenant.id, { rentPerSqm: v })
                        }
                        multiplier={1}
                        decimals={0}
                        min={0}
                        className="w-28 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-gray-700">
                    {(tenant.gla * tenant.rentPerSqm).toLocaleString("da-DK", {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-2 pr-4">
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
                  <td className="py-2 pr-4">
                    <input
                      type="date"
                      value={tenant.leaseExpiry ?? ""}
                      onChange={(e) =>
                        updateTenant(tenant.id, {
                          leaseExpiry: e.target.value || undefined,
                        })
                      }
                      className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                    />
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

        <div className="mt-6 flex flex-wrap gap-6 rounded-lg bg-gray-50 p-4">
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
              Total base rent:{" "}
            </span>
            <span className="font-semibold text-gray-900">
              {totalBaseRent.toLocaleString("da-DK")} DKK/yr
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
        </div>
      </div>
    </div>
  );
}
