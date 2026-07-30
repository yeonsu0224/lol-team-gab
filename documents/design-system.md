# Design System — Hextech Glass

> **문서 버전:** v0.5.1  
> **상태:** 3차 반복 UX 반영 (모션 시스템 · 상단 배너 · 대시보드 · 대치 정렬 · hover 플로팅 · 별점)

리그 오브 레전드의 어두운 청색·금색 계열에서 영감을 받은 컬러 그라디언트와 글래스모피즘을 사용한다. 다만 Riot의 실제 클라이언트를 복제하지 않고, 내전 팀 편성과 스탯 비교에 적합한 독자적인 인터페이스를 구성한다.

핵심 키워드:

```text
Dark Navy / Hextech Gold / Arcane Blue / Glass / Competitive
```

## 1. 컬러 토큰

### 기본 배경

```scss
$color-bg-deep: #030712;
$color-bg-base: #07101f;
$color-bg-elevated: #0b1728;
$color-bg-soft: #102038;
```

용도:

- `$color-bg-deep`: 페이지 최하단 배경
- `$color-bg-base`: 일반 페이지 배경
- `$color-bg-elevated`: 패널과 떠 있는 영역
- `$color-bg-soft`: hover 및 선택 영역

### Hextech Gold

```scss
$color-gold-100: #f8edc7;
$color-gold-300: #e8cf84;
$color-gold-500: #c89b3c;
$color-gold-600: #a97b24;
$color-gold-700: #785a28;
```

사용 범위:

- 핵심 CTA
- 선택된 탭
- 랭크 및 LP 강조
- 중요한 테두리
- 로고 및 장식적인 포인트

금색을 일반 본문이나 넓은 배경에 과도하게 사용하지 않는다.

### Arcane Blue

```scss
$color-blue-100: #d5f5ff;
$color-blue-300: #62d5f5;
$color-blue-500: #0ac8b9;
$color-blue-600: #0397ab;
$color-blue-700: #005a82;
```

사용 범위:

- 링크
- 포커스 링
- 정보 상태
- 보조 CTA
- 데이터 시각화
- 선택 가능한 요소의 hover

### Purple Accent

```scss
$color-purple-300: #c4a7ff;
$color-purple-500: #8b5cf6;
$color-purple-700: #5b21b6;
```

보라색은 라이벌, 특수 매칭 또는 보조 그래프에 제한적으로 사용한다.

### 텍스트

```scss
$color-text-primary: #f4f1e8;
$color-text-secondary: #a7b3c8;
$color-text-muted: #6f7f96;
$color-text-disabled: #4d5b70;
$color-text-inverse: #07101f;
```

### 테두리

```scss
$color-border-subtle: rgba(255, 255, 255, 0.08);
$color-border-default: rgba(182, 202, 230, 0.16);
$color-border-strong: rgba(200, 155, 60, 0.42);
$color-border-focus: rgba(98, 213, 245, 0.8);
```

### Glass Surface

```scss
$glass-surface-soft: rgba(10, 22, 39, 0.52);
$glass-surface-default: rgba(9, 20, 36, 0.68);
$glass-surface-strong: rgba(7, 16, 30, 0.82);
$glass-overlay: rgba(3, 7, 18, 0.72);

$glass-blur-sm: 8px;
$glass-blur-md: 16px;
$glass-blur-lg: 24px;
```

### 페이지 그라디언트

```scss
$gradient-page:
  radial-gradient(
    circle at 15% 10%,
    rgba(0, 90, 130, 0.28),
    transparent 34%
  ),
  radial-gradient(
    circle at 85% 15%,
    rgba(91, 33, 182, 0.18),
    transparent 30%
  ),
  radial-gradient(
    circle at 50% 100%,
    rgba(200, 155, 60, 0.12),
    transparent 38%
  ),
  linear-gradient(
    145deg,
    #030712 0%,
    #07101f 52%,
    #081527 100%
  );
```

### 금색 강조 그라디언트

```scss
$gradient-gold: linear-gradient(
  135deg,
  #f0d98b 0%,
  #c89b3c 48%,
  #8f6422 100%
);
```

### 청록색 강조 그라디언트

```scss
$gradient-blue: linear-gradient(
  135deg,
  #62d5f5 0%,
  #0ac8b9 50%,
  #005a82 100%
);
```

### 라이벌 강조 그라디언트

```scss
$gradient-rival: linear-gradient(
  135deg,
  #8b5cf6 0%,
  #0ac8b9 100%
);
```

## 2. 타이포그래피 스케일

한국어 본문은 가독성을 위해 Pretendard를 우선한다. 점수와 통계에는 고정폭 숫자를 적용한다.

```scss
$font-family-base:
  "Pretendard Variable",
  Pretendard,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;

$font-family-display:
  "Pretendard Variable",
  Pretendard,
  sans-serif;
```

### 크기 체계

| Token | 크기/행간 | 굵기 | 용도 |
|---|---:|---:|---|
| `display-xl` | 48/56px | 700 | 랜딩 핵심 문구 |
| `display-lg` | 40/48px | 700 | 주요 결과 점수 |
| `heading-xl` | 32/40px | 700 | 페이지 제목 |
| `heading-lg` | 24/32px | 700 | 패널 제목 |
| `heading-md` | 20/28px | 600 | 카드 제목 |
| `body-lg` | 18/28px | 500 | 강조 본문 |
| `body-md` | 16/24px | 400 | 기본 본문 |
| `body-sm` | 14/20px | 400 | 보조 정보 |
| `label-md` | 14/20px | 600 | 버튼·입력 라벨 |
| `caption` | 12/16px | 500 | 메타데이터 |
| `stat-lg` | 28/32px | 700 | LP·KDA·승률 |
| `stat-sm` | 16/20px | 600 | 보조 스탯 |

```scss
.stat-number {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
```

규칙:

- 기본 본문 크기는 16px로 한다.
- 모바일에서도 본문은 14px 미만으로 줄이지 않는다.
- 금색 텍스트는 제목, LP, 선택 상태에 제한한다.
- 전체 대문자 영문은 짧은 라벨에만 사용한다.
- 긴 본문에는 display 폰트 효과를 사용하지 않는다.

## 3. Spacing 규칙

4px 단위 체계를 사용한다.

```scss
$space-0: 0;
$space-1: 4px;
$space-2: 8px;
$space-3: 12px;
$space-4: 16px;
$space-5: 20px;
$space-6: 24px;
$space-8: 32px;
$space-10: 40px;
$space-12: 48px;
$space-16: 64px;
$space-20: 80px;
```

적용 기준:

- 아이콘과 텍스트: 8px
- 동일한 정보 그룹 내부: 8~12px
- 폼 요소 사이: 16px
- 카드 내부 패딩: 20~24px
- 패널 내부 패딩: 24~32px
- 카드 사이: 16~24px
- 섹션 사이: 40~64px
- 페이지 좌우 여백: 모바일 16px, 태블릿 24px, 데스크톱 32px
- 콘텐츠 최대 너비: 1200~1280px

동일한 의미의 컴포넌트는 화면마다 다른 간격을 임의로 사용하지 않는다.

## 4. Radius와 Shadow

