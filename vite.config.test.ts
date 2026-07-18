import { describe, expect, it, vi } from "vitest";

import { createLocalFontBoundaryMiddleware } from "./vite-alcyone-font-boundary";

function runMiddleware(method: string, url: string) {
  const middleware = createLocalFontBoundaryMiddleware();
  const response = {
    end: vi.fn(),
    setHeader: vi.fn(),
    statusCode: 200,
  };
  const next = vi.fn();

  middleware(
    { method, url } as Parameters<typeof middleware>[0],
    response as unknown as Parameters<typeof middleware>[1],
    next,
  );

  return { next, response };
}

describe("local Alcyone font boundary", () => {
  it("answers a HEAD capability probe quietly without a font content type", () => {
    const { next, response } = runMiddleware(
      "HEAD",
      "/api/fonts/alcyone-medium",
    );

    expect(response.statusCode).toBe(204);
    expect(response.end).toHaveBeenCalledOnce();
    expect(response.end.mock.calls[0]).toEqual([]);
    expect(response.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "private, no-store, max-age=0",
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      "Cross-Origin-Resource-Policy",
      "same-origin",
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      "X-Content-Type-Options",
      "nosniff",
    );
    expect(response.setHeader).not.toHaveBeenCalledWith(
      "Content-Type",
      expect.anything(),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("fails a GET request closed", () => {
    const { next, response } = runMiddleware(
      "GET",
      "/api/fonts/alcyone-medium",
    );

    expect(response.statusCode).toBe(503);
    expect(response.end).toHaveBeenCalledOnce();
    expect(response.end.mock.calls[0]).toEqual([]);
    expect(response.setHeader).not.toHaveBeenCalledWith(
      "Content-Type",
      expect.anything(),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it.each(["POST", "OPTIONS"])(
    "rejects an unsupported %s request with the Production method contract",
    (method) => {
      const { next, response } = runMiddleware(
        method,
        "/api/fonts/alcyone-medium",
      );

      expect(response.statusCode).toBe(405);
      expect(response.end).toHaveBeenCalledOnce();
      expect(response.end.mock.calls[0]).toEqual([]);
      expect(response.setHeader).toHaveBeenCalledWith("Allow", "GET, HEAD");
      expect(response.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        "private, no-store, max-age=0",
      );
      expect(response.setHeader).not.toHaveBeenCalledWith(
        "Content-Type",
        expect.anything(),
      );
      expect(next).not.toHaveBeenCalled();
    },
  );

  it("recognizes the font endpoint when it has a query string", () => {
    const { next, response } = runMiddleware(
      "HEAD",
      "/api/fonts/alcyone-medium?capability=1",
    );

    expect(response.statusCode).toBe(204);
    expect(response.end).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });

  it("passes unrelated requests to the next middleware without changing the response", () => {
    const { next, response } = runMiddleware("GET", "/api/posts?limit=10");

    expect(next).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(200);
    expect(response.setHeader).not.toHaveBeenCalled();
    expect(response.end).not.toHaveBeenCalled();
  });
});
