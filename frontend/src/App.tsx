import { Link, Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import Store from './pages/Store'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* shortcut: "/" redirects to the store until the homepage exists (Day 2, feature 4) */}
        <Route index element={<Navigate to="/store" replace />} />
        <Route path="store" element={<Store />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <Link to="/store" className="mt-6 inline-block bg-accent px-5 py-2.5 font-extrabold text-black">
        Browse the store
      </Link>
    </div>
  )
}
