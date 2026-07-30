import Link from "next/link";

import styles from "./page.module.scss";

export default function HomePage() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>랭크와 최근 경기 데이터를 바탕으로</p>
        <h1>내전 팀을 더 공정하게</h1>
        <p className={styles.lead}>참가자를 모으고, 균형 잡힌 팀을 제안하고, 매 판 변화를 투명하게 기록하세요.</p>
        <div className={styles.features}>
          <article><strong>전력 분석</strong><span>티어·라인·최근 기록을 함께 확인</span></article>
          <article><strong>판별 재밸런스</strong><span>성과와 팀 이동 이유를 쉽게 설명</span></article>
          <article><strong>내전 마무리</strong><span>승패·하이라이트·평점을 한곳에 저장</span></article>
        </div>
        <Link className={styles.cta} href="/dashboard">
          대시보드에서 시작하기
        </Link>
      </section>
    </main>
  );
}
