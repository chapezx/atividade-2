// oidc.js
// Confere se o id_token que o Google devolveu é autêntico e "combina" com a nossa transação.
// Um id_token é um JWT: três pedaços de texto separados por ponto (cabeçalho.corpo.assinatura).

// Decodifica uma parte Base64URL do JWT e devolve o objeto (JSON) correspondente.
function decodificarParte(parte) {
  const texto = atob(parte.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(texto);
}

// Converte a assinatura (texto Base64URL) de volta para bytes crus.
function base64UrlParaBytes(texto) {
  const normal = texto.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(normal);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

// Recebe o id_token, o client_id do nosso app e o nonce que geramos no início do login.
// Devolve { subject, email, displayName } se tudo estiver correto, ou lança um erro.
export async function validarIdTokenGoogle(idToken, clientId, nonceEsperado) {
  const partes = idToken.split(".");
  if (partes.length !== 3) throw new Error("id_token com formato inválido");

  const [parteCabecalho, parteCorpo, parteAssinatura] = partes;
  const cabecalho = decodificarParte(parteCabecalho);
  const corpo = decodificarParte(parteCorpo);

  // 1. O algoritmo precisa ser exatamente RS256 (assinatura com chave pública/privada).
  if (cabecalho.alg !== "RS256") throw new Error("algoritmo inesperado");

  // 2. Busca o documento de descoberta do Google, que informa onde estão as chaves públicas.
  const descobertaResp = await fetch(
    "https://accounts.google.com/.well-known/openid-configuration"
  );
  const descoberta = await descobertaResp.json();

  // 3. Busca o conjunto de chaves públicas (JWKS) do Google.
  const jwksResp = await fetch(descoberta.jwks_uri);
  const jwks = await jwksResp.json();

  // 4. Escolhe a chave cujo "kid" (id da chave) é igual ao informado no cabeçalho do token.
  const chaveEncontrada = jwks.keys.find((k) => k.kid === cabecalho.kid);
  if (!chaveEncontrada) throw new Error("chave pública não encontrada");

  // 5. Importa essa chave pública para o formato que o navegador/Cloudflare entende.
  const chavePublica = await crypto.subtle.importKey(
    "jwk",
    chaveEncontrada,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // 6. Verifica a assinatura: prova de que o token realmente veio do Google e não foi alterado.
  const dadosAssinados = new TextEncoder().encode(`${parteCabecalho}.${parteCorpo}`);
  const assinatura = base64UrlParaBytes(parteAssinatura);
  const assinaturaValida = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    chavePublica,
    assinatura,
    dadosAssinados
  );
  if (!assinaturaValida) throw new Error("assinatura inválida");

  // 7. Confere os dados de dentro do token (iss, aud, exp, nonce).
  const agora = Math.floor(Date.now() / 1000);
  if (corpo.iss !== "https://accounts.google.com" && corpo.iss !== "accounts.google.com") {
    throw new Error("emissor (iss) inválido");
  }
  if (corpo.aud !== clientId) throw new Error("audiência (aud) inválida");
  if (corpo.exp < agora) throw new Error("token expirado");
  if (corpo.nonce !== nonceEsperado) throw new Error("nonce inválido");

  return {
    subject: corpo.sub,
    email: corpo.email || null,
    displayName: corpo.name || null,
  };
}
