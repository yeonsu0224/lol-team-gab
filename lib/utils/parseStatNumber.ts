/**
 * Parses a user-entered number that may include thousands separators and a
 * decimal point (spec F-05). Accepts `20,170`, `1.50`, `1,234.5`. Returns
 * `null` for empty or non-numeric input (never silently 0).
 */
export function parseStatNumber(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") {
    return null;
  }
  const normalized = trimmed.replace(/,/g, "");
  if (!/^-?\d*\.?\d+$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Parses a KDA field that is either a ratio (`3.5`) or a `K/D/A` triple
 * (`12/4/9` → (12 + 9) / max(1, 4)). Returns `null` when unparseable.
 */
export function parseKdaInput(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") {
    return null;
  }

  if (trimmed.includes("/")) {
    const parts = trimmed.split("/").map((part) => parseStatNumber(part));
    if (parts.length !== 3 || parts.some((part) => part === null)) {
      return null;
    }
    const [kills, deaths, assists] = parts as [number, number, number];
    return (kills + assists) / Math.max(1, deaths);
  }

  return parseStatNumber(trimmed);
}

/** Formats a KDA ratio for display (one decimal). */
export function formatKda(kda: number): string {
  return (Math.round(kda * 100) / 100).toFixed(2);
}
