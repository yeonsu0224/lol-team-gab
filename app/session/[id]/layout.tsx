import type { ReactNode } from "react";

import { BackLink } from "@/components/layout/BackLink";
import { StepNav } from "@/components/layout/StepNav";

import styles from "./layout.module.scss";

interface SessionLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function SessionLayout({
  children,
  params,
}: SessionLayoutProps) {
  const { id } = await params;

  return (
    <main className={styles.container}>
      <div className={styles.chrome}>
        <BackLink />
        <StepNav sessionId={id} />
      </div>
      <section className={styles.panel}>{children}</section>
    </main>
  );
}
