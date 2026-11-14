import { Link } from 'react-router'
import { euro } from '../api'
import { cartTotal, MAX_QUANTITY, useCart } from '../cart'
import Steps from '../components/Steps'

/** Step 1: review the cart. Anyone can use it; "Proceed to checkout" asks for login (RequireAuth on /checkout). */
export default function Cart() {
  const { items, setQuantity, remove } = useCart()

  return (
    <div>
      <title>Your cart | eneba market</title>
      <Steps current={1} />

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <Link to="/store" className="mt-6 inline-block bg-accent px-5 py-2.5 font-extrabold text-black">Browse the store</Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="bg-surface-dark p-4">
            <h1 className="mb-4 text-xl font-bold">My cart</h1>
            <ul className="flex flex-col gap-3">
              {items.map((i) => (
                <li key={i.offer_id} className="flex flex-wrap items-center gap-4 bg-surface p-3">
                  <img src={i.product.image_url} alt="" className="h-20 w-15 object-cover" />
                  <div className="min-w-48 flex-1">
                    <div className="text-xs text-muted">Sold by {i.seller}</div>
                    <Link to={`/product/${i.product.slug}`} className="font-bold hover:underline">
                      {i.product.name} {i.product.platform} Key {i.product.region.toUpperCase()}
                    </Link>
                  </div>
                  <div className="flex items-center" role="group" aria-label={`Quantity of ${i.product.name}`}>
                    <button onClick={() => setQuantity(i.offer_id, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Decrease quantity"
                      className="size-8 bg-surface-dark font-bold disabled:opacity-40">−</button>
                    <span className="w-8 text-center font-bold">{i.quantity}</span>
                    <button onClick={() => setQuantity(i.offer_id, i.quantity + 1)} disabled={i.quantity >= Math.min(i.stock, MAX_QUANTITY)}
                      aria-label="Increase quantity" className="size-8 bg-surface-dark font-bold disabled:opacity-40">+</button>
                  </div>
                  <div className="w-24 text-right text-lg font-extrabold">{euro(i.price_cents * i.quantity)}</div>
                  <button onClick={() => remove(i.offer_id)} aria-label={`Remove ${i.product.name}`} className="text-muted hover:text-accent">✕</button>
                </li>
              ))}
            </ul>
          </section>

          <aside className="self-start bg-surface-dark p-5">
            <h2 className="mb-4 text-xl font-bold">Summary</h2>
            <div className="mb-4 flex justify-between text-lg font-extrabold">
              <span>Total</span>
              <span>{euro(cartTotal(items))}</span>
            </div>
            <Link to="/checkout" className="block bg-accent py-3 text-center font-extrabold text-black">Proceed to checkout</Link>
          </aside>
        </div>
      )}
    </div>
  )
}
