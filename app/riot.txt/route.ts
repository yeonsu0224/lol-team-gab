import { readFileSync } from "node:fs";
import { join } from "node:path";

export function GET() {
  const code = readFileSync(join(process.cwd(), "public", "riot.txt"), "utf8").trim();
  return new Response(code, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
