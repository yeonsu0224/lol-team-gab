export interface ChampionSummary {
  id: string;
  key: string;
  name: string;
  title: string;
  image: {
    full: string;
  };
}

export interface DataDragonImageUrls {
  square: string;
  splash: string;
  loading: string;
}

export interface DataDragonBootstrap {
  version: string;
  championsByKey: Record<string, ChampionSummary>;
}
