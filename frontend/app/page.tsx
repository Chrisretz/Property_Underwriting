"use client";

import { useState } from "react";
import { InputForm } from "@/components/InputForm";
import { Dashboard } from "@/components/Dashboard";
import { RentRoll, INITIAL_RENT_ROLL_TENANTS, type TenantLease } from "@/components/RentRoll";
import { runUnderwriting } from "@/lib/api";
import type { UnderwritingInput, UnderwritingOutput } from "@/lib/types";
import type { ValueScale } from "@/lib/scale";

type Tab = "assumptions" | "dashboard" | "rent-roll";

function grossRentFromTenants(tenants: TenantLease[]): number {
  return tenants.reduce((sum, t) => sum + t.gla * t.rentPerSqm, 0);
}

function weightedStructuralVacancyPct(tenants: TenantLease[]): number {
  const total = grossRentFromTenants(tenants);
  if (!total) return 0;
  return tenants.reduce(
    (sum, t) => sum + (t.gla * t.rentPerSqm) * t.structuralVacancyPct,
    0
  ) * (1 / total);
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("assumptions");
  const [output, setOutput] = useState<UnderwritingOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<ValueScale>("actual");
  const [rentRollTenants, setRentRollTenants] = useState<TenantLease[]>(INITIAL_RENT_ROLL_TENANTS);
  const [opexPctOfEgi, setOpexPctOfEgi] = useState(0.35);

  const grossRent = grossRentFromTenants(rentRollTenants);
  const vacancyPct = weightedStructuralVacancyPct(rentRollTenants);

  const handleSubmit = async (input: UnderwritingInput) => {
    const merged: UnderwritingInput = {
      ...input,
      income: {
        ...input.income,
        gross_rent: grossRent || input.income.gross_rent,
        vacancy_pct: vacancyPct,
      },
      operating: {
        ...input.operating,
        opex_pct_of_egi: opexPctOfEgi,
      },
    };
    setLoading(true);
    setError(null);
    try {
      const result = await runUnderwriting(merged);
      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setOutput(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Property Underwriting Platform
          </h1>
          <p className="mt-2 text-gray-600">
            Enter property assumptions to generate cashflows, investment
            metrics, and sensitivity analysis.
          </p>

          <div className="mt-6 flex gap-1 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab("assumptions")}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "assumptions"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              General Assumptions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("rent-roll")}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "rent-roll"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              Rent Roll
            </button>
          </div>
        </header>

        {activeTab === "assumptions" && (
          <section className="mb-12 rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              General Assumptions
            </h2>
            <div className="mb-6">
              <span className="block text-sm font-medium text-gray-700 mb-2">
                Values in
              </span>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scale"
                    checked={scale === "actual"}
                    onChange={() => setScale("actual")}
                  />
                  Actual numbers (DKK)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scale"
                    checked={scale === "thousands"}
                    onChange={() => setScale("thousands")}
                  />
                  Thousands (DKK)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scale"
                    checked={scale === "millions"}
                    onChange={() => setScale("millions")}
                  />
                  Millions (DKK)
                </label>
              </div>
            </div>
            <InputForm
              onSubmit={handleSubmit}
              isLoading={loading}
              scale={scale}
              rentRollSummary={{
                grossRent,
                vacancyPct,
                opexPctOfEgi,
              }}
            />
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </section>
        )}

        {activeTab === "dashboard" && (
          <>
            {output ? (
              <section>
                <Dashboard output={output} scale={scale} />
              </section>
            ) : (
              <section className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 p-12 text-center">
                <p className="text-gray-500">
                  Enter your deal assumptions in the General Assumptions tab and
                  click &quot;Run Underwriting&quot; to see the dashboard and
                  metrics.
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Make sure the backend API is running at{" "}
                  {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}.
                </p>
              </section>
            )}
          </>
        )}

        {activeTab === "rent-roll" && (
          <section className="mb-12">
            <RentRoll
              tenants={rentRollTenants}
              onTenantsChange={setRentRollTenants}
              opexPctOfEgi={opexPctOfEgi}
              onOpexPctOfEgiChange={setOpexPctOfEgi}
            />
          </section>
        )}
      </div>
    </main>
  );
}
