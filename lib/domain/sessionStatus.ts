import type { Session } from "@/lib/types";
import type { MessageKey } from "@/lib/i18n/messages/ko";

export type SessionStatus = "preparing" | "in_progress" | "completed";

export function sessionStatus(session: Session): SessionStatus {
  if (session.wrapUp) return "completed";
  if (session.preTeamProposal || session.rounds.length) return "in_progress";
  return "preparing";
}

export function sessionStatusLabelKey(status: SessionStatus): MessageKey {
  return (
    {
      preparing: "status.preparing",
      in_progress: "status.inProgress",
      completed: "status.completed",
    } as const
  )[status];
}

/** @deprecated Prefer sessionStatusLabelKey + t() for i18n. */
export function sessionStatusLabel(status: SessionStatus): string {
  return { preparing: "준비중", in_progress: "진행중", completed: "완료" }[status];
}