### Radius

```scss
$radius-sm: 6px;
$radius-md: 10px;
$radius-lg: 16px;
$radius-xl: 24px;
$radius-pill: 999px;
```

사용 기준:

- Badge: pill
- Button·Input: 8~10px
- 작은 Card: 12~16px
- 주요 Panel: 16~24px
- Modal: 24px

지나치게 둥근 형태를 모든 요소에 적용하지 않는다.

### Shadow

```scss
$shadow-sm:
  0 4px 12px rgba(0, 0, 0, 0.2);

$shadow-md:
  0 12px 32px rgba(0, 0, 0, 0.3);

$shadow-lg:
  0 24px 64px rgba(0, 0, 0, 0.42);

$shadow-gold:
  0 0 0 1px rgba(200, 155, 60, 0.3),
  0 8px 32px rgba(200, 155, 60, 0.12);

$shadow-blue:
  0 0 0 1px rgba(98, 213, 245, 0.28),
  0 8px 32px rgba(10, 200, 185, 0.12);
```

규칙:

- 기본 구분은 그림자보다 반투명 테두리를 사용한다.
- 일반 카드에는 `$shadow-sm` 이하만 사용한다.
- Modal과 주요 결과 Panel에만 `$shadow-lg`를 허용한다.
- 네온 광택은 선택·강조 상태에만 사용한다.
- 중첩된 카드마다 그림자를 추가하지 않는다.

## 4-A. 모션 시스템 (D-14)

3차 반복에서 도입한 모션 규칙. 정적·딱딱한 인상을 걷어내되, **가독성·성능·접근성**을 최우선으로 한다. 토큰은 `styles/abstracts/_motion.scss`에 둔다.

### 이징 토큰

```scss
$ease-in-out-soft: cubic-bezier(0.4, 0, 0.2, 1);   // 기본 전환·등장
$ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1);     // 등장(감속) 강조
$ease-in-soft: cubic-bezier(0.4, 0, 1, 1);         // 퇴장(가속)
```

- 기본은 **`ease-in-out` 계열 cubic-bezier**를 적극 사용한다. `linear`·급격한 곡선은 지양한다.

### 지속시간·지연 토큰

```scss
$motion-micro: 180ms;    // hover 마이크로 인터랙션 (§5 유지, 150~250ms)
$motion-enter: 320ms;    // 콘텐츠 등장 (220~420ms)
$motion-exit: 240ms;     // 단계 전환 페이드 아웃
$motion-stagger-step: 60ms;  // 순차 등장 항목 간 지연 (40~80ms)
```

### keyframes

```scss
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideInLeft {   // 블루팀: 좌 → 우
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes slideInRight {  // 레드팀: 우 → 좌
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes gradientShift { // CTA 활성 강조 (저강도)
  0%   { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}
```

### 적용 규칙

| 상황 | 모션 |
|------|------|
| **단계 전환**(페이지·스텝 이동) | 현재 화면 박스 `fadeOut`($motion-exit) → 새 화면 등장 |
| **콘텐츠 등장 순서** | 항상 **박스(컨테이너) → 타이틀 → 리스트/주요 콘텐츠** 순, `fadeInUp` + stagger |
| **순차 등장(stagger)** | 항목 index × `$motion-stagger-step` 지연 누적 |
| **팀 슬라이드 인** | 블루=`slideInLeft`, 레드=`slideInRight`. **참가자 등록 화면 제외** |
| **팀 제안 CTA** | 활성 시 `gradientShift` (의도된 예외, 저강도 루프) |

### 접근성 (reduced-motion)

```scss
@media (prefers-reduced-motion: reduce) {
  // 이동·슬라이드·그라디언트 루프 생략, 즉시 표시 또는 최소 페이드만
}
```

- 모션은 콘텐츠 접근을 지연시키지 않는다(키보드·스크린리더 흐름은 즉시 동작).
- 클라이언트에서는 `lib/hooks/useReducedMotion.ts`로 상태를 감지해 슬라이드/루프를 끈다.

## 5. 컴포넌트 규칙

> **MVP 기준:** 아래는 토큰(§1~§4) 위에 올라가는 **UI 컴포넌트·화면 패턴** 제안이다.  
> 구현은 CSS Modules + `@use "abstracts" as *`를 사용하며, 상세 스펙·파일 매핑은 절 하단 **UI 컴포넌트 카탈로그**를 따른다.

### Button

종류:

- `primary`: 팀 생성, 매칭 시작 등 핵심 행동
- `secondary`: 보조 행동
- `ghost`: 낮은 우선순위
- `danger`: 삭제 및 초기화
- `icon`: 아이콘 전용 행동

```scss
.button {
  min-height: 44px;
  padding: 0 $space-5;
  border-radius: $radius-md;
  font-size: 14px;
  font-weight: 600;
  transition:
    transform 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.button--primary {
  color: $color-text-inverse;
  background: $gradient-gold;
  border: 1px solid rgba(248, 237, 199, 0.48);
  box-shadow: $shadow-gold;
}

.button--secondary {
  border: 1px solid $color-border-default;
  color: $color-text-primary;
  background: rgba(16, 32, 56, 0.72);
}

.button--danger {
  min-height: 32px;
  padding-inline: $space-3;
  border: 1px solid rgba(255, 107, 107, 0.32);
  color: #ffb4b4;
  background: rgba(82, 27, 27, 0.48);
}
```

상태 규칙:

- hover: **모든 클릭 가능 UI**에 아주 약한 강조를 반드시 제공한다 (아래 **인터랙티브 Hover** 참고)
- primary hover: 1~2px 상승 + `brightness(1.06~1.08)` + 그림자 미세 증가
- secondary / ghost hover: 1px 상승 + `$color-border-strong` + `$shadow-sm`
- danger hover: 1px 상승 + 테두리·배경 밝기 증가
- active: 상승 효과 제거, `brightness(0.98)` 또는 1px 아래로 이동
- focus-visible: 청록색 2px focus ring
- disabled: 불투명도 45%, 포인터 이벤트 차단, **hover 없음**
- loading: 크기를 유지하고 중복 클릭 차단
- 아이콘 버튼의 클릭 영역은 최소 40×40px

한 화면에서 Primary Button은 원칙적으로 하나의 주요 행동에만 사용한다.

### 인터랙티브 Hover (전역)

모든 버튼, 링크, 입력 필드, 클릭 가능 카드는 마우스 호버 시 **눈에 띄되 과하지 않은** 피드백을 제공해야 한다. hover가 없는 인터랙티브 UI는 허용하지 않는다.

#### 적용 대상

| 요소 | hover 피드백 |
|------|-------------|
| `button`, `[role="button"]` | 1px 상승 + `brightness(1.06)` |
| `a[href]` | 밝기 증가 (`brightness(1.12)`) |
| `input`, `select`, `textarea` | `$color-border-strong` + 배경 미세 밝기 |
| 클릭 가능 Card / 세션 카드 | 1~2px 상승 + 테두리·그림자 강조 |
| 네비게이션 탭 / Step 링크 | 테두리·색상·그림자 미세 변화 |
| danger / remove 버튼 | 1px 상승 + danger 색상 밝기 증가 |

