# Progress so far — what was done, why, and how it fits together

Status: Day 1 of 3. Live at https://eneba-market.vercel.app (hello-world page). Database schema + seed built locally, **not pushed yet**.

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
              └─ branch "dev"          (your computer, via backend/.env)

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

## 14. Schema + seed (local only, not pushed yet)
- **Why:** every Day 2 feature (store, search, product page, homepage) needs real data to show.
- **Done:**
  - `create_catalog_tables`: platforms, regions, products (one row per edition: game × platform × region), sellers, offers (seller's price for a product), game_keys. Enables `pg_trgm` + a trigram index on product names.
  - `create_homepage_tables`: home_blocks (which blocks, in what order), banners, deals.
  - Seeders: 70 products, 6 sellers, 264 offers, 769 keys (44 offers with 0 keys to test "out of stock"), 3 blocks. No Faker (it's dev-only, missing on Render); fixed random seed → same data every run. `DatabaseSeeder` skips if products exist → safe to run on every deploy.
  - Dockerfile now also runs `db:seed` on start, because Render's free tier has no shell.
  - Verified: all prices end in 9, none above RRP, "wichter 3" already matches The Witcher 3 via `pg_trgm`.
- **Connects to:** pushing redeploys Render → migrations create the tables in `production` → the seeder fills them once. Next task (store API) reads these tables.

---

## Key rules this design guarantees (interview one-liners)
- **No secrets in git:** `.env` ignored; production secrets live only in Render.
- **Local can't break live:** separate Neon branches.
- **Stock can't drift:** stock is counted from unsold keys, not stored.
- **Money is exact:** prices are integer cents.
- **Homepage is data-driven:** block order and content come from tables, not frontend code.
- **Every push deploys:** GitHub → Vercel + Render.

## Next
1. Push schema + seed → production gets tables and data.
2. Store API: `GET /api/products` (filters: platform, region, price; sort; search; pagination) + `GET /api/products/{slug}`.
3. Day 2: store page, search, product page, homepage blocks, styling.
