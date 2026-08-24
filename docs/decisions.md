# Decisões técnicas

## ADR-001 — Poltronas marcadas por evento

### Problema

A reserva agregada por quantidade impedia o cliente de escolher lugares e não
representava a indisponibilidade de uma poltrona específica.

### Decisão

Cada evento recebe um mapa determinístico de 12 lugares por fileira. `Seat`
representa o lugar e `ReservationItem` liga uma poltrona a uma reserva e à sua
categoria (`FULL` ou `HALF`). Uma constraint única em `seatId` protege a regra no
PostgreSQL. Reservas expiradas ou recusadas removem seus itens e liberam os
lugares; reservas confirmadas mantêm os itens e geram tickets vinculados.

### Alternativas consideradas

- guardar o mapa em JSON no evento;
- controlar somente um status mutável na tabela de poltronas;
- manter apenas estoque agregado por quantidade.

### Trade-off

O modelo relacional cria mais registros, mas torna concorrência, auditoria e
consulta de disponibilidade explícitas. O mapa fixo não representa diferentes
geometrias de sala, o que é aceitável para o MVP.

## ADR-002 — Login progressivo

### Problema

Exigir autenticação antes de visualizar o catálogo adiciona atrito e esconde a
principal proposta do produto.

### Decisão

Home, catálogo, detalhe e disponibilidade são públicos. A autenticação com role
`CUSTOMER` é exigida pelo backend somente no endpoint que cria a reserva. Quando
o visitante inicia a compra, o frontend o direciona ao login e retorna ao evento.

### Trade-off

A seleção feita antes do login não é persistida entre páginas; o cliente escolhe
novamente ao retornar. Isso evita armazenar intenção de compra no navegador e
mantém a implementação proporcional ao desafio.

## ADR-003 — Preço da meia-entrada no backend

### Problema

Um total calculado somente no frontend pode ser adulterado.

### Decisão

O cliente envia apenas a categoria de cada poltrona. A API calcula meia como 50%
do preço base do evento, soma a reserva e grava categoria e preço no ingresso.

### Trade-off

O MVP não valida documentação comprobatória de meia-entrada. Essa verificação é
uma evolução separada do controle de preço e estoque.

## ADR-004 — Filme público como agrupamento de sessões

### Problema

Exibir cada sessão como um cartaz repetia filmes e misturava informações do
catálogo com dia, horário, local e estoque.

### Decisão

`Event` continua representando a sessão interna. A API agrupa eventos publicados
pelo `externalId` da TMDb e expõe filmes, locais e horários em endpoints públicos.
O cartaz leva à página do filme, onde o cliente escolhe local, dia e horário antes
de abrir o mapa de poltronas.

### Trade-off

A solução evita uma migração para uma entidade `Movie`, mas exige manter os dados
importados consistentes entre as sessões do mesmo filme.

## ADR-005 — Persistência local da intenção de compra

### Problema

Recarregar a página ou passar pelo login apagava a sessão e as poltronas que o
cliente havia acabado de escolher.

### Decisão

Sessão, categorias selecionadas e reserva pendente são guardadas no armazenamento
local com chaves por sessão. Ao restaurar, o frontend mantém somente poltronas que
a API ainda informa como disponíveis; reservas vencidas são descartadas.

### Trade-off

Os dados locais melhoram continuidade, mas não representam autoridade sobre o
estoque. Toda reserva continua sendo revalidada transacionalmente pelo backend.
