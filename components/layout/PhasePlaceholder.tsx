import styles from "./PhasePlaceholder.module.scss";

interface PhasePlaceholderProps {
  message: string;
}

export function PhasePlaceholder({ message }: PhasePlaceholderProps) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.marker} aria-hidden="true">
        ◇
      </span>
      <p>{message}</p>
    </div>
  );
}
