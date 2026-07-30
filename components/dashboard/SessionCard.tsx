import Link from "next/link";

import { deriveSessionStatus } from "@/lib/domain/sessionStatus";
import type { Session, SessionStatus } from "@/lib/types";
import styles from "@/app/dashboard/dashboard.module.scss";

export function SessionCard({ session }: { session: Session }) {
  return (
    <Link className={styles.card} href={sessionHref(session)}>
      <div className={styles.cardHeader}>
        <h3>{session.name ?? "이름 없는 내전"}</h3>
        <span className={styles.status}>{statusLabel(deriveSessionStatus(session))}</span>
      </div>
      <p className={styles.muted}>
        {new Date(session.createdAt).toLocaleDateString("ko-KR")} · 참가자 {session.participants.length}명 · {session.rounds.length}판
      </p>
      <div className={styles.cardFooter}>
        <span>{session.wrapUp?.performanceRating ? `내 평점 ${"★".repeat(session.wrapUp.performanceRating)}` : "평점 없음"}</span>
        <strong>이어가기 →</strong>
      </div>
    </Link>
  );
}

function sessionHref(session: Session): string {
  const base = `/session/${session.id}`;
  if (session.wrapUp) return `${base}/finish`;
  if (!session.preTeamProposal) return `${base}/players`;
  if (!session.rounds.length) return `${base}/team`;
  return `${base}/rebalance?round=${Math.min(4, session.rounds.length + 1)}`;
}

function statusLabel(status: SessionStatus): string {
  return status === "preparing" ? "준비 중" : status === "in_progress" ? "진행 중" : "완료";
}
