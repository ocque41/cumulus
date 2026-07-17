import { describe, expect, it } from "vitest";

import { PUBLIC_WORK_COUNT, WORK_PROJECTS } from "./work";

describe("public work directory", () => {
  it("documents a substantial, uniquely routed lab portfolio", () => {
    expect(WORK_PROJECTS).toHaveLength(10);
    expect(new Set(WORK_PROJECTS.map((project) => project.slug)).size).toBe(
      WORK_PROJECTS.length,
    );

    for (const project of WORK_PROJECTS) {
      expect(project.description.length, project.name).toBeGreaterThan(100);
      expect(project.latestWork.length, project.name).toBeGreaterThan(150);
      expect(project.stack.length, project.name).toBeGreaterThanOrEqual(5);
      expect(project.sourceBoundary.length, project.name).toBeGreaterThan(45);
      expect(project.verifiedAt, project.name).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(`${project.verifiedAt}T00:00:00Z`))).toBe(false);
    }
  });

  it("links only reviewed public snapshots and keeps private work unlinked", () => {
    const publicProjects = WORK_PROJECTS.filter((project) => project.source);
    expect(publicProjects).toHaveLength(PUBLIC_WORK_COUNT);
    expect(PUBLIC_WORK_COUNT).toBe(5);

    for (const project of publicProjects) {
      const url = new URL(project.source!.href);
      expect(url.protocol).toBe("https:");
      expect(url.hostname).toBe("github.com");
      expect(url.pathname).toMatch(/\/tree\/[a-f0-9]{7,40}$/);
      expect(project.source!.label).toBe("View source");
    }

    expect(WORK_PROJECTS.find((project) => project.slug === "cumulus")?.source?.href)
      .toBe("https://github.com/ocque41/cumulus/tree/92ed67e071bcee7504fc256fac9976891a85bedb");

    for (const slug of ["room", "requisia", "hyoka-hanesu", "gy", "toml-agent"]) {
      expect(WORK_PROJECTS.find((project) => project.slug === slug)?.source).toBeUndefined();
    }
  });

  it("contains no local paths or visible personal identifiers", () => {
    const visibleCopy = WORK_PROJECTS.flatMap((project) => [
      project.name,
      project.description,
      project.latestWork,
      project.status,
      project.domain,
      project.sourceBoundary,
      project.verifiedAt,
      ...project.stack,
    ]).join(" ");

    expect(visibleCopy).not.toMatch(/\/Users\/|localhost|127\.0\.0\.1|ocque41/i);
  });
});
