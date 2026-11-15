import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { api, euro, type Page, type Product } from '../api'

const MIN_CHARS = 2
const PREVIEW = 5

/** Header search: live dropdown of matching products (typo-tolerant via the API); Enter opens /store?q=. */
export default function SearchBox() {
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const urlQ = pathname === '/store' ? (params.get('q') ?? '') : ''

  const [text, setText] = useState(urlQ)
  const [term, setTerm] = useState(urlQ) // `text` after the user pauses typing
  const [open, setOpen] = useState(false)

  // Keep the box in sync with /store?q= (back button, removing the "Text:" tag, leaving the store).
  // React's "adjust state when a value changes" pattern: compare during render instead of using an effect.
  const [syncedQ, setSyncedQ] = useState(urlQ)
  if (urlQ !== syncedQ) {
    setSyncedQ(urlQ)
    setText(urlQ)
  }

  // Wait for a 250 ms pause in typing before searching, so we don't send a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(text.trim()), 250)
    return () => clearTimeout(timer)
  }, [text])

  const results = useQuery({
    queryKey: ['search', term], // keyed by term: a slow old response can't overwrite newer results
    queryFn: () => api<Page<Product>>(`products?q=${encodeURIComponent(term)}`),
    enabled: open && term.length >= MIN_CHARS,
  })

  const storeUrl = (q: string) => `/store?q=${encodeURIComponent(q)}`
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setOpen(false)
    navigate(storeUrl(text.trim()))
  }
  const close = () => setOpen(false)
  const showDropdown = open && text.trim().length >= MIN_CHARS

  return (
    <form
      role="search"
      onSubmit={submit}
      className="relative w-full"
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && close()} // focus left the search box and its dropdown
      onKeyDown={(e) => e.key === 'Escape' && close()}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 fill-none stroke-current stroke-2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        aria-label="Search products"
        placeholder="Search for games"
        value={text}
        onChange={(e) => { setText(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        className="h-[57px] w-full border border-white/70 bg-transparent px-12 text-[19px] font-extrabold outline-none placeholder:text-muted focus:border-accent"
      />
      {text && (
        <button type="button" aria-label="Clear search" onClick={() => { setText(''); close() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-xl leading-none hover:text-accent">
          ✕
        </button>
      )}

      {showDropdown && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 bg-surface shadow-2xl">
          {results.isError ? (
            <p className="p-4 text-sm">Search unavailable, try again.</p>
          ) : !results.data ? (
            <p className="p-4 text-sm text-muted">Searching…</p>
          ) : results.data.meta.total === 0 ? (
            <div className="p-6 text-center">
              <p className="font-bold">No matches found</p>
              <p className="text-sm text-muted">Check your spelling or try different keywords.</p>
              <Link to="/store" onClick={close} className="mt-3 inline-block bg-accent px-4 py-2 text-sm font-extrabold text-black">
                Browse the store
              </Link>
            </div>
          ) : (
            <>
              <ul>
                {results.data.data.slice(0, PREVIEW).map((p) => (
                  <li key={p.slug}>
                    <Link to={`/product/${p.slug}`} onClick={close} className="flex items-center gap-3 p-2 hover:bg-surface-light focus:bg-surface-light">
                      <img src={p.image_url} alt="" className="h-14 w-10 shrink-0 object-cover" />
                      <span className="flex-1 text-sm font-semibold">
                        {p.name} {p.platform.name} Key {p.region.name.toUpperCase()}
                      </span>
                      <span className="font-extrabold">{p.price_cents === null ? 'Sold out' : euro(p.price_cents)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to={storeUrl(term)} onClick={close} className="block border-t border-white/10 p-3 text-center text-sm font-bold text-accent hover:underline">
                See all {results.data.meta.total} {results.data.meta.total === 1 ? 'result' : 'results'}
              </Link>
            </>
          )}
        </div>
      )}
    </form>
  )
}
