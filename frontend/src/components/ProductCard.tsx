import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { euro, type Product } from '../api'
import { toCartItem, useCart } from '../cart'
import Cover from './Cover'

/**
 * Eneba-style product tile: cover, platform, title, region, old price + discount, price.
 * Buttons can't live inside a link (invalid HTML, confusing for screen readers), so the card is a box
 * with two links (cover, text) and a separate button bar over the bottom of the cover.
 */
export default function ProductCard({ product: p }: { product: Product }) {
  const url = `/product/${p.slug}`
  const buyable = p.cheapest_offer && p.price_cents !== null

  return (
    <div className="group flex flex-col bg-surface-dark shadow-black/40 transition focus-within:-translate-y-1 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        {/* Same destination as the title link below: hidden from keyboard and screen readers to avoid a duplicate stop. */}
        <Link to={url} tabIndex={-1} aria-hidden>
          <Cover src={p.image_url} name={p.name} className="aspect-[3/4] w-full" />
        </Link>
        {buyable && <CardActions product={p} />}
      </div>
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
    </div>
  )
}

/**
 * "Add to cart" / "Buy now" for the offer behind the card's "From" price.
 * Desktop: fades in on hover or keyboard focus. Touch screens (no hover): always visible.
 */
function CardActions({ product: p }: { product: Product }) {
  const offer = p.cheapest_offer!
  const add = useCart((s) => s.add)
  const navigate = useNavigate()
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
    <div className="absolute inset-x-0 bottom-0 flex gap-1.5 bg-gradient-to-t from-black/85 to-transparent p-2 pt-6 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
      <button onClick={addToCart} aria-live="polite" className="flex-1 bg-accent py-2 text-xs font-extrabold text-black hover:brightness-110">
        {status === 'added' ? 'Added ✓' : status === 'max' ? 'Max in cart' : 'Add to cart'}
      </button>
      <button onClick={() => { add(item); navigate('/cart') }} className="flex-1 bg-white py-2 text-xs font-extrabold text-black hover:bg-soft">
        Buy now
      </button>
    </div>
  )
}
