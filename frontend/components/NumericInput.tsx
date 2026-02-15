"use client";

import { useState, useEffect } from "react";

/** Parse number from input, accepting both comma and period as decimal separator */
function parseDecimal(str: string): number {
  const normalized = str.replace(",", ".").replace(/\s/g, "");
  return Number(normalized) || 0;
}

/** Format number for display (Danish locale: comma as decimal) */
function formatForDisplay(value: number, decimals = 2): string {
  return value.toLocaleString("da-DK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  decimals?: number;
  multiplier?: number; // e.g. 100 for percentages, 1_000_000 for millions
  min?: number;
  max?: number;
  className?: string;
  placeholder?: string;
}

/**
 * Input that accepts both comma and period as decimal separator.
 * Uses local state while editing to preserve "21," until user finishes.
 */
export function NumericInput({
  value,
  onChange,
  decimals = 2,
  multiplier = 1,
  min,
  max,
  className = "",
  placeholder,
}: NumericInputProps) {
  const displayValue = value / multiplier;
  const [local, setLocal] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Reset local state when value changes externally (e.g. form reset)
  useEffect(() => {
    if (!isFocused) setLocal(null);
  }, [displayValue, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocal(raw);
    const parsed = parseDecimal(raw) * multiplier;
    if (parsed >= 0 && (min === undefined || parsed >= min) && (max === undefined || parsed <= max)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setLocal(null);
    // On blur, commit the current input (or keep previous value if invalid)
    if (local !== null) {
      const current = parseDecimal(local) * multiplier;
      if (!isNaN(current) && current >= 0 && (min === undefined || current >= min) && (max === undefined || current <= max)) {
        onChange(current);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setLocal(formatForDisplay(displayValue, decimals));
  };

  const showValue = isFocused && local !== null ? local : formatForDisplay(displayValue, decimals);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={showValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
    />
  );
}
