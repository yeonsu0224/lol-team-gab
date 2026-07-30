"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { MyPlayerPicker } from "@/components/dashboard/MyPlayerPicker";
import { sessionStatus, sessionStatusLabel } from "@/lib/domain/sessionStatus";
import { useSessions } from "@/lib/storage/useSessions";
import { useUserProfile } from "@/lib/storage/useUserProfile";

export default function DashboardPage() {
  const router = useRouter();
  const { sessions, hydrated, error, create, remove } = useSessions();
  const { profile } = useUserProfile();

  function start() {
    const session = create();
    router.push(`/session/${session.id}/players`);
  }

  return (
    <main className="tg-page tg-stack">
      <section className="tg-panel tg-row tg-row--between">
        <div>
          <p className="tg-muted">내전 준비부터 마무리까지</p>
          <h1>{profile.displayName ? `안녕하세요, 총무 ${profile.displayName}님` : "안녕하세요, 총무님"}</h1>
        </div>
        <button className="tg-button tg-button--primary" type="button" onClick={start}>새 내전 시작</button>
      </section>
      <MyPlayerPicker />
      <section className="tg-stack">
        <h2>저장된 내전</h2>
        {error && <div className="tg-notice tg-notice--error">{error}</div>}
        {!hydrated ? <p aria-busy>세션을 불러오는 중입니다…</p> : sessions.length ? (
          <div className="tg-grid tg-grid--auto">
            {sessions.map((session) => {
              const status = sessionStatus(session);
              const href = status === "completed"
                ? `/session/${session.id}/finish`
                : session.preTeamProposal
                  ? `/session/${session.id}/${session.rounds.length ? "rebalance" : "team"}`
                  : `/session/${session.id}/players`;
              return (
                <article className="tg-panel tg-session-card" key={session.id}>
                  <div className="tg-row tg-row--between">
                    <span className={`tg-chip ${status === "completed" ? "is-gold" : ""}`}>{sessionStatusLabel(status)}</span>
                    <span className="tg-muted">{new Date(session.createdAt).toLocaleDateString("ko-KR")}</span>
                  </div>
                  <h3>{session.name || "이름 없는 내전"}</h3>
                  <p className="tg-muted">{session.participants.length}명 · {session.rounds.length}판 기록</p>
                  {session.wrapUp?.performanceRating && <p>내 평점 {"★".repeat(session.wrapUp.performanceRating)}</p>}
                  <div className="tg-row">
                    <Link className="tg-button tg-button--primary" href={href}>이어하기</Link>
                    <button className="tg-button" type="button" onClick={() => remove(session.id)}>삭제</button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <div className="tg-panel"><p className="tg-muted">아직 저장된 세션이 없습니다.</p></div>}
      </section>
    </main>
  );
}
