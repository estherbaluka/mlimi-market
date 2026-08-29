# Mlimi Market — Farm Produce Marketplace

> Fresh produce, direct from farmers. An MVP marketplace for Malawi — no payments, no gradients, just simple order requests.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black)](https://nextjs.org/)
[![Prisma 8](https://img.shields.io/badge/Prisma-8-2D3748)](https://prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Mlimi Market connects **farmers** who list agricultural produce with **buyers** who request orders. Farmers manage listings and fulfill requests; buyers browse, cart, and place orders without online payment. Built mobile-first with solid colors and flat design.

**Live:** `https://github.com/estherbaluka/mlimi-market` · **App:** `web/` (Next.js App Router)

---

## Features

### Buyer
- Register / Login (BUYER role)
- Browse products with search, category / price / unit filters, sorting, pagination
- Product detail with farmer info, stock, add to cart, message farmer
- Cart (Zustand, persistent, stock-aware, line totals)
- Checkout without payment (PICKUP or DELIVERY + address/pickup + note) → server-calculated totals, `SUBMITTED` order, snapshots, stock reservation
- Orders list + detail, cancel when `SUBMITTED|ACCEPTED`
- Messages — polling every 5s (`refetchInterval:5000`)

### Farmer
- Register / Login (FARMER role, farmName + location required)
- Products CRUD: create / edit / hide / show / sold-out / delete (owner-only)
- Orders: view requests containing own products, accept / reject / preparing / ready-for-pickup / out-for-delivery / delivered
- Messages — reply to buyers

### Admin
- Dashboard with live counts: users (farmers/buyers/admins), products (active/hidden/sold-out), orders (submitted), conversations
- Moderate products (hide/remove), view users and orders

### Design Constraints
- **No payments** — no Stripe/PayPal/mobile-money, no `Pay Now`, only `Place Order`
- **No gradients** — `linear-gradient` etc. forbidden, solid flat colors only (`bg-black`, `bg-white`, `bg-[#fbfbf5]`)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, webpack |
| Language | TypeScript 6, Zod + React Hook Form |
| DB | PostgreSQL (Supabase pooler) + Prisma 8 (`@prisma/orm-postgres`, contract `src/prisma/contract.prisma`) |
| Auth | `jose` JWT httpOnly cookie (`AUTH_SECRET`), `bcryptjs` |
| State | Zustand (cart), TanStack Query 5 (server state, polling) |
| Styling | Tailwind CSS 4, flat solid colors, `rounded-full` pills per `DESIGN.md` |

---

## Quick Start

```bash
git clone https://github.com/estherbaluka/mlimi-market.git
cd mlimi-market/web
pnpm install        # or npm install
cp .env.example .env
# fill DATABASE_URL, DIRECT_URL, AUTH_SECRET
```

**.env**
```env
DATABASE_URL="postgresql://postgres.rfqbahiylcnrttovnayi:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.rfqbahiylcnrttovnayi:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

```bash
# Prisma 8
pnpm contract:emit          # emit contract.json + types after schema change
pnpm db:seed                # seed admin/farmer/buyer + 10 products (tsx prisma/seed.ts)

pnpm dev --webpack          # http://localhost:3000 (7.7s)
pnpm exec tsc --noEmit
pnpm exec next build --webpack  # 25 routes
```

**Seed accounts**
| Role | Email | Password |
|---|---|---|
| ADMIN | admin@mlimi.test | admin123 |
| FARMER | farmer@mlimi.test | farmer123 (Green Valley Farm, Lilongwe) |
| BUYER | buyer@mlimi.test | buyer123 |

Products: Tomatoes, Onions, Maize, Cassava, Sweet Potatoes, Bananas, Beans, Groundnuts, Eggs, Honey.

---

## Project Structure

```
mlimi-market/
└─ web/                          # Next.js app (repo root for Vercel)
   ├─ app/
   │  ├─ page.tsx                # marketing home (solid colors)
   │  ├─ products/ [id]/         # public catalog + detail
   │  ├─ buyer/ cart checkout orders messages dashboard
   │  ├─ farmer/ products orders messages dashboard
   │  ├─ admin/ dashboard
   │  └─ api/ auth products orders conversations
   ├─ src/
   │  ├─ prisma/ contract.prisma db.ts  # Prisma 8
   │  ├─ lib/ auth.ts validations.ts product-validations.ts
   │  ├─ store/ cart.ts (Zustand)
   │  └─ components/ ui/ products/ farmer/ messages/ admin/
   ├─ prisma/ seed.ts
   └─ proxy.ts / middleware.ts    # role guard
```

---

## Prisma 8 Workflow

```bash
pnpm contract:emit       # after any src/prisma/contract.prisma change
# db sign/verify/migrate handled via prisma.config.ts + DATABASE_URL
pnpm db:seed
```

Query style:
```ts
import { db } from "@/prisma/db";
const products = await db.orm.public.Product.where({ status:"ACTIVE" }).select("id","title").all();
await db.orm.public.Product.where({ id }).update({ title:"New" });
```

---

## API Routes

| Method | Route | Guard |
|---|---|---|
| POST | /api/auth/register, /login, /logout, /me | public |
| GET/POST | /api/products, /api/products/[id] PATCH DELETE | GET public, write FARMER/ADMIN |
| POST/GET | /api/orders, PATCH /api/orders/[id] | BUYER place, FARMER update, BUYER cancel |
| GET/POST | /api/conversations, /api/conversations/[id]/messages | participant only, 5s polling |

---

## Roles & Order Flow

`SUBMITTED → ACCEPTED → PREPARING → READY_FOR_PICKUP|OUT_FOR_DELIVERY → DELIVERED` (also `REJECTED`, `CANCELLED` from `SUBMITTED|ACCEPTED`). Farmer transitions validated in `app/api/orders/[id]/route.ts`.

---

## Design System

Flat, `DESIGN.md` — `bg-black` primary pill, `rounded-full`, `border-zinc-200`, `bg-[#fbfbf5]` canvas, no `linear-gradient`. Uses `Geist` + `Inter`.

---

## Testing

```bash
pnpm exec tsc --noEmit
# eslint (warnings only for react-compiler watch)
pnpm exec next build --webpack  # must pass before push
```

Manual: register as BUYER/FARMER, add product as farmer, browse as buyer, add to cart, place order, farmer accepts, message polling.

---

## Deployment (Vercel)

- Root directory: `web`
- Build command: `pnpm build` (or `next build --webpack`)
- Env: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`

No `STRIPE_*` etc. — project rejects payment env.

---

## License

MIT — see `LICENSE` (initial commit). Contributions welcome.
