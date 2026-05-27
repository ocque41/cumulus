'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buildEmailRedirectTarget, resolvePostAuthDestination } from '@cumulus/auth/redirects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

type AuthTab = 'login' | 'signup' | 'forgot-password'

type AuthFormProps = {
  initialTab?: AuthTab
  redirectPath?: string
  redirectTo?: string | null
}

export function AuthForm({ initialTab = 'login', redirectPath = '/dashboard', redirectTo = null }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const getSiteUrl = () => {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')
    return origin.replace(/\/$/, '')
  }

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  function navigateToDestination(destination: string) {
    if (destination.startsWith('/')) {
      router.push(destination)
      router.refresh()
      return
    }

    window.location.assign(destination)
  }

  async function onLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          redirectPath,
          redirectTo,
        }),
      })

      const payload = await loginResponse.json().catch(() => null) as
        | { ok?: boolean; error?: string; redirectTo?: string }
        | null

      if (!loginResponse.ok || !payload?.ok || !payload.redirectTo) {
        toast.error(payload?.error ?? 'Unable to sign in.')
        return
      }

      toast.success('Signed in')
      navigateToDestination(payload.redirectTo)
    } finally {
      setIsLoading(false)
    }
  }

  async function onSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      const siteUrl = getSiteUrl()
      const destination = resolvePostAuthDestination(redirectTo, redirectPath)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: buildEmailRedirectTarget(siteUrl, redirectTo, redirectPath),
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.session) {
        toast.success('Account created')
        navigateToDestination(destination)
        return
      }

      toast.success('Check your email to confirm your account')
      setActiveTab('login')
    } finally {
      setIsLoading(false)
    }
  }

  async function onForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const email = formData.get('email') as string

      const siteUrl = getSiteUrl()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Check your email for the password reset link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <div className="rounded-[5.5px] border border-[color:var(--muted)]/40 bg-[color:var(--glass-bg-standard)] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--font-weight-semibold)]">Cumulus account access</span>
          <span className="rounded-md bg-[color:var(--accent-soft)] px-2 py-1 text-[10px] text-[color:var(--title)] [font-family:var(--type-label-family)] [font-weight:var(--type-label-weight)]">Shared auth</span>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--muted)]">
          Use one email and password for Cumulus app work.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AuthTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-[5.5px] border border-[color:var(--muted)]/40 bg-[color:var(--bg)] p-1">
          <TabsTrigger
            value="login"
            className="text-[color:var(--fg)] data-[state=active]:bg-[color:var(--bg)] data-[state=active]:text-[color:var(--title)]"
          >
            Sign In
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="text-[color:var(--fg)] data-[state=active]:bg-[color:var(--bg)] data-[state=active]:text-[color:var(--title)]"
          >
            Create Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <Card className="border-[color:var(--muted)]/40 bg-[color:var(--bg)]">
            <CardHeader>
              <CardTitle className="text-[color:var(--title)]">Sign In</CardTitle>
              <CardDescription className="text-[color:var(--muted)]">Use your Cumulus account credentials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={onLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={(event) => {
                        event.preventDefault()
                        setActiveTab('forgot-password')
                      }}
                    >
                      Forgot your password?
                    </Button>
                  </div>
                  <Input id="password" name="password" type="password" autoComplete="current-password" required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Working...' : 'Sign In'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[color:var(--muted)]/40" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[color:var(--bg)] px-2 text-[color:var(--muted)]">Need an account? Create one here.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signup">
          <Card className="border-[color:var(--muted)]/40 bg-[color:var(--bg)]">
            <CardHeader>
              <CardTitle className="text-[color:var(--title)]">Create Account</CardTitle>
              <CardDescription className="text-[color:var(--muted)]">Set up a Cumulus account and continue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={onSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Working...' : 'Create Account'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[color:var(--muted)]/40" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[color:var(--bg)] px-2 text-[color:var(--muted)]">Already have an account? Sign in instead.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forgot-password">
          <Card className="border-[color:var(--muted)]/40 bg-[color:var(--bg)]">
            <CardHeader>
              <CardTitle className="text-[color:var(--title)]">Forgot Password</CardTitle>
              <CardDescription className="text-[color:var(--muted)]">Enter your email and we will send a reset link.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={onForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Working...' : 'Send Reset Link'}
                </Button>
                <Button variant="link" className="w-full" onClick={() => setActiveTab('login')}>
                  Back to Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
