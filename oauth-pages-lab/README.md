# oauth-pages-lab

Este repositório contém o código do laboratório de login (Google + GitHub) em
Cloudflare Pages. Os arquivos de código já estão prontos; o que falta é
**configuração feita nos painéis** (Cloudflare, Google Cloud, GitHub), que
precisa ser feita pela dupla, com as contas de vocês.

## O que já está pronto no código

- `public/` — página estática (`index.html`, `app.js`, `styles.css`).
- `functions/_shared/` — funções reaproveitadas por todas as rotas
  (`crypto.js`, `cookies.js`, `providers.js`, `oidc.js`).
- `functions/api/health.js` e `functions/api/me.js` — rotas de status e perfil.
- `functions/oauth/login/[provider].js` — início do login (Google/GitHub).
- `functions/oauth/callback/[provider].js` — retorno do provedor, criação da sessão.
- `functions/oauth/logout.js` — encerramento da sessão local.
- `esquema-d1.sql` — script para colar no console do banco D1.

## O que a dupla ainda precisa fazer (fora do código)

1. Subir este conteúdo para um repositório no GitHub (pasta `public/` e
   `functions/` como irmãs, na raiz).
2. Criar o projeto no Cloudflare Pages, ligado a esse repositório
   (build command vazio, build output = `public`).
3. Criar o banco D1 e rodar `esquema-d1.sql` no console dele.
4. Ligar o banco ao projeto Pages com o nome exato `DB`.
5. Registrar o cliente Web no Google Cloud, com a URL de retorno
   `URL_BASE/oauth/callback/google`.
6. Registrar a OAuth App no GitHub, com a URL de retorno
   `URL_BASE/oauth/callback/github`.
7. Cadastrar no Pages (Settings > Variables and Secrets):
   - texto simples: `PUBLIC_BASE_URL`, `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`
   - criptografados: `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`
8. Fazer um novo deploy depois de salvar as variáveis.
9. Preencher os arquivos de `public/entrega1/` com as evidências reais
   (veja os modelos já deixados lá, com `[REMOVIDO]` no lugar de segredos).

Nenhum desses passos pode ser feito por código: são cadastros nos painéis do
Cloudflare, do Google e do GitHub, específicos da conta de cada dupla.
