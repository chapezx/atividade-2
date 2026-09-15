// logout.js
// POST /oauth/logout -> apaga a sessão local. Não afeta a conta no Google/GitHub.

import { lerCookies, apagarCookieSessao } from "../_shared/cookies.js";
import { sha256Base64Url } from "../_shared/crypto.js";

export async function onRequestPost(context) {
  const env = context.env;
  const origem = context.request.headers.get("Origin");

  // Só aceita pedidos que vieram do próprio site (evita logout disparado por outra página).
  if (origem !== env.PUBLIC_BASE_URL) {
    return new Response("Origem não permitida", {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const cookies = lerCookies(context.request);
  const valorCookie = cookies["__Host-session"];

  if (valorCookie) {
    const resumo = await sha256Base64Url(valorCookie);
    await env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?").bind(resumo).run();
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: env.PUBLIC_BASE_URL,
      "Set-Cookie": apagarCookieSessao(),
      "Cache-Control": "no-store",
    },
  });
}

// Qualquer método diferente de POST é recusado.
export function onRequestGet() {
  return new Response("Método não permitido", { status: 405 });
}
