"use client";

import { useRouter } from "next/navigation";

import { MyPlayerPicker } from "@/components/dashboard/MyPlayerPicker";
import { SessionGrid } from "@/components/dashboard/SessionGrid";
import { useSessions } from "@/lib/storage/useSessions";
import { useUserProfile } from "@/lib/storage/useUserProfile";
import styles from "./dashboard.module.scss";

export default function DashboardPage() {
  const router = useRouter();
  const { sessions, error, hydrated, create } = useSessions();
  const { profile } = useUserProfile();

  function startSession() {
    const session = create({ name: "새 내전" });
    router.push(`/session/${session.id}/players`);
  }

  return (
    <main className={`page-container ${styles.main}`}>
      <header className={styles.hero}>
        <div>
          <p>내전 준비부터 마무리까지</p>
          <h1>{profile.displayName ? `안녕하세요, 총무 ${profile.displayName}님` : "안녕하세요, 총무님"}</h1>
        </div>
        <button className={`${styles.button} ${styles.primary}`} type="button" onClick={startSession}>
          새 내전 시작
        </button>
      </header>

      <MyPlayerPicker />

      {error && <p role="alert">{error}</p>}
      <section aria-labelledby="sessions-title">
        <h2 id="sessions-title">내 세션</h2>
        {hydrated ? <SessionGrid sessions={sessions} /> : <p aria-busy>세션을 불러오는 중입니다…</p>}
      </section>
    </main>
  );
}