#### 적용하지 않는 대상

- 정보 표시 전용 Card (클릭 불가)
- Badge, 상태 라벨 (클릭 불가)
- `disabled`, `aria-disabled="true"`, `pointer-events: none` 요소
- 장식용 이미지·아이콘 (행동과 무관할 때)

#### 강도 기준

- **기본**: 1px 상승, `160ms ease` transition
- **강조(primary, 활성 탭)**: 최대 2px 상승, `$shadow-gold` 또는 `$shadow-sm` 추가
- **입력 필드**: transform 없이 테두리·배경만 변화
- hover만으로 레이아웃이 밀리지 않도록 transform은 `-1px ~ -2px` 범위로 제한한다.

#### 터치·접근성

- `@media (hover: hover) and (pointer: fine)` 안에서만 hover를 적용한다. 터치 기기에서는 hover 스타일이 고정되지 않도록 한다.
- hover는 focus-visible, active와 **함께** 동작해야 하며, hover만으로 상태를 전달하지 않는다.
- `prefers-reduced-motion: reduce`에서는 transform을 제거하고 border·background·filter만 사용한다.

#### 전역 SCSS (`styles/base/_interactive.scss`)

```scss
button,
a[href],
select,
input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]),
summary,
[role="button"] {
  @include interactive-transition;
}

@media (hover: hover) and (pointer: fine) {
  button:not(:disabled):hover,
  [role="button"]:not([aria-disabled="true"]):hover {
    transform: translateY(-1px);
    filter: brightness(1.06);
  }

  a[href]:hover {
    filter: brightness(1.12);
  }

  select:hover,
  input:not(:disabled):not([readonly]):hover {
    border-color: $color-border-strong;
    background-color: rgba(16, 32, 56, 0.88);
  }
}
```

컴포넌트별 추가 강조가 필요하면 아래 mixin을 사용한다. 화면마다 임의 hover 값을 새로 만들지 않는다.

```scss
@include interactive-transition;  // 공통 transition
@include hover-lift(-1px);        // 1px 상승
@include hover-emphasis-subtle;    // 테두리 + $shadow-sm
@include hover-brighten(1.06);    // brightness 조절
@include hover-surface-lift;      // lift + emphasis (secondary 버튼·카드용)
```

### Card

개별 플레이어, 챔피언, 통계처럼 독립적인 정보를 표현한다.

```scss
.card {
  position: relative;
  padding: $space-5;
  overflow: hidden;
  border: 1px solid $color-border-subtle;
  border-radius: $radius-lg;
  background: $glass-surface-default;
  box-shadow: $shadow-sm;
  backdrop-filter: blur($glass-blur-md);
  -webkit-backdrop-filter: blur($glass-blur-md);
}
```

규칙:

- Card 전체가 클릭 가능할 때만 hover 상승 효과를 사용한다.
- 클릭 가능 Card hover: `@include hover-surface-lift` + `$color-border-strong`
- 클릭 불가능한 Card에 클릭 가능한 것처럼 보이는 hover를 적용하지 않는다.
- 챔피언 Splash를 사용할 때 어두운 오버레이를 반드시 적용한다.
- Card 안에 Card를 중첩하는 것은 1단계까지만 허용한다.
- 주요 숫자 하나와 보조 정보들의 위계를 명확히 한다.

### Badge

티어, 포지션, 상태처럼 짧은 정보를 표시한다.

```scss
.badge {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  min-height: 24px;
  padding: 2px $space-2;
  border-radius: $radius-pill;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}
```

규칙:

- Badge 문구는 한 줄로 제한한다.
- 장문 설명에는 Badge를 사용하지 않는다.
- 색상과 함께 아이콘 또는 텍스트 라벨을 제공한다.
- 상태 Badge와 클릭 가능한 Filter Chip을 시각적으로 구분한다.
- 도메인 변형(`tierBadge`, `opBadge` 등)은 **UI 컴포넌트 카탈로그 — Badge 변형**을 따른다.

### Panel

팀 결과, 비교 분석, 설정 등 여러 정보를 묶는 큰 영역이다.

```scss
.panel {
  padding: $space-6;
  border: 1px solid $color-border-default;
  border-radius: $radius-xl;
  background: $glass-surface-strong;
  box-shadow: $shadow-md;
  backdrop-filter: blur($glass-blur-lg);
  -webkit-backdrop-filter: blur($glass-blur-lg);
}
```

규칙:

- Panel에는 제목 또는 접근 가능한 라벨을 제공한다.
- Panel 헤더, 본문, 액션 영역을 구분한다.
- 중요한 행동은 Panel 하단 또는 헤더 우측의 일관된 위치에 둔다.
- 한 화면에 강한 Glass Panel을 과도하게 배치하지 않는다.
- 긴 표가 들어가면 Glass 투명도를 낮추고 가독성을 우선한다.

---

## 5-A. UI 컴포넌트 카탈로그 (MVP)

§5의 Button·Card·Badge·Panel 규칙을 **구체 클래스·크기·화면 배치**까지 내린 구현 제안이다.  
Phase 4 이후 화면(F-04 팀 제안, F-05 시험 판 등)을 추가할 때도 동일 패턴을 확장한다.

### 기본 UI (Chrome)

모든 세션·하위 화면에 공통으로 제공하는 **탐색·페이지 틀**이다. 기능 화면보다 먼저 배치한다.

#### BackLink

이전 화면 또는 랜딩으로 돌아가는 텍스트 링크.

| 속성 | 값 |
|------|-----|
| 최소 높이 | 44px |
| typography | `label-md` |
| color | `$color-blue-300` |
| icon | `←` (텍스트, aria-hidden) |
| hover | `$color-blue-100` + 배경 `rgba(16, 32, 56, 0.48)` |

```scss
.backLink {
  @include text-style("label-md");
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  min-height: 44px;
  color: $color-blue-300;
}
```

| 화면 | href | label |
|------|------|-------|
| 랜딩·대시보드 외 전체 | `/dashboard` | `대시보드` |
| (필요 시) 이전 단계 | 이전 step path | `참가자로`, `팀 제안으로` 등 |

규칙:

- 브라우저 뒤로가기에만 의존하지 않고, **항상 눈에 보이는 BackLink**를 제공한다.
- **TopBanner 좌측 슬롯**에 1회 배치한다 (전역 크롬). 페이지 본문·session layout에 중복 배치하지 않는다.
- 랜딩(`/`)·대시보드(`/dashboard`)에서는 목적지가 같으므로 표시하지 않는다.
- Primary Button과 같은 줄에 두지 않는다.

#### PageHeader

페이지 제목·부제·우측 액션 영역. BackLink는 TopBanner에 있으므로 **본문에서 생략**한다.

| 영역 | typography | 설명 |
|------|------------|------|
| `title` | `heading-lg` | 페이지/세션 제목 |
| `description` | `body-sm`, secondary | 참가자 수, 진행 상태 등 |
| `action` | — | Badge, CTA (optional) |

```scss
.header {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.title {
  @include text-style("heading-lg");
  color: $color-text-primary;
}

.description {
  @include text-style("body-sm");
  color: $color-text-secondary;
}
```

