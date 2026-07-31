/** Public review roster. Tags from the owner; others default to KR1. */
export const DEMO_ROSTER = [
  { gameName: "부추삼겹살", tagLine: "KR1" },
  { gameName: "EZ and CC", tagLine: "KR1" },
  { gameName: "아가눈사람", tagLine: "KR1" },
  { gameName: "멘타트", tagLine: "KR1" },
  { gameName: "가슴이두근운동", tagLine: "6848" },
  { gameName: "우호우호고릴라", tagLine: "111" },
  { gameName: "디무아미두랴미다", tagLine: "KR1" },
  { gameName: "대충 쩌는 조이", tagLine: "KR1" },
  { gameName: "매직키드마술이", tagLine: "KR1" },
  { gameName: "네모난못", tagLine: "KR1" },
] as const;

export type DemoRosterEntry = (typeof DEMO_ROSTER)[number];

export function demoRiotId(entry: { gameName: string; tagLine: string }) {
  return `${entry.gameName}#${entry.tagLine}`;
}

export function normalizeRiotPart(value: string) {
  return value.trim().toLowerCase();
}
