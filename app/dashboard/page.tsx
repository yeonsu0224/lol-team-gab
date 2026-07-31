"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MyPlayerPicker } from "@/components/dashboard/MyPlayerPicker";
import { DemoDataBadge } from "@/components/demo/DemoDataBadge";
import { sessionStatus, sessionStatusLabelKey } from "@/lib/domain/sessionStatus";
import { useDemoStatus } from "@/lib/demo/useDemoStatus";
import { useT } from "@/lib/i18n/context";
import { loadBootstrap, profileIconUrl } from "@/lib/player/client";
import { useSessions } from "@/lib/storage/useSessions";
import { useUserProfile } from "@/lib/storage/useUserProfile";

export default function DashboardPage() {
  const t = useT();
  const { demoMode } = useDemoStatus();
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
          <p className="tg-muted tg-row" style={{ gap: 8 }}>
            {t("dashboard.greeting")}
            {demoMode && <DemoDataBadge />}
          </p>
          <h1>{profile.displayName ? t("dashboard.helloNamed", { name: profile.displayName }) : t("dashboard.helloGuest")}</h1>
        </div>
        <div className="tg-row">
          <button className="tg-dashboard-profile" type="button" onClick={() => setPickerOpen((open) => !open)} aria-label={t("dashboard.myPlayer")}>
            {iconUrl
              ? <Image src={iconUrl} alt="" width={36} height={36} unoptimized />
              : <span className="tg-dashboard-profile__fallback" />}
            <span>{profile.displayName || t("dashboard.myPlayer")}</span>
          </button>
          <button className="tg-button tg-button--primary" type="button" onClick={start}>{t("dashboard.newSession")}</button>
        </div>
      </section>
      {pickerOpen && <MyPlayerPicker />}
      {creating && (
        <div className="tg-modal-backdrop" onMouseDown={() => setCreating(false)}>
          <section className="tg-panel tg-modal tg-stack" role="dialog" aria-modal onMouseDown={(event) => event.stopPropagation()}>
            <h2>{t("dashboard.sessionName")}</h2>
            <input className="tg-input" value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} placeholder={t("dashboard.sessionNamePlaceholder")} autoFocus />
            <div className="tg-row tg-row--between">
              <button className="tg-button" type="button" onClick={() => setCreating(false)}>{t("dashboard.cancel")}</button>
              <button className="tg-button tg-button--primary" type="button" disabled={!nameDraft.trim()} onClick={confirmCreate}>{t("dashboard.create")}</button>
            </div>
          </section>
        </div>
      )}
      <section className="tg-stack">
        <h2>{t("dashboard.saved")}</h2>
        {error && <div className="tg-notice tg-notice--error">{error}</div>}
        {!hydrated ? <p aria-busy>{t("dashboard.loading")}</p> : sessions.length ? (
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
                    <span className={`tg-chip ${status === "completed" ? "is-gold" : status === "in_progress" ? "is-blue" : ""}`}>{t(sessionStatusLabelKey(status))}</span>
                    <span className="tg-muted">{new Date(session.createdAt).toLocaleDateString("ko-KR")}</span>
                  </div>
                  <h3>{session.name || t("dashboard.unnamed")}</h3>
                  <p className="tg-muted">{t("dashboard.sessionMeta", { players: session.participants.length, rounds: session.rounds.length })}</p>
                  {session.wrapUp?.performanceRating && <p>{t("dashboard.myRating")} {"★".repeat(session.wrapUp.performanceRating)}</p>}
                  <div className="tg-row">
                    <Link className="tg-button tg-button--primary" href={href}>{t("dashboard.continue")}</Link>
                    <button className="tg-button" type="button" onClick={() => remove(session.id)}>{t("dashboard.delete")}</button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <div className="tg-panel"><p className="tg-muted">{t("dashboard.empty")}</p></div>}
      </section>
    </main>
  );
}
