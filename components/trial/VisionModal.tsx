"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";

import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { parseStatNumber } from "@/lib/utils/parseStatNumber";

import type { AppliedResult, RosterEntry } from "./applyTypes";
import styles from "./VisionModal.module.scss";

interface VisionRow {
  participantName: string;
  killsText: string;
  deathsText: string;
  assistsText: string;
  damageText: string;
  rosterPuuid: string;
}

interface VisionModalProps {
  open: boolean;
  onClose: () => void;
  roster: RosterEntry[];
  onApply: (result: AppliedResult) => void;
}

function autoMap(name: string, roster: RosterEntry[]): string {
  const lower = name.trim().toLowerCase();
  const match = roster.find((entry) => {
    const gameName = entry.riotId.split("#")[0].toLowerCase();
    return gameName === lower || entry.riotId.toLowerCase() === lower;
  });
  return match?.puuid ?? "";
}

export function VisionModal({
  open,
  onClose,
  roster,
  onApply,
}: VisionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<VisionRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append(
        "participantNames",
        roster.map((entry) => entry.riotId).join(", "),
      );
      const response = await fetch("/api/riot/vision", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "이미지 분석에 실패했습니다.");
      }
      const players = payload.draft.players as Array<{
        participantName: string;
        kills: number | null;
        deaths: number | null;
        assists: number | null;
        damageDealt: number | null;
      }>;
      setRows(
        players.map((player) => ({
          participantName: player.participantName,
          killsText: player.kills !== null ? String(player.kills) : "",
          deathsText: player.deaths !== null ? String(player.deaths) : "",
          assistsText: player.assists !== null ? String(player.assists) : "",
          damageText:
            player.damageDealt !== null ? String(player.damageDealt) : "",
          rosterPuuid: autoMap(player.participantName, roster),
        })),
      );
      setWarnings(payload.draft.warnings ?? []);
    } catch (uploadError) {
      setRows([]);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "이미지 분석에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateRow(index: number, patch: Partial<VisionRow>) {
    setRows((previous) =>
      previous.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function handleApply() {
    const stats: AppliedResult["stats"] = {};
    for (const row of rows) {
      if (!row.rosterPuuid) {
        continue;
      }
      const kills = parseStatNumber(row.killsText);
      const deaths = parseStatNumber(row.deathsText);
      const assists = parseStatNumber(row.assistsText);
      const damage = parseStatNumber(row.damageText);
      const kda =
        kills !== null && deaths !== null && assists !== null
          ? (kills + assists) / Math.max(1, deaths)
          : null;
      stats[row.rosterPuuid] = { kda, damage };
    }
    onApply({ stats });
  }

  return (
    <Modal
      open={open}
      title="점수판 이미지 분석"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleApply} disabled={rows.length === 0}>
            폼에 채우기
          </Button>
        </>
      }
    >
      <label className={styles.upload}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleUpload}
          disabled={loading}
        />
        {loading ? "분석 중…" : "점수판 이미지 선택 (JPG/PNG/WebP)"}
      </label>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {warnings.length > 0 ? (
        <Banner tone="warning">
          인식이 불확실한 항목이 있습니다: {warnings.join(" / ")}
        </Banner>
      ) : null}

      {rows.length > 0 ? (
        <div className={styles.rows}>
          <p className={styles.hint}>
            인식 결과를 확인하고, 잘못된 값은 직접 수정한 뒤 참가자에 연결하세요.
          </p>
          {rows.map((row, index) => (
            <div key={index} className={styles.row}>
              <input
                className={styles.nameInput}
                value={row.participantName}
                onChange={(event) =>
                  updateRow(index, { participantName: event.target.value })
                }
                aria-label="인식된 참가자명"
              />
              <div className={styles.kdaGroup}>
                <input
                  className={styles.numInput}
                  value={row.killsText}
                  onChange={(event) =>
                    updateRow(index, { killsText: event.target.value })
                  }
                  placeholder="K"
                  aria-label="킬"
                />
                <input
                  className={styles.numInput}
                  value={row.deathsText}
                  onChange={(event) =>
                    updateRow(index, { deathsText: event.target.value })
                  }
                  placeholder="D"
                  aria-label="데스"
                />
                <input
                  className={styles.numInput}
                  value={row.assistsText}
                  onChange={(event) =>
                    updateRow(index, { assistsText: event.target.value })
                  }
                  placeholder="A"
                  aria-label="어시스트"
                />
              </div>
              <input
                className={styles.numInput}
                value={row.damageText}
                onChange={(event) =>
                  updateRow(index, { damageText: event.target.value })
                }
                placeholder="딜량"
                aria-label="딜량"
              />
              <select
                className={styles.select}
                value={row.rosterPuuid}
                onChange={(event) =>
                  updateRow(index, { rosterPuuid: event.target.value })
                }
                aria-label="참가자 연결"
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
