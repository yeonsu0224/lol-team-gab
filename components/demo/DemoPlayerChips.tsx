"use client";

import { useDemoStatus } from "@/lib/demo/useDemoStatus";
import { useT } from "@/lib/i18n/context";
import { useTierLabel } from "@/lib/i18n/useTierLabel";

export function DemoPlayerChips({
  onSelect,
}: {
  onSelect: (riotId: string) => void;
}) {
  const t = useT();
  const { formatTier } = useTierLabel();
  const { demoMode, players } = useDemoStatus();
  if (!demoMode || !players.length) return null;
  return (
    <div className="tg-demo-chips tg-stack" style={{ gap: 10 }}>
      <div>
        <strong>{t("demo.chips.title")}</strong>
        <p className="tg-muted">{t("demo.chips.hint")}</p>
      </div>
      <div className="tg-demo-chips__list">
        {players.map((player) => {
          const label = formatTier(player.tier);
          return (
            <button
              key={player.puuid}
              type="button"
              className="tg-chip tg-demo-chips__item"
              onClick={() => onSelect(player.riotId)}
            >
              {player.riotId}
              {label ? <span className="tg-muted"> · {label}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
