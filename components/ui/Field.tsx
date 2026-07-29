import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

import styles from "./Field.module.scss";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: FieldProps) {
  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={[styles.input, className].filter(Boolean).join(" ")} {...rest} />
  );
}

export function Select({
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={[styles.input, styles.select, className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
