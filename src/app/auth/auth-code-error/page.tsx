import Link from 'next/link'

export const dynamic = 'force-static'

export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-6 py-16">
      <div className="w-full rounded-[5.5px] border border-[color:var(--muted)]/40 bg-[color:var(--glass-bg-standard)] p-8 text-center">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">Authentication</p>
        <h1 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]">
          Sign-in callback failed
        </h1>
        <p className="mx-auto mt-4 max-w-[56ch] text-sm leading-[1.8] text-[color:var(--subtitle)] sm:text-base">
          Cumulus could not complete the sign-in handoff. Retry sign in from the main login page. If this repeats, check callback URL and auth cookie settings.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--muted)]/40 px-5 text-xs uppercase tracking-[0.14em] text-[color:var(--fg)]"
          >
            Back To Login
          </Link>
        </div>
      </div>
    </main>
  )
}
