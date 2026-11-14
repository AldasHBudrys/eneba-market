import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import NotFound from './components/NotFound'
import Product from './pages/Product'
import Store from './pages/Store'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* shortcut: "/" redirects to the store until the homepage exists (Day 2, feature 4) */}
        <Route index element={<Navigate to="/store" replace />} />
        <Route path="store" element={<Store />} />
        <Route path="product/:slug" element={<Product />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
