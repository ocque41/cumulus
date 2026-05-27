const AUTH_PROTECTED_PREFIXES = ["/dashboard", "/settings"] as const;

export function isAuthProtectedPath(pathname: string) {
  return AUTH_PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
