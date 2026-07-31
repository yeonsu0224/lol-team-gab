"use client";

import Image from "next/image";

import { SIDE_BANNER } from "@/lib/constants/sideBanner";
import { useT } from "@/lib/i18n/context";

/** 좌측 고정 광고 배너(F-13). 넓은 화면에서만 노출하며 본문 폭을 침범하지 않는다. */
export function SideBanner() {
  const t = useT();
  return (
    <aside className="tg-side-banner" aria-label={t("sideBanner.notAd")}>
      <a
        className="tg-side-banner__link"
        href={SIDE_BANNER.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          src={SIDE_BANNER.image}
          alt={SIDE_BANNER.alt}
          width={246}
          height={525}
          sizes="220px"
        />
        <span className="tg-side-banner__badge">{t("sideBanner.notAd")}</span>
      </a>
    </aside>
  );
}
