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

## Status (keep updated)
**Day 1**
- [x] Scaffold frontend + backend (Laravel 13 + Sanctum, `/api/health`; Vite + Tailwind tokens; works locally against Neon `dev`)
- [x] Deploy hello world — live: https://eneba-market.vercel.app (API: https://eneba-market-api.onrender.com, Neon `production`); push to `main` auto-deploys both
- [x] Schema + seed (70 products, 6 sellers, 264 offers, 769 keys, 3 homepage blocks; pg_trgm index)
- [x] Store API: `/api/products` (q, platform, region, min/max_price in cents, 7 sorts, 24/page), `/api/products/{slug}`, `/api/filters`; typo search done (pg_trgm)

**Day 2**
- [ ] Store page
- [ ] Search (fuzzy, header autocomplete)
- [ ] Product page with offers
- [ ] Homepage blocks
- [ ] Eneba styling

**Day 3**
- [ ] Auth
- [ ] Cart / checkout / keys
- [ ] Order history
- [ ] Tests
- [ ] README
- [ ] Chat log export
