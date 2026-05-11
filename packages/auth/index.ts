export {
  buildEmailRedirectTarget,
  resolvePostAuthDestination,
  type RedirectEnv,
  type RedirectPolicyOptions as RedirectsPolicyOptions,
} from './redirects'
export {
  createBrowserSupabaseClient,
  createClient,
} from './client'
export {
  createClient as createServerClient,
  createRouteHandlerSupabaseClient,
  createServerSupabaseClient,
} from './server'
export * from './middleware'
