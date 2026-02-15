"use client";

import { useState } from "react";
import type { UnderwritingInput } from "@/lib/types";
import { SCALE_DIVISORS, type ValueScale } from "@/lib/scale";

type PriceInputMode = "fixed" | "entry_yield";

import { NumericInput } from "./NumericInput";

const DEFAULT_INPUT: UnderwritingInput = {
  deal: {
    purchase_price: 5_000_000,
    hold_period_years: 5,
    acquisition_costs_pct: 0.03,
  },
  income: {
    gross_rent: 450_000,
    vacancy_pct: 0.05,
    rent_growth_pct: 0.03,
  },
  operating: {
    opex_per_sf: 0,
    opex_pct_of_egi: 0.35,
    inflation_pct: 0.025,
  },
  capex: {
    capex_reserve_pct: 0.05,
    capex_timing: [],
  },
  financing: {
    ltv_pct: 0.65,
    interest_rate_pct: 0.055,
    amortization_years: 30,
    interest_only: false,
  },
  exit: {
    exit_cap_rate_pct: 0.055,
    exit_costs_pct: 0.04,
  },
};

interface InputFormProps {
  onSubmit: (input: UnderwritingInput) => void;
  isLoading?: boolean;
  scale?: ValueScale;
}

export function InputForm({ onSubmit, isLoading, scale = "actual" }: InputFormProps) {
  const divisor = SCALE_DIVISORS[scale];
  const scaleLabel =
    scale === "thousands" ? " (thousands DKK)" : scale === "millions" ? " (millions DKK)" : " (DKK)";
  const [input, setInput] = useState<UnderwritingInput>(DEFAULT_INPUT);
  const [priceInputMode, setPriceInputMode] = useState<PriceInputMode>("fixed");
  const [entryYield, setEntryYield] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let payload = { ...input };
    if (priceInputMode === "entry_yield") {
      const egi = input.income.gross_rent * (1 - input.income.vacancy_pct);
      const noi = egi * (1 - input.operating.opex_pct_of_egi);
      const price = entryYield > 0 ? noi / (entryYield / 100) : input.deal.purchase_price;
      payload = { ...payload, deal: { ...payload.deal, purchase_price: price } };
    }
    onSubmit(payload);
  };

  const update = <K extends keyof UnderwritingInput>(
    section: K,
    key: keyof UnderwritingInput[K],
    value: number | boolean
  ) => {
    setInput((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <span className="block text-sm font-medium text-gray-700 mb-2">Price input</span>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="priceMode"
                checked={priceInputMode === "fixed"}
                onChange={() => setPriceInputMode("fixed")}
              />
              Fixed price
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="priceMode"
                checked={priceInputMode === "entry_yield"}
                onChange={() => setPriceInputMode("entry_yield")}
              />
              Entry yield (NOI / yield)
            </label>
          </div>
        </div>

        {priceInputMode === "fixed" ? (
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Purchase Price{scaleLabel}
            </span>
            <NumericInput
              value={input.deal.purchase_price}
              onChange={(v) => update("deal", "purchase_price", v)}
              multiplier={divisor}
              decimals={scale === "actual" ? 0 : 2}
              min={1}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder={scale === "millions" ? "e.g. 21 or 21,5" : scale === "thousands" ? "e.g. 5557,5" : undefined}
            />
          </label>
        ) : (
          <label>
            <span className="block text-sm font-medium text-gray-700">
              Entry Yield %
            </span>
            <NumericInput
              value={entryYield}
              onChange={(v) => setEntryYield(v)}
              multiplier={1}
              decimals={1}
              min={0.1}
              max={20}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">Price = Year 1 NOI ÷ Entry yield</p>
          </label>
        )}
        <label>
          <span className="block text-sm font-medium text-gray-700">
            Hold Period (years)
          </span>
          <input
            type="number"
            value={input.deal.hold_period_years}
            onChange={(e) =>
              update("deal", "hold_period_years", Number(e.target.value))
            }
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            min={1}
            max={30}
          />
        </label>
        <label>
          <span className="block text-sm font-medium text-gray-700">
            Gross Rent{scaleLabel}/yr
          </span>
          <NumericInput
            value={input.income.gross_rent}
            onChange={(v) => update("income", "gross_rent", v)}
            multiplier={divisor}
            decimals={scale === "actual" ? 0 : 2}
            min={1}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder={scale === "millions" ? "e.g. 21 or 21,5" : undefined}
          />
        </label>
        <label>
          <span className="block text-sm font-medium text-gray-700">
            Vacancy %
          </span>
          <NumericInput
            value={input.income.vacancy_pct * 100}
            onChange={(v) => update("income", "vacancy_pct", v / 100)}
            multiplier={1}
            decimals={1}
            min={0}
            max={30}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <label>
          <span className="block text-sm font-medium text-gray-700">
            Rent Growth %
          </span>
          <NumericInput
            value={input.income.rent_growth_pct * 100}
            onChange={(v) => update("income", "rent_growth_pct", v / 100)}
            multiplier={1}
            decimals={1}
            min={-10}
            max={15}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <label>
          <span className="block text-sm font-medium text-gray-700">
            OpEx % of EGI
          </span>
          <NumericInput
            value={input.operating.opex_pct_of_egi * 100}
            onChange={(v) => update("operating", "opex_pct_of_egi", v / 100)}
            multiplier={1}
            decimals={1}
            min={0}
            max={60}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <label>
          <span className="block text-sm font-medium text-gray-700">
            LTV %
          </span>
          <NumericInput
            value={input.financing.ltv_pct * 100}
            onChange={(v) => update("financing", "ltv_pct", v / 100)}
            multiplier={1}
            decimals={1}
            min={0}
            max={90}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <div className="sm:col-span-2 lg:col-span-3">
          <span className="block text-sm font-medium text-gray-700 mb-2">Financing</span>
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={!input.financing.interest_only}
              onChange={(e) => update("financing", "interest_only", !e.target.checked)}
            />
            With amortization
          </label>
        </div>
        <label>
          <span className="block text-sm font-medium text-gray-700">
            Interest Rate %
          </span>
          <NumericInput
            value={input.financing.interest_rate_pct * 100}
            onChange={(v) => update("financing", "interest_rate_pct", v / 100)}
            multiplier={1}
            decimals={2}
            min={0}
            max={15}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <label>
          <span className="block text-sm font-medium text-gray-700">
            Exit Cap Rate %
          </span>
          <NumericInput
            value={input.exit.exit_cap_rate_pct * 100}
            onChange={(v) => update("exit", "exit_cap_rate_pct", v / 100)}
            multiplier={1}
            decimals={2}
            min={2}
            max={12}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {isLoading ? "Calculating..." : "Run Underwriting"}
      </button>
    </form>
  );
}
