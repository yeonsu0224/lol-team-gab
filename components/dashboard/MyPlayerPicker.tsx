"use client";

import { useState } from "react";

import { DemoPlayerChips } from "@/components/demo/DemoPlayerChips";
import { DemoDataBadge } from "@/components/demo/DemoDataBadge";
import { searchAccounts } from "@/lib/player/client";
import { useDemoStatus } from "@/lib/demo/useDemoStatus";
import { useT } from "@/lib/i18n/context";
import { useUserProfile } from "@/lib/storage/useUserProfile";

export function MyPlayerPicker() {
  const t = useT();
  const { demoMode } = useDemoStatus();
  const { profile, save } = useUserProfile();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const query = draft ?? profile.riotId ?? "";

  async function submit(nextQuery = query) {
    setLoading(true);
    setError("");
    try {
      const account = (await searchAccounts(nextQuery))[0];
      if (!account) throw new Error(t("common.error"));
      save({
        displayName: account.gameName,
        riotId: `${account.gameName}#${account.tagLine}`,
        myPuuid: account.puuid,
        profileIconId: account.profileIconId,
      });
      setDraft(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="tg-panel tg-stack">
      <div className="tg-row tg-row--between">
        <div>
          <h2 className="tg-row" style={{ gap: 8 }}>
            {t("dashboard.myPlayer")}
            {demoMode && <DemoDataBadge />}
          </h2>
          <p className="tg-muted">{t("dashboard.myPlayerHelp")}</p>
        </div>
        {profile.myPuuid && (
          <button className="tg-button" type="button" onClick={() => { save({}); setDraft(""); }}>
            {t("dashboard.clear")}
          </button>
        )}
      </div>
      {profile.riotId && <strong>{t("dashboard.current")}: {profile.riotId}</strong>}
      <div className="tg-row">
        <input
          className="tg-input"
          style={{ flex: 1 }}
          aria-label={t("dashboard.myPlayer")}
          placeholder={t("players.placeholder")}
          value={query}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className="tg-button" type="button" disabled={!query.includes("#") || loading} onClick={() => void submit()}>
          {loading ? t("dashboard.searching") : t("dashboard.assign")}
        </button>
      </div>
      <DemoPlayerChips onSelect={(riotId) => { setDraft(riotId); void submit(riotId); }} />
      {error && <div className="tg-notice tg-notice--error" role="alert">{error}</div>}
    </section>
  );
}
