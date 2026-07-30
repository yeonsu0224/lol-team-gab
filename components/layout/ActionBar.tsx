import Link from "next/link";
import type { ReactNode } from "react";

/** 하단 고정 CTA. 스크롤 없이 주요 액션을 누를 수 있게 한다(D-22). */
export function ActionBar({ children, infoHref = "/scoring" }: { children: ReactNode; infoHref?: string }) {
  return (
    <div className="tg-action-bar" role="region" aria-label="주요 액션">
      <Link className="tg-action-bar__info" href={infoHref} aria-label="점수 책정 방식 안내" title="점수 책정 방식">
        i
      </Link>
      <div className="tg-action-bar__actions">{children}</div>
    </div>
  );
}
