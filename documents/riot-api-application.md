# Riot API Application — Review Instructions

Please select one of the demo players displayed below the search field. The complete application flow is available without signing in. The public review version uses representative demo data, while the attached video demonstrates the same flow with live Riot API data.

## Product description (for Developer Portal)

Custom Game Steward is a web tool for League of Legends custom / internal scrimmage organizers (8–10 players). It helps hosts build fairer Blue/Red teams by analyzing each player’s ranked tier, recent match history, role preference, and champion mastery, then proposing balanced lineups with transparent scoring reasons. After a trial game, hosts can enter results and get a rebalance proposal for the next round based on how people actually played—not vibes. The product does not predict ranked ladder outcomes or provide gambling-related tips; it is only for private custom-game balance.

The current release focuses on League of Legends. We plan to add support for custom / internal-game balance in other titles later; Riot Games APIs are used only for League of Legends data.

APIs we use: Account-v1, Summoner-v4, League-v4, Match-v5, Champion-Mastery-v4, plus Data Dragon for champion icons/metadata. Optional Gemini assists with scoreboard image parsing and session summaries; it is not required for the core balance flow.

This is an unofficial web app only (no companion mobile app). The public review build uses anonymized demo players so reviewers can walk the full flow without a production key; live Riot API data is enabled after production-key approval.

## Demo notice (KO)

현재 공개 버전은 Riot API 개발 키의 만료 및 운영 제한으로 인해 데모 데이터를 사용합니다. 프로덕션 키 승인 후 실시간 Riot API 데이터가 제공됩니다.

## Demo notice (EN)

This public review version uses demonstration data because Riot development API keys expire and are not suitable for a persistent public deployment. Live Riot API data will be enabled after the production key is approved.

## Support

Yunsu0224@gmail.com

## Affiliation

This service is not an official Riot Games product and is not affiliated with or endorsed by Riot Games.