규칙:

- Session layout 아래 page panel **맨 위**에 배치한다.
- `backHref` / `backLabel`은 layout BackLink가 **없는** 독립 페이지에서만 사용한다 (예: 랜딩 이외 root 페이지).
- 제목(`h1`)은 PageHeader에 1개만 둔다. Panel 내부 `sectionTitle`은 `h2`로 하향한다.

#### Session Chrome

세션 플로우 공통 상단 구조.

```text
container
  TopBanner (좌측 BackLink → "/dashboard" · 중앙 로고)
  chrome
    StepNav
  page panel
    PageHeader (title + description)
    …본문…
```

```scss
.chrome {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
```

#### Link (텍스트 / 버튼형)

| 변형 | 용도 |
|------|------|
| `BackLink` | 뒤로/랜딩 (기본 Chrome) |
| `homeLink` | **deprecated** — BackLink 사용 |
| `linkButton` | 비활성 안내·상태 칩 (클릭 불가 시 `linkButtonDisabled`) |

### Input / Select / Field

폼 입력의 기본 단위. Riot ID 검색, 수동 티어 입력 등에 사용한다.

| 속성 | 값 |
|------|-----|
| 최소 높이 | 44px |
| 패딩 | `0 $space-4` |
| radius | `$radius-md` |
| border | `$color-border-default` |
| background | `rgba(7, 16, 31, 0.76)` 또는 `$glass-surface-soft` |
| typography | `body-md` (입력값), `label-md` (라벨) |
| focus | `outline: 2px solid $color-border-focus` |
| hover | `$color-border-strong` + 배경 `rgba(16, 32, 56, 0.88)` |

```scss
.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  min-width: 140px;
  flex: 1 1 180px;
}

.input,
.select {
  min-height: 44px;
  padding: 0 $space-4;
  border: 1px solid $color-border-default;
  border-radius: $radius-md;
  color: $color-text-primary;
  background: rgba(7, 16, 31, 0.76);
}
```

규칙:

- 라벨(`fieldLabel`)은 입력 위에 배치하고 `$color-text-secondary`를 사용한다.
- placeholder는 `$color-text-muted`.
- `inputRow`는 입력 + primary 버튼을 가로 배치하며, `$breakpoint-sm` 이하에서는 column으로 전환한다.
- 숫자 입력(LP 등)은 `min`/`max`로 클라이언트 검증 후 서버·도메인 로직과 일치시킨다.

### Banner (Error / Warning)

API 실패, 저장 실패, 데이터 부족 등 시스템·데이터 상태를 알린다.

| 변형 | 색상 토큰 | 용도 |
|------|-----------|------|
| `errorBanner` | `$status-error*` | API 오류, 등록 실패 |
| `warningBanner` | `$status-warning*` / gold tint | bootstrap 실패, 데이터 부족 |

```scss
.errorBanner {
  @include text-style("body-sm");
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  color: #ffd6d6;
  background: rgba(109, 31, 31, 0.45);
  border: 1px solid rgba(255, 120, 120, 0.32);
}

.warningBanner {
  color: $color-gold-100;
  background: rgba(120, 92, 18, 0.22);
  border: 1px solid rgba(200, 155, 60, 0.28);
}
```

규칙:

- `role="alert"`를 error에 사용한다.
- 플레이어 평가(범인 등)와 시스템 오류를 같은 스타일로 표현하지 않는다.
- 원인 + 다음 행동(재시도, 키 갱신 등)을 함께 안내한다.

### Link

텍스트 링크와 버튼형 링크를 구분한다. **뒤로 가기는 BackLink**(기본 UI Chrome)를 사용한다.

| 변형 | 스타일 | hover |
|------|--------|-------|
| `BackLink` | `$color-blue-300`, `label-md`, `←` 아이콘 | 배경 + 밝기 (§ 기본 UI Chrome) |
| `linkButton` | secondary 버튼과 동일 | `@include hover-surface-lift` |
| `linkButtonDisabled` | opacity 45%, `pointer-events: none` | hover 없음 |

### Accordion

상세 정보(스탯, 모스트, 근거)를 접었다 펼치는 패턴. **PlayerCard** 내부에서 사용한다.

구현은 native `<details>` / `<summary>`를 우선한다.

| 영역 | 클래스 | 설명 |
|------|--------|------|
| 컨테이너 | `accordion` | 상단 `$color-border-subtle` 구분선 |
| 트리거 | `accordionTrigger` | `label-md`, 좌측 라벨 + 우측 `▾` |
| 본문 | `accordionBody` | padding `$space-5`, gap `$space-4` |

```scss
.accordionTrigger {
  @include text-style("label-md");
  padding: $space-3 $space-5;
  color: $color-text-secondary;
  cursor: pointer;

  &::after {
    content: "▾";
    color: $color-blue-300;
    transition: transform 160ms ease;
  }
}

.accordion[open] .accordionTrigger::after {
  transform: rotate(180deg);
}
```

규칙:

- 기본 상태는 **접힘**. 요약 행(cardSummary)만 항상 노출한다.
- 트리거 문구 예: `상세 분석 보기`
- 키보드: `<summary>` 기본 focus 지원, focus-visible ring 유지
- hover: 배경 `rgba(16, 32, 56, 0.48)`, 텍스트 `$color-text-primary`

> **3차 변경(F-02):** **참가자 등록 화면**에서는 상세를 아코디언 대신 **hover 플로팅 모달(PlayerHoverCard)**로 표시한다. 아코디언은 다른 화면 상세에서 계속 사용한다.

### StepNav

세션 진행 단계(참가자 → 팀 제안 → 시험 판 → 재밸런스) 네비게이션.

| 속성 | 값 |
|------|-----|
| 레이아웃 | 가로 pill 목록, `overflow-x: auto` |
| step 높이 | 44px |
| step gap | `$space-2` |
| 비활성 | `$glass-surface-soft`, `$color-text-secondary` |
| 활성 | `$color-gold-300`, `$shadow-gold`, `$color-border-strong` |
| stepNumber | 20×20px 원형, `$glass-overlay` 배경 |

```scss
.step {
  border-radius: $radius-pill;
  border: 1px solid $color-border-subtle;
  @include hover-emphasis-subtle;
}

.stepActive {
  border: 1px solid $color-border-strong;
  box-shadow: $shadow-gold;
  color: $color-gold-300;
}
```

규칙:

- `aria-current="step"`을 활성 링크에 지정한다.
- `nav`에 `aria-label="내전 진행 단계"` 제공.
- 모바일에서 가로 스크롤 허용, 줄바꿈하지 않는다 (`white-space: nowrap`).

### TopBanner (공통 크롬, D-14)

전 화면 상단에 고정되는 배너. **중앙 정렬 로고** 스타일 (feedback: 큰 시작 버튼 → 상단 배너).

| 요소 | 스타일 |
|------|--------|
| position | `sticky`/`fixed` top, `z-index` chrome 레이어 |
| layout | `1fr auto 1fr` 3열 — **좌측 슬롯에 BackLink(대시보드)**, 중앙 로고, 우측은 여백 |
| surface | `glass-surface($glass-surface-soft, $glass-blur-sm, $color-border-subtle)`, 하단 border |
| logo | 중앙 정렬, `$gradient-gold` text clip 또는 로고 마크 |
| height | 컴팩트(본문 자리 침범 최소) |

