# Want to fix

Issues noticed along the way, parked so they don't grow the current feature's scope. Pick from here in the styling pass or when time is left.

## Open

| # | Issue | Where | Fix idea | Found |
|---|---|---|---|---|
| 2 | Header search keeps the typed text after clicking a dropdown result (it only syncs with `/store?q=`, so leaving a store page without `q` doesn't clear it) | `frontend/src/components/SearchBox.tsx` | Clear the box when a result is clicked, or decide that keeping it is fine (Eneba keeps it) | Product page check, Day 2 |
| 4 | Loading states are plain "Loading…" text, not skeleton cards | Store grid, homepage rows, product page | A `ProductCardSkeleton` (grey blocks in the card's shape) shown while data loads | Styling plan, Day 2 (skipped on purpose to protect Day 3) |
| 5 | The cart never re-checks stock, so a line whose keys sold out meanwhile stays until checkout says "Only 0 left" and you remove it yourself | `frontend/src/pages/Cart.tsx`, `cart.ts` | On the cart page, fetch current stock per offer and mark/cap sold-out lines | Checkout check, Day 3 |

## Fixed

| # | Issue | Fix | When |
|---|---|---|---|
| 1 | Placeholder covers were the card's color (`#1f0a4d`) and blended in | Data migration `lighten_placeholder_covers` (+ seeder) switches covers to `#351183`; runs on deploy | Styling pass, Day 2 |
| 3 | Banner image text overlapped the overlay title | Overlay shows only the subtitle + "Shop now" (title is already in the image) | Styling pass, Day 2 |
