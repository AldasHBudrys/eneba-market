import { Link } from 'react-router'

export default function NotFound({ title = 'Page not found' }: { title?: string }) {
  return (
    <div className="py-24 text-center">
      <title>{`${title} | eneba market`}</title>
      <h1 className="text-3xl font-bold">{title}</h1>
      <Link to="/store" className="mt-6 inline-block bg-accent px-5 py-2.5 font-extrabold text-black">
        Browse the store
      </Link>
    </div>
  )
}
