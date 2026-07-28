import StepNav from "@/components/layout/StepNav";
import styles from "./layout.module.scss";

export default async function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className={`container ${styles.main}`}>
      <StepNav sessionId={id} />
      {children}
    </main>
  );
}
