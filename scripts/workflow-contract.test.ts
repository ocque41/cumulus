import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

async function workflow(name: string): Promise<string> {
  return readFile(resolve(process.cwd(), ".github", "workflows", name), "utf8");
}

describe("repository-owned publication workflows", () => {
  it("accepts dispatches from the publisher and keeps repository mutation in Actions", async () => {
    const [prepare, validate, merge] = await Promise.all([
      workflow("prepare-publication.yml"),
      workflow("validate-publication.yml"),
      workflow("merge-publication.yml"),
    ]);

    expect(prepare).toMatch(/workflow_dispatch:/);
    expect(validate).toMatch(/workflow_dispatch:/);
    expect(merge).toMatch(/workflow_dispatch:/);
    expect(prepare).toMatch(/contents: write/);
    expect(prepare).toMatch(/pull-requests: write/);
    expect(merge).toMatch(/contents: write/);
    expect(merge).toMatch(/pull-requests: write/);
    expect(prepare).toMatch(/run-name: Prepare publication · \$\{\{ inputs\.correlation_id \}\}/);
    expect(prepare).toMatch(/VALIDATED_CORRELATION_ID/);
  });

  it("publishes safe preparation and merge artifacts for Actions-only orchestration", async () => {
    const [prepare, merge] = await Promise.all([
      workflow("prepare-publication.yml"),
      workflow("merge-publication.yml"),
    ]);

    expect(prepare).toMatch(/name: publisher-prepare-result/);
    expect(prepare).toMatch(/path: publisher-result\.json/);
    expect(merge).toMatch(/name: publisher-merge-result/);
    expect(merge).toMatch(/path: publisher-merge-result\.json/);
    expect(merge).toMatch(/head_sha: process\.env\.HEAD_SHA/);
    expect(merge).toMatch(/merge_sha: response\.sha/);
    expect(merge).toMatch(/failure_code: process\.env\.FAILURE_CODE/);
    expect(merge).toMatch(/result: "rejected"/);
    expect(merge).not.toMatch(/MERGE_RESPONSE.*echo/);
  });

  it("exposes the homepage order in static metadata for deployment verification", async () => {
    const generator = await readFile(
      resolve(process.cwd(), "scripts", "generate-static-routes.mjs"),
      "utf8",
    );

    expect(generator).toMatch(/publishedPosts\.slice\(0, 5\)/);
    expect(generator).toMatch(/position: index \+ 1/);
    expect(generator).toMatch(/url: `\$\{ORIGIN\}\/logs\/\$\{post\.slug\}`/);
  });
});
