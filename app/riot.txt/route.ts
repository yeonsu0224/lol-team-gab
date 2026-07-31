export function GET() {
  return new Response("bcfa7487-365c-45c7-9415-4492af50308a", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
