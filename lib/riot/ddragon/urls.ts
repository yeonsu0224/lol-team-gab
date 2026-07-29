import type { DataDragonImageUrls } from "./types";

const DDRAGON_ORIGIN = "https://ddragon.leagueoflegends.com";
export const RANKED_EMBLEMS_SOURCE_URL =
  "https://static.developer.riotgames.com/docs/lol/ranked-emblems-latest.zip";

const TIER_EMBLEM_FILES: Record<string, string> = {
  IRON: "Rank=Iron.png",
  BRONZE: "Rank=Bronze.png",
  SILVER: "Rank=Silver.png",
  GOLD: "Rank=Gold.png",
  PLATINUM: "Rank=Platinum.png",
  EMERALD: "Rank=Emerald.png",
  DIAMOND: "Rank=Diamond.png",
  MASTER: "Rank=Master.png",
  GRANDMASTER: "Rank=Grandmaster.png",
  CHALLENGER: "Rank=Challenger.png",
};

function championDataId(value: string): string {
  if (!/^[A-Za-z0-9]+$/.test(value)) {
    throw new Error("Data Dragon champion id is invalid");
  }
  return value;
}

export function profileIconUrl(
  version: string,
  profileIconId: number,
): string {
  if (!Number.isInteger(profileIconId) || profileIconId < 0) {
    throw new Error("Profile icon id is invalid");
  }
  return `${DDRAGON_ORIGIN}/cdn/${version}/img/profileicon/${profileIconId}.png`;
}

export function championSquareUrl(
  version: string,
  dataDragonId: string,
): string {
  return `${DDRAGON_ORIGIN}/cdn/${version}/img/champion/${championDataId(dataDragonId)}.png`;
}

export function championSplashUrl(dataDragonId: string): string {
  return `${DDRAGON_ORIGIN}/cdn/img/champion/splash/${championDataId(dataDragonId)}_0.jpg`;
}

export function championLoadingUrl(dataDragonId: string): string {
  return `${DDRAGON_ORIGIN}/cdn/img/champion/loading/${championDataId(dataDragonId)}_0.jpg`;
}

export function championImageUrls(
  version: string,
  dataDragonId: string,
): DataDragonImageUrls {
  return {
    square: championSquareUrl(version, dataDragonId),
    splash: championSplashUrl(dataDragonId),
    loading: championLoadingUrl(dataDragonId),
  };
}

export function tierEmblemUrl(tier: string): string | null {
  const fileName = TIER_EMBLEM_FILES[tier.toUpperCase()];
  return fileName
    ? `/ranked-emblems/${encodeURIComponent(fileName)}`
    : null;
}
