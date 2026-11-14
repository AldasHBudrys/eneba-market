# Want to fix

Issues noticed along the way, parked so they don't grow the current feature's scope. Pick from here in the styling pass or when time is left.

| # | Issue | Where | Fix idea | Found |
|---|---|---|---|---|
| 1 | Placeholder covers are the same dark color as the card (`#1f0a4d`), so the image area blends into the card body | `frontend/src/components/ProductCard.tsx` (or `CatalogSeeder` cover URL) | Give the image area its own background/border in `ProductCard` (1 line). Changing the seeder color also works but the live DB won't re-seed on its own | Store page check, Day 2 |
