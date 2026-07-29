"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { SessionStorageError } from "@/lib/storage/sessionStore";
import { useSessions } from "@/lib/storage/useSessions";

import styles from "./page.module.scss";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function HomePage() {
  const router = useRouter();
  const { sessions, isHydrated, create, remove } = useSessions();
  const [sessionName, setSessionName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      const session = create(sessionName);
      router.push(`/session/${session.id}/players`);
    } catch (error) {
      setErrorMessage(
        error instanceof SessionStorageError
          ? error.message
          : "새 내전을 만들지 못했습니다. 다시 시도해 주세요.",
      );
    }
  }

  function handleDelete(id: string) {
    setErrorMessage(null);

    try {
      remove(id);
    } catch (error) {
      setErrorMessage(
        error instanceof SessionStorageError
          ? error.message
          : "내전을 삭제하지 못했습니다.",
      );
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>League of Legends Custom Match</p>
        <h1 className={styles.title}>내전 총무</h1>
        <p className={styles.description}>
          참가자 전력을 분석하고, 매 판 더 균형 잡힌 팀을 제안합니다.
        </p>
      </section>

      <section className={styles.startPanel} aria-labelledby="start-title">
        <div>
          <p className={styles.sectionEyebrow}>New session</p>
          <h2 id="start-title" className={styles.sectionTitle}>
            새 내전 시작
          </h2>
          <p className={styles.sectionDescription}>
            이름은 선택 사항입니다. 생성 후 참가자를 등록할 수 있어요.
          </p>
        </div>

        <form className={styles.createForm} onSubmit={handleCreate}>
          <label className={styles.label} htmlFor="session-name">
            내전 이름
          </label>
          <div className={styles.inputRow}>
            <input
              id="session-name"
              className={styles.input}
              value={sessionName}
              onChange={(event) => setSessionName(event.target.value)}
              maxLength={40}
              placeholder="예: 수요일 정기 내전"
            />
            <button className={styles.primaryButton} type="submit">
              새 내전 시작
            </button>
          </div>
        </form>

        {errorMessage ? (
          <p className={styles.errorBanner} role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>

      <section className={styles.sessions} aria-labelledby="sessions-title">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Saved sessions</p>
            <h2 id="sessions-title" className={styles.sectionTitle}>
              저장된 내전
            </h2>
          </div>
          {isHydrated ? (
            <span className={styles.countBadge}>{sessions.length}개</span>
          ) : null}
        </div>

        {!isHydrated ? (
          <p className={styles.emptyState}>저장된 내전을 불러오는 중입니다.</p>
        ) : sessions.length === 0 ? (
          <p className={styles.emptyState}>
            아직 저장된 내전이 없습니다. 첫 내전을 시작해 보세요.
          </p>
        ) : (
          <ul className={styles.sessionList}>
            {sessions.map((session) => (
              <li className={styles.sessionCard} key={session.id}>
                <Link
                  className={styles.sessionLink}
                  href={`/session/${session.id}/players`}
                >
                  <span className={styles.sessionName}>
                    {session.name ?? "이름 없는 내전"}
                  </span>
                  <span className={styles.sessionMeta}>
                    {dateFormatter.format(new Date(session.createdAt))} · 참가자{" "}
                    {session.participants.length}명
                  </span>
                </Link>
                <button
                  className={styles.deleteButton}
                  type="button"
                  onClick={() => handleDelete(session.id)}
                  aria-label={`${session.name ?? "이름 없는 내전"} 삭제`}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
