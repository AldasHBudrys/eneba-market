import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { api, euro, filtersQuery, type Page, type Product } from '../api'
import ProductCard from '../components/ProductCard'

const SORTS = [
  ['popular', 'Popularity: Most popular'],
  ['price_asc', 'Price: Low to High'],
  ['price_desc', 'Price: High to Low'],
  ['newest', 'Date: Newest First'],
  ['oldest', 'Date: Oldest First'],
  ['name_asc', 'Alphabet: A-Z'],
  ['name_desc', 'Alphabet: Z-A'],
]

/**
 * The URL query uses the API's own parameter names (q, platform, region, min_price, max_price, sort, page),
 * so the page forwards it to /api/products unchanged. Changing a filter = changing the URL.
 */
export default function Store() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q')

  const filters = useQuery(filtersQuery)
  const products = useQuery({
    queryKey: ['products', params.toString()],
    queryFn: () => api<Page<Product>>(`products?${params}`),
    placeholderData: keepPreviousData, // keep showing the old grid while the new one loads
  })

  /** Set or remove one URL param. Any filter change goes back to page 1. */
  const set = (key: string, value: string | null) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page')
      return next
    })
  const selected = (key: string) => params.get(key)?.split(',').filter(Boolean) ?? []
  const toggle = (key: string, slug: string) => {
    const current = selected(key)
    set(key, (current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]).join(',') || null)
  }
  const applyPrice = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const toCents = (field: string) => (form.get(field) ? String(Math.round(Number(form.get(field)) * 100)) : null)
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [field, value] of [['min_price', toCents('min')], ['max_price', toCents('max')]] as const) {
        if (value) next.set(field, value)
        else next.delete(field)
      }
      next.delete('page')
      return next
    })
  }

  const nameOf = (list: 'platforms' | 'regions', slug: string) => filters.data?.[list].find((x) => x.slug === slug)?.name ?? slug
  const tags = [
    ...(q ? [{ label: `Text: ${q}`, remove: () => set('q', null) }] : []),
    ...selected('platform').map((s) => ({ label: nameOf('platforms', s), remove: () => toggle('platform', s) })),
    ...selected('region').map((s) => ({ label: nameOf('regions', s), remove: () => toggle('region', s) })),
    ...(params.get('min_price') ? [{ label: `From ${euro(Number(params.get('min_price')))}`, remove: () => set('min_price', null) }] : []),
    ...(params.get('max_price') ? [{ label: `To ${euro(Number(params.get('max_price')))}`, remove: () => set('max_price', null) }] : []),
  ]
  const centsToEuro = (key: string) => (params.get(key) ? Number(params.get(key)) / 100 : '')

  return (
    <div>
      <title>{`${q ? `Results for "${q}"` : 'Store'} | eneba market`}</title>
      <h1 className="mb-6 text-3xl font-bold">{q ? `Results for "${q}"` : 'Store'}</h1>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-6 self-start bg-surface-dark p-4">
          <form onSubmit={applyPrice} key={`${params.get('min_price')}-${params.get('max_price')}`}>
            <h2 className="mb-2 font-bold">Price range (EUR)</h2>
            <div className="flex items-center gap-2">
              <input name="min" type="number" min="0" step="0.01" placeholder="Min" aria-label="Minimum price in euros"
                defaultValue={centsToEuro('min_price')} className="w-full bg-surface px-2 py-1.5" />
              <span>–</span>
              <input name="max" type="number" min="0" step="0.01" placeholder="Max" aria-label="Maximum price in euros"
                defaultValue={centsToEuro('max_price')} className="w-full bg-surface px-2 py-1.5" />
            </div>
            <button className="mt-2 w-full bg-accent py-1.5 text-sm font-extrabold text-black">Apply</button>
          </form>

          {(['platform', 'region'] as const).map((key) => (
            <fieldset key={key}>
              <legend className="mb-2 font-bold">{key === 'platform' ? 'Platforms' : 'Regions'}</legend>
              {filters.data?.[`${key}s`].map((option) => (
                <label key={option.slug} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                  <input type="checkbox" className="size-4 accent-accent" checked={selected(key).includes(option.slug)}
                    onChange={() => toggle(key, option.slug)} />
                  {option.name}
                </label>
              ))}
            </fieldset>
          ))}
        </aside>

        <section>
          {tags.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <button key={t.label} onClick={t.remove} className="bg-surface-dark px-3 py-1 text-sm hover:bg-surface"
                  aria-label={`Remove filter ${t.label}`}>
                  {t.label} ✕
                </button>
              ))}
              <button onClick={() => setParams({})} className="text-sm text-accent hover:underline">Clear all</button>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm">
              Results found: <b>{products.data?.meta.total ?? '…'}</b>
            </span>
            <select aria-label="Sort" value={params.get('sort') ?? (q ? '' : 'popular')} onChange={(e) => set('sort', e.target.value || null)}
              className="bg-surface-dark px-3 py-2 text-sm font-semibold">
              {q && <option value="">Best match</option>}
              {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          {products.isError && !products.data ? (
            <div className="py-16 text-center">
              <p>Couldn't load products.</p>
              <button onClick={() => products.refetch()} className="mt-4 bg-accent px-5 py-2 font-extrabold text-black">Retry</button>
            </div>
          ) : !products.data ? (
            <p className="py-16 text-center text-muted">Loading products…</p>
          ) : products.data.meta.total === 0 ? (
            <div className="py-16 text-center">
              <p className="text-xl font-bold">Sorry, no matches found</p>
              <p className="mt-1 text-sm text-muted">Check your spelling or try fewer filters.</p>
              <button onClick={() => setParams({})} className="mt-4 bg-accent px-5 py-2 font-extrabold text-black">Clear filters</button>
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${products.isPlaceholderData ? 'opacity-60' : ''}`}>
                {products.data.data.map((p) => <ProductCard key={p.slug} product={p} />)}
              </div>
              {/* shortcut: one button per page; fine for 3 pages, needs "1 2 … 50" truncation for a big catalog */}
              <nav aria-label="Pages" className="mt-6 flex justify-center gap-2">
                {Array.from({ length: products.data.meta.last_page }, (_, i) => i + 1).map((n) => (
                  <button key={n} aria-current={n === products.data.meta.current_page ? 'page' : undefined}
                    onClick={() => { set('page', n === 1 ? null : String(n)); window.scrollTo(0, 0) }}
                    className={`size-9 font-bold ${n === products.data.meta.current_page ? 'bg-accent text-black' : 'bg-surface-dark hover:bg-surface'}`}>
                    {n}
                  </button>
                ))}
              </nav>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
