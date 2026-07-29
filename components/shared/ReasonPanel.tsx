import styles from "./ReasonPanel.module.scss";

interface ReasonPanelProps {
  title?: string;
  reasons: string[];
  tone?: "default" | "neutral";
}

export function ReasonPanel({
  title = "분석 근거",
  reasons,
  tone = "default",
}: ReasonPanelProps) {
  if (reasons.length === 0) {
    return null;
  }

  return (
    <section className={styles.panel}>
      <h3 className={styles.title}>{title}</h3>
      <ul className={styles.list}>
        {reasons.map((reason, index) => (
          <li
            key={`${index}-${reason}`}
            className={tone === "neutral" ? styles.neutral : styles.item}
          >
            {reason}
          </li>
        ))}
      </ul>
    </section>
  );
}
