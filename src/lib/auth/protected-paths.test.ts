import { describe, expect, it } from "vitest";

import { isAuthProtectedPath } from "./protected-paths";

describe("auth protected paths", () => {
  it("protects dashboard and system routes", () => {
    expect(isAuthProtectedPath("/dashboard")).toBe(true);
    expect(isAuthProtectedPath("/dashboard/system")).toBe(true);
    expect(isAuthProtectedPath("/dashboard/database")).toBe(true);
  });

  it("protects settings routes", () => {
    expect(isAuthProtectedPath("/settings")).toBe(true);
    expect(isAuthProtectedPath("/settings/profile")).toBe(true);
  });

  it("does not protect similarly named public routes", () => {
    expect(isAuthProtectedPath("/")).toBe(false);
    expect(isAuthProtectedPath("/login")).toBe(false);
    expect(isAuthProtectedPath("/dashboardish")).toBe(false);
    expect(isAuthProtectedPath("/products/dashboard")).toBe(false);
  });
});
