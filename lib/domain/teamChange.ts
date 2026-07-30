import type { TeamChange, TeamSide } from "@/lib/types";

export interface TeamMemberRef {
  puuid: string;
  riotId?: string;
}

export interface TeamChangeResult {
  changes: TeamChange[];
  changedPuuids: Set<string>;
}

export function calculateTeamChanges(
  previous: { blueTeam: ReadonlyArray<TeamMemberRef>; redTeam: ReadonlyArray<TeamMemberRef> },
  next: { blueTeam: ReadonlyArray<TeamMemberRef>; redTeam: ReadonlyArray<TeamMemberRef> },
): TeamChangeResult {
  const changes = [
    ...changesForSide("blue", previous.blueTeam, next.blueTeam),
    ...changesForSide("red", previous.redTeam, next.redTeam),
  ];
  return {
    changes,
    changedPuuids: new Set(changes.flatMap(({ outPuuid, inPuuid }) => [outPuuid, inPuuid])),
  };
}

function changesForSide(
  toTeam: TeamSide,
  previous: ReadonlyArray<TeamMemberRef>,
  next: ReadonlyArray<TeamMemberRef>,
): TeamChange[] {
  const previousIds = new Set(previous.map(({ puuid }) => puuid));
  const nextIds = new Set(next.map(({ puuid }) => puuid));
  const outgoing = previous.filter(({ puuid }) => !nextIds.has(puuid));
  const incoming = next.filter(({ puuid }) => !previousIds.has(puuid));
  const count = Math.min(outgoing.length, incoming.length);
  return Array.from({ length: count }, (_, index) => ({
    outPuuid: outgoing[index].puuid,
    inPuuid: incoming[index].puuid,
    toTeam,
    reason: `${label(outgoing[index])} ↔ ${label(incoming[index])} 전력 균형 조정`,
  }));
}

function label(member: TeamMemberRef): string {
  return member.riotId?.split("#")[0] || member.puuid;
}
