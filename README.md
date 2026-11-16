# eneba market

An Eneba-style game key marketplace, built for the Eneba internship task: browse and filter a catalog, compare offers from several sellers, buy with a simulated payment and get a digital key.

## Try it

- **Live site:** https://eneba-market.vercel.app
- **API:** https://eneba-market-api.onrender.com/api/health
- **Demo account:** `demo@eneba-market.test` / `demo12345` (or register a new one)
- **Test card:** `4242 4242 4242 4242`, any future date, any CVC. A card ending in `0002` is declined.

> The API runs on Render's free tier and sleeps when idle: the first request can take ~50 s. Pages show loading skeletons meanwhile.

## Features

- **Store** (`/store`): filter by platform, region and price, with a count next to each option; 7 sorts; search; 24 per page. All state lives in the URL, so any view can be shared or bookmarked.
- **Search from anywhere**: the header box tolerates typos and partial names ("wichter" finds The Witcher), shows the top 5 as you type, Enter opens the full results.
- **Homepage built from blocks**: hero banners, rolling deals with countdowns, best sellers. The API decides which blocks show and in what order; each block has its own endpoint and tables.
- **Product page**: game details plus every seller's offer; the cheapest one in stock is featured, sold-out offers are greyed out.
- **Cart → checkout → key**: cart in the browser (re-checks price and stock with the server), 3-step checkout, simulated card payment, keys shown right away. Product cards also have Add to cart and View offers on hover.
- **Accounts**: register, log in, log out. Checkout and order history require login.
- **Order history** (`/orders`): past orders with keys hidden until "Reveal", plus Copy.
- **Eneba look**: colors, Metropolis font, header/footer measured against eneba.com, game covers from Steam.

## Architecture

```
Browser ──► Vercel (React SPA) ──/api/* rewrite──► Render (Laravel, Docker) ──► Neon (Postgres)
```

| Layer | Tech | Why |
|---|---|---|
| Frontend | Vite, React 19, TypeScript, React Router | the required stack; fast dev server |
| Server data | TanStack Query | caching, retries, loading/error states without hand-written effects |
| Client state | Zustand (persisted) | cart and login session in localStorage, tiny API |
| Styling | Tailwind v4 with Eneba color/font tokens | one place for the design tokens |
| Backend | Laravel 13 (PHP 8.5), REST under `/api` | required PHP; validation, ORM, migrations, tests built in |
| Auth | Sanctum bearer tokens (7-day expiry) | simple token auth for an SPA on another domain |
| Database | Postgres on Neon, `pg_trgm` | free tier, branches (dev / test / production), fuzzy search built in |
| Hosting | Vercel + Render + Neon free tiers | push to `main` deploys both apps |

Because Vercel forwards `/api/*` to Render, the browser only ever talks to one domain: no CORS setup needed.

**Data model:** `platforms`, `regions`, `products` (one platform + region each), `sellers`, `offers` (seller × product × price), `game_keys` (belong to an offer; sold once linked to an order item), `users`, `orders`, `order_items`, plus `home_blocks`, `banners`, `deals` for the homepage. Seeded with 70 products, 6 sellers, 264 offers and 769 keys.

## How the important parts work

- **A key is never sold twice.** Checkout runs in one database transaction and picks keys with `SELECT … FOR UPDATE SKIP LOCKED`: two buyers at the same moment lock different keys, nobody waits, and if anything fails (not enough stock, declined card) everything rolls back.
- **The server decides prices.** The browser sends only offer ids, quantities and the card's last 4 digits; prices and stock are re-read inside the transaction.
- **Stock can't drift.** It is counted from unsold keys, not stored as a number.
- **Money is exact.** Prices are integer cents in the database and API; formatted only for display.
- **Typo-tolerant search.** `ILIKE` for partial names plus `pg_trgm` `word_similarity ≥ 0.3` for typos, ranked by similarity. SQL wildcards in the search text are escaped.
- **Prices you see are prices you filter on.** A card's "From" price and the price filter both use the cheapest offer that has keys.
- **Filter counts** come in the same response as the products. Each group counts with every filter except its own, so ticking Steam still shows what adding GOG would give.
- **Homepage renders only what the API sends.** The frontend maps block types to components and skips unknown ones, so a new database row can't break the page.

