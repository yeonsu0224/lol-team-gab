import Link from "next/link";

import styles from "./BackLink.module.scss";

export function BackLink({ href = "/dashboard", label = "대시보드" }) {
  return (
    <Link className={styles.backLink} href={href}>
      <span aria-hidden>←</span>
      {label}
    </Link>
  );
}
