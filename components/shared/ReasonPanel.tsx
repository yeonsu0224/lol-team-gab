import styles from "./Shared.module.scss";

export function ReasonPanel({
  title = "이 결과가 나온 이유",
  reasons,
}: {
  title?: string;
  reasons: string[];
}) {
  return (
    <details className={styles.reason}>
      <summary>{title}</summary>
      <ul>
        {reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
    </details>
  );
}
