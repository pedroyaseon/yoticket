# YoTicket

Plataforma de eventos e ingressos criada para o desafio Elite Dev 2026.

## Arquitetura

```text
Next.js (apps/web) → NestJS (apps/api) → PostgreSQL
                                      ↓
                                    TMDb
```

O projeto usa npm workspaces. O PostgreSQL é o único serviço em container; web e API rodam localmente para reduzir a complexidade do desenvolvimento.

## Execução local

```bash
cp .env.example .env
docker compose up -d
npm ci
npm run prisma:migrate -- --name init
npm run seed
npm run dev:api
npm run dev:web
```

## Contas de demonstração

Senha para todas: `demo123`.

- `organizer@demo.com`
- `customer1@demo.com`
- `customer2@demo.com`
- `gate@demo.com`

## Fluxo principal

O catálogo e os detalhes dos eventos são públicos. Ao reservar, o cliente entra
na conta, seleciona poltronas e escolhe inteira ou meia-entrada. As poltronas
ficam pendentes por 15 minutos; o pagamento aprovado gera ingressos com QR Code
e o recusado devolve os lugares ao mapa.

```text
evento → poltronas → inteira/meia → reserva pendente → pagamento → ingresso
```

O cabeçalho informa qual conta está conectada e oferece acesso ao painel do
perfil e logout.

## Consistência das poltronas

Cada evento possui um mapa determinístico de 12 poltronas por fileira. A reserva
é executada em transação e serializada por evento. Além da checagem na aplicação,
`ReservationItem.seatId` possui constraint única no PostgreSQL. Portanto, duas
requisições concorrentes não conseguem manter a mesma poltrona.

Estados apresentados no mapa:

- disponível: não existe reserva ativa;
- pendente: reserva criada, aguardando pagamento;
- reservada: pagamento aprovado;
- selecionada: escolha local ainda não enviada ao backend.

A meia-entrada vale 50% do preço base. O valor é sempre recalculado pela API e
gravado no ingresso, sem confiar no total enviado pelo navegador.

## Estado atual

O MVP entrega autenticação JWT, RBAC, catálogo TMDb, eventos, poltronas marcadas,
inteira/meia, reserva temporária, pagamento simulado idempotente, ingresso com QR
Code, compartilhamento público limitado e validação atômica na portaria.

As decisões desta evolução estão registradas em `docs/decisions.md`.
