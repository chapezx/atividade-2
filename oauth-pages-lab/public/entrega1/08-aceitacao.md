# Critérios de aceitação

- [ ] o site é servido pelo endereço pages.dev atribuído à equipe
- [ ] os arquivos estáticos e as Functions compartilham a mesma origem
- [ ] o projeto foi publicado por integração com GitHub
- [ ] a equipe não instalou nem executou Node.js, npm, npx ou Wrangler
- [ ] cada provedor usa uma URL de retorno própria e exata
- [ ] os pedidos de autorização usam código e PKCE S256
- [ ] a Function apresenta o Client Secret correto somente na troca de tokens
- [ ] o retorno recusa uma transação ausente, expirada, alterada ou reutilizada
- [ ] o id_token do Google só produz sessão depois da validação criptográfica e semântica
- [ ] o access_token do GitHub só consulta /user e a autorização é revogada antes da sessão
- [ ] o cookie de sessão é opaco, Secure, HttpOnly, SameSite=Strict e sem Domain
- [ ] o D1 guarda o resumo do cookie, não seu valor bruto
- [ ] /api/me devolve somente o perfil necessário
- [ ] o logout confere Origin, remove a sessão e expira o cookie
- [ ] um cookie revogado não restaura a sessão
- [ ] tokens e segredos não aparecem no HTML, URLs, armazenamento Web ou registros
- [ ] a dupla consegue explicar por que os arquivos estáticos permanecem públicos
- [ ] as sessões administrativas foram encerradas no computador compartilhado

Assinatura da dupla:
Nome 1: ____________________  Nome 2: ____________________