Every design choice with its reason is one line in [DECISIONS.md](DECISIONS.md).

## Run locally

Needs PHP 8.3+ with `pdo_pgsql`, Composer, Node 20.19+, and a Postgres database (a free Neon branch works).

**Backend** (http://localhost:8000):

```bash
cd backend
composer install
cp .env.example .env          # then set DB_URL to your Postgres connection string
php artisan key:generate
php artisan migrate --seed    # tables + demo catalog + demo account
php artisan serve
```

**Frontend** (http://localhost:5173, forwards `/api` to :8000):

```bash
cd frontend
npm install
npm run dev
```

**Tests** wipe the database they run on, so give them their own: copy `.env` to `backend/.env.testing` and point its `DB_URL` at a separate, empty database. If `DB_URL` is empty the tests are skipped.

```bash
cd backend
php artisan test
```

> Windows note: on this machine antivirus deleted Laravel's `server.php`, so `artisan serve` exited; `php -S localhost:8000 -t public` (from `backend/`) does the same job.

## Testing

- **29 backend tests** (Neon `test` branch): filters, sorts, filter counts, "From" price, typo search, wildcard escaping, homepage blocks, auth and rate limit, checkout (DB prices, rollbacks, declined card, two checkouts never share a key), own orders only.
- **Concurrency checked with two real DB sessions:** session A locks a key and keeps its transaction open; session B runs the same query and got the next key after 0.43 s (0.13 s on a second run): no waiting, no double sale.
- **Manual runs** locally and on the live site: full purchase, sold-out product, API down (error + Retry), unknown homepage block, phone width.

Details in [PROGRESS.md](PROGRESS.md).

## Scope

The brief is vague on purpose, so the time went into doing the required flow well rather than adding features.

**Left out on purpose:** real payments, reviews, wishlist, seller dashboard, emails, admin panel, password reset. None of them are in the user flow the brief asks for, and each would have taken time from it.

## Known limits

- First request after idle is slow (Render free tier cold start).
- Games without Steam artwork use a placeholder cover.
- Deals are "rolling": each one restarts weekly, so the countdown never runs out.
- The login token is kept in localStorage (simple; readable by injected scripts, so a production app would use an httpOnly cookie).
- Laravel trusts all proxies (`trustProxies('*')`) because Render's proxy IPs aren't fixed; needed for correct client IPs in rate limiting.
- No automated frontend tests; the frontend was checked by hand and in a browser.

## How I used AI

Built with Claude Code as a pair programmer. For every feature: Claude wrote a short plan with the open decisions and its recommendations, I approved or changed them, it built the feature in a small diff, ran the tests and checked the result in a browser, and the decision went into DECISIONS.md. Side issues found along the way were parked in WANT_TO_FIX.md instead of growing the current change. The full chat is in [CHAT_LOG.md](CHAT_LOG.md).

## Docs in this repo

| File | What's in it |
|---|---|
| [NOTES.md](NOTES.md) | key points of the assignment |
| [PLAN.md](PLAN.md) | data model, API, 3-day plan |
| [ENEBA_RESEARCH.md](ENEBA_RESEARCH.md) | eneba.com design tokens and UI patterns |
| [DECISIONS.md](DECISIONS.md) | every design choice, one line each |
| [PROGRESS.md](PROGRESS.md) | what was built, why, test results |
| [WANT_TO_FIX.md](WANT_TO_FIX.md) | parked issues and how they were fixed |
| [CLAUDE.md](CLAUDE.md) | project rules for the AI agent ([AGENTS.md](AGENTS.md) points other agents there) |

Game images © their publishers, via Steam.
