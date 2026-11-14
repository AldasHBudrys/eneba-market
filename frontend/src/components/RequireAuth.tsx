import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth'

/** Route guard: logged-out visitors go to /login and come back here afterwards (?next=). The API enforces this too (401). */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuth((s) => s.token)
  const { pathname, search } = useLocation()
  return token ? children : <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />
}
