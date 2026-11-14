import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { api, ApiError, euro, type Order } from '../api'
import { cartTotal, useCart } from '../cart'
import Steps from '../components/Steps'

/** Steps 2 + 3: simulated payment, then the bought keys. Only reachable logged in (RequireAuth). */
export default function Checkout() {
  const { items, clear } = useCart()
  const queryClient = useQueryClient()
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})

  const pay = useMutation({
    // Only offer ids + quantities + the card's last 4 digits leave the browser; the server decides prices and keys.
    mutationFn: (cardLast4: string) =>
      api<{ data: Order }>('checkout', {
        method: 'POST',
        body: { items: items.map(({ offer_id, quantity }) => ({ offer_id, quantity })), card_last4: cardLast4 },
      }).then((r) => r.data),
    onSuccess: () => {
      clear()
      queryClient.invalidateQueries() // stock, "From" prices and best sellers just changed
    },
  })

  if (pay.data) return <Done order={pay.data} />
  // isIdle = no payment attempted yet. onSuccess empties the cart one render BEFORE pay.data is set,
  // so without this check a successful payment would bounce to /cart instead of showing the keys.
  if (items.length === 0 && pay.isIdle) return <Navigate to="/cart" replace />

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const errors = validateCard(form)
    setCardErrors(errors)
    if (Object.keys(errors).length === 0) pay.mutate(String(form.get('number')).replace(/\s/g, '').slice(-4))
  }

  const error = pay.error instanceof ApiError ? pay.error : null
  const serverError = !pay.isError ? null
    : error?.status === 402 ? 'Card declined. You were not charged.'
    : error?.errors.items?.[0] ?? 'Something went wrong. You were not charged, try again.'

  return (
    <div>
      <title>Payment | eneba market</title>
      <Steps current={2} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={onSubmit} noValidate className="bg-surface-dark p-5">
          <h1 className="text-xl font-bold">Payment</h1>
          <p className="mb-5 mt-2 bg-surface p-3 text-sm">
            <b>Demo only: never enter a real card.</b> Use <code>4242 4242 4242 4242</code>, any future date and any CVC.
            A card ending in <code>0002</code> is declined.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <CardField name="number" label="Card number" placeholder="4242 4242 4242 4242" error={cardErrors.number} wide />
            <CardField name="expiry" label="Expiry (MM/YY)" placeholder="12/28" error={cardErrors.expiry} />
            <CardField name="cvc" label="CVC" placeholder="123" error={cardErrors.cvc} />
            <CardField name="name" label="Name on card" placeholder="Ada Lovelace" error={cardErrors.name} wide />
          </div>
          {serverError && <p role="alert" className="mt-4 font-semibold text-accent">{serverError}</p>}
          <button disabled={pay.isPending} className="mt-5 w-full bg-accent py-3 font-extrabold text-black disabled:opacity-60">
            {pay.isPending ? 'Processing…' : `Pay ${euro(cartTotal(items))}`}
          </button>
        </form>

        <aside className="self-start bg-surface-dark p-5">
          <h2 className="mb-3 text-xl font-bold">Order summary</h2>
          <ul className="mb-4 flex flex-col gap-2 text-sm">
            {items.map((i) => (
              <li key={i.offer_id} className="flex justify-between gap-3">
                <span>{i.quantity}× {i.product.name} <span className="text-muted">({i.product.platform})</span></span>
                <span className="font-bold">{euro(i.price_cents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-extrabold">
            <span>Total</span><span>{euro(cartTotal(items))}</span>
          </div>
          <Link to="/cart" className="mt-3 block text-center text-sm text-accent hover:underline">Edit cart</Link>
        </aside>
      </div>
    </div>
  )
}

/** Format checks only (it's a simulated payment): 16 digits, a future MM/YY, 3-digit CVC, a name. */
function validateCard(form: FormData): Record<string, string> {
  const errors: Record<string, string> = {}
  const number = String(form.get('number')).replace(/\s/g, '')
  const expiry = String(form.get('expiry')).trim()
  const [month, year] = expiry.split('/').map(Number)
  if (!/^\d{16}$/.test(number)) errors.number = 'Enter the 16-digit card number.'
  // A card is valid until the end of its expiry month, i.e. expired from the 1st of the next month.
  if (!/^\d{2}\/\d{2}$/.test(expiry) || month < 1 || month > 12 || new Date(2000 + year, month, 1) <= new Date()) errors.expiry = 'Enter a future date as MM/YY.'
  if (!/^\d{3}$/.test(String(form.get('cvc')).trim())) errors.cvc = 'Enter the 3-digit CVC.'
  if (!String(form.get('name')).trim()) errors.name = 'Enter the name on the card.'
  return errors
}

function CardField({ name, label, placeholder, error, wide = false }: { name: string; label: string; placeholder: string; error?: string; wide?: boolean }) {
  const id = `card-${name}`
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">{label}</label>
      {/* autoComplete off: discourages the browser from filling in a real saved card on a demo site */}
      <input id={id} name={name} placeholder={placeholder} autoComplete="off" inputMode={name === 'name' ? 'text' : 'numeric'}
        aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full bg-surface px-3 py-2.5 outline-none ${error ? 'border border-accent' : 'border border-transparent'}`} />
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-accent">{error}</p>}
    </div>
  )
}

/** Step 3: the keys. Copy button per key. */
function Done({ order }: { order: Order }) {
  const [copied, setCopied] = useState<number | null>(null)
  const copy = (itemId: number, code: string) => navigator.clipboard.writeText(code).then(() => setCopied(itemId))

  return (
    <div>
      <title>Your keys | eneba market</title>
      <Steps current={3} />
      <section className="bg-surface-dark p-5">
        <h1 className="text-2xl font-bold">Thank you! Here are your keys</h1>
        <p className="mt-1 text-sm text-muted">Order #{order.id} · charged {euro(order.total_cents)}</p>
        <ul className="mt-5 flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-4 bg-surface p-4">
              <div className="min-w-48 flex-1">
                <div className="font-bold">{item.product.name} {item.product.platform} Key {item.product.region.toUpperCase()}</div>
                <div className="text-xs text-muted">Sold by {item.seller} · {euro(item.price_cents)}</div>
              </div>
              <code className="bg-surface-dark px-3 py-2 font-bold tracking-wider text-accent">{item.code}</code>
              <button onClick={() => copy(item.id, item.code)} className="bg-accent px-4 py-2 text-sm font-extrabold text-black">
                {copied === item.id ? 'Copied' : 'Copy'}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-6">
          <Link to="/orders" className="font-bold text-accent hover:underline">View in order history</Link>
          <Link to="/store" className="font-bold text-accent hover:underline">Continue shopping</Link>
        </div>
      </section>
    </div>
  )
}
