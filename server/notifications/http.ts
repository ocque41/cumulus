const BASE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
} as const;

export class RequestBodyError extends Error {
  readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = "RequestBodyError";
    this.status = status;
  }
}

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...BASE_HEADERS, ...init.headers },
  });
}

export function unsubscribeJsonResponse(
  body: unknown,
  init: ResponseInit = {},
): Response {
  return jsonResponse(body, {
    ...init,
    headers: {
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      ...init.headers,
    },
  });
}

export function webhookJsonResponse(
  body: unknown,
  init: ResponseInit = {},
): Response {
  return jsonResponse(body, {
    ...init,
    headers: {
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      ...init.headers,
    },
  });
}

export function unsubscribeEmptyResponse(status = 200): Response {
  return new Response(null, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function readSmallText(
  request: Request,
  maximumBytes = 4096,
): Promise<string> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const size = Number(contentLength);
    if (!Number.isSafeInteger(size) || size < 0) {
      throw new RequestBodyError("invalid_content_length", 400);
    }
    if (size > maximumBytes) {
      throw new RequestBodyError("request_too_large", 413);
    }
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const chunks: string[] = [];
  let bytesRead = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytesRead += chunk.value.byteLength;
      if (bytesRead > maximumBytes) {
        try {
          await reader.cancel();
        } catch {
          // The size error remains authoritative even if cancellation fails.
        }
        throw new RequestBodyError("request_too_large", 413);
      }
      chunks.push(decoder.decode(chunk.value, { stream: true }));
    }
    chunks.push(decoder.decode());
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError("invalid_request_body", 400);
  } finally {
    reader.releaseLock();
  }
  return chunks.join("");
}

export async function readSmallJson(
  request: Request,
  maximumBytes = 4096,
): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new RequestBodyError("unsupported_media_type", 415);
  }
  const text = await readSmallText(request, maximumBytes);
  try {
    return JSON.parse(text);
  } catch {
    throw new RequestBodyError("invalid_json", 400);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
