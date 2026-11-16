import { useState } from 'react'
import { Link } from 'react-router'
import { euro, type Product } from '../api'
import { toCartItem, useCart } from '../cart'
import Cover from './Cover'

/**
 * Eneba-style product tile: cover, platform, title, region, old price + discount, price.
 * Buttons can't live inside a link (invalid HTML, confusing for screen readers), so the card is a box
 * with two links (cover, text) and the buttons beside them.
 *
 * Hover (like eneba.com): the text panel slides up over the bottom of the cover and reveals the buttons under the price.
 * The buttons are 92 px tall; a -92 px bottom margin keeps them out of the card's height and overflow-hidden hides them,
 * so the grid never jumps. Touch screens (no hover) skip the trick: the buttons always sit under the price.
 */
export default function ProductCard({ product: p }: { product: Product }) {
  const url = `/product/${p.slug}`
  const buyable = p.cheapest_offer && p.price_cents !== null
  const slide = '[@media(hover:hover)]:-mb-[92px] [@media(hover:hover)]:group-hover:-translate-y-[92px] [@media(hover:hover)]:group-focus-within:-translate-y-[92px]'

  return (
    <div className="group flex flex-col overflow-hidden bg-surface-dark shadow-black/40 transition focus-within:-translate-y-1 hover:-translate-y-1 hover:shadow-lg">
      {/* Same destination as the title link below: hidden from keyboard and screen readers to avoid a duplicate stop. */}
      <Link to={url} tabIndex={-1} aria-hidden>
        <Cover src={p.image_url} name={p.name} className="aspect-[3/4] w-full" />
      </Link>
      <div className={`relative flex flex-1 flex-col bg-surface-dark transition-transform duration-200 motion-reduce:transition-none ${buyable ? slide : ''}`}>
        <Link to={url} className="flex flex-1 flex-col gap-1 p-3">
          <span className="text-xs text-muted">{p.platform.name}</span>
          <h3 className="line-clamp-2 text-sm font-bold group-hover:underline">
            {p.name} {p.platform.name} Key {p.region.name.toUpperCase()}
          </h3>
          <span className="text-xs font-semibold uppercase text-cashback">{p.region.name}</span>
          <div className="mt-auto pt-2">
            {p.price_cents === null ? (
              <span className="font-bold text-muted">Sold out</span>
            ) : (
              <>
                <div className="text-xs text-muted">
                  From{' '}
                  {p.discount_percent ? (
                    <>
                      <s>{euro(p.rrp_cents)}</s> <span className="font-semibold text-discount">-{p.discount_percent}%</span>
                    </>
                  ) : null}
                </div>
                <div className="text-xl font-extrabold">{euro(p.price_cents)}</div>
              </>
            )}
          </div>
        </Link>
        {buyable && <CardActions product={p} />}
      </div>
    </div>
  )
}

/**
 * "Add to cart" for the offer behind the card's "From" price, and "View offers" (the product page, every seller), like eneba.com.
 * Stacked full width, 92 px tall in total (2 × 36 px + 8 px gap + 12 px padding): ProductCard's slide distance depends on it.
 */
function CardActions({ product: p }: { product: Product }) {
  const offer = p.cheapest_offer!
  const add = useCart((s) => s.add)
  const [status, setStatus] = useState<'idle' | 'added' | 'max'>('idle')

  const item = toCartItem(p, { ...offer, price_cents: p.price_cents! })
  const inCart = () => useCart.getState().items.find((i) => i.offer_id === offer.id)?.quantity ?? 0

  const addToCart = () => {
    const before = inCart()
    add(item)
    setStatus(inCart() > before ? 'added' : 'max') // the cart caps at stock / 10, so "added" must be checked, not assumed
    setTimeout(() => setStatus('idle'), 1500)
  }

  return (
    <div className="flex h-[92px] flex-col gap-2 px-3 pb-3">
      <button onClick={addToCart} aria-live="polite" className="h-9 bg-accent text-sm font-extrabold text-black hover:brightness-110">
        {status === 'added' ? 'Added ✓' : status === 'max' ? 'Max in cart' : 'Add to cart'}
      </button>
      <Link to={`/product/${p.slug}`} className="flex h-9 items-center justify-center border-2 border-white text-sm font-extrabold text-white hover:bg-white/10">
        View offers
      </Link>
    </div>
  )
}
