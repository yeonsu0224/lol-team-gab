import type { ReactNode } from "react";

/** 가벼운 마크다운: 굵게 · 인라인 코드 · 줄바꿈 · 목록. 외부 라이브러리 없이 AI 응답용. */
export function renderSimpleMarkdown(source: string): ReactNode[] {
  return source.split("\n").map((line, lineIndex) => {
    const trimmed = line.trim();
    const isList = /^[-*]\s+/.test(trimmed);
    const content = isList ? trimmed.replace(/^[-*]\s+/, "") : line;
    const nodes = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((chunk, index) => {
      if (chunk.startsWith("**") && chunk.endsWith("**")) {
        return <strong key={`${lineIndex}-${index}`}>{chunk.slice(2, -2)}</strong>;
      }
      if (chunk.startsWith("`") && chunk.endsWith("`")) {
        return <code key={`${lineIndex}-${index}`}>{chunk.slice(1, -1)}</code>;
      }
      return <span key={`${lineIndex}-${index}`}>{chunk}</span>;
    });
    if (isList) {
      return <li key={lineIndex}>{nodes}</li>;
    }
    return (
      <p key={lineIndex} className="tg-md-line">
        {nodes}
      </p>
    );
  });
}
