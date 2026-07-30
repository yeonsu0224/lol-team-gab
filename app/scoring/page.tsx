export default function ScoringPage() {
  return (
    <main className="tg-page tg-stack">
      <section className="tg-panel tg-stack">
        <h1>점수 책정 방식</h1>
        <p className="tg-muted">내전 총무가 팀과 성과를 나누는 기준을 한곳에 모아 두었습니다.</p>
      </section>
      <section className="tg-panel tg-stack">
        <h2>누적 LP (D-02)</h2>
        <p>시험 판이 끝나면 직전 LP를 <strong>90%</strong>, 이번 판 조정 LP를 <strong>10%</strong>로 섞습니다. 한 판 성적으로 실력이 크게 흔들리지 않게 하기 위함입니다.</p>
      </section>
      <section className="tg-panel tg-stack">
        <h2>개인 점수 · 팀 배정 (D-06)</h2>
        <p>자동 배정 점수는 LP 70% · 주 라인 KDA 20% · 보정 승률 10%입니다. 여기에 총무가 티어·전적에 잡히지 않는 센스를 <strong>-10~+10%p</strong> 범위에서 보정할 수 있습니다. 비슷한 점수끼리 라이벌로 묶은 뒤, 팀 합 차이가 가장 작은 배치를 고릅니다. OP/1~5 뱃지는 설명용이며 배정 점수를 바꾸지 않습니다.</p>
      </section>
      <section className="tg-panel tg-stack">
        <h2>기대 이상 · 꿀벌 (D-07)</h2>
        <p>시험 판 KDA·딜량으로 만든 성과 점수가 사전 기대와 티어 기대를 <strong>둘 다</strong> 넘을 때만 기대 이상입니다. 기록이 부족하면 평가를 생략합니다.</p>
      </section>
    </main>
  );
}
