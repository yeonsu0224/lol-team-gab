export function ReasonPanel({ title = "왜 이렇게 계산했나요?", reasons }: { title?: string; reasons: string[] }) {
  return (
    <details className="tg-panel">
      <summary style={{ cursor: "pointer", fontWeight: 800 }}>{title}</summary>
      <ul>
        {reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
    </details>
  );
}
