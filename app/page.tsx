import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.badge}>Hextech Glass</p>
        <h1 className={styles.title}>내전 총무</h1>
        <p className={styles.description}>
          LoL 5v5 내전 팀 밸런스 도구 — Phase 0 스캐폴딩 완료
        </p>
      </section>
    </main>
  );
}
