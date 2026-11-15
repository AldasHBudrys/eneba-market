import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { api, euro, type Order } from '../api'
import { useAuth } from '../auth'
import { OrdersSkeleton } from '../components/Skeleton'

const when = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

/** Order history (login required). Keys stay hidden until "Reveal", like on Eneba. */
export default function Orders() {
  const userId = useAuth((s) => s.user?.id)
  const orders = useQuery({
    queryKey: ['orders', userId], // keyed by user: a second person on the same browser never sees the first one's cached keys
    queryFn: () => api<{ data: Order[] }>('orders').then((r) => r.data),
  })

  return (
    <div>
      <title>My orders | eneba market</title>
      <h1 className="mb-6 text-3xl font-bold">My orders</h1>

      {orders.isError ? (
        <div className="py-16 text-center">
          <p>Couldn't load your orders.</p>
          <button onClick={() => orders.refetch()} className="mt-4 bg-accent px-5 py-2 font-extrabold text-black">Retry</button>
        </div>
      ) : !orders.data ? (
        <OrdersSkeleton />
      ) : orders.data.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-xl font-bold">No orders yet</p>
          <Link to="/store" className="mt-4 inline-block bg-accent px-5 py-2.5 font-extrabold text-black">Browse the store</Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.data.map((order) => (
            <li key={order.id} className="bg-surface-dark p-5">
              <div className="mb-3 flex flex-wrap justify-between gap-2">
                <span className="font-bold">Order #{order.id} · <span className="font-normal text-muted">{when.format(new Date(order.created_at))}</span></span>
                <span className="font-extrabold">{euro(order.total_cents)}</span>
              </div>
              <ul className="flex flex-col gap-2">
                {order.items.map((item) => <KeyRow key={item.id} item={item} />)}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function KeyRow({ item }: { item: Order['items'][number] }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  return (
    <li className="flex flex-wrap items-center gap-4 bg-surface p-3">
      <div className="min-w-48 flex-1">
        <Link to={`/product/${item.product.slug}`} className="font-bold hover:underline">
          {item.product.name} {item.product.platform} Key {item.product.region.toUpperCase()}
        </Link>
        <div className="text-xs text-muted">Sold by {item.seller} · {euro(item.price_cents)}</div>
      </div>
      <code className="bg-surface-dark px-3 py-2 font-bold tracking-wider text-accent" aria-label={revealed ? 'Key' : 'Key hidden'}>
        {revealed ? item.code : item.code.replace(/[^-]/g, '•')}
      </code>
      {revealed ? (
        <button onClick={() => navigator.clipboard.writeText(item.code).then(() => setCopied(true))} className="bg-accent px-4 py-2 text-sm font-extrabold text-black">
          {copied ? 'Copied' : 'Copy'}
        </button>
      ) : (
        <button onClick={() => setRevealed(true)} className="bg-accent px-4 py-2 text-sm font-extrabold text-black">Reveal</button>
      )}
    </li>
  )
}
