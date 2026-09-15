// callback/[provider].js
// GET /oauth/callback/google  ou  GET /oauth/callback/github
// Recebe a resposta do provedor, confere tudo, troca o código por tokens
// e, só depois de confirmar a identidade, cria a sessão local.

import { gerarValorAleatorio, sha256Base64Url } from "../../_shared/crypto.js";
import { lerCookies, apagarCookieTransacao, cookieSessao } from "../../_shared/cookies.js";
import { PROVEDORES, provedorValido, urlDeRetorno } from "../../_shared/providers.js";
import { validarIdTokenGoogle } from "../../_shared/oidc.js";

export async function onRequestGet(context) {
  const provedor = context.params.provider;
  if (!provedorValido(provedor)) {
    return new Response("Não encontrado", { status: 404 });
  }

  const env = context.env;
  const url = new URL(context.request.url);
  const erro = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Passo 1: recusa se o provedor sinalizou erro, ou se faltar code/state.
  if (erro || !code || !state) {
    return new Response("Pedido inválido", { status: 400 });
  }

  // Passo 2: exige o cookie temporário criado no início do login.
  const cookies = lerCookies(context.request);
  const idTransacaoBruto = cookies["__Host-oauth-tx"];
  if (!idTransacaoBruto) {
    return new Response("Transação ausente", { status: 400 });
  }

  // Passo 3: usa o resumo do cookie para achar a transação (ainda não expirada).
  const idHash = await sha256Base64Url(idTransacaoBruto);
  const agora = Math.floor(Date.now() / 1000);
  const transacao = await env.DB
    .prepare("SELECT * FROM oauth_transactions WHERE id_hash = ? AND expires_at > ?")
    .bind(idHash, agora)
    .first();

  if (!transacao) {
    return new Response("Transação inválida ou expirada", { status: 400 });
  }

  // Passo 4: o state que voltou na URL precisa bater com o que guardamos.
  const stateHash = await sha256Base64Url(state);
  if (stateHash !== transacao.state_hash || transacao.provider !== provedor) {
    return new Response("State inválido", { status: 400 });
  }

  // Passo 5: apaga a transação já, antes de continuar (evita que a mesma URL seja usada 2x).
  await env.DB.prepare("DELETE FROM oauth_transactions WHERE id_hash = ?").bind(idHash).run();

  const config = PROVEDORES[provedor];
  const redirectUri = urlDeRetorno(env.PUBLIC_BASE_URL, provedor);

  let identidade; // vai guardar { subject, email, displayName }

  if (provedor === "google") {
    // Passo 6: troca o código por tokens (aqui, e só aqui, o Client Secret é usado).
    const respostaToken = await fetch(config.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        code_verifier: transacao.code_verifier,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!respostaToken.ok) {
      return new Response("Falha ao trocar o código", { status: 400 });
    }
    const dadosToken = await respostaToken.json();

    // Passo 7: valida o id_token (assinatura + iss + aud + exp + nonce).
    identidade = await validarIdTokenGoogle(
      dadosToken.id_token,
      env.GOOGLE_CLIENT_ID,
      transacao.nonce
    );
  } else {
    // GitHub: troca o código por um access_token.
    const respostaToken = await fetch(config.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!respostaToken.ok) {
      return new Response("Falha ao trocar o código", { status: 400 });
    }
    const dadosToken = await respostaToken.json();
    if (!dadosToken.access_token || !/bearer/i.test(dadosToken.token_type || "")) {
      return new Response("Resposta de token inválida", { status: 400 });
    }

    // Consulta o perfil autenticado (prova quem é a conta).
    const respostaUsuario = await fetch(config.userEndpoint, {
      headers: {
        Authorization: `Bearer ${dadosToken.access_token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
      },
    });
    if (!respostaUsuario.ok) {
      return new Response("Falha ao consultar o perfil", { status: 400 });
    }
    const usuario = await respostaUsuario.json();

    identidade = {
      subject: String(usuario.id), // id numérico estável, convertido em texto
      email: usuario.email || null, // pode vir nulo, e não faz mal
      displayName: usuario.name || usuario.login,
    };

    // Revoga a autorização da OAuth App para essa conta (o access_token deixa de valer).
    const credenciais = btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`);
    const respostaRevogacao = await fetch(config.revokeEndpoint(env.GITHUB_CLIENT_ID), {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${credenciais}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ access_token: dadosToken.access_token }),
    });
    if (respostaRevogacao.status !== 204) {
      return new Response("Falha ao revogar a autorização", { status: 400 });
    }
  }

  // Passo 8: só agora, com a identidade confirmada, cria a sessão local opaca.
  const sessaoBruta = gerarValorAleatorio();
  const sessaoHash = await sha256Base64Url(sessaoBruta);
  const expiraSessao = agora + 28800; // 8 horas

  await env.DB
    .prepare(
      `INSERT INTO sessions (id_hash, issuer, subject, email, display_name, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      sessaoHash,
      provedor === "google" ? "https://accounts.google.com" : "https://github.com",
      identidade.subject,
      identidade.email,
      identidade.displayName,
      expiraSessao,
      agora
    )
    .run();

  // Passos 9 e 10: apaga o cookie temporário, cria o cookie de sessão, volta para o site.
  const headers = new Headers();
  headers.append("Set-Cookie", apagarCookieTransacao());
  headers.append("Set-Cookie", cookieSessao(sessaoBruta));
  headers.set("Location", env.PUBLIC_BASE_URL);

  return new Response(null, { status: 302, headers });
}
