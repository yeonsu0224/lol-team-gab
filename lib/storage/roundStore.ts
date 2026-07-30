import type { RoundNumber, RoundRecord, Session } from "@/lib/types";
import { updateSession } from "./sessionStore";

export function getRound(session: Session, round: RoundNumber): RoundRecord | null {
  return session.rounds.find((item) => item.round === round) ?? null;
}

export function saveRound(sessionId: string, record: RoundRecord): Session {
  return updateSession(sessionId, (session) => {
    const index = session.rounds.findIndex(({ round }) => round === record.round);
    if (index < 0) {
      if (record.round !== session.rounds.length + 1 || session.rounds.length >= 3) {
        throw new Error("시험 판은 1판부터 3판까지 순서대로 저장해 주세요.");
      }
      return { ...session, rounds: [...session.rounds, record] };
    }
    const rounds = [...session.rounds];
    rounds[index] = record;
    return { ...session, rounds };
  });
}
