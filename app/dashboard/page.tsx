"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MyPlayerPicker } from "@/components/dashboard/MyPlayerPicker";
import { sessionStatus, sessionStatusLabel } from "@/lib/domain/sessionStatus";
import { loadBootstrap, profileIconUrl } from "@/lib/player/client";
import { useSessions } from "@/lib/storage/useSessions";
import { useUserProfile } from "@/lib/storage/useUserProfile";

export default function DashboardPage() {
  const router = useRouter();
  const { sessions, hydrated, error, create, remove } = useSessions();
  const { profile } = useUserProfile();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [iconUrl, setIconUrl] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    if (!profile.profileIconId) {
      const timer = window.setTimeout(() => { if (!cancelled) setIconUrl(undefined); }, 0);
      return () => { cancelled = true; window.clearTimeout(timer); };
    }
    void loadBootstrap()
      .then((bootstrap) => {
        if (!cancelled) setIconUrl(profileIconUrl(bootstrap.version, profile.profileIconId));
      })
      .catch(() => { if (!cancelled) setIconUrl(undefined); });
    return () => { cancelled = true; };
  }, [profile.profileIconId]);

  function start() {
    const name = nameDraft.trim();
    if (!name) {
      setCreating(true);
      return;
    }
    const session = create({ name });
    router.push(`/session/${session.id}/players`);
  }

  function confirmCreate() {
    const name = nameDraft.trim();
    if (!name) return;
    const session = create({ name });
    router.push(`/session/${session.id}/players`);
  }

  return (
    <main className="tg-page tg-stack">
      <section className="tg-panel tg-row tg-row--between">
        <div>
          <p className="tg-muted">내전 준비부터 마무리까지</p>
          <h1>{profile.displayName ? `안녕하세요, ${profile.displayName}님` : "안녕하세요, 총무님"}</h1>
        </div>
        <div className="tg-row">
          <button className="tg-dashboard-profile" type="button" onClick={() => setPickerOpen((open) => !open)} aria-label="내 플레이어 설정">
            {iconUrl
              ? <Image src={iconUrl} alt="" width={36} height={36} unoptimized />
              : <span className="tg-dashboard-profile__fallback" />}
            <span>{profile.displayName || "내 플레이어"}</span>
          </button>
          <button className="tg-button tg-button--primary" type="button" onClick={start}>새 내전 시작</button>
        </div>
      </section>
      {pickerOpen && <MyPlayerPicker />}
      {creating && (
        <div className="tg-modal-backdrop" onMouseDown={() => setCreating(false)}>
          <section className="tg-panel tg-modal tg-stack" role="dialog" aria-modal onMouseDown={(event) => event.stopPropagation()}>
            <h2>내전 이름</h2>
            <input className="tg-input" value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} placeholder="예: 금요일 내전" autoFocus />
            <div className="tg-row tg-row--between">
              <button className="tg-button" type="button" onClick={() => setCreating(false)}>취소</button>
              <button className="tg-button tg-button--primary" type="button" disabled={!nameDraft.trim()} onClick={confirmCreate}>만들기</button>
            </div>
          </section>
        </div>
      )}
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
                <article className={`tg-panel tg-session-card is-${status}`} key={session.id}>
                  <div className="tg-row tg-row--between">
                    <span className={`tg-chip ${status === "completed" ? "is-gold" : status === "in_progress" ? "is-blue" : ""}`}>{sessionStatusLabel(status)}</span>
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
