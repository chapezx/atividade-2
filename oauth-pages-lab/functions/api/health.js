// health.js
// Rota simples só para confirmar que as Pages Functions estão no ar.
export function onRequestGet() {
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
