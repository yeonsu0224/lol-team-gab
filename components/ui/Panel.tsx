import type { HTMLAttributes } from "react";

import styles from "./Panel.module.scss";

type PanelTone = "default" | "soft";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  tone?: PanelTone;
}

export function Panel({
  tone = "default",
  className,
  ...rest
}: PanelProps) {
  const classes = [styles.panel, styles[tone], className]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...rest} />;
}
