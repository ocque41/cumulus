import { act, render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LicensedBodyFont } from "./LicensedBodyFont";

const ATTRIBUTE = "data-body-font";

function fontResponse(init?: ResponseInit): Response {
  return new Response(null, {
    headers: { "Content-Type": "font/woff2" },
    status: 200,
    ...init,
  });
}

afterEach(() => {
  document.documentElement.removeAttribute(ATTRIBUTE);
  vi.unstubAllGlobals();
});

describe("LicensedBodyFont", () => {
  it("enables Alcyone only after a successful WOFF2 HEAD response", async () => {
    const fetcher = vi.fn().mockResolvedValue(fontResponse());
    vi.stubGlobal("fetch", fetcher);

    const { container } = render(<LicensedBodyFont />);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute(ATTRIBUTE, "alcyone");
    });
    expect(container).toBeEmptyDOMElement();
    expect(fetcher).toHaveBeenCalledWith(
      "/api/fonts/alcyone-medium",
      expect.objectContaining({
        cache: "default",
        credentials: "same-origin",
        headers: { Accept: "font/woff2" },
        method: "HEAD",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("keeps the fallback for an invalid content type", async () => {
    const fetcher = vi.fn().mockResolvedValue(fontResponse({
      headers: { "Content-Type": "application/octet-stream" },
    }));
    vi.stubGlobal("fetch", fetcher);

    render(<LicensedBodyFont />);

    await act(async () => {
      await fetcher.mock.results[0]?.value;
    });
    expect(document.documentElement).not.toHaveAttribute(ATTRIBUTE);
  });

  it.each([
    ["a non-OK response", () => Promise.resolve(fontResponse({ status: 404 }))],
    ["a request error", () => Promise.reject(new Error("network unavailable"))],
  ])("keeps the fallback for %s", async (_reason, result) => {
    const fetcher = vi.fn(result);
    vi.stubGlobal("fetch", fetcher);

    render(<LicensedBodyFont />);
    const request = fetcher.mock.results[0]?.value;

    await act(async () => {
      await request?.catch(() => undefined);
    });
    expect(document.documentElement).not.toHaveAttribute(ATTRIBUTE);
  });

  it("aborts on cleanup and ignores a late successful response", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const request = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetcher = vi.fn().mockReturnValue(request);
    vi.stubGlobal("fetch", fetcher);

    const view = render(<LicensedBodyFont />);
    const signal = fetcher.mock.calls[0]?.[1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);

    view.unmount();

    expect(signal?.aborted).toBe(true);
    await act(async () => {
      resolveRequest?.(fontResponse());
      await request;
    });
    expect(document.documentElement).not.toHaveAttribute(ATTRIBUTE);
  });

  it("allows the live Strict Mode request to enable the font", async () => {
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn((_: RequestInfo | URL, init?: RequestInit) => {
      if (init?.signal) signals.push(init.signal);
      return Promise.resolve(fontResponse());
    });
    vi.stubGlobal("fetch", fetcher);

    render(
      <StrictMode>
        <LicensedBodyFont />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute(ATTRIBUTE, "alcyone");
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });
});
