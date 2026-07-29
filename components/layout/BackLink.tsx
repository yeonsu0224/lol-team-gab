import Link from "next/link";

import styles from "./BackLink.module.scss";

interface BackLinkProps {
  href?: string;
  label?: string;
}

export function BackLink({
  href = "/",
  label = "랜딩으로",
}: BackLinkProps) {
  return (
    <Link className={styles.backLink} href={href}>
      <span aria-hidden="true">←</span>
      {label}
    </Link>
  );
}
