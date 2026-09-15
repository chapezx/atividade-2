// providers.js
// Guarda os endereços fixos de cada provedor, para não espalhar URLs pelo código.

export const PROVEDORES = {
  google: {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
  },
  github: {
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
    userEndpoint: "https://api.github.com/user",
    // Endereço de revogação depende do client_id, por isso é uma função.
    revokeEndpoint: (clientId) => `https://api.github.com/applications/${clientId}/grant`,
  },
};

// Monta a URL de retorno exata (a mesma que foi cadastrada no provedor).
export function urlDeRetorno(urlBase, provedor) {
  return `${urlBase}/oauth/callback/${provedor}`;
}

// Só aceitamos dois provedores neste laboratório.
export function provedorValido(nome) {
  return nome === "google" || nome === "github";
}
