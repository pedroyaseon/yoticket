# YoTicket

Plataforma de cinema e ingressos desenvolvida para o desafio Elite Dev 2026.
O sistema cobre a programação de sessões, escolha de poltronas, pagamento
simulado, emissão de ingressos e validação de entrada.

## Acesso

[Acessar o YoTicket](https://yoticket.netlify.app/events)

## Visão geral

O catálogo público organiza os filmes em cartaz sem confundi-los com as sessões
internas. Um filme pode estar disponível em diferentes locais, datas e horários;
cada combinação representa uma sessão com capacidade, preço e mapa de poltronas
próprios.

O fluxo principal é:

```text
filme → local → data → horário → poltronas → tipo de ingresso
      → reserva → pagamento → ingresso com QR Code
```

## Perfis

### Cliente

Pode explorar filmes e locais sem autenticação. O login é solicitado quando uma
reserva precisa ser concluída. O cliente escolhe poltronas e ingressos de inteira
ou meia-entrada, simula o pagamento e acompanha os ingressos emitidos. Cada
ingresso possui QR Code, link de compartilhamento e opção de cancelamento com
reembolso simulado antes da sessão.

### Organizador

Pesquisa filmes no catálogo da TMDb e cria a programação do cinema. É possível
definir local, período em cartaz, dias da semana, horários, capacidade e preço.
O painel permite pesquisar, visualizar, editar, publicar e remover sessões, além
de acompanhar capacidade, vendas, disponibilidade e receita simulada.

### Portaria

Seleciona local, filme e horário antes da validação. O ingresso pode ser lido
pela câmera ou informado manualmente. A resposta diferencia claramente ingresso
válido, inexistente, já utilizado ou pertencente a outra sessão.

## Regras de negócio

### Reserva de poltronas

Uma reserva pendente mantém as poltronas por 15 minutos. O backend revalida a
disponibilidade no momento da reserva e protege cada operação com transação no
PostgreSQL. Uma constraint única sobre a poltrona reservada impede que duas
requisições concorrentes confirmem o mesmo lugar.

Estados apresentados no mapa:

- **Disponível:** pode ser selecionada;
- **Selecionada:** escolha local ainda não enviada;
- **Pendente:** reservada temporariamente, aguardando pagamento;
- **Reservada:** pagamento aprovado.

A seleção em andamento é preservada durante o login ou recarregamento da página,
mas nunca substitui a validação definitiva feita pela API.

### Pagamento e ingresso

O pagamento é simulado como aprovado ou recusado. A meia-entrada corresponde a
50% do valor base, sempre recalculado pela API. A confirmação é idempotente:
repetir a mesma requisição não duplica ingressos. Em caso de recusa, a reserva é
cancelada e as poltronas voltam a ficar disponíveis.

Cada ingresso recebe um código aleatório não sequencial. O QR Code transporta
somente esse identificador; a API continua sendo a autoridade sobre propriedade,
sessão, status e utilização do ingresso. A página compartilhada expõe apenas os
dados necessários para apresentação na entrada.

### Validação e reembolso

A validação na portaria é atômica. Duas requisições simultâneas para o mesmo
ingresso não podem obter sucesso: somente a primeira altera o status para usado.
As respostas possíveis são `VALID`, `INVALID`, `ALREADY_USED` e `WRONG_EVENT`.

O cancelamento de um ingresso válido registra o reembolso simulado, cancela o
ingresso e libera a poltrona na mesma transação. Ingressos já utilizados ou de
sessões iniciadas não podem ser reembolsados.

## Arquitetura

```text
┌──────────────────────────────────────────────────────────────┐
│                         Navegador                            │
│ catálogo público · cliente · organizador · portaria          │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS / JSON
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Next.js + TypeScript                      │
│ páginas · componentes · estado da interface · sessão JWT     │
└──────────────────────────────┬───────────────────────────────┘
                               │ REST /api
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     NestJS + TypeScript                      │
│ auth · catalog · events · reservations · payments            │
│ tickets · gate                                               │
└───────────────┬───────────────────────────────┬──────────────┘
                │ Prisma / transações           │ catálogo
                ▼                               ▼
┌───────────────────────────────┐   ┌──────────────────────────┐
│          PostgreSQL           │   │           TMDb           │
│ usuários · sessões · lugares  │   │ filmes e metadados       │
│ reservas · pagamentos         │   │ acesso somente pela API  │
│ ingressos                     │   └──────────────────────────┘
└───────────────────────────────┘
```

- **Camada web:** o Next.js renderiza o catálogo público e as áreas específicas
  de cada perfil. A interface mantém somente estado de apresentação; preço,
  disponibilidade e autorização são sempre confirmados pela API.
- **Camada de aplicação:** o NestJS expõe a API REST e concentra autenticação,
  autorização e regras de negócio. Controllers recebem os requests, DTOs validam
  os payloads e services executam os casos de uso.
- **Camada de dados:** o Prisma representa o domínio e executa transações no
  PostgreSQL. Constraints únicas protegem e-mail, pagamento por reserva, código
  de ingresso e ocupação de poltronas.
- **Integração externa:** o módulo `catalog` consulta a TMDb e devolve apenas os
  campos necessários para criar uma sessão. A credencial nunca passa pelo
  navegador.

A API é organizada por domínio, mantendo regras de negócio separadas da camada
HTTP. O frontend consome somente a API interna e não recebe credenciais da TMDb.

### Fluxo de compra

```text
consulta da sessão
  → consulta das poltronas
  → reserva temporária
  → pagamento simulado
  → confirmação transacional
  → emissão de um ingresso por poltrona
  → exibição do QR Code
```

### Fluxo de validação

```text
portaria seleciona a sessão
  → lê o código do QR ou recebe digitação manual
  → API localiza o ingresso e confere a sessão
  → atualização atômica de VALID para USED
  → retorno VALID, INVALID, ALREADY_USED ou WRONG_EVENT
```

## Requests da API

Todas as rotas usam o prefixo `/api`. Endpoints protegidos recebem o token no
header `Authorization: Bearer <token>`. O papel indicado é validado no backend.

### Sistema e autenticação

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Público | Verifica a disponibilidade da API. |
| `POST` | `/api/auth/register` | Público | Cria uma conta com papel `CUSTOMER`. |
| `POST` | `/api/auth/login` | Público | Autentica e devolve o token JWT e o usuário. |
| `GET` | `/api/auth/me` | Autenticado | Retorna o perfil associado ao token. |

```http
POST /api/auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "cliente@email.com",
  "password": "senha-segura"
}
```

O login recebe o mesmo formato de payload em `POST /api/auth/login`.

### Catálogo público

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/movies?q={titulo}` | Público | Lista filmes que possuem sessões publicadas. |
| `GET` | `/api/movies/:key` | Público | Exibe um filme e sua programação. |
| `GET` | `/api/venues` | Público | Lista os locais disponíveis. |
| `GET` | `/api/venues/:slug` | Público | Exibe um local e os filmes em cartaz. |
| `GET` | `/api/events?q={titulo}` | Público | Lista e pesquisa sessões publicadas. |
| `GET` | `/api/events/:id` | Público | Retorna os detalhes de uma sessão. |
| `GET` | `/api/events/:eventId/seats` | Público | Retorna o mapa e o estado atual das poltronas. |
| `GET` | `/api/tickets/shared/:code` | Público | Exibe os dados mínimos de um ingresso compartilhado. |

### Organizador

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/catalog/movies?query={titulo}` | `ORGANIZER` | Pesquisa filmes diretamente na TMDb. |
| `GET` | `/api/organizer/events` | `ORGANIZER` | Lista as sessões do organizador. |
| `GET` | `/api/organizer/events/:id` | `ORGANIZER` | Exibe uma sessão pertencente ao organizador. |
| `POST` | `/api/events` | `ORGANIZER` | Cria uma sessão em rascunho. |
| `POST` | `/api/events/schedule` | `ORGANIZER` | Cria várias sessões para o mesmo filme. |
| `PATCH` | `/api/events/:id` | `ORGANIZER` | Atualiza descrição, local, data, capacidade ou preço. |
| `POST` | `/api/events/:id/publish` | `ORGANIZER` | Publica uma sessão em rascunho. |
| `DELETE` | `/api/events/:id` | `ORGANIZER` | Cancela a sessão sem removê-la do histórico. |

Exemplo de criação de uma programação com duas sessões:

```http
POST /api/events/schedule HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "externalId": 603,
  "title": "Matrix",
  "description": "Um clássico da ficção científica em nova exibição.",
  "location": "Cine Aurora — Centro",
  "startsAt": [
    "2026-09-04T18:00:00-03:00",
    "2026-09-04T21:00:00-03:00"
  ],
  "capacity": 96,
  "priceInCents": 4000
}
```

### Cliente, pagamento e ingressos

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `POST` | `/api/events/:eventId/reservations` | `CUSTOMER` | Reserva de uma a dez poltronas por 15 minutos. |
| `POST` | `/api/reservations/:id/payment` | `CUSTOMER` | Simula aprovação ou recusa do pagamento. |
| `GET` | `/api/tickets/me` | `CUSTOMER` | Lista os ingressos do cliente. |
| `GET` | `/api/tickets/:id` | `CUSTOMER` | Exibe um ingresso pertencente ao cliente. |
| `POST` | `/api/tickets/:id/cancel` | `CUSTOMER` | Cancela o ingresso e registra o reembolso simulado. |

Reserva com uma entrada inteira e uma meia-entrada:

```http
POST /api/events/:eventId/reservations HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "seats": [
    { "seatId": "seat-id-a1", "ticketType": "FULL" },
    { "seatId": "seat-id-a2", "ticketType": "HALF" }
  ]
}
```

Pagamento simulado:

```http
POST /api/reservations/:id/payment HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "outcome": "APPROVED"
}
```

O campo `outcome` aceita `APPROVED` ou `DECLINED`. Repetir a aprovação da mesma
reserva devolve o resultado já existente sem emitir ingressos duplicados.

### Portaria

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/gate/events` | `GATE` | Lista sessões disponíveis para validação. |
| `POST` | `/api/gate/validate` | `GATE` | Valida e consome atomicamente um ingresso. |

```http
POST /api/gate/validate HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventId": "event-id",
  "ticketCode": "codigo-seguro-do-ingresso"
}
```

A validação retorna um dos estados `VALID`, `INVALID`, `ALREADY_USED` ou
`WRONG_EVENT`.

## Segurança e consistência

- senhas armazenadas com hash seguro;
- autenticação JWT e autorização por papel no backend;
- validação e normalização dos payloads;
- códigos públicos não sequenciais para ingressos e compartilhamentos;
- preço e meia-entrada recalculados pela API;
- proteção transacional contra venda e validação duplicadas;
- mensagens de erro sem exposição de detalhes internos.

## Escopo do MVP

O YoTicket entrega o fluxo completo entre organizador, cliente e portaria. A
cobrança e o reembolso são intencionalmente simulados; não há integração com um
provedor financeiro real. As regras críticas de concorrência, autorização e
validade dos ingressos permanecem protegidas no backend e no banco de dados.
