import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { api } from '../api'
import { useAuth } from '../auth'
import SearchBox from './SearchBox'

/** Header on every page; the routed page renders in <Outlet />. */
export default function Layout() {
  return (
    <>
      <header className="border-b border-white/10">{/* Eneba's header is the page purple, not a dark bar */}
        {/* phones: logo + nav on the first row, search wraps to a full-width second row */}
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link to="/" className="text-2xl font-extrabold tracking-tight">
            eneba<span className="text-accent">.</span>market
          </Link>
          <div className="order-last w-full md:order-none md:max-w-xl md:flex-1">
            <SearchBox />
          </div>
          <nav className="ml-auto flex items-center gap-4 text-sm font-semibold md:ml-0">
            <NavLink to="/store" className={({ isActive }) => (isActive ? 'text-accent' : 'hover:text-accent')}>
              Store
            </NavLink>
            <AccountLinks />
          </nav>
        </div>
      </header>
      <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="mt-16 bg-surface-dark">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm">
          <div>
            <Link to="/" className="text-lg font-extrabold">eneba<span className="text-accent">.</span>market</Link>
            <p className="mt-1 text-muted">For the Eneba internship task</p>
          </div>
          <Link to="/store" className="font-semibold hover:text-accent">Store</Link>
        </div>
      </footer>
    </>
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
        <span>Hi, {user.name}</span>
        <button onClick={logout} className="hover:text-accent">Log out</button>
      </span>
    )
  }

  const next = ['/login', '/register'].includes(pathname) ? '' : `?next=${encodeURIComponent(pathname + search)}`
  return (
    <span>
      <Link to={`/login${next}`} className="hover:text-accent">Log in</Link>
      <span className="px-1.5 text-muted">|</span>
      <Link to={`/register${next}`} className="hover:text-accent">Register</Link>
    </span>
  )
}
