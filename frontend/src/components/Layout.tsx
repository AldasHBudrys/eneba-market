import { Link, NavLink, Outlet } from 'react-router'
import SearchBox from './SearchBox'

/** Header on every page; the routed page renders in <Outlet />. */
export default function Layout() {
  return (
    <>
      <header className="bg-surface-dark">
        {/* phones: logo + nav on the first row, search wraps to a full-width second row */}
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link to="/" className="text-2xl font-extrabold tracking-tight">
            eneba<span className="text-accent">.</span>market
          </Link>
          <div className="order-last w-full md:order-none md:max-w-xl md:flex-1">
            <SearchBox />
          </div>
          <nav className="ml-auto text-sm font-semibold md:ml-0">
            <NavLink to="/store" className={({ isActive }) => (isActive ? 'text-accent' : 'hover:text-accent')}>
              Store
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </>
  )
}
