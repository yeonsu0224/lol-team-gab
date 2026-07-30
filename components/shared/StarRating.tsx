"use client";

import styles from "./Shared.module.scss";

export function StarRating({
  value,
  onChange,
}: {
  value?: 1 | 2 | 3 | 4 | 5;
  onChange: (value: 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <div className={styles.stars} role="radiogroup" aria-label="내전 성과 별점">
      {([1, 2, 3, 4, 5] as const).map((star) => (
        <button
          key={star}
          className={`${styles.star} ${value && star <= value ? styles.starActive : ""}`}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star}점`}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
