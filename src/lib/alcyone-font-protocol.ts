export const ALCYONE_FONT_ENDPOINT = "/api/fonts/alcyone-medium";
export const ALCYONE_FONT_CONTENT_TYPE = "font/woff2";
export const ALCYONE_FONT_ALLOWED_METHODS_HEADER = "GET, HEAD";

export const ALCYONE_FONT_SECURITY_HEADERS = {
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
} as const;

export const ALCYONE_FONT_UNAVAILABLE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  ...ALCYONE_FONT_SECURITY_HEADERS,
} as const;

export const ALCYONE_FONT_METHOD_NOT_ALLOWED_HEADERS = {
  ...ALCYONE_FONT_UNAVAILABLE_HEADERS,
  Allow: ALCYONE_FONT_ALLOWED_METHODS_HEADER,
} as const;

export const ALCYONE_FONT_METHOD_NOT_ALLOWED_STATUS = 405;

export const ALCYONE_FONT_AVAILABLE_CACHE_CONTROL =
  "public, max-age=31536000, immutable";

export const ALCYONE_FONT_UNAVAILABLE_STATUS = {
  GET: 503,
  HEAD: 204,
} as const;

export type AlcyoneFontRequestMethod =
  keyof typeof ALCYONE_FONT_UNAVAILABLE_STATUS;

export function isAlcyoneFontRequestMethod(
  method: string,
): method is AlcyoneFontRequestMethod {
  return method === "GET" || method === "HEAD";
}

export function getAlcyoneFontUnavailableStatus(
  method: AlcyoneFontRequestMethod,
): 204 | 503 {
  return method === "HEAD"
    ? ALCYONE_FONT_UNAVAILABLE_STATUS.HEAD
    : ALCYONE_FONT_UNAVAILABLE_STATUS.GET;
}

export function isAlcyoneFontEndpoint(url: string | undefined): boolean {
  return url?.split("?", 1)[0] === ALCYONE_FONT_ENDPOINT;
}

export function isAlcyoneFontContentType(contentType: string | null): boolean {
  return (
    contentType?.split(";", 1)[0]?.trim().toLowerCase() ===
    ALCYONE_FONT_CONTENT_TYPE
  );
}
