export type RedirectEnv = Partial<{
  FEDERATED_ALLOWED_ROOTS: string
  FEDERATED_LOCAL_HOSTS: string
  NEXT_PUBLIC_FEDERATED_ALLOWED_ROOTS: string
  NEXT_PUBLIC_FEDERATED_LOCAL_HOSTS: string
  NODE_ENV: string
  VERCEL_ENV: string
}>

export type RedirectPolicyOptions = {
  allowedLocalHosts?: string[]
  allowedRoots?: string[]
  env?: RedirectEnv
  requireHttpsInProd?: boolean
}

function parseCsv(value: string | undefined, fallback: string[]): string[] {
  if (!value || !value.trim()) return fallback
  return value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
}

function stableHost(value: string): string {
  return value.trim().toLowerCase().replace(/^\./, '')
}

function isProdLike(env: RedirectEnv = process.env): boolean {
  return env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production'
}

export function getAllowedRoots(env: RedirectEnv = process.env): string[] {
  return parseCsv(
    env.FEDERATED_ALLOWED_ROOTS ?? env.NEXT_PUBLIC_FEDERATED_ALLOWED_ROOTS,
    ['cumulush.com']
  ).map(stableHost)
}

export function getAllowedLocalHosts(env: RedirectEnv = process.env): string[] {
  return parseCsv(
    env.FEDERATED_LOCAL_HOSTS ?? env.NEXT_PUBLIC_FEDERATED_LOCAL_HOSTS,
    ['localhost', '127.0.0.1', 'local.cumulush.com']
  ).map(stableHost)
}

export function isAllowedRedirect(
  url: string,
  options: RedirectPolicyOptions = {}
): boolean {
  const env = options.env ?? process.env

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const allowedRoots = (options.allowedRoots ?? getAllowedRoots(env)).map(stableHost)
    const allowedLocalHosts = (options.allowedLocalHosts ?? getAllowedLocalHosts(env)).map(stableHost)
    const requireHttpsInProd = options.requireHttpsInProd ?? isProdLike(env)
    const isLocal = allowedLocalHosts.includes(host)
    const isRootAllowed = allowedRoots.some((root) => host === root || host.endsWith(`.${root}`))
    const protocolAllowed =
      parsed.protocol === 'https:' ||
      (!requireHttpsInProd && parsed.protocol === 'http:' && isLocal)

    return protocolAllowed && (isRootAllowed || isLocal)
  } catch {
    return false
  }
}

function safeRelativePath(path: string | null | undefined, fallback: string): string {
  if (!path) return fallback
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return fallback
  return path
}

export function resolvePostAuthDestination(
  redirectTo: string | null | undefined,
  fallback: string,
  options: RedirectPolicyOptions = {}
): string {
  if (redirectTo && isAllowedRedirect(redirectTo, options)) return redirectTo
  return safeRelativePath(fallback, '/dashboard')
}

export function buildEmailRedirectTarget(
  siteUrl: string,
  redirectTo: string | null | undefined,
  fallback: string,
  options: RedirectPolicyOptions = {}
): string {
  const origin = siteUrl.replace(/\/$/, '')
  const target = new URL('/auth/callback', origin)
  const destination = resolvePostAuthDestination(redirectTo, fallback, options)

  if (destination.startsWith(origin)) {
    target.searchParams.set('redirectTo', destination)
  } else {
    target.searchParams.set('next', safeRelativePath(destination, '/dashboard'))
  }

  return target.toString()
}
