"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/storage/useSessions";
import styles from "./players.module.scss";

export default function PlayersPage() {
  const { id } = useParams<{ id: string }>();
  const session = useSession(id);

  if (session === undefined) return null;

  if (session === null) {
    return (
      <section className={styles.panel}>
        <h1 className={styles.title}>세션을 찾을 수 없습니다</h1>
        <p className={styles.muted}>
          이 브라우저에 저장되지 않았거나 삭제된 내전입니다.
        </p>
        <Link href="/" className={styles.homeLink}>
          랜딩으로 돌아가기
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-label="참가자 등록">
      <header className={styles.header}>
        <h1 className={styles.title}>{session.name ?? "이름 없는 내전"}</h1>
        <p className={styles.muted}>
          참가자 {session.participants.length}/10명 · 입력된 시험 판 {session.rounds.length}/3
        </p>
      </header>
      <div className={styles.placeholder}>
        참가자 등록과 전력 분석은 Phase 2~3에서 구현됩니다.
      </div>
    </section>
  );
}