규칙:

- 랜딩·대시보드·세션 화면 공통 상단 크롬으로 유지한다.
- 배너는 장식이 아니라 브랜드·홈 진입점이며, 큰 CTA를 대체한다.

### Hero (Landing · 소개형, F-01)

랜딩은 **소개형**이다. 앱이 무엇을 하는지 전달하고 "시작하기"로 대시보드에 진입한다.

| 요소 | typography / 스타일 |
|------|---------------------|
| `badge` | `caption`, pill, `$color-gold-300`, uppercase |
| `title` | `display-xl`, `$gradient-gold` text clip |
| `subtitle` | `body-md`, `$color-text-secondary` |
| `startCta` | `primary` 버튼 → `/dashboard` |

규칙:

- hero는 중앙 정렬, gap `$space-3`.
- display-xl 그라디언트 텍스트는 hero·주요 결과 점수에만 사용한다.
- 소개 블록은 Stagger(박스→타이틀→콘텐츠) 등장.

### DashboardGreeting (F-12, D-15)

대시보드 상단 인사·내 플레이어 영역.

| 요소 | 스타일 |
|------|--------|
| `greeting` | `heading-md`, "안녕하세요, 총무 {이름}님" (미지정 시 "총무님") |
| `myPlayerPicker` | Riot ID 검색 결과 계정을 "나"(myPuuid)로 지정/해제 |

### SessionCard

저장된 내전 목록의 클릭 가능 카드 (대시보드 그리드).

| 속성 | 값 |
|------|-----|
| surface | `glass-surface($glass-surface-soft, $glass-blur-sm, $color-border-subtle)` |
| padding | `$space-5` |
| radius | `$radius-lg` |
| layout | column, gap `$space-2` |
| hover | `@include hover-surface-lift` + `$shadow-sm` |

| 텍스트 / 요소 | typography / 스타일 |
|--------|------------|
| `sessionName` | `body-lg`, primary |
| `sessionMeta` | `caption`, secondary (생성일 등) |
| `statusChip` | 상태 칩 — `preparing`(준비중, neutral) / `in_progress`(진행중, blue) / `completed`(완료, gold) (D-15) |
| `myRating` | 내 평점 별점(StarRating, read-only) — `wrapUp` 별점 있을 때 (F-10/F-12) |

그리드: 모바일 1열 → `$breakpoint-md` 이상 2~3열 (`sessionGrid`). 카드 나열은 Stagger 모션 적용(D-14).

### StarRating (F-10)

세션 **성과** 별점 1~5 입력/표시 컴포넌트. 피드백은 별점 없이 텍스트만.

| 상태 | 스타일 |
|------|--------|
| 입력 | 세션 성과 별 1~5 클릭·키보드 선택, 채워진 별 `$color-gold-500` (피드백은 텍스트만) |
| 표시(read-only) | 대시보드 카드 "내 평점" 등, 비활성 |

- `aria-label`로 "5점 만점에 N점" 제공, 키보드 조작 지원.

### 플로팅·모달 패턴 (3차)

feedback "2차 시도"에서 상시 큰 패널 대신 **hover 플로팅 / 미니 모달**로 정보 밀도를 낮춘다.

| 컴포넌트 | 용도 | 규칙 |
|----------|------|------|
| `PlayerHoverCard` | 참가자 등록 카드 hover 상세 (F-02) | 카드 hover/focus 시 상세 스탯·근거를 floating으로. 터치 환경은 tap 토글. `$shadow-md` |
| `MiniAddModal` | 팀 박스 선수 추가/교체 (F-04) | 팀 박스 버튼 클릭 시 **블루=좌 / 레드=우** 방향에 소형 모달 플로팅 |
| `BalanceReasonPopover` | 밸런스 근거 (F-04) | 팀 제안 박스 **우상단 아이콘** hover 시 상세 근거 박스 플로팅 (상시 패널 아님) |
| `RecentMatchesModal` | 최근 경기 선택 (F-05) | 참가자 최근 경기 목록을 모달로, 선택 시 폼 자동 채움 |

공통 규칙:

- 플로팅/모달은 `$shadow-lg`(모달)·`$shadow-md`(팝오버), Glass surface 사용.
- 핵심 폼·콘텐츠를 가리지 않게 배치하고, ESC·바깥 클릭으로 닫는다.
- hover 전용 정보는 keyboard focus·터치 대체 경로를 함께 제공한다(§8 접근성).
- 등장/퇴장에 `fadeInUp`/`fadeOut`($motion-enter/$motion-exit) 적용.

### PlayerCard

참가자 1명의 사전 전력을 표시하는 **column 리스트** 아이템.

#### 레이아웃 원칙

- 목록(`participantList`)은 **flex column**, gap `$space-3`, 카드 width 100%.
- flex wrap 그리드로 여러 열 배치하지 **않는다**.
- 카드 내부는 **요약(항상 노출) + 아코디언(상세)** 2단 구조.

#### cardSummary (요약 행)

| 영역 | 크기 / 스타일 |
|------|---------------|
| profileIcon | 56×56px, 원형 |
| tierEmblem | **88×88px**, `object-fit: contain` |
| playerName | `heading-md` |
| badgeRow | tier / internal / source 뱃지 |
| summaryMeta | `body-sm`, muted — 포지션 · 최근 N판 |
| removeButton | danger compact (min-height 32px) |

```scss
.participantList {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.cardSummary {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4 $space-5;
}
```

#### accordionBody (상세)

- `statGrid`: 4열 auto-fit (min 120px), label `caption` + value `body-md`
- `metaSection`: 모스트 챔피언, 근거 요약
- `reasonList`: bullet list, `$color-text-secondary`

### Badge 변형 (도메인)

§5 Badge 공통 규칙 위에, MVP에서 사용하는 변형을 정의한다.

| 클래스 | 의미 | 색상 |
|--------|------|------|
| `tierBadge` + `lolTier*` | LoL 티어+LP | 티어별 색 (Iron~Challenger) |
| `internalBadge` + `internalTier1~4` | 내부 1~4티어 | 1=gold, 2=teal, 3=blue, 4=slate |
| `opBadge` | OP | purple tint (`$status-op*`) |
| `sourceBadge` | 솔랭/자랭/수동 | neutral glass |
| `readyBadge` | 팀 제안 가능 | `$gradient-blue` |
| `readyBadgeLink` | 준비 완료 CTA (링크) | readyBadge와 동일 톤 + 클릭 가능 |
| `waitBadge` | 인원 부족 | neutral + border |

규칙:

- Badge는 기본적으로 **클릭 불가**, hover 없음.
- **예외:** `readyBadgeLink`는 8·10명 준비 완료 시 `/team` 이동용으로만 클릭 가능하다. `n/10 · 팀 제안하기` 형태로 인원과 액션을 함께 표시한다.
- OP와 internal tier는 동시 표시 가능.
- LoL 티어 뱃지는 `getLolTierBadgeClassName()` + `lolTierIron` … `lolTierChallenger` 변형을 사용한다.
- 내부 1~4 뱃지는 `getInternalTierBadgeClassName()` + `internalTier1` … `internalTier4` 변형을 사용한다. **동일 blue tint 금지.**

