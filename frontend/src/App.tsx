import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import NotFound from './components/NotFound'
import Home from './pages/Home'
import Product from './pages/Product'
import Store from './pages/Store'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="store" element={<Store />} />
        <Route path="product/:slug" element={<Product />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
