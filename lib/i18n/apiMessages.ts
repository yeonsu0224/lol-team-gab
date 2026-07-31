import type { Locale } from "./locale";

const API_MESSAGES = {
  DEMO_PLAYER_ONLY: {
    ko: "데모 플레이어만 검색 가능합니다. 검색창 아래 목록에서 선택해 주세요.",
    en: "Only demo players can be searched. Please select one from the list below the search field.",
  },
  DEMO_MATCH_NOT_FOUND: {
    ko: "데모 매치를 찾을 수 없습니다.",
    en: "Demo match not found.",
  },
  RIOT_ID_TAG_REQUIRED: {
    ko: "원격 검색에는 게임명#태그를 정확히 입력해 주세요. 태그 없는 검색은 이전 플레이어 목록에서만 제공됩니다.",
    en: "Remote search requires gameName#tag. Tagless search only works from previous players.",
  },
  INVALID_ACCOUNT_QUERY: {
    ko: "gameName과 tagLine이 필요합니다.",
    en: "gameName and tagLine are required.",
  },
  RIOT_API_KEY_MISSING: {
    ko: "RIOT_API_KEY가 설정되지 않았습니다.",
    en: "RIOT_API_KEY is not configured.",
  },
  RIOT_UNAUTHORIZED: {
    ko: "Riot API 키가 만료되었거나 권한이 없습니다. 키를 갱신하고 서버를 재시작해 주세요.",
    en: "Riot API key is expired or unauthorized. Renew the key and restart the server.",
  },
  RIOT_NOT_FOUND: {
    ko: "Riot 데이터를 찾을 수 없습니다.",
    en: "Riot data was not found.",
  },
  RIOT_RATE_LIMITED: {
    ko: "Riot API 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
    en: "Riot API rate limit reached. Please try again shortly.",
  },
  REQUEST_FAILED: {
    ko: "요청을 처리하지 못했습니다.",
    en: "The request could not be processed.",
  },
} as const;

export type ApiMessageKey = keyof typeof API_MESSAGES;

export function localizeApiMessage(key: ApiMessageKey, locale: Locale = "ko") {
  return API_MESSAGES[key][locale];
}