#### LoL 티어 뱃지 색 (참고)

| 티어 | 톤 |
|------|-----|
| Iron | gray |
| Bronze | copper |
| Silver | silver-blue |
| Gold | hextech gold |
| Platinum | cyan |
| Emerald | green |
| Diamond | indigo |
| Master | purple |
| Grandmaster | red |
| Challenger | bright gold |

#### 내부 티어 뱃지 색 (세션 상대 4분위)

| 뱃지 | 톤 | 의미 |
|------|-----|------|
| 1 | gold | 상위 25% |
| 2 | teal | 25~50% |
| 3 | blue | 50~75% |
| 4 | slate | 하위 25% |

- `readyBadge` / `readyBadgeLink` / `waitBadge`는 폼 헤더 우측 상태 표시용.

### Profile & Game Assets

Data Dragon / Community Dragon 이미지 규격.

| 자산 | 크기 | URL helper |
|------|------|------------|
| ProfileIcon | 56×56px, 원형 | `getProfileIconUrl(version, id)` |
| TierEmblem | **88×88px** | `getTierEmblemUrl(tier)` |
| ChampionIcon | 40×40px, `$radius-md` | `getChampionImageUrls(...).square` |

```scss
.profileIcon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid rgba(248, 237, 199, 0.22);
}

.tierEmblem {
  width: 88px;
  height: 88px;
  object-fit: contain;
}

.championIcon {
  width: 40px;
  height: 40px;
  border-radius: $radius-md;
}
```

규칙:

- profileIcon 없을 때 `profileFallback`: 이니셜 1글자, 56×56 원형.
- tierEmblem은 cardSummary 우측 고정 (`flex-shrink: 0`).
- championIcon hover: 1px lift + border 강조 (정보 아이콘, 클릭 불필요 시에도 미세 hover 허용).

### StatGrid

dl 기반 KPI 그리드. Accordion 본문·팀 패널 등에 재사용.

```scss
.statGrid {
  display: grid;
  gap: $space-3;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.statItem dt {
  @include text-style("caption");
  color: $color-text-muted;
}

.statItem dd {
  @include text-style("body-md");
  color: $color-text-primary;
  @include stat-number; // 숫자 KPI일 때
}
```

### Placeholder / Empty State

데이터 없음·아직 구현 전 영역.

```scss
.placeholder {
  min-height: 160px;
  border: 1px dashed $color-border-default;
  border-radius: $radius-lg;
  color: $color-text-muted;
  @include text-style("body-sm");
}
```

규칙:

- dashed border로 “임시/비어 있음”을 표현한다.
- hover 없음 (클릭 불가).

### 화면 레이아웃 패턴

MVP 화면별 Panel 조합. 새 화면은 아래 패턴을 따른다.

#### F-01 Landing (`app/page.tsx`) — 소개형 (3차)

```text
TopBanner (고정 상단, 중앙 로고)
Hero (badge + title + subtitle)
  ↓ $space-10
IntroSection — 앱 소개 (Stagger 등장)
  ↓
StartCta → "/dashboard"
```

#### F-12 Dashboard (`app/dashboard/page.tsx`) — 신규 (3차)

```text
TopBanner
DashboardGreeting — "안녕하세요, 총무 {이름}님" + MyPlayerPicker
CreateRow — "새 내전 시작" (nameInput + primaryButton)
ListSection — sessionGrid → SessionCard[] (statusChip + myRating, Stagger 등장)
```

#### Session Layout (`app/session/[id]/layout.tsx`)

```text
container
  TopBanner (공통 크롬 · 좌측 BackLink → "/dashboard")
  chrome
    StepNav
  children (page panel, FadeStage 전환)
```

#### F-02/F-03 Players (`app/session/[id]/players/page.tsx`) — 3차 개편

```text
Panel (glass, page shell)
  PageHeader (title + meta)   ← BackLink는 TopBanner에 있음
  searchHint (검색창 상단 소형 텍스트 — 본캐 경고 등)  ← 박스 아님
  FormPanel (glass-strong) — Riot ID 등록 + 팀 제안 CTA(그라디언트 활성)
  ManualPanel (optional) — 수동 티어
  registeredGrid — 좌5 / 우5 2열, 좌열→우열 순차, ~50% 축소 카드
    → PlayerCard(간략) + hover PlayerHoverCard(상세)
```

#### F-04/F-06 Team & Rebalance — 대치 정렬 (D-16, 3차)

```text
teamBoards (중앙 기준 대치)
  blueBoard (좌) — 헤더/타이틀/카드 우측 정렬, 카드 내 요소 거울 순서, slideInLeft
  powerRatioBar (51% vs 49%)
  redBoard (우)  — 헤더/타이틀/카드 좌측 정렬, 기본 순서, slideInRight
    · 각 팀 박스: 평균 티어 헤더 + [선수 추가/교체] 버튼(→ MiniAddModal)
    · 우상단: 밸런스 근거 아이콘(→ BalanceReasonPopover)
actionRow (하단 버튼 구역) — [시험 판 진행] / [내전 종료하기]
FloatingAssistant (우하단)
```

**카드 폭 규칙 (D-16)**

대치 정렬은 **콘텐츠 정렬만** 바꾼다. `teamList`는 grid이므로 `justify-content`를 주면 auto 컬럼이 stretch되지 않아 카드가 내용 폭으로 줄어든다. 정렬은 `text-align`으로만 처리하고, `justify-content: flex-end`는 flex 행(`teamHeader`·`badges`)에만 적용한다.

```scss
// ✅ 카드가 팀 박스 안쪽 폭 100%를 유지
.blue .teamHeader,
.blue .teamList,
.blue .badges { text-align: right; }

.blue .teamHeader,
.blue .badges { justify-content: flex-end; }

// ❌ .teamList(grid)에 justify-content를 주면 카드 폭이 내용 폭으로 줄어든다
```

**요소 순서 미러링 (D-16)**

블루팀 카드는 레드팀 카드의 거울 배치를 따른다. 카드 최상위 flex(`playerCard`)와 **뱃지 행(`badges`)** 모두 `row-reverse`를 적용해, 두 팀 모두 중앙에서 바깥쪽으로 `내부 티어 뱃지 → 라인 아이콘 → 성과·꿀벌` 순서로 읽히게 한다.

```scss
.blue .playerCard,
.blue .badges { flex-direction: row-reverse; }

@media (max-width: 47.999rem) {
  // 1열로 쌓이면 정렬·순서 미러링 모두 해제
  .blue .playerCard,
  .blue .badges { flex-direction: row; }
}
```

| Panel 클래스 | surface | padding | gap |
|--------------|---------|---------|-----|
| `panel` | `glass-surface` | `$space-6` | `$space-6` |
| `formPanel` / `listSection` | `$glass-surface-strong` | `$space-6` | `$space-5` |
| `formHeader` | grid 1fr + auto (≥720px) | — | `$space-3` |
| `registeredGrid` | 2열(≥`$breakpoint-md`), 1열(모바일) | — | `$space-3` |
| `blueBoard` | `text-align: right`, 카드·뱃지 행 `flex-direction: row-reverse` | — | — |
| `teamList` | grid 1열, `justify-content` 금지(카드 100% 폭 유지) | — | `$space-2` |

