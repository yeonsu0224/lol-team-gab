"use client";

import { useState } from "react";

import { DemoDataBadge } from "@/components/demo/DemoDataBadge";
import { useDemoStatus } from "@/lib/demo/useDemoStatus";
import { useLocale, useT } from "@/lib/i18n/context";
import type { Session } from "@/lib/types";

export interface MatchPayload {
  metadata: { matchId: string };
  info: {
    gameCreation: number;
    participants: Array<{
      puuid: string;
      riotIdGameName?: string;
      riotIdTagline?: string;
      teamId: number;
      win: boolean;
      kills: number;
      deaths: number;
      assists: number;
      totalDamageDealtToChampions: number;
      teamPosition?: string;
      championId: number;
    }>;
  };
}

interface VisionPlayer {
  riotId?: string;
  championName?: string;
  role?: string;
  kda?: string;
  damage?: number;
}

export function TrialAssist({
  session,
  preferredPuuid,
  onMatch,
  onVision,
}: {
  session: Session;
  preferredPuuid?: string;
  onMatch: (match: MatchPayload) => void;
  onVision: (players: VisionPlayer[]) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const { demoMode } = useDemoStatus();
  const [modal, setModal] = useState<"match" | "recent" | "vision" | null>(null);
  const [matchId, setMatchId] = useState("");
  const [puuid, setPuuid] = useState(preferredPuuid ?? session.participants[0]?.puuid ?? "");
  const [matches, setMatches] = useState<MatchPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchMatch(id: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/riot/match/${encodeURIComponent(id.trim())}`);
      const body = await response.json() as MatchPayload & { error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? t("assist.matchFail"));
      onMatch(body);
      setModal(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("assist.matchFail"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecent() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/riot/matches?puuid=${encodeURIComponent(puuid)}`);
      const body = await response.json() as { matches?: MatchPayload[]; error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? t("assist.recentFail"));
      setMatches(body.matches ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("assist.recentFail"));
    } finally {
      setLoading(false);
    }
  }

  async function analyzeImage(file: File) {
    setLoading(true);
    setError("");
    try {
      const image = await toBase64(file, () => t("assist.imageFail"));
      const response = await fetch("/api/riot/vision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image, mimeType: file.type }),
      });
      const body = await response.json() as { players?: VisionPlayer[]; error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? t("assist.visionFail"));
      onVision(body.players ?? []);
      setModal(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("assist.visionFail"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="tg-panel tg-row tg-row--between">
        <div>
          <strong className="tg-row" style={{ gap: 8 }}>
            {t("assist.title")}
            {demoMode && <DemoDataBadge />}
          </strong>
          <p className="tg-muted">{t("assist.hint")}</p>
        </div>
        <div className="tg-row">
          <button className="tg-button tg-button--primary" type="button" onClick={() => setModal("match")}>{t("assist.matchId")}</button>
          <button className="tg-button tg-button--primary" type="button" onClick={() => setModal("recent")}>{t("assist.recent")}</button>
          <button className="tg-button tg-button--primary" type="button" onClick={() => setModal("vision")}>
            {t("assist.vision")}<span className="tg-beta">beta</span>
          </button>
        </div>
      </div>
      {modal && (
        <div className="tg-modal-backdrop" onMouseDown={() => setModal(null)}>
          <section className="tg-panel tg-modal tg-stack" role="dialog" aria-modal onMouseDown={(event) => event.stopPropagation()}>
            <div className="tg-row tg-row--between">
              <h2>
                {modal === "match" ? t("assist.matchTitle") : modal === "recent" ? t("assist.recentTitle") : t("assist.visionTitle")}
                {modal === "vision" && <span className="tg-beta">beta</span>}
              </h2>
              <button className="tg-button" type="button" onClick={() => setModal(null)}>{t("common.close")}</button>
            </div>
            {modal === "match" && (
              <div className="tg-row">
                <input className="tg-input" style={{ flex: 1 }} value={matchId} onChange={(event) => setMatchId(event.target.value)} placeholder="KR_1234567890 / DEMO_KR_0001" />
                <button className="tg-button tg-button--primary" disabled={!matchId.trim() || loading} onClick={() => void fetchMatch(matchId)}>{t("assist.load")}</button>
              </div>
            )}
            {modal === "recent" && (
              <>
                <div className="tg-row">
                  <select className="tg-select" style={{ flex: 1 }} value={puuid} onChange={(event) => setPuuid(event.target.value)}>
                    {session.participants.map((participant) => <option value={participant.puuid} key={participant.puuid}>{participant.riotId}</option>)}
                  </select>
                  <button className="tg-button tg-button--primary" onClick={() => void fetchRecent()} disabled={!puuid || loading}>{t("assist.list")}</button>
                </div>
                <div className="tg-grid">
                  {matches.map((match) => (
                    <button className="tg-button" type="button" key={match.metadata.matchId} onClick={() => { onMatch(match); setModal(null); }}>
                      {match.metadata.matchId.startsWith("DEMO_") && <DemoDataBadge />}{" "}
                      {match.metadata.matchId} · {new Date(match.info.gameCreation).toLocaleString(locale === "en" ? "en-US" : "ko-KR")}
                    </button>
                  ))}
                </div>
              </>
            )}
            {modal === "vision" && (
              <label className="tg-field">
                <span>{t("assist.visionLabel")} <span className="tg-beta">beta</span></span>
                <span className="tg-muted">{t("assist.visionHint")}</span>
                <input type="file" accept="image/*" disabled={loading} onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void analyzeImage(file);
                }} />
              </label>
            )}
            {loading && <p aria-busy>{t("assist.loading")}</p>}
            {error && <div className="tg-notice tg-notice--error">{error}</div>}
          </section>
        </div>
      )}
    </>
  );
}

function toBase64(file: File, failMessage: () => string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error(failMessage()));
    reader.readAsDataURL(file);
  });
}
