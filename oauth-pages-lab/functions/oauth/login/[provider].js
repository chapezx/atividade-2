// login/[provider].js
// GET /oauth/login/google  ou  GET /oauth/login/github
// Cria a "transação" de login (guardada no D1) e redireciona o navegador ao provedor.

import { gerarValorAleatorio, sha256Base64Url } from "../../_shared/crypto.js";
import { cookieTransacao } from "../../_shared/cookies.js";
import { PROVEDORES, provedorValido, urlDeRetorno } from "../../_shared/providers.js";

export async function onRequestGet(context) {
  const provedor = context.params.provider; // "google" ou "github", vindo da URL

  // Qualquer outro nome de provedor não deve revelar nada: só 404.
  if (!provedorValido(provedor)) {
    return new Response("Não encontrado", { status: 404 });
  }

  const env = context.env;
  const config = PROVEDORES[provedor];

  // Gera todos os valores aleatórios da transação (43 caracteres cada).
  const idTransacaoBruto = gerarValorAleatorio(); // vai para o cookie
  const state = gerarValorAleatorio(); // protege contra CSRF no retorno
  const codeVerifier = gerarValorAleatorio(); // segredo do PKCE
  const nonce = provedor === "google" ? gerarValorAleatorio() : null; // só o Google usa

  // No banco só entram resumos (hashes), nunca o cookie bruto nem o state bruto.
  const idHash = await sha256Base64Url(idTransacaoBruto);
  const stateHash = await sha256Base64Url(state);
  const codeChallenge = await sha256Base64Url(codeVerifier); // isso é o "S256" do PKCE

  const expiraEm = Math.floor(Date.now() / 1000) + 600; // transação vale por 10 minutos

  await env.DB
    .prepare(
      `INSERT INTO oauth_transactions (id_hash, provider, state_hash, nonce, code_verifier, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(idHash, provedor, stateHash, nonce, codeVerifier, expiraEm)
    .run();

  // Monta o pedido de autorização que vai para o Google/GitHub.
  const redirectUri = urlDeRetorno(env.PUBLIC_BASE_URL, provedor);
  const parametros = new URLSearchParams({
    client_id: provedor === "google" ? env.GOOGLE_CLIENT_ID : env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  if (provedor === "google") {
    parametros.set("scope", config.scope);
    parametros.set("nonce", nonce);
  }
  // No GitHub, scope e nonce ficam de fora, como o PDF pede.

  const urlAutorizacao = `${config.authorizationEndpoint}?${parametros.toString()}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: urlAutorizacao,
      "Set-Cookie": cookieTransacao(idTransacaoBruto),
    },
  });
}
