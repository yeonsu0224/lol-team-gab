import type { ReactNode } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { StepNav } from "@/components/layout/StepNav";

export default async function SessionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="page-container stack" style={{ paddingBlock: "2rem" }}>
      <PageHeader title="내전 세션">
        <StepNav sessionId={id} />
      </PageHeader>
      {children}
    </main>
  );
}