### 컴포넌트 ↔ 파일 매핑 (MVP)

구현 시 CSS Modules 클래스명은 아래를 기준으로 맞춘다. 공통 추출 전까지 화면별 module에 동일 이름을 사용한다.

| UI | 현재 파일 | 추후 공통화 |
|----|-----------|-------------|
| BackLink | `BackLink.module.scss` | `components/layout/BackLink` |
| PageHeader | `PageHeader.module.scss` | `components/layout/PageHeader` |
| Primary / Secondary / Remove Button | `players.module.scss`, `page.module.scss` | `components/shared/Button` |
| Input / Select / Field | `players.module.scss`, `page.module.scss` | `components/shared/Input` |
| Banner | `players.module.scss`, `page.module.scss` | `components/shared/Banner` |
| StepNav | `StepNav.module.scss` | `components/layout/StepNav` |
| SessionCard | `page.module.scss` | `components/dashboard/SessionCard` |
| TopBanner | `layout.module.scss` | `components/layout/TopBanner` |
| DashboardGreeting / SessionGrid / MyPlayerPicker | `dashboard.module.scss` | `components/dashboard/*` |
| 모션 래퍼(FadeStage/Stagger/TeamSlideIn) | `_motion.scss` + module | `components/motion/*` |
| PlayerHoverCard | `players.module.scss` | `components/player/PlayerHoverCard` |
| MiniAddModal / BalanceReasonPopover | `team.module.scss` | `components/team/*` |
| RecentMatchesModal | `trial.module.scss` | `components/trial/RecentMatchesModal` |
| StarRating | `finish.module.scss` | `components/shared/StarRating` |
| RiotIdSearch | `RiotIdSearch.module.scss` | `components/player/RiotIdSearch` |
| PlayerCard + Accordion | `players.module.scss` | `components/player/PlayerCard` |
| Badge 변형 | `players.module.scss`, `_status-badges.scss` | `components/shared/Badge` |
| ReasonPanel | `ReasonPanel` + 화면 module | `components/shared/ReasonPanel` |
| VisionReviewPanel | trial 화면 module | `components/trial/VisionReviewPanel` |
| StatGrid | `players.module.scss` | `components/shared/StatGrid` |

규칙:

- 새 화면에서 Button·Input·Badge를 **다시 정의하지 않는다**. 위 클래스 스펙을 복사하거나 공통 컴포넌트로 추출한다.
- 화면마다 spacing·radius·색상을 바꾸지 않는다. 토큰과 본 절의 수치를 따른다.

## 6. 상태 색상 규칙

상태는 색상만으로 표현하지 않는다. 항상 **색상 + 아이콘 + 텍스트**를 함께 사용한다.

### OP

압도적으로 높은 성과를 보인 플레이어를 의미한다.

```scss
$status-op: #d8b4fe;
$status-op-strong: #a855f7;
$status-op-bg: rgba(168, 85, 247, 0.16);
$status-op-border: rgba(216, 180, 254, 0.4);
```

- 아이콘: 왕관, 번개 또는 별
- 라벨: `OP`
- 의미: 매우 높은 기여도
- 보라색과 금색 광택을 제한적으로 함께 사용할 수 있다.

### 꿀벌

팀 기여도와 협력 지표가 긍정적인 플레이어를 의미한다.

```scss
$status-bee: #facc15;
$status-bee-strong: #eab308;
$status-bee-bg: rgba(250, 204, 21, 0.14);
$status-bee-border: rgba(250, 204, 21, 0.4);
```

- 아이콘: 벌 또는 하트
- 라벨: `꿀벌`
- 의미: 긍정적 기여 또는 팀워크
- Warning과 혼동되지 않도록 꿀벌 아이콘과 명칭을 반드시 표시한다.

### 범인

낮은 기여도나 패배 영향 지표를 표현한다.

```scss
$status-culprit: #fb7185;
$status-culprit-strong: #e11d48;
$status-culprit-bg: rgba(251, 113, 133, 0.14);
$status-culprit-border: rgba(251, 113, 133, 0.4);
```

- 아이콘: 표적 또는 아래 방향 화살표
- 라벨: `범인`
- 시스템 오류를 뜻하는 Error와 구분한다.
- 사용자를 공격하거나 조롱하는 문구를 추가하지 않는다.
- 단일 KDA만으로 판정하지 않고 명세된 산정 기준을 사용한다.
- 낮은 표본 수에서는 확정 표현 대신 `관찰 필요`를 고려한다.

### Error

시스템 실패, 저장 실패, API 오류를 의미한다.

```scss
$status-error: #ff5c6c;
$status-error-strong: #ef3340;
$status-error-bg: rgba(255, 92, 108, 0.14);
$status-error-border: rgba(255, 92, 108, 0.45);
```

- 아이콘: 원형 느낌표
- 라벨 예시: `정보를 불러오지 못했습니다`
- 원인과 다음 행동을 함께 안내한다.
- 플레이어 평가 상태에는 사용하지 않는다.

### Warning

데이터 부족, 낮은 신뢰도, 사용자의 확인이 필요한 상태다.

```scss
$status-warning: #f6c453;
$status-warning-strong: #d99a1b;
$status-warning-bg: rgba(246, 196, 83, 0.14);
$status-warning-border: rgba(246, 196, 83, 0.42);
```

- 아이콘: 삼각형 느낌표
- 예: `최근 경기 수가 적어 점수 신뢰도가 낮습니다`
- 꿀벌 상태와 색상이 비슷하므로 아이콘과 문구를 반드시 다르게 한다.

### Success와 Info

```scss
$status-success: #34d399;
$status-success-bg: rgba(52, 211, 153, 0.14);
$status-success-border: rgba(52, 211, 153, 0.4);

$status-info: #38bdf8;
$status-info-bg: rgba(56, 189, 248, 0.14);
$status-info-border: rgba(56, 189, 248, 0.4);
```

- Success: 저장 및 팀 생성 완료
- Info: 일반 안내 및 중립 정보

## 7. SCSS 구조 원칙

권장 구조:

```text
styles/
├── abstracts/
│   ├── _colors.scss
│   ├── _typography.scss
│   ├── _spacing.scss
│   ├── _radius.scss
│   ├── _shadows.scss
│   ├── _breakpoints.scss
│   ├── _mixins.scss
│   └── _index.scss
├── base/
│   ├── _reset.scss
│   ├── _fonts.scss
│   ├── _root.scss
│   ├── _interactive.scss
│   └── _accessibility.scss
├── utilities/
│   ├── _glass.scss
│   ├── _layout.scss
│   └── _visually-hidden.scss
└── globals.scss
```

컴포넌트 스타일은 컴포넌트와 같은 위치에 둔다.

