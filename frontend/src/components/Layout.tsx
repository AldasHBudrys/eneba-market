import { Link, NavLink, Outlet } from 'react-router'

/** Header on every page; the routed page renders in <Outlet />. */
export default function Layout() {
  return (
    <>
      <header className="bg-surface-dark">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <Link to="/" className="text-2xl font-extrabold tracking-tight">
            eneba<span className="text-accent">.</span>market
          </Link>
          <nav className="text-sm font-semibold">
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
