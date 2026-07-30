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
      Object.values(champions.data)
        // Data Dragon 16.15+에는 모드 전용 Jade 변형이 일반 챔피언과
        // 같은 이름으로 포함된다. 내전 기록에는 실제 챔피언 ID만 제공한다.
        .filter((champion) => !champion.id.startsWith("Jade_"))
        .map((champion) => [champion.key, champion]),
    ),
  };
}
