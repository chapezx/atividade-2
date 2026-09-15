# Testes de falha

Para cada caso: preparação, pedido enviado, resultado esperado, resultado observado.
Não inclua cookies, códigos, tokens, state ou nonce reais — apenas [REMOVIDO].

## Caso 1: retorno sem cookie temporário
- Preparação:
- Pedido enviado:
- Resultado esperado: a rota de retorno recusa e não cria sessão.
- Resultado observado:

## Caso 2: state alterado
- Preparação:
- Pedido enviado:
- Resultado esperado: recusa antes de trocar o código.
- Resultado observado:

## Caso 3: reutilização da transação
- Preparação:
- Pedido enviado:
- Resultado esperado: a segunda tentativa falha (transação já apagada).
- Resultado observado:

## Caso 4: sessão expirada
- Preparação:
- Pedido enviado:
- Resultado esperado: /api/me responde 401.
- Resultado observado:

## Caso 5: origem inválida na saída
- Preparação:
- Pedido enviado:
- Resultado esperado: logout recusado, sessão original permanece válida.
- Resultado observado:

## Caso 6: reutilização do cookie revogado
- Preparação:
- Pedido enviado:
- Resultado esperado: /api/me responde 401 após o logout.
- Resultado observado:
