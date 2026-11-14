# Progress so far — what was done, why, and how it fits together

Status: Days 1 and 2 of 3 done. Live at https://eneba-market.vercel.app: homepage, store, typo-tolerant search, product page. Day 3 next: auth, cart/checkout/keys, order history, tests, README, chat log.

## The big picture

```
 Browser
   │  https://eneba-market.vercel.app
   ▼
 Vercel  (frontend/ — React build, static files)
   │  /api/*  →  rewrite (frontend/vercel.json)
   ▼
 Render  (backend/ — Laravel in Docker, https://eneba-market-api.onrender.com)
   │  DB_URL (secret in Render)
   ▼
 Neon Postgres ── branch "production"   (live data)
              ├─ branch "dev"          (your computer, via backend/.env)
              └─ branch "test"         (automated tests, via backend/.env.testing; wiped each run)

 GitHub (AldasHBudrys/eneba-market) ── push to main ──► Vercel + Render redeploy automatically
```

Same shape locally: Vite dev server (:5173) proxies `/api` to PHP (:8000), which uses the Neon `dev` branch.

---

## 1. Read the assignment → `NOTES.md`
- **Why:** the PDF is vague on purpose; graders judge scope decisions, AI usage, and whether you can explain the code. Missing a deliverable = no evaluation.
- **Done:** extracted hard rules (GitHub link, public URL, full chat log, 7-day limit), the 7 features, the stack, and the "few features done deep" hint.
- **Connects to:** every later task. The deliverables list drives the deploy work; "depth over breadth" drives the plan.

## 2. Plan the architecture → `PLAN.md`
- **Why:** decide stack, data model and API once, so later steps are just execution.
- **Done:** chose React+TS / Laravel / Postgres; designed tables (products, sellers, offers, keys, homepage blocks); listed endpoints; picked 3 features to go deep on (typo-tolerant search, safe checkout, data-driven homepage); listed cuts (real payments, reviews, wishlist…).
- **Connects to:** task 14 implements the data model from here; Day 2–3 implement the API list.

## 3. Study eneba.com → `ENEBA_RESEARCH.md`
- **Why:** "Eneba styling" is a requirement; measuring beats guessing. Also to see how their features behave.
- **Done:** read computed colors/font from the live site (purple `#4618AC`, yellow `#FAD318`, Metropolis font, square buttons), mapped homepage blocks, store filters/sort (state lives in the URL), product page offer list, 3-step checkout. Found their search **fails on typos** ("wichter 3" → no results).
- **Connects to:** the colors are already Tailwind tokens (task 7); filters/sort shape the store API; the typo finding is a good interview point.

## 4. 3-day schedule (in `PLAN.md`)
- **Why:** you chose a 3-day deadline; needs an order that always leaves something working.
- **Done:** Day 1 = backend + deploy, Day 2 = browse/search screens, Day 3 = auth/checkout/submit. Rule: deploy every day. Fixed cut order if time runs short.
- **Connects to:** the status checklist in `CLAUDE.md`.

## 5. Project rules → `CLAUDE.md`, `DECISIONS.md`
- **Why:** each AI session re-reads `CLAUDE.md`, so rules stay consistent; `DECISIONS.md` is your one-line-per-choice cheat sheet for the interview.
- **Done:** stack, commands, scope in/out, rules (small steps, no secrets in git, prices in cents, key sale in one DB transaction), daily checklist.
- **Connects to:** every coding step follows these rules; every decision since then is logged.

## 6. Local tooling (Windows setup)
- **Why:** couldn't build anything until PHP + Composer worked.
- **Done:** found PHP 8.5 + Composer inside Laravel Herd. Found **Avast intercepting HTTPS** and locking downloads: built a separate certificate bundle for Composer/git, installed packages via `git clone` (`--prefer-source`). Avast also deletes Laravel's `server.php` (false positive), so local dev uses `php -S` instead of `artisan serve`. No antivirus or system settings were changed.
- **Connects to:** documented in `CLAUDE.md` so future sessions don't rediscover it. Not an issue on Render (Linux, no Avast).

