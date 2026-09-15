// me.js
// GET /api/me -> devolve { email, displayName } se existir sessão válida, senão 401.

import { lerCookies } from "../_shared/cookies.js";
import { sha256Base64Url } from "../_shared/crypto.js";

export async function onRequestGet(context) {
  const cookies = lerCookies(context.request);
  const valorCookie = cookies["__Host-session"];

  // Sem cookie de sessão -> não autenticado.
  if (!valorCookie) {
    return new Response("Não autenticado", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // O banco guarda só o resumo (hash) do cookie, nunca o valor bruto.
  const resumo = await sha256Base64Url(valorCookie);
  const agora = Math.floor(Date.now() / 1000);

  const sessao = await context.env.DB
    .prepare("SELECT email, display_name, expires_at FROM sessions WHERE id_hash = ?")
    .bind(resumo)
    .first();

  // Sem registro no banco, ou sessão já vencida -> não autenticado.
  if (!sessao || sessao.expires_at < agora) {
    return new Response("Sessão inválida ou expirada", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return Response.json(
    { email: sessao.email, displayName: sessao.display_name },
    { headers: { "Cache-Control": "no-store" } }
  );
}
