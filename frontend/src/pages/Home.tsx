import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { api, type Banner, type Deal, type HomeBlock, type Product } from '../api'
import ProductCard from '../components/ProductCard'

type BlockProps = { title: string | null; endpoint: string }

/** Block type (from the API) → component. A type missing here is skipped, so new rows in home_blocks can't break the page. */
const BLOCKS: Record<string, (props: BlockProps) => ReactNode> = {
  banners: BannerBlock,
  deals: DealsBlock,
  bestsellers: ProductRowBlock,
}

/** The homepage renders whatever /api/homepage lists, in that order. Nothing about which blocks exist is hardcoded here. */
export default function Home() {
  const layout = useQuery({ queryKey: ['homepage'], queryFn: () => api<{ data: HomeBlock[] }>('homepage').then((r) => r.data) })

  if (layout.isError)
    return (
      <div className="py-24 text-center">
        <p>Couldn't load the homepage.</p>
        <button onClick={() => layout.refetch()} className="mt-4 bg-accent px-5 py-2 font-extrabold text-black">Retry</button>
      </div>
    )
  if (!layout.data) return <p className="py-24 text-center text-muted">Loading…</p>

  return (
    <div className="flex flex-col gap-10">
      {layout.data.map((block) => {
        const Block = BLOCKS[block.type]
        return Block ? <Block key={block.type} title={block.title} endpoint={block.endpoint} /> : null
      })}
    </div>
  )
}

/** Each block fetches its own endpoint, so one slow or failing block doesn't hold up the others. */
function useBlock<T>(endpoint: string) {
  return useQuery({ queryKey: ['block', endpoint], queryFn: () => api<{ data: T[] }>(endpoint).then((r) => r.data) })
}

function BlockState({ title, failed }: { title: string | null; failed: boolean }) {
  return <p className="py-8 text-center text-sm text-muted">{failed ? `Couldn't load ${title ?? 'this section'}.` : 'Loading…'}</p>
}

function BannerBlock({ title, endpoint }: BlockProps) {
  const banners = useBlock<Banner>(endpoint)
  if (!banners.data) return <BlockState title={title} failed={banners.isError} />
  const [main, ...side] = banners.data

  const tile = (b: Banner, big: boolean) => (
    <Link key={b.title} to={b.link_url} className="group relative block overflow-hidden">
      <img src={b.image_url} alt="" className={`w-full object-cover transition group-hover:scale-105 ${big ? 'aspect-[3/1]' : 'aspect-[3/1] md:aspect-auto md:h-full'}`} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className={`font-extrabold ${big ? 'text-2xl' : 'text-lg'}`}>{b.title}</div>
        {b.subtitle && <div className="text-sm">{b.subtitle}</div>}
      </div>
    </Link>
  )

  return (
    <section aria-label={title ?? 'Featured'} className="grid gap-3 md:grid-cols-[2fr_1fr]">
      {main && tile(main, true)}
      {side.length > 0 && <div className="grid gap-3" style={{ gridTemplateRows: `repeat(${side.length}, 1fr)` }}>{side.map((b) => tile(b, false))}</div>}
    </section>
  )
}

function DealsBlock({ title, endpoint }: BlockProps) {
  const deals = useBlock<Deal>(endpoint)
  const now = useNow()
  if (!deals.data) return <BlockState title={title} failed={deals.isError} />

  return (
    <section>
      <h2 className="mb-4 text-3xl font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {deals.data.map((d) => (
          <div key={d.product.slug} className="flex flex-col">
            <div className="bg-accent px-2 py-1 text-center text-xs font-extrabold text-black">Ends in {countdown(d.ends_at, now)}</div>
            <ProductCard product={d.product} />
          </div>
        ))}
      </div>
    </section>
  )
}

function ProductRowBlock({ title, endpoint }: BlockProps) {
  const products = useBlock<Product>(endpoint)
  if (!products.data) return <BlockState title={title} failed={products.isError} />

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-3xl font-bold">{title}</h2>
        <Link to="/store" className="text-sm font-bold text-accent hover:underline">Show all</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {products.data.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </section>
  )
}

/** Current time, updated every second: one timer drives all countdowns in the block. */
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}

/** ISO end time → "2d 04:12:09" (Eneba's DD HH MM SS countdown). */
function countdown(endsAt: string, now: number) {
  const s = Math.max(0, Math.floor((new Date(endsAt).getTime() - now) / 1000))
  if (s === 0) return 'ended'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${Math.floor(s / 86400)}d ${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}
