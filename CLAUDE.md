# Eneba Market — CLAUDE.md

Eneba-style game key marketplace. Internship assignment, **3-day deadline, scope over polish**.
The user is a junior returning to coding: explain non-obvious code in 1–2 sentences. They must be able to explain everything in an interview.
More context: `PLAN.md` (data model, API), `ENEBA_RESEARCH.md` (design tokens, UI patterns), `DECISIONS.md`.

## Stack
- `frontend/`: Vite + React + TypeScript, React Router, TanStack Query (server data), Tailwind (Eneba tokens), Zustand (cart).
- `backend/`: Laravel (PHP 8.5), REST under `/api`, Sanctum bearer tokens.
- DB: Postgres on Neon, `pg_trgm` for fuzzy search.
- Deploy: Vercel (frontend, rewrites `/api/*` to the backend) + Render (backend, Docker) + Neon (DB).

## Commands
Dev servers: `.claude/launch.json` has `backend` (:8000) and `frontend` (:5173, proxies `/api` → :8000).
Windows quirks: PHP comes from Laravel Herd (in Git Bash call `~/.config/herd/bin/php85/php.exe`). Avast scans HTTPS and
deleted Laravel's `server.php`, so `artisan serve` exits — use `php -S localhost:8000 -t backend/public` instead.
Composer needs `COMPOSER_CAFILE`/`GIT_SSL_CAINFO` = Herd's cacert + Avast root, and `--prefer-source` (Avast locks zips).

Backend (`cd backend`):
- `php artisan migrate:fresh --seed` (rebuild DB + test data)
- `php artisan test` (uses Neon `test` branch via `.env.testing`; skips if DB_URL is empty — never point it at dev/production)

Frontend (`cd frontend`):
- `npm run dev`
- `npm run build`

## Scope in
- Store: filters (platform, region, price), sort, search by name; state in the URL
- Homepage blocks rendered from `/api/homepage`
- Typo-tolerant search (header, available everywhere)
- Product page with offers from several sellers
- Cart → checkout → simulated payment → digital key
- Auth (register/login); checkout + order history require login
- Order history

## Scope out (on purpose)
Real payments, reviews, wishlist, seller dashboard, emails, admin panel, password reset.

## Rules
- One feature per step, small diffs. After each step, tell the user what to test by hand.
- No new dependencies without asking.
- Never commit secrets: `.env` is gitignored, `.env.example` is committed.
- Key assignment happens in **one DB transaction** using `SELECT … FOR UPDATE SKIP LOCKED`, so a key is never sold twice.
- Homepage renders only what the API sends. Nothing is hardcoded in the frontend.
- Prices are integer cents everywhere (DB, API). Format only at display time.
- Log each design decision as one line in `DECISIONS.md` (choice + reason).
- Side issues found mid-feature go into `WANT_TO_FIX.md` (one table row), not into the current diff.

## Status (keep updated)
**Day 1**
- [x] Scaffold frontend + backend (Laravel 13 + Sanctum, `/api/health`; Vite + Tailwind tokens; works locally against Neon `dev`)
- [x] Deploy hello world — live: https://eneba-market.vercel.app (API: https://eneba-market-api.onrender.com, Neon `production`); push to `main` auto-deploys both
- [x] Schema + seed (70 products, 6 sellers, 264 offers, 769 keys, 3 homepage blocks; pg_trgm index)
- [x] Store API: `/api/products` (q, platform, region, min/max_price in cents, 7 sorts, 24/page), `/api/products/{slug}`, `/api/filters`; typo search done (pg_trgm)

**Day 2**
- [x] Store page (`/store`: filters, sort, tags, pages; URL query = API params; Metropolis font)
- [x] Search (header SearchBox: 250 ms pause → top 5 from `/api/products?q=`, Enter → `/store?q=`)
- [x] Product page with offers (`/product/:slug`: featured = cheapest in stock, offer list, sold-out greyed, 404; Buy disabled until Day 3)
- [x] Homepage blocks (`/api/homepage` + `/api/blocks/{banners,deals,bestsellers}`; frontend type→component map; rolling deals)
- [x] Eneba styling (side-by-side with eneba.com; purple header, focus outlines, card hover, footer, favicon, titles; WANT_TO_FIX #1 #3 fixed)

**Day 3**
- [x] Auth (register/login/logout/me, Sanctum 7-day tokens, rate limit + trustProxies, Zustand session in localStorage, demo account demo@eneba-market.test)
- [x] Cart / checkout / keys (browser cart, 3-step checkout, POST /api/checkout in one transaction with FOR UPDATE SKIP LOCKED, decline card ...0002, last-4-only)
- [x] Order history (`GET /api/orders` own orders only; `/orders` page with Reveal + Copy; header "My orders")
- [x] Tests (25 backend tests; concurrency proven with two DB sessions; local + live manual sweep; results in PROGRESS.md)
- [x] Extra A: header + footer match eneba.com measurements (1200 px width, 147 px two-row header, nav band, footer columns)
- [x] Extra B: real game covers (Steam art for 23 games via data migration, <Cover> fallback, footer credit)
- [x] Extra C: Add to cart + Buy now on product cards (cheapest_offer in list APIs, shared toCartItem)
- [x] Extras: bigger yellow logo mark; homepage banners use Steam hero art
- [x] Extra D: WANT_TO_FIX #5 — cart re-checks stock + price (/api/offers), lowers qty, blocks on sold out
- [ ] README
- [ ] Chat log export
