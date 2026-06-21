'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GraduationCap, KeyRound, Mail } from 'lucide-react'

export default function LoginPage() {
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('admin@school.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = searchParams.get('redirect') || `/${locale}/dashboard`

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Invalid email or password')
      }

      router.replace(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f4f0ff,transparent_35%),linear-gradient(180deg,#fcfcfd_0%,#eef2f7_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-border/70 bg-background shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden bg-[linear-gradient(135deg,#111827_0%,#1f2937_45%,#0f172a_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm">
                <GraduationCap className="h-4 w-4" />
                School Management System
              </div>
              <h1 className="max-w-md text-4xl font-semibold leading-tight">
                Login with any active user from your user management data.
              </h1>
              <p className="mt-4 max-w-lg text-sm text-slate-300">
                Seeded demo credentials work immediately. Example: `admin@school.com` / `admin123`
              </p>
            </div>

            <div className="grid gap-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Auth.js credentials login is wired to the `User` table.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Dashboard access redirects here instead of crashing on invalid JSON.
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-10">
            <div className="mx-auto max-w-md">
              <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <GraduationCap className="h-4 w-4" />
                Back to home
              </Link>

              <div className="mt-8">
                <h2 className="text-3xl font-semibold text-foreground">Sign in</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your email and password to open the dashboard.
                </p>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Email</span>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                      required
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Password</span>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                      required
                    />
                  </div>
                </label>

                {error ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" className="h-11 w-full rounded-xl text-sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Login'}
                </Button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
