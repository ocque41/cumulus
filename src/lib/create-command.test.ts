import { describe, expect, it } from "vitest";

import {
  buildCreateCommand,
  createDefaults,
  defaultCumulusDbForTemplate,
  type CreateCommandOptions,
} from "./create-command";

function withOptions(overrides: Partial<CreateCommandOptions> = {}) {
  return buildCreateCommand({ ...createDefaults, ...overrides });
}

describe("buildCreateCommand", () => {
  it("builds the default command", () => {
    expect(withOptions()).toBe(
      "npm create @cmls@latest -- --template full --agent-auth hosted --cumulus-db both --with auth,db,knowledge --package-manager npm --no-install --no-git",
    );
  });

  it("adds explicit template, auth, company, package manager, install, and git flags", () => {
    expect(
      withOptions({
        projectName: "acme-app",
        company: "Acme Inc",
        template: "inner",
        agentAuth: "self-hosted",
        cumulusDb: "local",
        packageManager: "pnpm",
        install: true,
        git: true,
      }),
    ).toBe(
      'npm create @cmls@latest acme-app -- --template inner --agent-auth self-hosted --cumulus-db local --with auth,db,knowledge --package-manager pnpm --company "Acme Inc" --install --git',
    );
  });

  it("keeps selected features in order", () => {
    expect(withOptions({ features: ["auth", "knowledge"] })).toContain("--with auth,knowledge");
  });

  it("uses runtime setup only when knowledge is selected", () => {
    expect(withOptions({ installRuntimes: true })).toContain("--install-runtimes");
    expect(withOptions({ features: ["auth", "db"], installRuntimes: true })).not.toContain("--install-runtimes");
  });

  it("adds dry run when selected", () => {
    expect(withOptions({ dryRun: true })).toContain("--dry-run");
  });
});

describe("defaultCumulusDbForTemplate", () => {
  it("uses cloud for outer and both for the app templates", () => {
    expect(defaultCumulusDbForTemplate("outer")).toBe("cloud");
    expect(defaultCumulusDbForTemplate("full")).toBe("both");
    expect(defaultCumulusDbForTemplate("inner")).toBe("both");
    expect(defaultCumulusDbForTemplate("agent-auth")).toBe("both");
  });
});