## 7. Frontend scaffold → `frontend/`
- **Why:** the brief requires React (TS preferred).
- **Done:** Vite + React + TypeScript, React Router, TanStack Query (handles loading/error/caching of API calls), Tailwind with Eneba tokens in `src/index.css`. Dev proxy: `/api` → `localhost:8000` (`vite.config.ts`). Hello-world `App.tsx` calls `/api/health` and shows the result.
- **Connects to:** the proxy mirrors the Vercel rewrite (task 13), so frontend code always calls a relative `/api/...` and never needs the backend's address.

## 8. Backend scaffold → `backend/`
- **Why:** the brief requires PHP (or Go); Laravel gives migrations, seeders, validation, auth and transactions built in.
- **Done:** Laravel 13; `install:api` added `routes/api.php` + **Sanctum** (token auth, used on Day 3); `HasApiTokens` on `User`; `/api/health` runs `select 1` against the DB. Removed Laravel's bundled `CLAUDE.md`/`AGENTS.md` (they told agents to install PHP via a downloaded script and would conflict with ours).
- **Connects to:** `/api/health` is used by the frontend hello-world, by Render's health check, and by our deploy checks.

## 9. Database → Neon
- **Why:** Postgres for `pg_trgm` (fuzzy search); Neon's free tier doesn't expire (Render's free Postgres is deleted after 30 days).
- **Done:** project `eneba-market` in Frankfurt (same region as Render). Two branches: `production` (live) and `dev` (local; auto-delete turned off). Direct connections, not pooled. Connection strings pasted by you only — never in chat or git.
- **Connects to:** `backend/.env` → `dev`; Render's `DB_URL` → `production`. `migrate:fresh` locally can never wipe live data.

## 10. Local end-to-end check → `.claude/launch.json`
- **Why:** prove browser → React → `/api` → Laravel → Neon works before deploying.
- **Done:** launch configs for both servers; page showed "API: ok, db connected" with Eneba colors.
- **Connects to:** the same check repeated on the live URLs (tasks 12–13).

## 11. Git + GitHub
- **Why:** GitHub link is a required deliverable; also the trigger for automatic deploys.
- **Done:** repo at root with `.gitignore` (`.env` ignored, `.env.example` committed). Fixed SSH: your key wasn't on GitHub, then was added as a read-only deploy key → you enabled write access. Pushed `main`. Secrets scan before every commit.
- **Connects to:** Render and Vercel both deploy from this repo on every push.

## 12. Backend deploy → Render (`backend/Dockerfile`, `render.yaml`)
- **Why:** public URL is a required deliverable; Render runs PHP free via Docker.
- **Done:** Dockerfile (PHP 8.5 + `pdo_pgsql`, Composer install, on start: cache config → migrate → serve). `render.yaml` describes the service as code (free plan, Frankfurt, health check, `LOG_CHANNEL=stderr`). Secrets `APP_KEY` + `DB_URL` marked `sync: false` → typed by you in Render's dashboard. Render's GitHub app limited to this one repo.
- **Connects to:** `https://eneba-market-api.onrender.com/api/health` → ok + DB connected (Neon `production`). Free tier sleeps after ~15 min idle (~50 s cold start).

## 13. Frontend deploy → Vercel (`frontend/vercel.json`)
- **Why:** free static hosting for the React build, with a rewrite so the browser only ever talks to one domain.
- **Done:** rewrite `/api/*` → Render; fallback `/(.*)` → `index.html` so deep links like `/store` survive a refresh. Vercel's GitHub app limited to this repo; project root `frontend`, Vite preset.
- **Connects to:** `https://eneba-market.vercel.app` shows "API: ok, db connected" — the full chain works. No CORS setup needed because it's same-origin.

## 14. Schema + seed
- **Why:** every Day 2 feature (store, search, product page, homepage) needs real data to show.
- **Done:**
  - `create_catalog_tables`: platforms, regions, products (one row per edition: game × platform × region), sellers, offers (seller's price for a product), game_keys. Enables `pg_trgm` + a trigram index on product names.
  - `create_homepage_tables`: home_blocks (which blocks, in what order), banners, deals.
  - Seeders: 70 products, 6 sellers, 264 offers, 769 keys (44 offers with 0 keys to test "out of stock"), 3 blocks. No Faker (it's dev-only, missing on Render); fixed random seed → same data every run. `DatabaseSeeder` skips if products exist → safe to run on every deploy.
  - Dockerfile now also runs `db:seed` on start, because Render's free tier has no shell.
  - Verified: all prices end in 9, none above RRP, "wichter 3" already matches The Witcher 3 via `pg_trgm`.
- **Connects to:** pushing redeploys Render → migrations create the tables in `production` → the seeder fills them once (3 s on Render vs 32 s from home: same region as the DB). The store API reads these tables.

## 15. Store API → `ProductController`, `FilterController`, models
- **Why:** every Day 2 screen needs products; doing the backend on Day 1 kept Day 2 almost pure frontend.
- **Done:** `GET /api/products` (`q`, `platform`, `region`, `min_price`/`max_price` in cents, 7 sorts, 24 per page), `GET /api/products/{slug}` (details + offers, buyable first, cheapest first), `GET /api/filters` (sidebar options from the DB). Models with scopes: `Product::search`, `withLowestPrice`; `Offer::inStock`, `withStock`; `GameKey::unsold` (the one definition of "unsold", changes in one line on Day 3). API Resources shape the JSON; key codes are `$hidden`.
- **Search:** `ILIKE` partial match OR `pg_trgm word_similarity ≥ 0.3`. Threshold measured, not guessed: "wichter" → Witcher scores 0.30, unrelated names ≤ 0.25; plain `similarity()` was too low for long names (0.11).
- **Tests:** feature tests on a separate Neon `test` branch; `TestCase` skips them unless `.env.testing` has a `DB_URL` (otherwise Laravel would fall back to `.env` and wipe `dev`).
- **Connects to:** the store page passes its URL query straight to `/api/products`; header search and product page reuse the same endpoints.

---

# Day 2: browse & find

Done-check met: typing "wichter 3" in the header on the live site finds The Witcher 3 and opens its product page.
Commits: `5d96415` store → `f4e1b70` search → `7edc92e` product page → `e0e8d20` homepage → `998536d` styling.

**How we worked:** one feature at a time (plan → approval → build → test → commit); ask when a decision isn't covered by the plan; side issues found mid-feature go to `WANT_TO_FIX.md` instead of growing the change.

## 16. Store page → `frontend/src/pages/Store.tsx`
- **Why:** the brief's "Store: browse every product, filter, sort, search by name".
- **Done:** sidebar (price in €, platforms, regions from `/api/filters`), 7 sorts, filter tags + "Clear all", "Results found", page numbers, loading/empty/error states, phone layout. Shared pieces: `api.ts` (fetch helper, types, `euro()`), `Layout.tsx`, `ProductCard.tsx`, Metropolis font (`@fontsource/metropolis`).
- **Key idea:** the URL query uses the API's own parameter names, so the page forwards it to `/api/products` unchanged. Filter click = URL change = refetch; refresh, back button and shared links just work. `keepPreviousData` keeps the old grid (dimmed) while new results load.
- **Bug found and fixed (backend):** with €5–15, a card showed €3.49: the filter matched any buyable offer in range, but cards show the cheapest. Now it filters on the same "From" price the card shows; test case added.
- **Connects to:** header search sends Enter to `/store?q=…`; `ProductCard` is reused by search, homepage rows.

## 17. Header search → `frontend/src/components/SearchBox.tsx`
- **Why:** the brief's "search from anywhere, cope with typos and partial names".
- **Done:** dropdown with up to 5 matches after a 250 ms typing pause; Enter → `/store?q=…` (no separate search page, like Eneba); "No matches found" state; Escape / click outside closes; own row on phones.
- **How:** reuses `/api/products?q=` (no backend change; typo tolerance from `pg_trgm`). Requests are keyed by the search text, so a slow old response can't overwrite newer results. Stays in sync with `/store?q=` using React's "adjust state during render" pattern (the linter flagged the first, effect-based version).
- **Parked:** WANT_TO_FIX #2 (box keeps its text after clicking a result; Eneba does the same).

## 18. Product page → `frontend/src/pages/Product.tsx`
- **Why:** the brief's "details and offers from several sellers, so a buyer can compare and choose".
- **Done:** breadcrumbs, cover, info rows, featured offer, full offer list (seller, rating label, price, discount, stock; sold-out greyed), description; tab title = product name (React 19 `<title>`).
- **Decisions:** featured = cheapest in stock (no "verified seller" concept); rating labels ≥9.8 Superb / ≥9.5 Excellent / ≥9.0 Very good / Good (Eneba's examples); "Buy now" visible but disabled until the cart exists; a 404 isn't retried, so "Product not found" shows at once (`ApiError` carries the HTTP status).
- **Bugs:** blank page because Laravel wraps single resources as `{"data": {...}}` and the type assumed the bare product (TypeScript doesn't check JSON at runtime); locally broken layout was Tailwind's dev server missing a new file (restart fixed it; production build was fine).

## 19. Homepage → `HomepageController` + `frontend/src/pages/Home.tsx`
- **Why:** the brief's "blocks, each from its own backend source; nothing hardcoded in the frontend".
- **Done:** `GET /api/homepage` lists blocks (`type`, `title`, `endpoint`) by `position`; `/api/blocks/banners`, `/deals`, `/bestsellers` each read their own source. Frontend: `type → component` map, each block fetches its own endpoint, unknown types skipped, one slow/failing block doesn't break the others. Ticking "Ends in" countdowns.
- **Proof of "nothing hardcoded":** swapping two `position` values in the DB reorders the page on reload, no code change or deploy.
- **Decisions:** rolling deals (an ended deal moves forward by whole weeks; the seeded deals would all have expired before grading; marked `shortcut:`); best sellers = top 12 by popularity, in stock only; every homepage endpoint returns `{"data": [...]}`.
- **Tests:** 4 new (block order, banners, rolling deals, best sellers) → 13 backend tests total, all passing.

## 20. Styling pass
- **Why:** "looks and feels like Eneba" is a grading point.
- **Done:** side-by-side screenshots vs eneba.com, then: header in the page purple with a dark search box (as measured on Eneba), yellow `:focus-visible` outline, card hover lift, footer "For the Eneba internship task", favicon, page titles.
- **WANT_TO_FIX #1 fixed** with a data migration (covers recolored `#1f0a4d` → `#351183`; the live DB only runs migrations on deploy, `down()` reverses it). **#3 fixed:** banner overlay shows subtitle + "Shop now" (the title is already in the image). **#4 parked:** loading skeletons, skipped to protect Day 3.

---

## Key rules this design guarantees (interview one-liners)
- **No secrets in git:** `.env` ignored; production secrets live only in Render.
- **Local can't break live:** separate Neon branches.
- **Stock can't drift:** stock is counted from unsold keys, not stored.
- **Money is exact:** prices are integer cents.
- **Homepage is data-driven:** block order and content come from tables, not frontend code.
- **Every push deploys:** GitHub → Vercel + Render.
- **Shareable store state:** filters, sort, search and page live in the URL.
- **Prices you see are prices you filter on:** the "From" price and the price filter use the same cheapest-buyable-offer rule.
- **Tests can't wipe real data:** they only run against the Neon `test` branch.

## Next (Day 3)
1. Auth: register / login / logout with Sanctum tokens; login + register pages; protected routes.
2. Cart → checkout → simulated payment → keys, with key assignment in one DB transaction (`FOR UPDATE SKIP LOCKED`).
3. Order history.
4. Tests, README, chat log export, submission.
