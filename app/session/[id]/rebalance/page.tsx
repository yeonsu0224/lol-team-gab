import { SessionWorkspace } from "@/components/session/SessionWorkspace";

export default async function RebalancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SessionWorkspace sessionId={id} view="rebalance" />;
}
