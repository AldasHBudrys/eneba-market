import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { api, ApiError, euro, type Offer, type ProductDetail } from '../api'
import NotFound from '../components/NotFound'

/** Seller rating → Eneba-style label (their examples: 9.91 Superb, 9.63 Excellent). */
const ratingLabel = (r: number) => (r >= 9.8 ? 'Superb' : r >= 9.5 ? 'Excellent' : r >= 9 ? 'Very good' : 'Good')
const discount = (price: number, rrp: number) => Math.round(100 - (price * 100) / rrp)

// Placeholder until the cart exists (Day 3): the button is in its final place but does nothing yet.
function BuyButton({ wide = false }: { wide?: boolean }) {
  return (
    <button disabled title="Cart arrives on Day 3"
      className={`bg-accent px-5 py-2 font-extrabold text-black disabled:cursor-not-allowed disabled:opacity-60 ${wide ? 'w-full py-3' : ''}`}>
      Buy now
    </button>
  )
}

export default function Product() {
  const { slug = '' } = useParams()
  const product = useQuery({
    queryKey: ['product', slug],
    // Laravel wraps a single resource as {"data": {...}}
    queryFn: () => api<{ data: ProductDetail }>(`products/${encodeURIComponent(slug)}`).then((r) => r.data),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 3, // a 404 won't fix itself
  })

  if (product.error instanceof ApiError && product.error.status === 404) return <NotFound title="Product not found" />
  if (product.isError)
    return (
      <div className="py-24 text-center">
        <p>Couldn't load this product.</p>
        <button onClick={() => product.refetch()} className="mt-4 bg-accent px-5 py-2 font-extrabold text-black">Retry</button>
      </div>
    )
  if (!product.data) return <p className="py-24 text-center text-muted">Loading product…</p>

  const p = product.data
  const title = `${p.name} ${p.platform.name} Key ${p.region.name.toUpperCase()}`
  const buyable = p.offers.filter((o) => o.stock > 0)
  const [featured, ...others] = buyable // offers arrive cheapest-buyable first, so the first is the cheapest

  return (
    <article>
      <title>{`${title} | eneba market`}</title>

      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link to="/store" className="hover:text-white">Store</Link> ›{' '}
        <Link to={`/store?platform=${p.platform.slug}`} className="hover:text-white">{p.platform.name}</Link> ›{' '}
        <span className="text-white">{p.name}</span>
      </nav>

      <div className="grid gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr_320px]">
        <img src={p.image_url} alt={p.name} className="aspect-[3/4] w-full max-w-xs object-cover" />

        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          <ul className="mt-6 flex flex-col gap-4 text-sm">
            <li><span aria-hidden>🌍</span> <b>Region: {p.region.name}</b><br /><span className="text-muted">Can be activated in {p.region.name === 'Global' ? 'any country' : p.region.name}</span></li>
            <li><span aria-hidden>🎮</span> <b>{p.platform.name}</b><br /><span className="text-muted">Activate and redeem on {p.platform.name}</span></li>
            <li><span aria-hidden>🔑</span> <b>Digital key</b><br /><span className="text-success">Instant delivery</span></li>
          </ul>
        </div>

        <aside className="self-start bg-surface p-5 md:col-span-2 lg:col-span-1">
          <h2 className="text-xs font-bold uppercase tracking-wide text-accent">Featured offer</h2>
          {featured ? (
            <>
              <div className="mt-3 text-sm text-muted">
                <s>{euro(p.rrp_cents)}</s> <span className="font-semibold text-discount">-{discount(featured.price_cents, p.rrp_cents)}%</span>
              </div>
              <div className="mb-1 text-3xl font-extrabold">{euro(featured.price_cents)}</div>
              <div className="mb-4 text-sm text-muted">Sold by {featured.seller.name}</div>
              <BuyButton wide />
              {others.length > 0 && (
                <a href="#offers" className="mt-3 block text-center text-sm text-accent hover:underline">
                  +{others.length} {others.length === 1 ? 'offer' : 'offers'} from {euro(Math.min(...others.map((o) => o.price_cents)))}
                </a>
              )}
            </>
          ) : (
            <p className="mt-3 text-2xl font-extrabold text-muted">Sold out</p>
          )}
        </aside>
      </div>

      <section id="offers" className="mt-10">
        <h2 className="mb-3 text-xl font-bold">Offers ({p.offers.length})</h2>
        <ul className="flex flex-col gap-2">
          {p.offers.map((o) => <OfferRow key={o.id} offer={o} rrp={p.rrp_cents} />)}
        </ul>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="mb-3 text-xl font-bold">Description</h2>
        <p className="text-sm leading-relaxed">{p.description}</p>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-muted">Genre</dt><dd>{p.genre}</dd>
          <dt className="text-muted">Release date</dt><dd>{new Date(p.release_date).toLocaleDateString('en-GB', { dateStyle: 'long' })}</dd>
        </dl>
      </section>
    </article>
  )
}

function OfferRow({ offer: o, rrp }: { offer: Offer; rrp: number }) {
  const soldOut = o.stock === 0
  return (
    <li className={`flex flex-wrap items-center gap-x-6 gap-y-2 bg-surface-dark p-4 ${soldOut ? 'opacity-50' : ''}`}>
      <div className="min-w-40 flex-1">
        <div className="font-bold">{o.seller.name}</div>
        <div className="text-xs text-muted">{o.seller.rating.toFixed(2)} {ratingLabel(o.seller.rating)} rating</div>
      </div>
      <div className="text-sm text-muted">
        <s>{euro(rrp)}</s> <span className="font-semibold text-discount">-{discount(o.price_cents, rrp)}%</span>
      </div>
      <div className="w-24 text-xl font-extrabold">{euro(o.price_cents)}</div>
      <div className="w-24 text-sm">{soldOut ? 'Sold out' : `${o.stock} in stock`}</div>
      {soldOut ? <span className="w-[6.5rem]" /> : <BuyButton />}
    </li>
  )
}
