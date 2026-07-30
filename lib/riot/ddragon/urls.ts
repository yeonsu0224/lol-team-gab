import type { DataDragonImageUrls } from "./types";

const CDN = "https://ddragon.leagueoflegends.com/cdn";

export function profileIconUrl(version: string, profileIconId: number): string {
  return `${CDN}/${segment(version)}/img/profileicon/${profileIconId}.png`;
}

export function championImageUrls(version: string, championId: string): DataDragonImageUrls {
  const id = segment(championId);
  return {
    square: `${CDN}/${segment(version)}/img/champion/${id}.png`,
    splash: `${CDN}/img/champion/splash/${id}_0.jpg`,
    loading: `${CDN}/img/champion/loading/${id}_0.jpg`,
  };
}

const EMBLEM_TIERS = new Set([
  "iron",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "emerald",
  "diamond",
  "master",
  "grandmaster",
  "challenger",
]);

export function rankedEmblemUrl(tier: string): string | null {
  const normalized = tier.toLowerCase().trim();
  if (!EMBLEM_TIERS.has(normalized)) return null;
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return `/ranked-emblems/Rank=${encodeURIComponent(label)}.png`;
}

function segment(value: string): string {
  return encodeURIComponent(value);
}
