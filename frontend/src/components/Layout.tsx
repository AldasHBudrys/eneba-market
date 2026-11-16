import { useQuery } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigationType } from 'react-router'
import { api, filtersQuery } from '../api'
import { useAuth } from '../auth'
import { cartCount, useCart } from '../cart'
import SearchBox from './SearchBox'

/** Eneba's measured layout width: 1200 px of content + 20 px padding on each side. Shared by header, page and footer. */
const CONTAINER = 'mx-auto w-full max-w-[1240px] px-5'

/** Header (two rows, like eneba.com), the routed page in <Outlet />, footer. */
export default function Layout() {
  return (
    <>
      <ScrollToTop />
      <header>
        {/* Row 1: 20 px padding + 57 px row (search box height) = Eneba's 97 px. Phones: search wraps to its own row. */}
        <div className={`${CONTAINER} flex flex-wrap items-center gap-x-6 gap-y-3 py-5`}>
          <Logo />
          <div className="order-last w-full md:order-none md:max-w-[550px] md:flex-1">
            <SearchBox />
          </div>
          <nav aria-label="Account" className="ml-auto flex items-center gap-4 text-sm font-semibold">
            <CartLink />
            <AccountLinks />
          </nav>
        </div>
        <PlatformNav />
      </header>
      <main className={`${CONTAINER} min-h-[70vh] py-6`}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

/** BrowserRouter keeps the old scroll position on navigation; jump to the top like a normal page load.
 *  Back/Forward (POP) is left alone so the browser can return you to where you were. */
function ScrollToTop() {
  const { pathname, search } = useLocation()
  const type = useNavigationType()
  useEffect(() => {
    if (type !== 'POP') window.scrollTo(0, 0)
  }, [pathname, search, type])
  return null
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 font-extrabold tracking-tight ${small ? 'text-base' : 'text-[22px]'}`}>
      {/* Yellow mark (the purple favicon disappeared on the purple header); bigger than the word mark, like Eneba's icon. */}
      <img src="/logo.svg" alt="" className={small ? 'size-9' : 'size-13'} />
      <span>eneba<span className="text-accent">.</span>market</span>
    </Link>
  )
}

/** Row 2: full-width darker band (Eneba: 50 px, black 25 %), links 16 px / 600. Platforms come from the API, not code. */
function PlatformNav() {
  const filters = useQuery(filtersQuery)
  const { pathname, search } = useLocation()
  const current = pathname === '/store' ? (new URLSearchParams(search).get('platform') ?? '') : null
  const link = (active: boolean) => `flex h-full shrink-0 items-center px-3 hover:text-accent ${active ? 'text-accent' : ''}`

  return (
    <nav aria-label="Platforms" className="h-[50px] bg-black/25 text-base font-semibold">
      {/* Phones: scrolls sideways instead of wrapping (the page itself never scrolls sideways). */}
      <div className={`${CONTAINER} flex h-full items-stretch overflow-x-auto whitespace-nowrap`}>
        <Link to="/store" className={`-ml-3 ${link(current === '')}`}>Store</Link>
        {filters.data?.platforms.map((p) => (
          <Link key={p.slug} to={`/store?platform=${p.slug}`} className={link(current === p.slug)}>{p.name}</Link>
        ))}
      </div>
    </nav>
  )
}

function Footer() {
  const filters = useQuery(filtersQuery)
  const user = useAuth((s) => s.user)
  const linkClass = 'text-xs leading-[18px] text-soft hover:text-white' // Eneba: 12 px, #DCD8E6, 18 px line height

  return (
    <footer className="mt-16 bg-black/70">{/* Eneba: black 70 % over the page purple */}
      <div className={`${CONTAINER} grid gap-8 pb-[50px] pt-5 sm:grid-cols-[1.5fr_1fr_1fr_1fr]`}>
        <div>
          <Logo small />
          <p className="mt-2 text-xs text-soft">For the Eneba internship task</p>
        </div>
        <Column title="Shop">
          <li><Link to="/store" className={linkClass}>Store</Link></li>
          {filters.data?.platforms.map((p) => (
            <li key={p.slug}><Link to={`/store?platform=${p.slug}`} className={linkClass}>{p.name}</Link></li>
          ))}
        </Column>
        <Column title="Account">
          <li><Link to="/cart" className={linkClass}>Cart</Link></li>
          {user ? (
            <li><Link to="/orders" className={linkClass}>My orders</Link></li>
          ) : (
            <>
              <li><Link to="/login" className={linkClass}>Log in</Link></li>
              <li><Link to="/register" className={linkClass}>Register</Link></li>
            </>
          )}
        </Column>
        <Column title="About">
          <li><a href="https://github.com/AldasHBudrys/eneba-market" className={linkClass}>Source code on GitHub</a></li>
          <li><span className="text-xs leading-[18px] text-soft">Game images © their publishers, via Steam</span></li>
        </Column>
      </div>
    </footer>
  )
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-bold">{title}</h2>
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  )
}

function CartLink() {
  const count = useCart((s) => cartCount(s.items))
  return (
    <NavLink to="/cart" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
      className={({ isActive }) => (isActive ? 'text-accent' : 'hover:text-accent')}>
      Cart{count > 0 && <span className="ml-1 bg-accent px-1.5 text-xs font-extrabold text-black">{count}</span>}
    </NavLink>
  )
}

/** "Log in | Register" or "Hi, name · Log out". Login links carry the current page as ?next= so you come back here. */
function AccountLinks() {
  const { user, clear } = useAuth()
  const { pathname, search } = useLocation()

  if (user) {
    // Revoke the token on the server; log out locally even if that request fails (e.g. offline).
    const logout = () => api('auth/logout', { method: 'POST' }).catch(() => {}).finally(clear)
    return (
      <span className="flex items-center gap-3">
        <NavLink to="/orders" className={({ isActive }) => (isActive ? 'text-accent' : 'hover:text-accent')}>My orders</NavLink>
        <span>Hi, {user.name}</span>
        <button onClick={logout} className="hover:text-accent">Log out</button>
      </span>
    )
  }

  // Eneba: 15 px / 800 for Log in | Register
  const next = ['/login', '/register'].includes(pathname) ? '' : `?next=${encodeURIComponent(pathname + search)}`
  return (
    <span className="text-[15px] font-extrabold">
      <Link to={`/login${next}`} className="hover:text-accent">Log in</Link>
      <span className="px-1.5 text-muted">|</span>
      <Link to={`/register${next}`} className="hover:text-accent">Register</Link>
    </span>
  )
}
