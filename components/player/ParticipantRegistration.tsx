"use client";

import { useMemo, useState } from "react";

import { RiotIdSearch } from "@/components/player/RiotIdSearch";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { analyzeSession } from "@/lib/player/analysis";
import {
  type ParticipantDraft,
  draftNeedsManualTier,
  fetchParticipantDraft,
  participantFromManualTier,
  participantFromRank,
} from "@/lib/player/registerParticipant";
import type { RiotAccount } from "@/lib/riot/types";
import { updateSession } from "@/lib/storage/sessionStore";
import type { Participant } from "@/lib/types";

import styles from "./ParticipantRegistration.module.scss";

const MAX_PARTICIPANTS = 10;

const TIER_OPTIONS = [
  { value: "IRON", label: "아이언" },
  { value: "BRONZE", label: "브론즈" },
  { value: "SILVER", label: "실버" },
  { value: "GOLD", label: "골드" },
  { value: "PLATINUM", label: "플래티넘" },
  { value: "EMERALD", label: "에메랄드" },
  { value: "DIAMOND", label: "다이아몬드" },
  { value: "MASTER", label: "마스터" },
  { value: "GRANDMASTER", label: "그랜드마스터" },
  { value: "CHALLENGER", label: "챌린저" },
];
const APEX = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);
const RANK_OPTIONS = ["I", "II", "III", "IV"];

interface ParticipantRegistrationProps {
  sessionId: string;
  participants: Participant[];
}

export function ParticipantRegistration({
  sessionId,
  participants,
}: ParticipantRegistrationProps) {
  const [registering, setRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<ParticipantDraft | null>(
    null,
  );
  const [manualTier, setManualTier] = useState("GOLD");
  const [manualRank, setManualRank] = useState("IV");

  const registeredPuuids = useMemo(
    () => new Set(participants.map((participant) => participant.puuid)),
    [participants],
  );

  function persist(next: Participant[]) {
    try {
      updateSession(sessionId, { participants: analyzeSession(next) });
    } catch {
      setErrorMessage("세션을 저장하지 못했습니다. 저장 공간을 확인해 주세요.");
    }
  }

  async function fetchAccountByRiotId(riotId: string): Promise<RiotAccount> {
    const response = await fetch(
      `/api/riot/account?riotId=${encodeURIComponent(riotId)}`,
    );
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "계정을 찾지 못했습니다.");
    }
    return payload as RiotAccount;
  }

  async function handleDraft(account: RiotAccount) {
    if (registeredPuuids.has(account.puuid)) {
      setErrorMessage("이미 등록된 계정입니다.");
      return;
    }
    setRegistering(true);
    setErrorMessage(null);
    try {
      const draft = await fetchParticipantDraft(account);
      if (draftNeedsManualTier(draft)) {
        setPendingDraft(draft);
        return;
      }
      persist([...participants, participantFromRank(draft)]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "전력 분석에 실패했습니다.",
      );
    } finally {
      setRegistering(false);
    }
  }

  async function handleRegisterRiotId(riotId: string) {
    setRegistering(true);
    setErrorMessage(null);
    try {
      const account = await fetchAccountByRiotId(riotId);
      await handleDraft(account);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "계정을 찾지 못했습니다.",
      );
      setRegistering(false);
    }
  }

  function handleConfirmManualTier() {
    if (!pendingDraft) {
      return;
    }
    const rank = APEX.has(manualTier) ? "I" : manualRank;
    persist([
      ...participants,
      participantFromManualTier(pendingDraft, { tier: manualTier, rank }),
    ]);
    setPendingDraft(null);
  }

  return (
    <>
      <RiotIdSearch
        registeredPuuids={registeredPuuids}
        disabled={participants.length >= MAX_PARTICIPANTS}
        busy={registering}
        onRegisterAccount={handleDraft}
        onRegisterRiotId={handleRegisterRiotId}
      />

      {errorMessage ? <Banner tone="error">{errorMessage}</Banner> : null}

      <Modal
        open={pendingDraft !== null}
        title="수동 티어 입력"
        onClose={() => setPendingDraft(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDraft(null)}>
              취소
            </Button>
            <Button onClick={handleConfirmManualTier}>등록</Button>
          </>
        }
      >
        <Banner tone="warning">
          {pendingDraft
            ? `${pendingDraft.account.gameName}#${pendingDraft.account.tagLine} 계정은 랭크 정보가 없어 티어를 직접 입력해야 합니다.`
            : ""}
        </Banner>
        <div className={styles.manualRow}>
          <Field label="티어" htmlFor="manual-tier">
            <Select
              id="manual-tier"
              value={manualTier}
              onChange={(event) => setManualTier(event.target.value)}
            >
              {TIER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="구간" htmlFor="manual-rank">
            <Select
              id="manual-rank"
              value={APEX.has(manualTier) ? "I" : manualRank}
              onChange={(event) => setManualRank(event.target.value)}
              disabled={APEX.has(manualTier)}
            >
              {RANK_OPTIONS.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </>
  );
}
