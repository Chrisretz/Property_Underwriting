import type { UnderwritingInput, UnderwritingOutput } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function runUnderwriting(
  input: UnderwritingInput
): Promise<UnderwritingOutput> {
  const res = await fetch(`${API_BASE}/api/v1/underwrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText || "Underwriting failed");
  }

  return res.json();
}
