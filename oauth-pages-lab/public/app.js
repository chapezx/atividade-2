// app.js
// Roda no navegador. Pergunta para a própria origem (mesma origem, sem CORS)
// se existe uma sessão válida, e escreve o resultado na tela.

fetch("/api/me", { credentials: "same-origin" })
  .then((response) => (response.ok ? response.json() : null))
  .then((user) => {
    const status = document.getElementById("status");
    status.textContent = user
      ? `Sessão de ${user.email ?? user.displayName}.`
      : "Nenhuma sessão neste navegador.";
  });
