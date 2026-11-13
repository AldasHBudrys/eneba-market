# eneba.com — Walkthrough Findings (2026-11-13)

What I tested: homepage, header search (typo + partial), store filters/sort, product page, cart/checkout (stopped before entering an email, test item removed), login page.

## 🎨 Design tokens (measured from computed styles)

| Token | Value | Used for |
|---|---|---|
| `bg` | `#4618AC` (rgb 70,24,172) | Page background |
| `surface-dark` | `#1F0A4D` | Header bar, cards, panels, dark text on light |
| `surface` | `#351183` | Secondary panels |
| `surface-light` | `#7A4EDF` | Hover / dropdown rows |
| `accent` ⭐ | `#FAD318` (yellow) | Primary buttons: "Add to cart", "Buy now", links like "Clear all" |
| `cashback` | `#63E3C2` (teal) | "CASHBACK" badge on cards |
| `success` | `#23C299` | "Instant delivery", checkout step 1 |
| `discount` | `#84E916` (lime) | "-67%", cashback amounts |
| `text` | `#FFFFFF` | Main text |
| `text-muted` | `#B3AAC9` | Old/strikethrough price, secondary text |

- **Font:** `Metropolis` (weights 400 / 600 / 800), fallback Arial. Free/OFL — e.g. `@fontsource/metropolis`.
- **Headings:** section titles 30px / 700, white.
- **Buttons:** square corners (**border-radius 0**), yellow bg, **black** text, 15px / 800, ~35px tall.
- **Corners:** almost everything is square; only a few 5px radii.
- **Header:** logo · big search box (outlined) · language/currency · wishlist ♡ · cart · "Log in | Register". Below: nav bar (Categories, Cheap Games, Software, eGift Cards…).

## 🏠 Homepage blocks (top → bottom)
1. **Hero banner** — 1 big + 3 smaller promo tiles (GTA VI, "Games -90%", Phantom Blade, Software).
2. **Countdown widget** — "Ends in: DD HH MM SS" promo (floating, closable).
3. **Category icon strip** — Games, Gaming eCards, eGift Cards, Steam, PSN, Xbox… (carousel).
4. **Product carousels**: Recommended for you · Top games · Best selling eGift Cards · Best selling gift cards · Upcoming games — each with "Show all".
5. Categories grid + "Load more", SEO text, footer.

## 🃏 Product card anatomy (reused everywhere)
Image (cover) → "CASHBACK" badge → platform icon + name (Steam/GOG/PSN) → title → **region** (GLOBAL / EUROPE, colored) → `From €49.99 -67%` (strikethrough + %) → **big price €16.32** → cashback line → hover: "Add to cart" + "View offers" + wishlist ♡.

## 🔍 Search
- Header search opens an **overlay dropdown**: 5 query suggestions + product rows (image, "Digital good" tag, title, `From` old price, price).
- **Partial works**: "witch" → Witcher 3, Witch Queen, Blair Witch…
- ⭐ **Typos do NOT work**: "wichter 3" → "Sorry, no matches found" + "View popular products" button (ghost icon empty state).
  → **Our pg_trgm fuzzy search would beat Eneba here — good talking point.**
- Enter → goes to the store page with `?text=witch`.

## 🛒 Store / catalog (`/store/all`)
- Left sidebar filters, each with **result counts**: Price range (min–max EUR), Country, Product type (Game, DLC, eGift Card…), OS, **Platforms** (Steam, Xbox, GOG…), Genres, **Regions** (Europe, Global, US…). "N more" expanders.
- Active filters shown as **chips** ("Text: witch ✕") + "Clear all".
- "Results found: 1000+", grid of cards, numbered pagination (1 2 3 … 50).
- **Sort options:** Price low→high, Price high→low, Date newest, Date oldest, Most popular (default), A–Z, Z–A.
- ⭐ **All state lives in the URL**: `/store/all?drms[]=steam&sortBy=PRICE_ASC&text=witch` → shareable, back button works.

## 📦 Product page (`/{platform}-{name}-{region}` slug)
- Breadcrumbs → cover image + title + wishlist count.
- Info rows with icons: region ("Can be activated in Lithuania"), platform (activate on GOG.com), "Digital key – Instant delivery", "Instant refunds".
- **Right column "Featured offer"**: old price, -%, price, cashback, **Buy now**, "+14 offers from €15.17".
- ⭐ **Offer list**: each seller row = **seller name + rating (9.91 "Superb")** + old price + -% + price + cashback + Buy now. Top 5 shown, "Load 11 more offers". Lowest price ≠ always featured (featured = "Verified by Eneba").
- Below: "Gamers also viewed", reviews (34, sub-scores Gameplay/Story/Graphics/Soundtrack), genre tags, description, system requirements, release date, publisher, languages.

## 💳 Cart / checkout (`/checkout`)
- **3-step progress bar**: ① Cart → ② Payment → ③ Get your product. Header is stripped down (logo + steps only).
- Cart row: "Sold by {seller}", title, quantity − 1 +, price, cashback, ♡, 🗑.
- Right: "Where to deliver the order?" **email** field → Summary (products, service fee, total, cashback) → **Proceed to checkout**. Discount code input.
- Eneba allows **guest checkout by email**. ⚠️ Our spec requires sign-in for checkout — keep our rule, note the difference.
- "Buy now" on a seller row adds **that specific offer** to the cart and jumps straight to `/checkout`.

## 🔐 Auth (`my.eneba.com/login`)
- Separate subdomain, split layout: big "Hi! It's nice to see you!" left, purple form card right.
- Social login (Google, Facebook, Apple, Steam, Discord, Twitch, X) + **email magic link** (no password).
- → We'll do **email + password** (simpler, no email service needed). Copy the visual layout.

## ✅ What this changes in PLAN.md
- Add **Metropolis font + tokens above** to Tailwind config; buttons square + yellow.
- Store filters: price range, platform, region (+ maybe genre); filter **counts** and **chips** are cheap wins.
- Store sort: match Eneba's 7 options (or the 4 that matter: price ↑↓, newest, popular).
- Product page offers: add **seller rating** (already in `sellers.rating`) and **old price / discount %** → add `products.rrp_cents`.
- Checkout: mirror the **3-step bar**; step ③ shows the keys.
- Search dropdown: suggestions + product rows; empty state with "View popular products".

## Skipped
- Didn't accept cookies, sign in, enter an email or pay. Didn't test wishlist, reviews, cashback, mobile layout.
