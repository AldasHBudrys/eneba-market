# Want to fix

Issues noticed along the way, parked so they don't grow the current feature's scope. Pick from here in the styling pass or when time is left.

| # | Issue | Where | Fix idea | Found |
|---|---|---|---|---|
| 1 | Placeholder covers are the same dark color as the card (`#1f0a4d`), so the image area blends into the card body | `frontend/src/components/ProductCard.tsx` (or `CatalogSeeder` cover URL) | Give the image area its own background/border in `ProductCard` (1 line). Changing the seeder color also works but the live DB won't re-seed on its own | Store page check, Day 2 |
| 2 | Header search keeps the typed text after clicking a dropdown result (it only syncs with `/store?q=`, so leaving a store page without `q` doesn't clear it) | `frontend/src/components/SearchBox.tsx` | Clear the box when a result is clicked, or decide that keeping it is fine (Eneba keeps it) | Product page check, Day 2 |
| 3 | Placeholder banner images have their title baked in, so on the side banner tiles the image text overlaps the title/subtitle overlay | `HomepageSeeder` banner URLs / `frontend/src/pages/Home.tsx` (`BannerBlock`) | Use text-free placeholder images (data change; live DB needs a one-off update), or drop the overlay title when the image already shows it | Homepage check, Day 2 |
