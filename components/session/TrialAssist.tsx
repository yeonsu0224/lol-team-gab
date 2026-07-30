"use client";

import { useState } from "react";

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
      if (!response.ok) throw new Error(body.error?.message ?? "경기를 불러오지 못했습니다.");
      onMatch(body);
      setModal(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "경기를 불러오지 못했습니다.");
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
      if (!response.ok) throw new Error(body.error?.message ?? "최근 경기를 불러오지 못했습니다.");
      setMatches(body.matches ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "최근 경기를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeImage(file: File) {
    setLoading(true);
    setError("");
    try {
      const image = await toBase64(file);
      const response = await fetch("/api/riot/vision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image, mimeType: file.type }),
      });
      const body = await response.json() as { players?: VisionPlayer[]; error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? "이미지를 분석하지 못했습니다.");
      onVision(body.players ?? []);
      setModal(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "이미지를 분석하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="tg-panel tg-row tg-row--between">
        <div>
          <strong>입력 보조</strong>
          <p className="tg-muted">손으로 넣기보다 경기 ID·최근 경기·점수판 이미지를 먼저 쓰세요.</p>
        </div>
        <div className="tg-row">
          <button className="tg-button tg-button--primary" type="button" onClick={() => setModal("match")}>경기 ID</button>
          <button className="tg-button tg-button--primary" type="button" onClick={() => setModal("recent")}>최근 경기</button>
          <button className="tg-button tg-button--primary" type="button" onClick={() => setModal("vision")}>
            점수판 이미지<span className="tg-beta">beta</span>
          </button>
        </div>
      </div>
      {modal && (
        <div className="tg-modal-backdrop" onMouseDown={() => setModal(null)}>
          <section className="tg-panel tg-modal tg-stack" role="dialog" aria-modal onMouseDown={(event) => event.stopPropagation()}>
            <div className="tg-row tg-row--between">
              <h2>
                {modal === "match" ? "경기 ID 불러오기" : modal === "recent" ? "최근 경기 선택" : "점수판 이미지 분석"}
                {modal === "vision" && <span className="tg-beta">beta</span>}
              </h2>
              <button className="tg-button" type="button" onClick={() => setModal(null)}>닫기</button>
            </div>
            {modal === "match" && (
              <div className="tg-row">
                <input className="tg-input" style={{ flex: 1 }} value={matchId} onChange={(event) => setMatchId(event.target.value)} placeholder="KR_1234567890" />
                <button className="tg-button tg-button--primary" disabled={!matchId.trim() || loading} onClick={() => void fetchMatch(matchId)}>불러오기</button>
              </div>
            )}
            {modal === "recent" && (
              <>
                <div className="tg-row">
                  <select className="tg-select" style={{ flex: 1 }} value={puuid} onChange={(event) => setPuuid(event.target.value)}>
                    {session.participants.map((participant) => <option value={participant.puuid} key={participant.puuid}>{participant.riotId}</option>)}
                  </select>
                  <button className="tg-button tg-button--primary" onClick={() => void fetchRecent()} disabled={!puuid || loading}>목록 조회</button>
                </div>
                <div className="tg-grid">
                  {matches.map((match) => (
                    <button className="tg-button" type="button" key={match.metadata.matchId} onClick={() => { onMatch(match); setModal(null); }}>
                      {match.metadata.matchId} · {new Date(match.info.gameCreation).toLocaleString("ko-KR")}
                    </button>
                  ))}
                </div>
              </>
            )}
            {modal === "vision" && (
              <label className="tg-field">
                <span>LoL 점수판 이미지 <span className="tg-beta">beta</span></span>
                <span className="tg-muted">인식이 틀릴 수 있어요. 분석 후 수동 매칭으로 고칠 수 있습니다.</span>
                <input type="file" accept="image/*" disabled={loading} onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void analyzeImage(file);
                }} />
              </label>
            )}
            {loading && <p aria-busy>불러오는 중…</p>}
            {error && <div className="tg-notice tg-notice--error">{error}</div>}
          </section>
        </div>
      )}
    </>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}
