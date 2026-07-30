export interface ChampionSummary {
  id: string;
  key: string;
  name: string;
  title: string;
}

export type ChampionsByKey = Record<string, ChampionSummary>;

export interface DataDragonBootstrap {
  version: string;
  championsByKey: ChampionsByKey;
}

export interface DataDragonImageUrls {
  square: string;
  splash: string;
  loading: string;
}