```text
components/
├── layout/
│   ├── BackLink.tsx
│   ├── BackLink.module.scss
│   ├── PageHeader.tsx
│   ├── PageHeader.module.scss
│   ├── StepNav.tsx
│   └── StepNav.module.scss
├── player/
│   ├── RiotIdSearch.tsx
│   └── RiotIdSearch.module.scss
├── shared/
│   └── ReasonPanel.tsx
├── trial/
│   └── VisionReviewPanel.tsx
└── (화면별 module: players / team / trial / rebalance / summary)
```

### 토큰 관리

SCSS 변수와 CSS Custom Property를 함께 사용한다.

- 빌드 시점에 고정되는 간격과 breakpoint: SCSS 변수
- 런타임에서 테마 변경 가능성이 있는 색상: CSS 변수
- 컴포넌트에서 색상값을 직접 작성하지 않는다.
- 동일한 색을 여러 이름으로 중복 정의하지 않는다.

```scss
:root {
  --color-bg-base: #07101f;
  --color-surface-glass: rgba(9, 20, 36, 0.68);
  --color-text-primary: #f4f1e8;
  --color-text-secondary: #a7b3c8;
  --color-primary: #c89b3c;
  --color-focus: #62d5f5;
}
```

### Glass Mixin

```scss
@mixin glass-surface(
  $background: $glass-surface-default,
  $blur: $glass-blur-md,
  $border: $color-border-default
) {
  border: 1px solid $border;
  background: $background;
  box-shadow: $shadow-sm;
  backdrop-filter: blur($blur);
  -webkit-backdrop-filter: blur($blur);

  @supports not (backdrop-filter: blur(1px)) {
    background: $color-bg-elevated;
  }
}
```

### Interactive Hover Mixin

§5 Button — 인터랙티브 Hover와 동일한 값을 mixin으로 제공한다. `_mixins.scss`에 정의하고, 전역 기본값은 `_interactive.scss`에서 적용한다.

```scss
@mixin interactive-transition { /* transform, border, background, box-shadow, color, filter — 160ms */ }
@mixin hover-lift($offset: -1px) { /* hover 시 translateY, active 시 원위치 */ }
@mixin hover-emphasis-subtle { /* $color-border-strong + $shadow-sm */ }
@mixin hover-brighten($amount: 1.06) { /* filter: brightness */ }
@mixin hover-surface-lift { /* hover-lift + hover-emphasis-subtle */ }
```

`styles/globals.scss`에서 `_interactive.scss`를 import하여 앱 전역 hover 기본값을 보장한다.

### 반응형 Mixin

```scss
$breakpoint-sm: 480px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;

@mixin respond-to($breakpoint) {
  @media (min-width: $breakpoint) {
    @content;
  }
}
```

모바일 우선으로 작성한다.

```scss
.panel {
  padding: $space-4;

  @include respond-to($breakpoint-md) {
    padding: $space-6;
  }

  @include respond-to($breakpoint-xl) {
    padding: $space-8;
  }
}
```

### 네이밍 원칙

CSS Modules 내부에서도 BEM과 유사한 명확한 역할명을 사용한다.

```scss
.playerCard {}
.playerCard__header {}
.playerCard__identity {}
.playerCard__stats {}
.playerCard__status {}
.playerCard--selected {}
```

다만 CSS Modules에서 해시가 적용되므로 전역 BEM 구조를 과도하게 만들지 않는다.

### 금지 사항

- 컴포넌트 파일마다 임의의 색상값 작성
- 근거 없는 `z-index: 9999`
- 모든 요소에 `backdrop-filter` 적용
- 3단계 이상의 Glass Surface 중첩
- 레이아웃을 위한 과도한 `position: absolute`
- 의미 없는 `!important`
- 상태를 색상만으로 표현
- 페이지마다 새로운 spacing 값 생성
- 동일한 Button과 Badge를 화면별로 다시 구현
- **클릭 가능 UI에 hover 피드백 없이 배포**
- 디자인 명세에 없는 임의의 애니메이션 추가

## 8. 접근성 및 모션

```scss
:focus-visible {
  outline: 2px solid $color-border-focus;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- 본문 텍스트는 충분한 명도 대비를 유지한다.
- Glass Surface 위 텍스트의 가독성을 실제 배경 이미지와 함께 확인한다.
- 모든 인터랙션은 키보드로 사용할 수 있어야 한다.
- 마우스가 있는 환경에서는 모든 버튼·링크·입력 UI에 hover 피드백을 제공한다 (§5 인터랙티브 Hover).
- 터치 전용 환경에서는 hover 스타일이 상태처럼 고정되지 않도록 `@media (hover: hover)`로 제한한다.
- `OP`, `꿀벌`, `범인`은 아이콘과 텍스트를 함께 표시한다.
- **hover 마이크로 인터랙션**은 150~250ms로 제한한다.
- **단계 전환·콘텐츠 등장**(D-14, §4-A)은 220~420ms, stagger 40~80ms를 사용한다. 이징은 `ease-in-out` 계열 cubic-bezier를 우선한다.
- hover 전용 정보(PlayerHoverCard·Popover)는 keyboard focus·터치 대체 경로를 함께 제공한다.
- `prefers-reduced-motion: reduce`에서는 hover transform·슬라이드 인·그라디언트 루프를 생략하고, 즉시 표시하거나 최소한의 border·background·페이드 변화만 사용한다.
- 장식적인 무한 애니메이션은 사용하지 않는다. **예외:** 팀 제안 CTA 활성 그라디언트(§4-A, 저강도, reduced-motion에서 정지).

핵심 원칙은 다음 한 문장으로 정리할 수 있습니다.

> 어두운 청색 배경과 절제된 금색·청록색 포인트를 사용하고, Glass 효과는 주요 정보 계층을 강조하는 데만 적용하며, 플레이어 스탯의 가독성을 모든 장식보다 우선한다.

---

## 9. 변경 이력

| 버전 | 날짜 | 변경 |
|------|------|------|
| v0.3 | 2026-07-28 | MVP UI 카탈로그 · Chrome · hover/interactive |
| v0.4 | 2026-07-29 | 구현 반영: `readyBadgeLink`, RiotIdSearch·ReasonPanel·VisionReviewPanel 매핑, 컴포넌트 폴더 구조 동기화 |
| v0.5.1 | 2026-07-30 | D-16 대치 정렬 구현 규칙 보강: `teamList`(grid)에 `justify-content` 금지 — 카드 폭 100% 유지, `justify-content`는 flex 행(`teamHeader`·`badges`)에만. 블루팀은 `playerCard`·`badges` 모두 `row-reverse`로 요소 순서 거울 배치, 모바일 1열에서 해제 |
| v0.5 | 2026-07-29 | **3차 반복(feedback "2차 시도"):** §4-A 모션 시스템(이징·지속시간·keyframes fadeOut/fadeInUp/slideInLeft·Right/gradientShift·reduced-motion), TopBanner·소개형 Hero·Dashboard(Greeting·SessionCard 상태칩/평점)·StarRating·플로팅 모달 패턴(PlayerHoverCard·MiniAddModal·BalanceReasonPopover·RecentMatchesModal), 대치 정렬(D-16) 레이아웃, §8 모션 가이드·파일 매핑 갱신 |