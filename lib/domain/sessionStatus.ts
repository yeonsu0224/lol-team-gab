import type { Session, SessionStatus } from "@/lib/types";

export function deriveSessionStatus(session: Session): SessionStatus {
  if (session.wrapUp) return "completed";
  if (session.preTeamProposal || session.rounds.length > 0) return "in_progress";
  return "preparing";
}
