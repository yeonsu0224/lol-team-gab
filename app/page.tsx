import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="tg-page">
      <section className="tg-hero">
        <span className="tg-chip is-gold">내전 준비부터 결과까지</span>
        <h1>팀 밸런스,<br />감이 아니라 근거로.</h1>
        <p>
          참가자 전력을 분석하고 팀을 제안한 뒤, 시험 판 결과로 재밸런스합니다.
          마지막에는 MVP와 기대 이상 플레이어까지 리드미컬하게 정리해 드려요.
        </p>
        <div className="tg-row" style={{ justifyContent: "center" }}>
          <Link className="tg-button tg-button--primary" href="/dashboard">시작하기</Link>
          <a className="tg-button" href="#features">무엇을 할 수 있나요?</a>
        </div>
      </section>
      <section id="features" className="tg-grid tg-grid--auto">
        {[
          ["전력 분석", "Riot 공개 기록과 티어를 함께 봅니다."],
          ["팀 제안", "8명 또는 10명을 균형 있게 나눕니다."],
          ["시험 판", "KDA·피해량·챔피언·라인을 반영합니다."],
          ["결과 공개", "승리팀·MVP·기대 이상 플레이어를 보여줍니다."],
        ].map(([title, text]) => (
          <article className="tg-panel" key={title}>
            <h2>{title}</h2>
            <p className="tg-muted">{text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
