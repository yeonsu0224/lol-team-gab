# Design System — Hextech Glass

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

## 5. 컴포넌트 규칙

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
```

상태 규칙:

- hover: 최대 2px 상승 또는 밝기 증가
- active: 상승 효과 제거, 1px 아래로 이동 가능
- focus-visible: 청록색 2px focus ring
- disabled: 불투명도 45%, 포인터 이벤트 차단
- loading: 크기를 유지하고 중복 클릭 차단
- 아이콘 버튼의 클릭 영역은 최소 40×40px

한 화면에서 Primary Button은 원칙적으로 하나의 주요 행동에만 사용한다.

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
├── Button/
│   ├── Button.tsx
│   └── Button.module.scss
├── PlayerCard/
│   ├── PlayerCard.tsx
│   └── PlayerCard.module.scss
└── TeamPanel/
    ├── TeamPanel.tsx
    └── TeamPanel.module.scss
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
- `OP`, `꿀벌`, `범인`은 아이콘과 텍스트를 함께 표시한다.
- 애니메이션은 150~250ms 범위로 제한한다.
- 장식적인 무한 애니메이션은 사용하지 않는다.

핵심 원칙은 다음 한 문장으로 정리할 수 있습니다.

> 어두운 청색 배경과 절제된 금색·청록색 포인트를 사용하고, Glass 효과는 주요 정보 계층을 강조하는 데만 적용하며, 플레이어 스탯의 가독성을 모든 장식보다 우선한다.