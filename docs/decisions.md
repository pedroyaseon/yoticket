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

A intenção de compra é persistida localmente para permitir o retorno após o
login, mas sempre é revalidada pela API. Isso melhora a continuidade sem tornar o
navegador autoridade sobre estoque.

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

## ADR-006 — Cancelamento e reembolso por ingresso

### Problema

Uma compra pode conter várias poltronas. Reembolsar apenas a reserva inteira
impediria o cliente de cancelar um único ingresso e poderia liberar estoque de
forma incorreta.

### Decisão

O cancelamento é feito por ingresso válido e antes do início da sessão. Uma
transação marca o ticket como `CANCELLED`, registra `refundedAt`, remove o vínculo
da poltrona, decrementa o estoque vendido e ajusta a reserva. Repetir a requisição
retorna o estado já reembolsado sem decrementar o estoque novamente.

### Alternativas consideradas

- reembolsar sempre a reserva completa;
- criar uma integração com provedor de pagamento;
- manter a poltrona ocupada após o cancelamento.

### Trade-off

O reembolso é apenas simulado e não possui conciliação financeira. O modelo por
ticket, entretanto, preserva consistência e permite revender a poltrona liberada.

## ADR-007 — Remoção lógica de evento

### Problema

Apagar uma sessão pode eliminar histórico ou invalidar ingressos já pagos sem um
processo explícito de reembolso.

### Decisão

O endpoint de remoção altera o evento para `CANCELLED` e libera reservas
pendentes. Se houver ingressos vendidos, a operação é bloqueada. Dessa forma, o
organizador não cancela vendas acidentalmente e o histórico permanece auditável.

### Trade-off

Eventos cancelados continuam armazenados e visíveis no painel do organizador.
Um fluxo futuro poderá coordenar cancelamento em massa e reembolsos.

## ADR-008 — Programação recorrente como lote transacional

### Problema

Criar cada horário manualmente é repetitivo, e várias chamadas independentes
podem deixar apenas parte da temporada cadastrada quando uma delas falha.

### Decisão

O organizador escolhe primeiro dia, duração, dias da semana e até quatro horários
por dia. O frontend converte a grade em instantes ISO e a API valida no máximo
120 sessões, serializa a operação pelo organizador, detecta sobreposições e cria
todo o lote em uma transação.

### Alternativas consideradas

- uma requisição separada por sessão;
- armazenar uma regra recorrente e gerar sessões sob demanda;
- adicionar uma entidade de temporada completa.

### Trade-off

As sessões concretas ocupam mais registros, mas mantêm compra, estoque e portaria
simples. Alterar toda a temporada depois de criada continua sendo uma melhoria
futura.

## ADR-009 — Deploy serverless no Netlify com PostgreSQL Neon

### Problema

O MVP precisa de hospedagem gratuita para Next.js, NestJS e PostgreSQL. Um
servidor gratuito tradicional hiberna após inatividade, enquanto executar todo o
sistema em um único processo reduziria a separação entre as aplicações.

### Decisão

Next.js e a API são publicados no mesmo projeto Netlify. A configuração comum do
NestJS foi extraída para uma factory: o entrypoint local chama `listen`, e uma
Netlify Function inicializa o mesmo app sem abrir porta. O handler é armazenado
em cache por instância aquecida. O PostgreSQL 16 fica no Neon, em AWS US East 2,
usando a connection string com pooling.

O build de produção aplica migrations existentes com `prisma migrate deploy`.
Deploy Previews não aplicam migrations e o seed é uma operação inicial explícita.

### Alternativas consideradas

- Render para frontend e servidor NestJS tradicional;
- Netlify somente no frontend e API em outro provedor;
- unir Next.js e NestJS em um único servidor persistente;
- substituir a API NestJS por route handlers do Next.js.

### Trade-off

A Function pode sofrer cold start e o rate limit em memória vale apenas por
instância. Em compensação, o domínio único simplifica CORS, o plano gratuito é
adequado à demonstração e a API preserva seus módulos, DTOs, RBAC e regras de
negócio. Consistência de estoque, poltronas e portaria continua garantida pelo
banco, independentemente da instância que processa a requisição.
