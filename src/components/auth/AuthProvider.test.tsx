import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "./AuthContext";
import { AuthProvider } from "./AuthProvider";

describe("AuthProvider", () => {
  it("does not let a stale anonymous session response erase a magic-link exchange", async () => {
    let finishInitialSession: ((response: Response) => void) | undefined;
    const initialSession = new Promise<Response>((resolve) => {
      finishInitialSession = resolve;
    });
    const fetcher = vi.fn((_: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "GET") return initialSession;
      if (init?.method === "POST") {
        return Promise.resolve(new Response(JSON.stringify({
          ok: true,
          user: { email: "reader@example.com" },
        })));
      }
      return Promise.reject(new Error("unexpected_request"));
    }) as unknown as typeof fetch;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider fetcher={fetcher}>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(result.current.exchangeMagicLink("valid-token")).resolves.toMatchObject({
        ok: true,
      });
    });
    expect(result.current.user).toEqual({ email: "reader@example.com" });

    await act(async () => {
      finishInitialSession?.(new Response(JSON.stringify({ ok: true, user: null })));
      await initialSession;
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toEqual({ email: "reader@example.com" });
  });
});
