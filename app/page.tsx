"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createSession,
  SessionStorageFullError,
} from "@/lib/storage/sessionStore";
import { useSessions } from "@/lib/storage/useSessions";
import styles from "./page.module.scss";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const sessions = useSessions();
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    try {
      const session = createSession(name);
      router.push(`/session/${session.id}/players`);
    } catch (e) {
      setError(
        e instanceof SessionStorageFullError
          ? e.message
          : "세션을 만들지 못했습니다. 다시 시도해 주세요.",
      );
    }
  };

  return (
    <main className={`container ${styles.page}`}>
      <section className={styles.hero}>
        <p className={styles.badge}>Hextech Glass</p>
        <h1 className={styles.title}>내전 총무</h1>
        <p className={styles.subtitle}>LoL 5v5 내전 팀 밸런스 도구</p>
      </section>

      <section className={styles.createPanel} aria-label="새 내전 만들기">
        <h2 className={styles.panelTitle}>새 내전 시작</h2>
        <div className={styles.createRow}>
          <input
            className={styles.nameInput}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="내전 이름 (선택)"
            maxLength={40}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <button className={styles.primaryButton} type="button" onClick={handleCreate}>
            팀 만들기
          </button>
        </div>
        {error ? (
          <p className={styles.errorBanner} role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className={styles.listSection} aria-label="저장된 세션">
        <h2 className={styles.panelTitle}>저장된 내전</h2>
        {sessions === null ? null : sessions.length === 0 ? (
          <p className={styles.empty}>저장된 내전이 없습니다. 새 내전을 시작해 보세요.</p>
        ) : (
          <ul className={styles.sessionGrid}>
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className={styles.sessionCard}
                  onClick={() => router.push(`/session/${session.id}/players`)}
                >
                  <span className={styles.sessionName}>
                    {session.name ?? "이름 없는 내전"}
                  </span>
                  <span className={styles.sessionMeta}>
                    {new Date(session.createdAt).toLocaleString("ko-KR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span className={styles.sessionMeta}>
                    참가자 {session.participants.length}명 · 입력 {session.rounds.length}/3판
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
