# Want to fix

Issues noticed along the way, parked so they don't grow the current feature's scope. Pick from here in the styling pass or when time is left.

## Open

| # | Issue | Where | Fix idea | Found |
|---|---|---|---|---|
| 2 | Header search keeps the typed text after clicking a dropdown result (it only syncs with `/store?q=`, so leaving a store page without `q` doesn't clear it) | `frontend/src/components/SearchBox.tsx` | Clear the box when a result is clicked, or decide that keeping it is fine (Eneba keeps it) | Product page check, Day 2 |

## Fixed

| # | Issue | Fix | When |
|---|---|---|---|
| 1 | Placeholder covers were the card's color (`#1f0a4d`) and blended in | Data migration `lighten_placeholder_covers` (+ seeder) switches covers to `#351183`; runs on deploy | Styling pass, Day 2 |
| 3 | Banner image text overlapped the overlay title | Overlay shows only the subtitle + "Shop now" (title is already in the image). Later superseded: banners now use text-free Steam hero art and the overlay shows the title again | Styling pass, Day 2 |
| 5 | The cart never re-checked stock | `GET /api/offers?ids=` + `useLiveCart()`: cart and checkout refresh price + stock on open/focus, lower quantities above stock with a notice, flag sold-out lines and block checkout until removed | Day 3 extras |
| 4 | Loading states were plain "Loading…" text | `components/Skeleton.tsx`: card grid, banner, row, product-page and order skeletons in the real layouts (shared grid constants; skeleton card within 4 px of a real one), pulse off under "reduce motion", screen readers hear "Loading" once | Day 3 extras |
