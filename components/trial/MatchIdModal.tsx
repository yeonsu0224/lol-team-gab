"use client";

import { useState } from "react";

import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { formatKda } from "@/lib/utils/parseStatNumber";
import type { TeamSide } from "@/lib/types";

import type { AppliedResult, RosterEntry } from "./applyTypes";
import styles from "./MatchIdModal.module.scss";

interface MatchParticipant {
  puuid: string;
  riotId: string | null;
  championName: string;
  team: TeamSide;
  win: boolean;
  kda: number;
  damageDealt: number;
}

interface MatchIdModalProps {
  open: boolean;
  onClose: () => void;
  roster: RosterEntry[];
  onApply: (result: AppliedResult) => void;
}

export function MatchIdModal({
  open,
  onClose,
  roster,
  onApply,
}: MatchIdModalProps) {
  const [matchId, setMatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<MatchParticipant[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  async function handleFetch() {
    const trimmed = matchId.trim();
    if (trimmed === "") {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/riot/match/${encodeURIComponent(trimmed)}`,
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "경기를 불러오지 못했습니다.");
      }
      const rows: MatchParticipant[] = payload.participants;
      setParticipants(rows);
      const rosterPuuids = new Set(roster.map((entry) => entry.puuid));
      const auto: Record<string, string> = {};
      for (const row of rows) {
        auto[row.puuid] = rosterPuuids.has(row.puuid) ? row.puuid : "";
      }
      setMapping(auto);
    } catch (fetchError) {
      setParticipants([]);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "경기를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    const stats: AppliedResult["stats"] = {};
    const winByTeam: Record<TeamSide, number> = { blue: 0, red: 0 };
    for (const participant of participants) {
      const rosterPuuid = mapping[participant.puuid];
      if (!rosterPuuid) {
        continue;
      }
      stats[rosterPuuid] = {
        kda: participant.kda,
        damage: participant.damageDealt,
      };
      const entry = roster.find((item) => item.puuid === rosterPuuid);
      if (entry && participant.win) {
        winByTeam[entry.team] += 1;
      }
    }
    const winnerTeam: TeamSide | undefined =
      winByTeam.blue === winByTeam.red
        ? undefined
        : winByTeam.blue > winByTeam.red
          ? "blue"
          : "red";
    onApply({ stats, winnerTeam });
  }

  return (
    <Modal
      open={open}
      title="경기 ID로 결과 불러오기"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleApply} disabled={participants.length === 0}>
            폼에 채우기
          </Button>
        </>
      }
    >
      <div className={styles.fetchRow}>
        <Field label="경기 ID" htmlFor="match-id">
          <Input
            id="match-id"
            value={matchId}
            onChange={(event) => setMatchId(event.target.value)}
            placeholder="KR_1234567890"
          />
        </Field>
        <Button size="sm" onClick={handleFetch} disabled={loading}>
          {loading ? "불러오는 중…" : "조회"}
        </Button>
      </div>

      {error ? <Banner tone="error">{error}</Banner> : null}

      {participants.length > 0 ? (
        <div className={styles.rows}>
          <p className={styles.hint}>
            자동 매핑되지 않은 선수는 아래에서 직접 연결하세요.
          </p>
          {participants.map((participant) => (
            <div key={participant.puuid} className={styles.row}>
              <span className={styles.who}>
                {participant.riotId ?? participant.championName}
                <span className={styles.stat}>
                  KDA {formatKda(participant.kda)} · 딜{" "}
                  {Math.round(participant.damageDealt).toLocaleString()}
                </span>
              </span>
              <select
                className={styles.select}
                value={mapping[participant.puuid] ?? ""}
                onChange={(event) =>
                  setMapping((previous) => ({
                    ...previous,
                    [participant.puuid]: event.target.value,
                  }))
                }
                aria-label={`${participant.riotId ?? participant.championName} 매핑`}
              >
                <option value="">미지정</option>
                {roster.map((entry) => (
                  <option key={entry.puuid} value={entry.puuid}>
                    {entry.riotId}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ) : null}
    </Modal>
  );
}
