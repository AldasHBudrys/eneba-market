import { Link } from 'react-router'
import { euro, type Product } from '../api'
import Cover from './Cover'

/** Eneba-style product tile: cover, platform, title, region, old price + discount, price. */
export default function ProductCard({ product: p }: { product: Product }) {
  return (
    <Link to={`/product/${p.slug}`} className="group flex flex-col bg-surface-dark shadow-black/40 transition hover:-translate-y-1 hover:shadow-lg">
      <Cover src={p.image_url} name={p.name} className="aspect-[3/4] w-full" />
      <div className="flex flex-1 flex-col gap-1 p-3">
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
      </div>
    </Link>
  )
}
