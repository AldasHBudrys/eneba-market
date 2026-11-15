import { useQuery } from '@tanstack/react-query'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, euro, type Offer, type Product } from './api'

export const MAX_QUANTITY = 10

/** One cart line = one seller's offer. Stock and price are refreshed from the server whenever the cart or checkout opens. */
export type CartItem = {
  offer_id: number
  quantity: number
  stock: number // 0 = sold out (line stays visible, checkout blocked until removed)
  price_cents: number
  seller: string
  product: { slug: string; name: string; platform: string; region: string; image_url: string }
}

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'quantity'>) => void
  setQuantity: (offerId: number, quantity: number) => void
  remove: (offerId: number) => void
  clear: () => void
  /** Apply the server's current price + stock; lowers quantities above the stock. Returns what changed, for the notice. */
  refresh: (live: Pick<Offer, 'id' | 'price_cents' | 'stock'>[]) => string[]
}

const cap = (quantity: number, stock: number) => Math.max(1, Math.min(quantity, stock, MAX_QUANTITY))

/** The cart lives in the browser (saved to localStorage): guests can fill it, and checkout sends only offer ids + quantities. */
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.offer_id === item.offer_id)
          return existing
            ? { items: s.items.map((i) => (i === existing ? { ...i, quantity: cap(i.quantity + 1, item.stock) } : i)) }
            : { items: [...s.items, { ...item, quantity: 1 }] }
        }),
      setQuantity: (offerId, quantity) =>
        set((s) => ({ items: s.items.map((i) => (i.offer_id === offerId ? { ...i, quantity: cap(quantity, i.stock) } : i)) })),
      remove: (offerId) => set((s) => ({ items: s.items.filter((i) => i.offer_id !== offerId) })),
      clear: () => set({ items: [] }),
      refresh: (live) => {
        const byId = new Map(live.map((o) => [o.id, o]))
        const notes: string[] = []
        const items = get().items.map((i) => {
          const o = byId.get(i.offer_id) ?? { price_cents: i.price_cents, stock: 0 } // missing = offer removed: treat as sold out
          const name = i.product.name
          if (o.stock === 0) {
            if (i.stock !== 0) notes.push(`${name}: sold out. Remove it to continue.`)
            return { ...i, stock: 0 }
          }
          if (o.price_cents !== i.price_cents) notes.push(`${name}: price is now ${euro(o.price_cents)}.`)
          if (i.quantity > o.stock) notes.push(`${name}: only ${o.stock} left, quantity lowered to ${o.stock}.`)
          return { ...i, price_cents: o.price_cents, stock: o.stock, quantity: Math.min(i.quantity, o.stock) }
        })
        set({ items })
        return notes
      },
    }),
    { name: 'cart' },
  ),
)

/**
 * Re-checks the cart against the server on page open and when the window regains focus.
 * The result is the list of changes to show; `blocked` = a sold-out line is in the cart.
 */
export function useLiveCart() {
  const items = useCart((s) => s.items)
  const ids = items.map((i) => i.offer_id).sort((a, b) => a - b).join(',')
  const check = useQuery({
    queryKey: ['cart-offers', ids],
    queryFn: async () => useCart.getState().refresh((await api<{ data: Offer[] }>(`offers?ids=${ids}`)).data),
    enabled: ids !== '',
    staleTime: 0,
  })
  return { notes: check.data ?? [], blocked: items.some((i) => i.stock === 0) }
}

/** Builds a cart line from a product + one of its offers. Shared by the product page and the card buttons. */
export const toCartItem = (
  p: Product,
  o: { id: number; seller: { name: string }; stock: number; price_cents: number },
): Omit<CartItem, 'quantity'> => ({
  offer_id: o.id,
  stock: o.stock,
  price_cents: o.price_cents,
  seller: o.seller.name,
  product: { slug: p.slug, name: p.name, platform: p.platform.name, region: p.region.name, image_url: p.image_url },
})

/** Sold-out lines don't count: they can't be bought. */
export const cartTotal = (items: CartItem[]) => items.reduce((sum, i) => sum + (i.stock > 0 ? i.price_cents * i.quantity : 0), 0)
export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0)
