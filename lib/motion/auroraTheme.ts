/**
 * 오로라 배경 색 테마 (D-23).
 *
 * 결과 인트로처럼 화면 밖(레이아웃 루트)에 있는 배경 색을 페이지에서 바꿔야 하므로
 * React context 대신 모듈 스토어를 쓴다. 배경은 rAF 루프에서 목표 색으로 보간하고,
 * 노출 강조(`is-focus`)만 구독으로 리렌더한다.
 *
 * 색상(hue)은 테마 안에서 섞지 않는다. 무지개로 번지는 것을 막기 위해 각 테마는
 * 단일 색조의 명도 변화로만 구성한다.
 */
export type AuroraTheme = "default" | "blue" | "red" | "gold";

const STOPS: Record<AuroraTheme, readonly [string, string, string]> = {
  default: ["#16306b", "#2589ff", "#1b3a7a"],
  blue: ["#10336f", "#4aa2ff", "#0b2557"],
  red: ["#4d1327", "#ef4f67", "#33101d"],
  gold: ["#402d0d", "#c89b3c", "#2b1d08"],
};

let currentTheme: AuroraTheme = "default";
const listeners = new Set<() => void>();

export function setAuroraTheme(theme: AuroraTheme) {
  if (currentTheme === theme) return;
  currentTheme = theme;
  listeners.forEach((listener) => listener());
}

export function getAuroraTheme(): AuroraTheme {
  return currentTheme;
}

export function getAuroraStops(theme: AuroraTheme): readonly [string, string, string] {
  return STOPS[theme];
}

export function subscribeAuroraTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
