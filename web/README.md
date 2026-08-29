# Mlimi Market — Web (Next.js)

> `web/` is the Next.js 16 App Router application for Mlimi Market (farm produce marketplace). See root `../README.md` for full monorepo overview.

## Stack

Next.js 16 + React 19 + TypeScript 6, Tailwind 4, Prisma 8 (`@prisma/orm-postgres`), PostgreSQL (Supabase), Zustand, TanStack Query, `jose` JWT, `bcryptjs`.

## Local Dev

```bash
pnpm install
cp .env.example .env   # fill DATABASE_URL, AUTH_SECRET
pnpm contract:emit
pnpm db:seed           # admin@mlimi.test / farmer@mlimi.test / buyer@mlimi.test
pnpm dev --webpack     # http://localhost:3000
```

Build: `pnpm exec tsc --noEmit && pnpm exec next build --webpack` (25 routes).

## Key Routes

- `/` marketing, `/products` `/products/[id]` (public, filters, pagination)
- `/buyer/*` cart checkout orders messages (BUYER)
- `/farmer/*` products orders messages (FARMER)
- `/admin/dashboard` (ADMIN)
- `/api/*` auth products orders conversations

## Constraints

Solid colors only, no `gradient`; no payment gateways — use `Place Order`.

## Prisma 8

Contract at `src/prisma/contract.prisma`, emitted `contract.json` + `contract.d.ts`, client `src/prisma/db.ts` via `db.orm.public.*`. Config `prisma.config.ts` points to `src/prisma/contract.prisma`.

Seed: `prisma/seed.ts` (10 products).
