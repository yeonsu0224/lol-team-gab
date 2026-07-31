export type Locale = "ko" | "en";

export const LOCALES: Locale[] = ["ko", "en"];
export const DEFAULT_LOCALE: Locale = "ko";
export const LOCALE_COOKIE = "tg-locale";
export const LOCALE_STORAGE_KEY = "team-gap:locale";

export function isLocale(value: unknown): value is Locale {
  return value === "ko" || value === "en";
}

export function localeFromRequest(request: Request): Locale {
  const url = new URL(request.url);
  const query = url.searchParams.get("lang");
  if (isLocale(query)) return query;
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=(ko|en)(?:;|$)`));
  if (isLocale(match?.[1])) return match[1];
  const accept = request.headers.get("accept-language")?.toLowerCase() ?? "";
  if (accept.includes("en") && !accept.startsWith("ko")) return "en";
  return DEFAULT_LOCALE;
}
