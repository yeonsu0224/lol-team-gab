import Image from "next/image";

import { SIDE_BANNER } from "@/lib/constants/sideBanner";

/** 좌측 고정 광고 배너(F-13). 넓은 화면에서만 노출하며 본문 폭을 침범하지 않는다. */
export function SideBanner() {
  return (
    <aside className="tg-side-banner" aria-label="개발자 포트폴리오 광고">
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
        <span className="tg-side-banner__badge">광고아님</span>
      </a>
    </aside>
  );
}
