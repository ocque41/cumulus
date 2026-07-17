import { describe, expect, it } from "vitest";

import { WORK_PROJECTS as FOCUSED_WORK_PROJECTS } from "./focused-work";
import {
  PUBLIC_WORK_COUNT,
  WORK_PROJECTS,
  getWorkProject,
} from "./work";

const EXPECTED_PROJECTS = [
  ["requisia", "Requisia"],
  ["insuja", "Insuja"],
  ["hyoka-hanesu", "Hyoka Hanesu"],
  ["gy", "gy"],
] as const;

describe("public work directory", () => {
  it("uses one four-project first-party catalog everywhere", () => {
    expect(WORK_PROJECTS).toBe(FOCUSED_WORK_PROJECTS);
    expect(WORK_PROJECTS.map(({ slug, name }) => [slug, name])).toEqual(
      EXPECTED_PROJECTS,
    );
    expect(new Set(WORK_PROJECTS.map((project) => project.slug)).size).toBe(4);

    for (const [slug] of EXPECTED_PROJECTS) {
      expect(getWorkProject(`  ${slug.toUpperCase()}  `)?.slug).toBe(slug);
    }
    expect(getWorkProject("missing-project")).toBeUndefined();
  });

  it("provides substantial descriptions with explicit evidence limits", () => {
    for (const project of WORK_PROJECTS) {
      expect(project.description.length, project.name).toBeGreaterThan(140);
      expect(project.latestWork.length, project.name).toBeGreaterThan(190);
      expect(project.stack.length, project.name).toBeGreaterThanOrEqual(6);
      expect(project.sourceBoundary.length, project.name).toBeGreaterThan(120);
      expect(project.status, project.name).toMatch(
        /development|pre-production|local|prototype/i,
      );
      expect(project.sourceBoundary, project.name).toMatch(
        /private|first-party|maintainer/i,
      );
      expect(project.verifiedAt, project.name).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(`${project.verifiedAt}T00:00:00Z`))).toBe(false);
    }
  });

  it("contains no public-source claim, local path, endpoint, or identifier", () => {
    expect(PUBLIC_WORK_COUNT).toBe(0);

    const serialized = JSON.stringify(WORK_PROJECTS);
    expect(serialized).not.toMatch(/https?:\/\//i);
    expect(serialized).not.toMatch(
      /\/Users\/|\/private\/|localhost|127\.0\.0\.1|ocque41|@[a-z0-9.-]+\.[a-z]{2,}/i,
    );
    expect(serialized).not.toMatch(
      /api[_-]?key|service[_-]?role|access[_-]?token|customer[_-]?id/i,
    );
  });
});
