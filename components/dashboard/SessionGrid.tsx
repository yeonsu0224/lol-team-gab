import { Stagger } from "@/components/motion/Stagger";
import type { Session } from "@/lib/types";
import styles from "@/app/dashboard/dashboard.module.scss";
import { SessionCard } from "./SessionCard";

export function SessionGrid({ sessions }: { sessions: Session[] }) {
  if (!sessions.length) return <p>아직 저장된 세션이 없습니다.</p>;
  return (
    <Stagger className={styles.grid}>
      {sessions.map((session) => <SessionCard key={session.id} session={session} />)}
    </Stagger>
  );
}
