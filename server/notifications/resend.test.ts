import { describe, expect, it, vi } from "vitest";
import { renderPostNotification } from "./render";
import { ResendMailer } from "./resend";

const API_KEY = "runtime-secret-resend-key";
const message = renderPostNotification({
  post: {
    slug: "hello-world",
    title: "Hello <world>",
    excerpt: "Read & learn.",
    date: "2026-07-16",
  },
  postUrl: "https://cumulush.com/logs/hello-world",
  browserUnsubscribeUrl: "https://cumulush.com/unsubscribe#token=signed",
  oneClickUnsubscribeUrl:
    "https://cumulush.com/api/notifications/unsubscribe?token=signed",
  recipientEmail: "reader@example.com",
  idempotencyKey: "blog-notification-stable",
  postalAddress: "Cumulus & Co., 42 Cloud Avenue, Madrid, Spain",
});

describe("Resend adapter", () => {
  it("sends one HTML/plaintext message with stable idempotency and unsubscribe headers", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(
      JSON.stringify({ id: "provider-message-id" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    const mailer = new ResendMailer({
      apiKey: API_KEY,
      fromEmail: "Cumulus <hi@cumulush.com>",
      fetcher,
    });

    await expect(mailer.send(message)).resolves.toEqual({
      ok: true,
      providerMessageId: "provider-message-id",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe(`Bearer ${API_KEY}`);
    expect(headers.get("idempotency-key")).toBe(message.idempotencyKey);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      from: "Cumulus <hi@cumulush.com>",
      to: ["reader@example.com"],
      html: message.html,
      text: message.text,
      headers: {
        "List-Unsubscribe": `<${message.oneClickUnsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    expect(String(url)).not.toContain(API_KEY);
    expect(String(init?.body)).not.toContain(API_KEY);
  });

  it.each([
    [429, true, "resend_http_429"],
    [503, true, "resend_http_503"],
    [400, false, "resend_http_400"],
    [401, false, "resend_http_401"],
    [422, false, "resend_http_422"],
  ])("classifies HTTP %i without returning the provider body", async (status, retryable, failureCode) => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(
      JSON.stringify({ message: "reader@example.com failed" }),
      { status, headers: { "Retry-After": "90" } },
    ));
    const mailer = new ResendMailer({
      apiKey: API_KEY,
      fromEmail: "hi@cumulush.com",
      fetcher,
    });
    const result = await mailer.send(message);

    expect(result).toMatchObject({ ok: false, retryable, failureCode });
    expect(JSON.stringify(result)).not.toContain("reader@example.com");
    if (!result.ok && retryable) expect(result.retryAfterSeconds).toBe(90);
  });

  it("distinguishes a different-payload idempotency conflict", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(
      JSON.stringify({ name: "invalid_idempotent_request" }),
      { status: 409 },
    ));
    const mailer = new ResendMailer({
      apiKey: API_KEY,
      fromEmail: "hi@cumulush.com",
      fetcher,
    });
    await expect(mailer.send(message)).resolves.toMatchObject({
      ok: false,
      retryable: false,
      failureCode: "resend_invalid_idempotency",
    });
  });

  it("defaults a missing retry header to sixty seconds and stops quota exhaustion", async () => {
    const responses = [
      new Response(JSON.stringify({ name: "rate_limit_exceeded" }), {
        status: 429,
      }),
      new Response(JSON.stringify({ name: "daily_quota_exceeded" }), {
        status: 429,
      }),
    ];
    const fetcher = vi.fn<typeof fetch>(async () => responses.shift()!);
    const mailer = new ResendMailer({
      apiKey: API_KEY,
      fromEmail: "hi@cumulush.com",
      fetcher,
    });

    await expect(mailer.send(message)).resolves.toMatchObject({
      ok: false,
      retryable: true,
      retryAfterSeconds: 60,
    });
    await expect(mailer.send(message)).resolves.toEqual({
      ok: false,
      failureCode: "resend_quota_exceeded",
      retryable: false,
      retryAfterSeconds: 60,
    });
  });

  it("treats a network outcome as retryable and does not expose the thrown detail", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => {
      throw new Error("reader@example.com API key leaked");
    });
    const mailer = new ResendMailer({
      apiKey: API_KEY,
      fromEmail: "hi@cumulush.com",
      fetcher,
    });
    const result = await mailer.send(message);
    expect(result).toMatchObject({
      ok: false,
      retryable: true,
      failureCode: "resend_network_error",
    });
    expect(JSON.stringify(result)).not.toContain("reader@example.com");
    expect(JSON.stringify(result)).not.toContain(API_KEY);
  });

  it("bounds provider response bodies before parsing", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(
      "x".repeat(4097),
      { status: 200 },
    ));
    const mailer = new ResendMailer({
      apiKey: API_KEY,
      fromEmail: "hi@cumulush.com",
      fetcher,
    });
    await expect(mailer.send(message)).resolves.toEqual({
      ok: false,
      failureCode: "resend_invalid_response",
      retryable: true,
      retryAfterSeconds: 60,
    });
  });
});

describe("email rendering", () => {
  it("escapes content and includes an accessible, bounded HTML document", () => {
    expect(message.html).toContain('<html lang="en" dir="ltr">');
    expect(message.html).toContain('<body lang="en" dir="ltr"');
    expect(message.html).toContain("<title>Hello &lt;world&gt;</title>");
    expect(message.html.match(/<h1\b/g)).toHaveLength(1);
    expect(message.html).not.toContain("Hello <world>");
    expect(message.html).toContain("Read Hello &lt;world&gt;");
    expect(new TextEncoder().encode(message.html).byteLength).toBeLessThan(102_400);
    expect(message.text).toContain("https://cumulush.com/logs/hello-world");
    expect(message.text).toContain("https://cumulush.com/unsubscribe#token=signed");
    expect(message.text).toContain(
      "Cumulus postal address: Cumulus & Co., 42 Cloud Avenue, Madrid, Spain",
    );
    expect(message.html).toContain(
      "Cumulus postal address: Cumulus &amp; Co., 42 Cloud Avenue, Madrid, Spain",
    );
  });
});
