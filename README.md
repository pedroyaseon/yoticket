# YoTicket

Plataforma de eventos e ingressos criada para o desafio Elite Dev 2026.

## Arquitetura

```text
Next.js (apps/web) → NestJS (apps/api) → PostgreSQL
                                      ↓
                                    TMDb
```

O projeto usa npm workspaces. O PostgreSQL é o único serviço em container; web e API rodam localmente para reduzir a complexidade do desenvolvimento.

Em produção, Next.js e NestJS são publicados no mesmo projeto Netlify. A API é
empacotada como uma Netlify Function e continua disponível sob `/api`; o banco
PostgreSQL é fornecido pelo Neon na mesma região das Functions (AWS US East 2).

## Execução local

```bash
# crie o arquivo .env na raiz com as variáveis documentadas abaixo
docker compose up -d
npm ci
npm run prisma:migrate -- --name init
npm run seed
npm run dev:api
npm run dev:web
```

O repositório não inclui `.env.example`. Para executar localmente, crie `.env`
na raiz com `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`TMDB_API_READ_ACCESS_TOKEN`, `NEXT_PUBLIC_API_URL` e `WEB_ORIGIN`.

## Deploy — Netlify e Neon

1. Crie no Neon um projeto `yoticket` com PostgreSQL 16 em AWS US East 2
   (Ohio), sem Neon Auth.
2. Copie a connection string com pooling habilitado.
3. No Netlify, importe o repositório `yoticket`, selecione `apps/web` como
   package directory e mantenha a base do monorepo na raiz.
4. Cadastre no painel do Netlify as variáveis abaixo. Segredos nunca devem ser
   adicionados ao repositório.

```text
DATABASE_URL=<conexão pooled do Neon>
JWT_SECRET=<segredo aleatório com no mínimo 32 bytes>
JWT_EXPIRES_IN=1h
TMDB_API_READ_ACCESS_TOKEN=<token da TMDb>
NEXT_PUBLIC_API_URL=/api
WEB_ORIGIN=https://<nome-do-site>.netlify.app
```

O build de produção executa `prisma migrate deploy` e o seed idempotente antes
de compilar. Deploy Previews apenas geram o Prisma Client e compilam a
aplicação, evitando que uma PR altere o banco de produção. O seed usa `upsert`
para manter as contas e a programação de demonstração sem apagar reservas,
pagamentos ou ingressos existentes.

O handler NestJS é reutilizado enquanto a Function permanece aquecida. Regras
críticas de concorrência continuam protegidas por transações e constraints no
PostgreSQL, e não por memória do processo serverless.

## Contas de demonstração

Senha para todas: `demo123`.

- `organizer@demo.com`
- `customer1@demo.com`
- `customer2@demo.com`
- `gate@demo.com`

## Fluxo principal

O catálogo, os locais e os detalhes dos filmes são públicos. Cada filme agrupa
suas sessões por local, dia e horário. Ao reservar, o cliente entra na conta,
seleciona poltronas e escolhe inteira ou meia-entrada. As poltronas ficam
pendentes por 15 minutos; o pagamento aprovado gera ingressos com QR Code e o
recusado devolve os lugares ao mapa.

```text
filme → local → dia → horário → poltronas → inteira/meia → pagamento → ingresso
```

Depois da compra, um ingresso válido pode ser cancelado antes da sessão. A API
simula o reembolso, marca o ingresso como cancelado e libera a poltrona na mesma
transação.

O organizador possui uma área própria para explorar o catálogo, adicionar
uma programação recorrente por período, dias da semana e horários, editar data,
local, capacidade e preço, abrir a página pública do filme e remover sessões sem
vendas. Eventos com ingressos vendidos não são removidos silenciosamente.

A portaria escolhe local, filme e horário antes de ler o QR Code. O retorno
`VALID` recebe sinalização verde destacada; os demais resultados continuam
diferenciando ingresso inválido, já utilizado e sessão errada.

O cabeçalho informa qual conta está conectada e oferece acesso ao painel do
perfil e logout.

O seed cria 12 filmes distintos em quatro locais, com três sessões por filme em
cada local. A escolha de sessão e poltronas é preservada após recarregar a página
ou passar pelo login, mas continua sujeita à revalidação do backend.

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
Code, cancelamento com reembolso simulado, compartilhamento público limitado e
validação atômica na portaria.

As decisões desta evolução estão registradas em `docs/decisions.md`.
