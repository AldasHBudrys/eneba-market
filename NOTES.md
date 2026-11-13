# Eneba Intern Assignment 2027 — Key Notes

Source: `Eneba Internship Assignment.pdf`

## ⚠️ Hard rules (no evaluation without these)
- [ ] **Deadline: 7 days** from receiving the assignment. Reply to the *registration email* with results.
- [ ] **GitHub link(s)** to the project.
- [ ] **Public deployed URL** on a free tier (Render, Vercel, etc.).
- [ ] **Full agent chat history** (prompts + responses) as `.md` file or chat link. 👉 Save logs from day one.

## 🎯 What they're really grading
- **How you use AI** — agentic coding is *strongly encouraged*.
- **You must be able to explain every line** of your code.
- **Scope is yours, but you must justify it.** Specs are vague on purpose; shortcuts allowed.
- ⭐ **"A few features done extensively beat many minimal ones."** Depth > breadth.

## 🛠 Tech stack (required)
| Layer | Requirement |
|---|---|
| Frontend | **React**, TypeScript preferred |
| Backend | **PHP (or Go)**, REST or GraphQL |
| Database | Any — you design the data model |

## 🧩 Features to build
1. **Store / catalog** — browse all products; **filters** (platform, region, price), **sorting**, **search by name**.
2. **Homepage** — built from **blocks** (banner, best sellers, deals…).
   ⭐ Each block gets data from **its own backend service/DB**. **Nothing hardcoded in frontend.**
3. **Search** — available **from anywhere** (global header search).
   ⭐ Must handle **typos + partial names** (fuzzy search).
4. **Product page** — product details + **offers from multiple sellers** to compare.
5. **Checkout** — cart → pay → **receive digital key**. Payment simulated or provider **test mode** (e.g. Stripe test). No real money.
6. **Auth** — sign up / sign in. ⭐ **Checkout + order history require login.**
7. **Eneba styling** — look & feel of eneba.com: colors, typography, spacing, components. Applies to **every screen**.

## 🔀 User flow (from diagram)
```
Homepage ─┐
          ├─► Product page ─► Cart ─► Checkout ──(sign-in required)──► Payment ─► Order + key
Search ───┘
```

## 💡 Decisions to make & justify (write them in README)
- Data model: products, platforms, regions, sellers, offers (seller × product × price), users, cart, orders, keys.
- Fuzzy search approach (e.g. Postgres `pg_trgm`, MySQL FULLTEXT + Levenshtein, or Meilisearch).
- How "separate backend per homepage block" is done (separate endpoints/tables per block vs. separate services).
- Payment: simulated vs. Stripe test mode.
- Which features you go *deep* on, and what you cut.
- Hosting: free-tier frontend (Vercel) + PHP/Go backend + DB (Render / Neon / etc.).
