"use client";

import { useState } from "react";

import { searchAccounts, type AccountResult } from "@/lib/player/client";
import { useUserProfile } from "@/lib/storage/useUserProfile";
import styles from "@/app/dashboard/dashboard.module.scss";

export function MyPlayerPicker() {
  const { profile, save } = useUserProfile();
  // `null` keeps the field mirroring the saved Riot ID until the user edits it.
  const [draft, setDraft] = useState<string | null>(null);
  const query = draft ?? profile.riotId ?? "";
  const [results, setResults] = useState<AccountResult[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    setError("");
    try {
      setResults(await searchAccounts(query));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "계정을 검색하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.profile} aria-labelledby="profile-title">
      <div className={styles.profileHeader}>
        <div>
          <h2 id="profile-title">내 플레이어</h2>
          <p className={styles.muted}>세션 참가자와 독립적으로 Riot ID를 지정합니다.</p>
        </div>
        {profile.myPuuid && (
          <button className={styles.button} type="button" onClick={() => {
            save({});
            setDraft("");
            setResults([]);
          }}>지정 해제</button>
        )}
      </div>
      {profile.riotId && <strong>현재 지정: {profile.riotId}</strong>}
      <div className={styles.search}>
        <input className={styles.input} aria-label="내 Riot ID" placeholder="게임명#KR1" value={query} onChange={(event) => setDraft(event.target.value)} />
        <button className={styles.button} type="button" disabled={!query.trim() || loading} onClick={() => void search()}>
          {loading ? "검색 중…" : "계정 검색"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className={styles.results}>
        {results.map((account) => (
          <div className={styles.result} key={account.puuid}>
            <span>{account.gameName}#{account.tagLine}</span>
            <button className={styles.button} type="button" onClick={() => {
              save({
                displayName: account.gameName,
                riotId: `${account.gameName}#${account.tagLine}`,
                myPuuid: account.puuid,
              });
              setDraft(null);
              setResults([]);
            }}>나로 지정</button>
          </div>
        ))}
      </div>
    </section>
  );
}
