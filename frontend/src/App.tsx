import { useQuery } from '@tanstack/react-query'

// Day 1 hello world: proves frontend → /api → Laravel → DB works locally and when deployed.
export default function App() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/health')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      return res.json() as Promise<{ status: string; db: string }>
    },
  })

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">eneba market</h1>
      <p className="mt-4">
        API:{' '}
        {health.isPending ? 'checking…' : health.isError ? `down (${health.error.message})` : `${health.data.status}, db ${health.data.db}`}
      </p>
      <button className="mt-4 h-9 bg-accent px-4 font-extrabold text-black">Add to cart</button>
    </main>
  )
}
