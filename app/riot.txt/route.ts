const RIOT_VERIFICATION_CODE = "bd8fd52c-cae2-49cb-8537-cd1464bde6f3";

export function GET() {
  return new Response(RIOT_VERIFICATION_CODE, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
