interface ChampionPayload {
  data: Record<string, { id: string; key: string; name: string; image: { full: string } }>;
}

export async function getDataDragonBootstrap() {
  const versions = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
    next: { revalidate: 3600 },
  }).then((response) => response.json() as Promise<string[]>);
  const version = versions[0];
  const champions = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/ko_KR/champion.json`,
    { next: { revalidate: 3600 } },
  ).then((response) => response.json() as Promise<ChampionPayload>);
  return {
    version,
    championsByKey: Object.fromEntries(
      Object.values(champions.data).map((champion) => [champion.key, champion]),
    ),
  };
}
