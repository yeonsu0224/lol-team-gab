/** @deprecated D-22: 화면 아코디언 대신 /scoring + ActionBar i 링크를 사용한다. */
export function ReasonPanel({ title = "왜 이렇게 계산되었나요?", reasons }: { title?: string; reasons: string[] }) {
  return (
    <p className="tg-sr-only">
      {title}: {reasons.join(" ")}
    </p>
  );
}
