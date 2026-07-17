import { act, renderHook, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
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

  it("lets the newest manual session refresh win a response race", async () => {
    let finishFirstRetry: ((response: Response) => void) | undefined;
    let finishSecondRetry: ((response: Response) => void) | undefined;
    const firstRetry = new Promise<Response>((resolve) => {
      finishFirstRetry = resolve;
    });
    const secondRetry = new Promise<Response>((resolve) => {
      finishSecondRetry = resolve;
    });
    let request = 0;
    const fetcher = vi.fn(() => {
      request += 1;
      if (request === 1) {
        return Promise.resolve(new Response(JSON.stringify({ ok: false }), {
          status: 503,
        }));
      }
      return request === 2 ? firstRetry : secondRetry;
    }) as unknown as typeof fetch;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider fetcher={fetcher}>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.available).toBe(false));

    let firstRefresh: Promise<void> | undefined;
    let secondRefresh: Promise<void> | undefined;
    act(() => {
      firstRefresh = result.current.refreshSession();
      secondRefresh = result.current.refreshSession();
    });

    await act(async () => {
      finishSecondRetry?.(new Response(JSON.stringify({
        ok: true,
        user: { email: "newest@example.com" },
      })));
      await secondRefresh;
    });
    await act(async () => {
      finishFirstRetry?.(new Response(JSON.stringify({ ok: false }), {
        status: 503,
      }));
      await firstRefresh;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.available).toBe(true);
    expect(result.current.user).toEqual({ email: "newest@example.com" });
  });

  it("keeps session initialization stable when rendered in StrictMode", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      user: { email: "strict@example.com" },
    }))) as unknown as typeof fetch;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StrictMode>
        <AuthProvider fetcher={fetcher}>{children}</AuthProvider>
      </StrictMode>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.available).toBe(true);
    expect(result.current.user).toEqual({ email: "strict@example.com" });
  });
});
