export type ValueScale = "actual" | "thousands" | "millions";

export const SCALE_DIVISORS: Record<ValueScale, number> = {
  actual: 1,
  thousands: 1_000,
  millions: 1_000_000,
};

export function scaleValue(value: number, scale: ValueScale): number {
  return value / SCALE_DIVISORS[scale];
}

export function formatScaledValue(
  value: number,
  scale: ValueScale,
  decimals = 0
): string {
  const scaled = scaleValue(value, scale);
  const formatted = scaled.toLocaleString("da-DK", {
    minimumFractionDigits: scale === "actual" ? 0 : 1,
    maximumFractionDigits: scale === "millions" ? 2 : decimals || 1,
  });
  if (scale === "millions") return `${formatted}M DKK`;
  if (scale === "thousands") return `${formatted} DKK`;
  return `${formatted} DKK`;
}

export function formatScaledCompact(value: number, scale: ValueScale): string {
  const scaled = scaleValue(value, scale);
  if (scale === "millions") return `${scaled.toFixed(2)}M DKK`;
  if (scale === "thousands") return `${scaled.toLocaleString("da-DK", { maximumFractionDigits: 1 })}k DKK`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M DKK`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K DKK`;
  return `${value.toFixed(0)} DKK`;
}

export function formatScaledTable(value: number, scale: ValueScale): string {
  const scaled = scaleValue(value, scale);
  return scaled.toLocaleString("da-DK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: scale === "actual" ? 0 : 1,
  });
}
