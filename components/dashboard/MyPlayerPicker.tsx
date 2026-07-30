"use client";

import { useState } from "react";

import { searchAccounts } from "@/lib/player/client";
import { useUserProfile } from "@/lib/storage/useUserProfile";

export function MyPlayerPicker() {
  const { profile, save } = useUserProfile();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const query = draft ?? profile.riotId ?? "";

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const account = (await searchAccounts(query))[0];
      if (!account) throw new Error("계정을 찾지 못했습니다.");
      save({
        displayName: account.gameName,
        riotId: `${account.gameName}#${account.tagLine}`,
        myPuuid: account.puuid,
        profileIconId: account.profileIconId,
      });
      setDraft(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "계정을 찾지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="tg-panel tg-stack">
      <div className="tg-row tg-row--between">
        <div>
          <h2>내 플레이어</h2>
          <p className="tg-muted">최근 경기 기본 조회에 사용할 Riot ID입니다.</p>
        </div>
        {profile.myPuuid && (
          <button className="tg-button" type="button" onClick={() => { save({}); setDraft(""); }}>
            지정 해제
          </button>
        )}
      </div>
      {profile.riotId && <strong>현재 지정: {profile.riotId}</strong>}
      <div className="tg-row">
        <input
          className="tg-input"
          style={{ flex: 1 }}
          aria-label="내 Riot ID"
          placeholder="게임명#태그"
          value={query}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className="tg-button" type="button" disabled={!query.includes("#") || loading} onClick={() => void submit()}>
          {loading ? "검색 중…" : "나로 지정"}
        </button>
      </div>
      {error && <div className="tg-notice tg-notice--error" role="alert">{error}</div>}
    </section>
  );
}
