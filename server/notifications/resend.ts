import { isRecord } from "./http.js";
import type { MailResult, NotificationEmail, NotificationMailer } from "./types.js";

interface ResendMailerOptions {
  apiKey: string;
  fromEmail: string;
  fetcher?: typeof fetch;
}

function retryAfterSeconds(response: Response): number {
  const header =
    response.headers.get("retry-after")
    ?? response.headers.get("ratelimit-reset");
  if (header === null) return 60;
  const parsed = Number(header);
  if (!Number.isFinite(parsed)) return 60;
  return Math.max(30, Math.min(3600, Math.ceil(parsed)));
}

async function readBoundedResponseText(
  response: Response,
  maximumBytes: number,
): Promise<string | null> {
  if (!response.body) return "";
  const reader = response.body.getReader();
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
          // A bounded failure is sufficient even if cancellation is rejected.
        }
        return null;
      }
      chunks.push(decoder.decode(chunk.value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join("");
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

async function safeProviderErrorName(response: Response): Promise<string> {
  try {
    const text = await readBoundedResponseText(response, 2048);
    if (text === null) return "";
    const value: unknown = JSON.parse(text);
    if (!isRecord(value)) return "";
    const nested = isRecord(value.error) ? value.error : value;
    const candidate = nested.name ?? nested.code;
    return typeof candidate === "string" ? candidate : "";
  } catch {
    return "";
  }
}

export class ResendMailer implements NotificationMailer {
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fetcher: typeof fetch;

  constructor(options: ResendMailerOptions) {
    this.apiKey = options.apiKey;
    this.fromEmail = options.fromEmail;
    this.fetcher = options.fetcher ?? fetch;
  }

  async send(message: NotificationEmail): Promise<MailResult> {
    let response: Response;
    try {
      response = await this.fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": message.idempotencyKey,
        },
        signal: AbortSignal.timeout(20_000),
        body: JSON.stringify({
          from: this.fromEmail,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          headers: {
            "List-Unsubscribe": `<${message.oneClickUnsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });
    } catch {
      return {
        ok: false,
        failureCode: "resend_network_error",
        retryable: true,
        retryAfterSeconds: 60,
      };
    }

    if (!response.ok) {
      const providerName = await safeProviderErrorName(response);
      const invalidIdempotency =
        response.status === 409
        && /invalid[_-]?idempot/i.test(providerName);
      const quotaExceeded =
        response.status === 429
        && /(?:daily|monthly)[_-]?quota[_-]?exceeded/i.test(providerName);
      const retryable =
        !invalidIdempotency
        && !quotaExceeded
        && (response.status === 408
          || response.status === 409
          || response.status === 425
          || response.status === 429
          || response.status >= 500);
      return {
        ok: false,
        failureCode: invalidIdempotency
          ? "resend_invalid_idempotency"
          : quotaExceeded
            ? "resend_quota_exceeded"
          : `resend_http_${response.status}`,
        retryable,
        retryAfterSeconds: retryable ? retryAfterSeconds(response) : 60,
      };
    }

    let value: unknown;
    try {
      const responseText = await readBoundedResponseText(response, 4096);
      if (responseText === null) throw new Error("response_too_large");
      value = JSON.parse(responseText);
    } catch {
      return {
        ok: false,
        failureCode: "resend_invalid_response",
        retryable: true,
        retryAfterSeconds: 60,
      };
    }

    const providerMessageId =
      isRecord(value) && typeof value.id === "string" ? value.id : "";
    if (
      providerMessageId.length < 1
      || providerMessageId.length > 255
      || /[\r\n]/.test(providerMessageId)
    ) {
      return {
        ok: false,
        failureCode: "resend_invalid_response",
        retryable: true,
        retryAfterSeconds: 60,
      };
    }

    return { ok: true, providerMessageId };
  }
}
