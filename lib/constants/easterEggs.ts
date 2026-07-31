export type EasterEggEffect = "none" | "glow" | "rainbow" | "sparkle";

export interface EasterEggTag {
  puuid?: string;
  riotId?: string;
  label: string;
  emoji?: string;
  effect?: EasterEggEffect;
  note?: string;
}

/**
 * 표시 전용 개발자 이스터에그.
 * 실제 값을 직접 추가하되 도메인 점수·팀 배정·AI payload에서는 import하지 않는다.
 */
export const EASTER_EGG_TAGS: EasterEggTag[] = [
  // {
  //   puuid: "",
  //   riotId: "가슴이두근운동#6848",
  //   label: "에겐남",
  //   emoji: "✨",
  //   effect: "sparkle",
  //   note: "재미용 태그. 전력 분석과 무관합니다.",
  // },
];

export function lookupEasterEgg(puuid?: string, riotId?: string): EasterEggTag | undefined {
  const normalized = riotId?.trim().toLocaleLowerCase();
  return EASTER_EGG_TAGS.find(
    (egg) =>
      Boolean(puuid && egg.puuid === puuid) ||
      Boolean(normalized && egg.riotId?.trim().toLocaleLowerCase() === normalized),
  );
}
