# Eneba Market — Plan

Guiding rule from the brief: **few features, done deep**. Every choice below picks the option with the least code that still fully meets the spec, so you can explain all of it.

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React + TypeScript + Vite**, React Router, TanStack Query, **Zustand** (cart) | Vite = zero-config. TanStack Query handles loading/error/caching so components stay simple. Zustand = tiny global cart store. |
| Styling | **Tailwind CSS** with Eneba colors as theme tokens | Fast to match a reference design; tokens live in one config file. |
| Backend | **PHP 8.5 + Laravel** (REST under `/api`, Sanctum bearer tokens) | Built-in auth, migrations, seeders, validation, DB transactions. Less code to write = less to explain. |
| Database | **PostgreSQL** | `pg_trgm` extension gives typo-tolerant search without an extra search service. |
| Hosting | Frontend → **Vercel** (rewrites `/api/*` to backend), Backend → **Render** (Docker, free), DB → **Neon** (free Postgres) | All free. Render's free Postgres expires after 30 days, Neon's doesn't. |

Known limit: Render free tier sleeps after ~15 min idle → first request takes ~30–60 s. Mention it in the README.

## 2. Data model

```
users           id, name, email (unique), password_hash, created_at
platforms       id, name, slug            -- Steam, PlayStation, Xbox, Nintendo...
regions         id, name, slug            -- Global, EU, US...
products        id, name, slug, description, image_url, platform_id, region_id,
                release_date, genre, rrp_cents, created_at   -- rrp = strikethrough "From" price
sellers         id, name, rating
offers          id, product_id, seller_id, price_cents, currency
                -- stock = count of unsold keys, not a column (can't drift)
keys            id, offer_id, code, order_item_id NULL   -- NULL = unsold
cart_items      id, user_id, offer_id, quantity
orders          id, user_id, total_cents, status (pending|paid|failed), created_at
order_items     id, order_id, offer_id, price_cents      -- one row per key
-- homepage blocks: each block reads its own table
home_layout     id, block_type, position, title           -- which blocks, in what order
banners         id, title, subtitle, image_url, link_url, position
deals           id, product_id, discount_percent, ends_at
-- best sellers: computed from order_items (no table)
```

Money is stored as **integer cents** (no float rounding errors).

## 3. API (REST, `/api`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | – | Sanctum token |
| GET | `/me` | ✅ | |
| GET | `/products?q=&platform=&region=&min=&max=&sort=&page=` | – | Store; sort: price, newest, name |
| GET | `/products/{slug}` | – | Details + offers sorted by price, with stock |
| GET | `/search?q=` | – | Fuzzy, top 8, for header autocomplete |
| GET | `/homepage` | – | Returns the layout: `[{type, title, endpoint}]` |
| GET | `/blocks/banners` · `/blocks/deals` · `/blocks/bestsellers` | – | One endpoint per block, each its own query/table |
| GET/POST/PATCH/DELETE | `/cart`, `/cart/{id}` | ✅ | |
| POST | `/checkout` | ✅ | Creates order, reserves keys |
| POST | `/orders/{id}/pay` | ✅ | Simulated payment → reveals keys |
| GET | `/orders`, `/orders/{id}` | ✅ | Order history + keys |

## 4. Where to go deep (the "extensive" features)

1. **Search** — `pg_trgm` `similarity()` + `ILIKE '%q%'` so `"wichter 3"` finds *The Witcher 3* and `"cyber"` finds *Cyberpunk 2077*. GIN trigram index. Same search reused by Store and header.
2. **Checkout correctness** — in one DB transaction: lock unsold keys (`SELECT … FOR UPDATE SKIP LOCKED`), fail cleanly if out of stock, never sell the same key twice. One test that proves it.
3. **Homepage blocks** — frontend renders whatever `/api/homepage` says; each block component fetches its own endpoint. Reorder/remove blocks in the DB → homepage changes without a deploy.

## 5. Deliberately cut (justify in README)

- **Real payments** → simulated "Pay" step with a fake card form (spec allows it). Stripe test mode = optional upgrade if time is left.
- Reviews, wishlist, seller dashboards, admin panel, email, password reset, i18n/currencies.
- Separate microservices per homepage block → separate **endpoints + tables** in one app. Same contract for the frontend; far less ops on a free tier.

## 6. Frontend pages

`/` Home · `/store` Catalog (filters in URL query so links are shareable) · `/product/:slug` · `/search?q=` · `/cart` · `/checkout` 🔒 · `/orders` 🔒 · `/orders/:id` 🔒 (keys) · `/login` · `/register`

Header on every page: logo, **global search with autocomplete**, cart count, account menu.

## 7. Seed data

~60 products across 4–5 platforms and 3 regions, 4–6 sellers, 2–5 offers per product, 3–10 keys per offer (random codes like `XXXXX-XXXXX-XXXXX`). Laravel seeder, so `php artisan migrate --seed` rebuilds everything.

## 8. 3-day schedule

Rule: **deploy at the end of every day**, so there's always a working public URL. Style as you build (tokens from `ENEBA_RESEARCH.md` go into Tailwind on Day 1), not as a last-day pass.

### Day 1 — Scaffold, deploy, data, store API
- [ ] GitHub repo (monorepo: `/backend`, `/frontend`); scaffold Laravel + Vite app
- [ ] **Deploy hello world:** backend → Render (Docker), frontend → Vercel with `/api` rewrite, DB → Neon
- [ ] Schema: all migrations, enable `pg_trgm`; seeder (~60 products, sellers, offers, keys, banners, deals, home_layout)
- [ ] Store API: `/products` (filters, sort, pagination), `/products/{slug}`
- ✅ Done when: the deployed frontend shows products fetched from the deployed API.

### Day 2 — Browse & find (the screens people see)
- [ ] Store page: sidebar filters (price, platform, region), sort, chips, pagination — all in URL query; product card component
- [ ] Search: `/search` API (pg_trgm), header autocomplete + empty state, results page
- [ ] Product page: details + offer list (seller, rating, price, discount, Buy now)
- [ ] Homepage blocks: renders blocks from `/api/homepage`, each block fetches its own endpoint
- [ ] Eneba styling: Tailwind tokens + Metropolis font, header, all Day 2 screens
- ✅ Done when: you can find "wichter 3" from the header and open its product page.

### Day 3 — Auth, buy, submit
- [ ] Auth: Sanctum register/login/logout/`/me`; login + register pages; route guard
- [ ] Cart (Zustand; add specific offer, qty, remove) 🔒
- [ ] Checkout: 3-step bar; transaction with `FOR UPDATE SKIP LOCKED`; simulated payment → keys shown
- [ ] Orders history + order detail with keys 🔒
- [ ] Tests: no double-sold key, fuzzy search finds typo, protected routes return 401
- [ ] Styling pass on all screens, loading/empty/error states
- [ ] README: setup, architecture, scope + what was cut and why, cold-start note
- [ ] **Export full chat log** → `CHAT_LOG.md`; reply to the registration email with repo + URL + log
- ✅ Done when: a fresh account can buy a key on the public URL.

### If time runs short, cut in this order
1. Filter counts & chips → 2. Search suggestions list (keep product rows) → 3. Order detail page (show keys on order list) → 4. Deals block (keep banner + best sellers).
Never cut: fuzzy search, checkout transaction, auth guard, deploy, chat log.
