import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MAX_QUANTITY = 10

/** One cart line = one seller's offer. The display fields are a snapshot; the server re-prices everything at checkout. */
export type CartItem = {
  offer_id: number
  quantity: number
  stock: number // stock when added, used to cap the quantity buttons; the server re-checks
  price_cents: number // shortcut: price when added; the server charges the current price (prices never change in this demo)
  seller: string
  product: { slug: string; name: string; platform: string; region: string; image_url: string }
}

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'quantity'>) => void
  setQuantity: (offerId: number, quantity: number) => void
  remove: (offerId: number) => void
  clear: () => void
}

const cap = (quantity: number, stock: number) => Math.max(1, Math.min(quantity, stock, MAX_QUANTITY))

/** The cart lives in the browser (saved to localStorage): guests can fill it, and checkout sends only offer ids + quantities. */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
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
    }),
    { name: 'cart' },
  ),
)

export const cartTotal = (items: CartItem[]) => items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0)
export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0)
