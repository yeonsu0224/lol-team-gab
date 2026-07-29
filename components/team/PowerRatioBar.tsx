import styles from "./PowerRatioBar.module.scss";

interface PowerRatioBarProps {
  bluePowerPct: number;
  redPowerPct: number;
}

export function PowerRatioBar({
  bluePowerPct,
  redPowerPct,
}: PowerRatioBarProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.labels}>
        <span className={styles.blueLabel}>블루 {bluePowerPct}%</span>
        <span className={styles.caption}>전력 비율</span>
        <span className={styles.redLabel}>레드 {redPowerPct}%</span>
      </div>
      <div
        className={styles.bar}
        role="img"
        aria-label={`전력 비율 블루 ${bluePowerPct}퍼센트, 레드 ${redPowerPct}퍼센트`}
      >
        <span className={styles.blueFill} style={{ width: `${bluePowerPct}%` }} />
        <span className={styles.redFill} style={{ width: `${redPowerPct}%` }} />
      </div>
    </div>
  );
}
