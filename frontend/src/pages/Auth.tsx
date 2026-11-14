import { useMutation } from '@tanstack/react-query'
import type { FormEvent, ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { api, ApiError } from '../api'
import { safeNext, useAuth, type Session } from '../auth'

export function Login() {
  return (
    <AuthForm
      title="Log in"
      endpoint="auth/login"
      submitLabel="Log in"
      switchTo={{ text: 'New user?', label: 'Create account', path: '/register' }}
      fields={[
        { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
        { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password' },
      ]}
    />
  )
}

export function Register() {
  return (
    <AuthForm
      title="Create account"
      endpoint="auth/register"
      submitLabel="Create account"
      switchTo={{ text: 'Already have an account?', label: 'Log in', path: '/login' }}
      fields={[
        { name: 'name', label: 'Name', type: 'text', autoComplete: 'name' },
        { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
        { name: 'password', label: 'Password (min. 8 characters)', type: 'password', autoComplete: 'new-password' },
        { name: 'password_confirmation', label: 'Repeat password', type: 'password', autoComplete: 'new-password' },
      ]}
    />
  )
}

type Field = { name: string; label: string; type: string; autoComplete: string }
type Props = { title: string; endpoint: string; submitLabel: string; fields: Field[]; switchTo: { text: string; label: string; path: string } }

/** Eneba-style split layout: greeting on the left, form card on the right. On success: save the session, go back to `next`. */
function AuthForm({ title, endpoint, submitLabel, fields, switchTo }: Props) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { token, setSession } = useAuth()
  const next = safeNext(params.get('next'))

  const submit = useMutation({
    mutationFn: (form: Record<string, FormDataEntryValue>) => api<Session>(endpoint, { method: 'POST', body: form }),
    onSuccess: (session) => {
      setSession(session)
      navigate(next, { replace: true })
    },
  })

  if (token && !submit.isPending) return <Navigate to={next} replace /> // already logged in

  const error = submit.error instanceof ApiError ? submit.error : null
  const fieldErrors = error?.errors ?? {}
  // Field errors (422) show under their input; anything else (429, 500, network down) gets one message above the button.
  const general = error?.status === 429 ? 'Too many attempts. Wait a minute and try again.'
    : submit.isError && Object.keys(fieldErrors).length === 0 ? 'Something went wrong. Try again.' : null
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    submit.mutate(Object.fromEntries(new FormData(e.currentTarget)))
  }

  return (
    <div className="grid items-center gap-10 py-10 md:grid-cols-2">
      <title>{`${title} | eneba market`}</title>
      <p className="text-5xl font-extrabold leading-tight md:text-6xl">Hi!<br />It's nice<br />to see you!</p>

      <form onSubmit={onSubmit} noValidate className="mx-auto w-full max-w-sm bg-surface p-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mb-5 mt-1 text-sm">
          {switchTo.text}{' '}
          <Link to={`${switchTo.path}?next=${encodeURIComponent(next)}`} className="font-bold text-accent hover:underline">{switchTo.label}</Link>
        </p>

        {fields.map((f) => (
          <Labeled key={f.name} field={f} error={fieldErrors[f.name]?.[0]} />
        ))}
        {general && <p role="alert" className="mb-3 text-sm font-semibold text-accent">{general}</p>}

        <button disabled={submit.isPending} className="mt-2 w-full bg-accent py-3 font-extrabold text-black disabled:opacity-60">
          {submit.isPending ? 'Please wait…' : submitLabel}
        </button>
      </form>
    </div>
  )
}

function Labeled({ field: f, error }: { field: Field; error?: string }): ReactNode {
  const id = `field-${f.name}`
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">{f.label}</label>
      <input id={id} name={f.name} type={f.type} autoComplete={f.autoComplete} required aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full bg-surface-dark px-3 py-2.5 outline-none ${error ? 'border border-accent' : 'border border-transparent'}`} />
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-accent">{error}</p>}
    </div>
  )
}
