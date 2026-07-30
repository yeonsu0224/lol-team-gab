# 내전 총무

LoL 8~10명 내전 팀 밸런스 웹앱. Next.js(App Router) + TypeScript + SCSS Modules.

진입: 소개형 랜딩(`/`) → 대시보드(`/dashboard`) → 세션(참가자 → 팀 → 시험판 → 재밸런스 → 종료).

## 문서

- [documents/constitution.md](./documents/constitution.md) — 프로젝트 원칙
- [documents/spec.md](./documents/spec.md) — 기능 명세
- [documents/design-system.md](./documents/design-system.md) — Hextech Glass 디자인 토큰·컴포넌트 규칙
- [documents/implementation-plan.md](./documents/implementation-plan.md) — 구현 계획
- [documents/tasks.md](./documents/tasks.md) — 작업 정의 (Task ID: `P{Phase}-T{번호}`)

## 시작하기

```bash
npm install
cp .env.local.example .env.local   # RIOT_API_KEY, GEMINI_API_KEY 입력
npm run dev
npm run self-check   # 도메인 로직 자체 검증
```

## 환경 변수

서버 전용. `NEXT_PUBLIC_*`는 사용하지 않는다.

| 변수 | 용도 |
|------|------|
| `RIOT_API_KEY` | Riot Games API |
| `DDRAGON_FALLBACK_VERSION` | Data Dragon `versions.json` 실패 시 fallback |
| `GEMINI_API_KEY` | F-09 멀티모달 점수판 분석 + F-08 텍스트 요약 |

## 스타일 규칙

- 디자인 토큰은 [documents/design-system.md](./documents/design-system.md)가 단일 기준, 구현은 `styles/`(`abstracts`·`base`·`utilities`)에 있다.
- 컴포넌트는 `*.module.scss` + `@use "abstracts" as *;`로 토큰을 사용한다.
- 색상값·간격 하드코딩 금지 — 토큰 우선.
