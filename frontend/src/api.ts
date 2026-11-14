// Types mirror the Laravel API Resources (backend/app/Http/Resources). Prices are integer cents.

export type Named = { slug: string; name: string }

export type Product = {
  slug: string
  name: string
  image_url: string
  platform: Named
  region: Named
  rrp_cents: number
  price_cents: number | null // null = sold out
  discount_percent: number | null
}

export type Offer = {
  id: number
  seller: { name: string; rating: number }
  price_cents: number
  stock: number
}

/** GET /api/products/{slug}: the card fields plus details and every seller's offer (buyable first, cheapest first). */
export type ProductDetail = Product & {
  description: string
  genre: string
  release_date: string
  offers: Offer[]
}

export type Page<T> = {
  data: T[]
  meta: { current_page: number; last_page: number; total: number }
}

export type Filters = {
  platforms: Named[]
  regions: Named[]
  price: { min_cents: number; max_cents: number }
}

/** Carries the HTTP status so pages can tell "not found" (404) from "server down". */
export class ApiError extends Error {
  status: number
  constructor(status: number) {
    super(`API ${status}`)
    this.status = status
  }
}

/** GET /api/{path} and parse JSON. Throws on non-2xx so TanStack Query shows the error state. */
export async function api<T>(path: string): Promise<T> {
  const res = await fetch(`/api/${path}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new ApiError(res.status)
  return res.json()
}

const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })

/** 1729 → "€17.29". The only place cents become euros. */
export const euro = (cents: number) => eur.format(cents / 100)
