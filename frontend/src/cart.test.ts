import { beforeEach, describe, expect, it } from 'vitest'
import { euro } from './api'
import { cartCount, cartTotal, MAX_QUANTITY, useCart, type CartItem } from './cart'

const line = (offer_id: number, stock: number, price_cents = 1000): Omit<CartItem, 'quantity'> => ({
  offer_id,
  stock,
  price_cents,
  seller: 'Seller A',
  product: { slug: `game-${offer_id}`, name: `Game ${offer_id}`, platform: 'Steam', region: 'Global', image_url: '' },
})
const items = () => useCart.getState().items

beforeEach(() => useCart.getState().clear())

describe('cart quantities', () => {
  it('adding the same offer again raises the quantity, capped at stock', () => {
    const { add } = useCart.getState()
    add(line(1, 2))
    add(line(1, 2))
    add(line(1, 2)) // only 2 keys exist
    expect(items()).toHaveLength(1)
    expect(items()[0].quantity).toBe(2)
  })

  it('caps typed quantities between 1 and min(stock, MAX_QUANTITY)', () => {
    const { add, setQuantity } = useCart.getState()
    add(line(1, 50))
    setQuantity(1, 99)
    expect(items()[0].quantity).toBe(MAX_QUANTITY)
    setQuantity(1, 0)
    expect(items()[0].quantity).toBe(1)
  })
})

describe('refresh from the server', () => {
  it('follows the new price, lowers quantity above stock and reports both', () => {
    const { add, setQuantity, refresh } = useCart.getState()
    add(line(1, 5, 1000))
    setQuantity(1, 4)
    const notes = refresh([{ id: 1, price_cents: 1200, stock: 2 }])
    expect(items()[0]).toMatchObject({ price_cents: 1200, stock: 2, quantity: 2 })
    expect(notes).toEqual([`Game 1: price is now ${euro(1200)}.`, 'Game 1: only 2 left, quantity lowered to 2.'])
  })

  it('marks an offer missing from the response as sold out, and says so only once', () => {
    const { add, refresh } = useCart.getState()
    add(line(1, 3))
    expect(refresh([])).toEqual(['Game 1: sold out. Remove it to continue.'])
    expect(items()[0].stock).toBe(0)
    expect(refresh([])).toEqual([]) // already known: no repeated notice
  })
})

describe('totals', () => {
  const lines: CartItem[] = [
    { ...line(1, 5, 1000), quantity: 2 },
    { ...line(2, 0, 9999), quantity: 1 }, // sold out
  ]

  it('total skips sold-out lines (they cannot be bought)', () => {
    expect(cartTotal(lines)).toBe(2000)
  })

  it('count includes every line (shown on the header badge)', () => {
    expect(cartCount(lines)).toBe(3)
  })

  it('euro() formats integer cents', () => {
    expect(euro(1729)).toBe('€17.29')
  })
})
