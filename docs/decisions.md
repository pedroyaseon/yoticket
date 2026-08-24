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
