// crypto.js
// Funções básicas de criptografia usadas em todo o laboratório.
// Tudo aqui usa só a Web Crypto API, já disponível na Cloudflare (nada de bibliotecas externas).

// Gera 32 bytes aleatórios e devolve como texto Base64URL (dá 43 caracteres).
// Serve para: id da transação, state, code_verifier, id da sessão.
export function gerarValorAleatorio() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes); // preenche o array com bytes realmente aleatórios
  return paraBase64Url(bytes);
}

// Converte bytes crus em texto Base64URL (variação do Base64 sem +, / e =,
// que é segura para usar em cookies e URLs).
export function paraBase64Url(bytes) {
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Calcula o SHA-256 de um texto e devolve o resultado já em Base64URL.
// Usado para transformar um valor "cru" (cookie, state, code_verifier) em um resumo
// que pode ser guardado no banco sem expor o valor original.
export async function sha256Base64Url(texto) {
  const dados = new TextEncoder().encode(texto); // texto -> bytes
  const hashBuffer = await crypto.subtle.digest("SHA-256", dados); // calcula o hash
  return paraBase64Url(new Uint8Array(hashBuffer));
}
