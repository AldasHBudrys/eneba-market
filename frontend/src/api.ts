import { useAuth } from './auth'

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

/** GET /api/homepage: which blocks the homepage shows, in order, and where each block loads from. */
export type HomeBlock = { type: string; title: string | null; endpoint: string }
export type Banner = { title: string; subtitle: string | null; image_url: string; link_url: string }
export type Deal = { ends_at: string; product: Product }

/** An order as its owner sees it (backend OrderResource), including the bought key codes. */
export type Order = {
  id: number
  total_cents: number
  created_at: string
  items: {
    id: number
    price_cents: number
    seller: string
    product: { slug: string; name: string; platform: string; region: string }
    code: string
  }[]
}

/** Carries the HTTP status so pages can tell "not found" (404) from "server down". */
export class ApiError extends Error {
  status: number
  /** Laravel's per-field validation messages (422), e.g. { email: ["The email has already been taken."] }. */
  errors: Record<string, string[]>
  constructor(status: number, errors: Record<string, string[]> = {}) {
    super(`API ${status}`)
    this.status = status
    this.errors = errors
  }
}

/**
 * Call /api/{path} (or a full "/api/..." path the API sent us) and parse JSON.
 * Sends the login token when there is one. Throws ApiError on non-2xx so TanStack Query shows the error state.
 */
export async function api<T>(path: string, { method = 'GET', body }: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = useAuth.getState().token
  const res = await fetch(path.startsWith('/api/') ? path : `/api/${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (res.status === 401 && token) useAuth.getState().clear() // token expired or was revoked: log out locally
  if (!res.ok) throw new ApiError(res.status, (await res.json().catch(() => ({}))).errors)
  return res.status === 204 ? (undefined as T) : res.json()
}

const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })

/** 1729 → "€17.29". The only place cents become euros. */
export const euro = (cents: number) => eur.format(cents / 100)
