"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type { RiotAccount } from "@/lib/riot/types";

import styles from "./RiotIdSearch.module.scss";

interface RiotIdSearchProps {
  registeredPuuids: Set<string>;
  disabled?: boolean;
  busy?: boolean;
  onRegisterAccount: (account: RiotAccount) => void;
  onRegisterRiotId: (riotId: string) => void;
}

type SearchStatus = "idle" | "loading" | "done" | "error";

function classifyInput(value: string): "search" | "wait" {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return "wait";
  }
  if (trimmed.includes("#")) {
    const tag = trimmed.slice(trimmed.lastIndexOf("#") + 1);
    return tag.length >= 2 ? "search" : "wait";
  }
  return "search";
}

export function RiotIdSearch({
  registeredPuuids,
  disabled = false,
  busy = false,
  onRegisterAccount,
  onRegisterRiotId,
}: RiotIdSearchProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<RiotAccount[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, 400);
  const requestIdRef = useRef(0);

  const showTypingHint =
    classifyInput(debouncedQuery) === "wait" &&
    debouncedQuery.trim().length > 0;

  useEffect(() => {
    if (classifyInput(debouncedQuery) === "wait") {
      requestIdRef.current += 1;
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    // Reflects an in-flight external request (debounced search API sync).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");
    setErrorMessage(null);

    fetch(`/api/riot/account/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "검색에 실패했습니다.");
        }
        return payload.accounts as RiotAccount[];
      })
      .then((accounts) => {
        if (requestIdRef.current === requestId) {
          setResults(accounts);
          setStatus("done");
        }
      })
      .catch((error: unknown) => {
        if (requestIdRef.current === requestId) {
          setResults([]);
          setStatus("error");
          setErrorMessage(
            error instanceof Error ? error.message : "검색에 실패했습니다.",
          );
        }
      });
  }, [debouncedQuery]);

  const visibleResults = useMemo(
    () => results.filter((account) => !registeredPuuids.has(account.puuid)),
    [results, registeredPuuids],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length === 0 || disabled || busy) {
      return;
    }
    onRegisterRiotId(trimmed);
    setQuery("");
    setResults([]);
    setStatus("idle");
  }

  function handleSelect(account: RiotAccount) {
    if (disabled || busy) {
      return;
    }
    onRegisterAccount(account);
    setQuery("");
    setResults([]);
    setStatus("idle");
  }

  return (
    <div className={styles.search}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="게임명#태그 (예: 총무님#KR1)"
            aria-label="Riot ID 검색"
            disabled={disabled}
            autoComplete="off"
          />
          <Button type="submit" disabled={disabled || busy || query.trim().length === 0}>
            {busy ? "등록 중…" : "참가자 추가"}
          </Button>
        </div>
        <p className={styles.warning}>
          부캐라면 본캐 계정을 입력하세요. 전력 분석은 입력한 계정 기준입니다.
        </p>
      </form>

      {disabled ? (
        <Banner tone="info">참가자는 최대 10명까지 등록할 수 있습니다.</Banner>
      ) : null}

      <div className={styles.results} aria-live="polite">
        {showTypingHint ? (
          <p className={styles.state}>계속 입력하세요. 게임명 2자 이상부터 검색합니다.</p>
        ) : null}
        {!showTypingHint && status === "loading" ? (
          <p className={styles.state}>계정을 검색하는 중…</p>
        ) : null}
        {!showTypingHint && status === "error" ? (
          <Banner tone="error">{errorMessage}</Banner>
        ) : null}
        {!showTypingHint && status === "done" && visibleResults.length === 0 ? (
          <p className={styles.state}>일치하는 계정을 찾지 못했습니다.</p>
        ) : null}
        {!showTypingHint && visibleResults.length > 0 ? (
          <ul className={styles.list}>
            {visibleResults.map((account) => (
              <li key={account.puuid}>
                <button
                  type="button"
                  className={styles.result}
                  onClick={() => handleSelect(account)}
                  disabled={busy}
                >
                  <span className={styles.resultName}>
                    {account.gameName}
                    <span className={styles.resultTag}>#{account.tagLine}</span>
                  </span>
                  <span className={styles.resultAction}>추가</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
