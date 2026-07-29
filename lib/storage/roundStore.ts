import {
  commitTrialRound,
  removeTrialRound,
  replaySession,
} from "@/lib/domain/trialCommit";
import type { RoundNumber, RoundRecord, Session, TrialResult } from "@/lib/types";

import { getSession, updateSession } from "./sessionStore";

export function getRound(
  sessionId: string,
  round: RoundNumber,
): RoundRecord | null {
  const session = getSession(sessionId);
  return (
    session?.rounds.find((record) => record.trialResult.round === round) ?? null
  );
}

/** Adds or updates a trial round; participant LP/honeybee/grade sync via replay. */
export function saveTrialRound(
  sessionId: string,
  trial: TrialResult,
): Session {
  return updateSession(sessionId, (session) =>
    commitTrialRound(session, trial),
  );
}

export function deleteTrialRound(
  sessionId: string,
  round: RoundNumber,
): Session {
  return updateSession(sessionId, (session) =>
    removeTrialRound(session, round),
  );
}

/** Forces a full recompute (useful after participant edits mid-session). */
export function resyncSession(sessionId: string): Session {
  return updateSession(sessionId, (session) => replaySession(session));
}
