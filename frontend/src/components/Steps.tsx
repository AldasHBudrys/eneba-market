const STEPS = ['Cart', 'Payment', 'Get your product']

/** Eneba's checkout progress bar: ① Cart → ② Payment → ③ Get your product. */
export default function Steps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold">
      {STEPS.map((label, i) => {
        const n = i + 1
        return (
          <li key={label} aria-current={n === current ? 'step' : undefined} className={`flex items-center gap-2 ${n > current ? 'text-muted' : ''}`}>
            <span className={`grid size-7 place-items-center rounded-full ${n < current ? 'bg-success text-black' : n === current ? 'bg-accent text-black' : 'bg-surface'}`}>
              {n < current ? '✓' : n}
            </span>
            {label}
            {n < STEPS.length && <span aria-hidden className="ml-1 h-px w-8 bg-white/30 sm:w-16" />}
          </li>
        )
      })}
    </ol>
  )
}
