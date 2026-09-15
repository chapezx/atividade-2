// cookies.js
// Funções simples para ler o cabeçalho Cookie e montar cabeçalhos Set-Cookie.

// Lê todos os cookies da requisição e devolve como objeto { nome: valor }.
export function lerCookies(request) {
  const cabecalho = request.headers.get("Cookie") || "";
  const cookies = {};
  cabecalho.split(";").forEach((parte) => {
    const [nome, ...resto] = parte.trim().split("=");
    if (nome) cookies[nome] = resto.join("=");
  });
  return cookies;
}

// Cookie temporário da transação de login. Dura 10 minutos (600 segundos).
export function cookieTransacao(valor) {
  return `__Host-oauth-tx=${valor}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}

// Apaga o cookie de transação (Max-Age=0 remove o cookie no navegador).
export function apagarCookieTransacao() {
  return `__Host-oauth-tx=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// Cookie de sessão final. Dura 8 horas (28800 segundos). SameSite=Strict porque
// é o cookie "de verdade" que dá acesso às rotas protegidas.
export function cookieSessao(valor) {
  return `__Host-session=${valor}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}

// Apaga o cookie de sessão (usado no logout).
export function apagarCookieSessao() {
  return `__Host-session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
