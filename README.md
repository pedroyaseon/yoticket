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

## Estado atual

A fundação entrega schema Prisma, JWT, hash bcrypt, RBAC, seed e CI. Os fluxos de catálogo, evento, compra, ingresso e portaria serão entregues em PRs separados.
