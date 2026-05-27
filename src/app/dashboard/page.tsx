"use client";

import { useMemo, useState } from "react";

import { CopyCommand } from "@/components/create/copy-command";
import {
  agentAuthRows,
  buildCreateCommand,
  CREATE_AGENT_AUTH_MODES,
  CREATE_CUMULUS_DB_MODES,
  CREATE_FEATURES,
  CREATE_NPM_SHORTHAND,
  CREATE_PACKAGE_MANAGERS,
  CREATE_PACKAGE_NAME,
  CREATE_TEMPLATES,
  createDefaults,
  createExamples,
  cumulusDbRows,
  defaultCumulusDbForTemplate,
  templateRows,
  type CreateAgentAuthMode,
  type CreateCumulusDbMode,
  type CreateFeature,
  type CreatePackageManager,
  type CreateTemplate,
} from "@/lib/cumulus-create";

function SegmentButton<T extends string>({
  active,
  label,
  onSelect,
  value,
}: {
  active: boolean;
  label: string;
  onSelect: (value: T) => void;
  value: T;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={[
        "rounded-[5.5px] border px-3 py-2 font-mono text-xs uppercase",
        active
          ? "border-[color:var(--title)] bg-[color:var(--title)] text-[color:var(--bg)]"
          : "border-[color:var(--hairline)] text-[color:var(--muted)]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="font-mono text-[0.72rem] uppercase text-[color:var(--muted)]">
      {children}
    </span>
  );
}

export default function DashboardPage() {
  const [projectName, setProjectName] = useState(createDefaults.projectName);
  const [company, setCompany] = useState(createDefaults.company);
  const [template, setTemplate] = useState<CreateTemplate>(createDefaults.template);
  const [agentAuth, setAgentAuth] = useState<CreateAgentAuthMode>(createDefaults.agentAuth);
  const [cumulusDb, setCumulusDb] = useState<CreateCumulusDbMode>(createDefaults.cumulusDb);
  const [features, setFeatures] = useState<CreateFeature[]>(createDefaults.features);
  const [packageManager, setPackageManager] = useState<CreatePackageManager>(createDefaults.packageManager);
  const [install, setInstall] = useState(createDefaults.install);
  const [git, setGit] = useState(createDefaults.git);
  const [dryRun, setDryRun] = useState(createDefaults.dryRun);
  const [installRuntimes, setInstallRuntimes] = useState(createDefaults.installRuntimes);
  const [dbTouched, setDbTouched] = useState(false);

  const hasKnowledge = features.includes("knowledge");

  const command = useMemo(
    () =>
      buildCreateCommand({
        projectName,
        company,
        template,
        agentAuth,
        cumulusDb,
        features,
        packageManager,
        install,
        git,
        dryRun,
        installRuntimes,
      }),
    [agentAuth, company, cumulusDb, dryRun, features, git, install, installRuntimes, packageManager, projectName, template],
  );
  const runChoices: Array<{ label: string; checked: boolean; setter: (value: boolean) => void }> = [
    { label: "Install deps", checked: install, setter: setInstall },
    { label: "Git init", checked: git, setter: setGit },
    { label: "Dry run", checked: dryRun, setter: setDryRun },
  ];

  function updateTemplate(nextTemplate: CreateTemplate) {
    setTemplate(nextTemplate);
    if (!dbTouched) {
      setCumulusDb(defaultCumulusDbForTemplate(nextTemplate));
    }
  }

  function updateFeature(feature: CreateFeature) {
    setFeatures((current) => {
      const next = current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature].sort((a, b) => CREATE_FEATURES.indexOf(a) - CREATE_FEATURES.indexOf(b));

      if (!next.includes("knowledge")) {
        setInstallRuntimes(false);
      }

      return next;
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-8 px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <section className="rounded-[5.5px] border border-[color:var(--hairline)] p-5 sm:p-8">
        <p className="font-mono text-[0.72rem] uppercase text-[color:var(--muted)]">
          Cumulus Create
        </p>
        <h1 className="mt-4 max-w-[12ch] text-5xl leading-none text-[color:var(--title)] sm:text-7xl">
          Build the command.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--subtitle)]">
          Choose the app parts. Click the command to copy it.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)]">
        <div className="space-y-6 rounded-[5.5px] border border-[color:var(--hairline)] p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <FieldLabel>Project name</FieldLabel>
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                className="h-11 w-full rounded-[5.5px] border border-[color:var(--hairline)] bg-transparent px-3 text-sm text-[color:var(--title)] outline-none focus:border-[color:var(--title)]"
              />
            </label>
            <label className="space-y-2">
              <FieldLabel>Company</FieldLabel>
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Acme Inc"
                className="h-11 w-full rounded-[5.5px] border border-[color:var(--hairline)] bg-transparent px-3 text-sm text-[color:var(--title)] outline-none focus:border-[color:var(--title)]"
              />
            </label>
          </div>

          <div className="space-y-3">
            <FieldLabel>Template</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {CREATE_TEMPLATES.map((value) => (
                <SegmentButton key={value} value={value} label={value} active={template === value} onSelect={updateTemplate} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <FieldLabel>Agent auth</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {CREATE_AGENT_AUTH_MODES.map((value) => (
                <SegmentButton key={value} value={value} label={value} active={agentAuth === value} onSelect={setAgentAuth} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <FieldLabel>Cumulus DB</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {CREATE_CUMULUS_DB_MODES.map((value) => (
                <SegmentButton
                  key={value}
                  value={value}
                  label={value}
                  active={cumulusDb === value}
                  onSelect={(next) => {
                    setDbTouched(true);
                    setCumulusDb(next);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <FieldLabel>Parts</FieldLabel>
            <div className="grid gap-2 sm:grid-cols-3">
              {CREATE_FEATURES.map((feature) => (
                <label
                  key={feature}
                  className="flex items-center gap-3 rounded-[5.5px] border border-[color:var(--hairline)] px-3 py-3 text-sm text-[color:var(--subtitle)]"
                >
                  <input
                    type="checkbox"
                    checked={features.includes(feature)}
                    onChange={() => updateFeature(feature)}
                    className="h-4 w-4 accent-[color:var(--title)]"
                  />
                  <span>{feature}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <FieldLabel>Package manager</FieldLabel>
              <select
                value={packageManager}
                onChange={(event) => setPackageManager(event.target.value as CreatePackageManager)}
                className="h-11 w-full rounded-[5.5px] border border-[color:var(--hairline)] bg-[color:var(--bg)] px-3 text-sm text-[color:var(--title)] outline-none focus:border-[color:var(--title)]"
              >
                {CREATE_PACKAGE_MANAGERS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              <FieldLabel>Run choices</FieldLabel>
              <div className="grid gap-2">
                {runChoices.map((choice) => (
                  <label key={choice.label} className="flex items-center justify-between rounded-[5.5px] border border-[color:var(--hairline)] px-3 py-2 text-sm">
                    <span>{choice.label}</span>
                    <input
                      type="checkbox"
                      checked={choice.checked}
                      onChange={(event) => choice.setter(event.target.checked)}
                      className="h-4 w-4 accent-[color:var(--title)]"
                    />
                  </label>
                ))}
                <label className="flex items-center justify-between rounded-[5.5px] border border-[color:var(--hairline)] px-3 py-2 text-sm">
                  <span>Install Knowledge runtimes</span>
                  <input
                    type="checkbox"
                    checked={installRuntimes && hasKnowledge}
                    disabled={!hasKnowledge}
                    onChange={(event) => setInstallRuntimes(event.target.checked)}
                    className="h-4 w-4 accent-[color:var(--title)] disabled:opacity-40"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="sticky top-24 rounded-[5.5px] border border-[color:var(--hairline)] p-5">
            <FieldLabel>Command</FieldLabel>
            <CopyCommand command={command} className="mt-4 w-full p-4 text-sm" />
            <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--subtitle)]">
              <CopyCommand command={CREATE_NPM_SHORTHAND} />
              <p>
                This shorthand and <code className="font-mono text-[color:var(--title)]">{CREATE_PACKAGE_NAME}</code> download the same package
                and run the same create binary after it has been published.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[5.5px] border border-[color:var(--hairline)] p-5">
          <FieldLabel>Templates</FieldLabel>
          <div className="mt-4 space-y-4">
            {templateRows.map((row) => (
              <p key={row.value} className="text-sm leading-7 text-[color:var(--subtitle)]">
                <code className="font-mono text-[color:var(--title)]">{row.value}</code> {row.includes}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-[5.5px] border border-[color:var(--hairline)] p-5">
          <FieldLabel>Agent auth</FieldLabel>
          <div className="mt-4 space-y-4">
            {agentAuthRows.map((row) => (
              <p key={row.value} className="text-sm leading-7 text-[color:var(--subtitle)]">
                <code className="font-mono text-[color:var(--title)]">{row.value}</code> {row.useWhen}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-[5.5px] border border-[color:var(--hairline)] p-5">
          <FieldLabel>Cumulus DB</FieldLabel>
          <div className="mt-4 space-y-4">
            {cumulusDbRows.map((row) => (
              <p key={row.value} className="text-sm leading-7 text-[color:var(--subtitle)]">
                <code className="font-mono text-[color:var(--title)]">{row.value}</code> {row.meaning}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[5.5px] border border-[color:var(--hairline)] p-5">
        <FieldLabel>Examples</FieldLabel>
        <div className="mt-4 grid gap-3">
          {createExamples.map((example) => (
            <CopyCommand key={example} command={example} className="w-full px-4 py-3 text-sm" />
          ))}
        </div>
        <p className="mt-5 text-sm leading-7 text-[color:var(--subtitle)]">
          Defaults: full template, hosted auth, npm, no install, and no git init.
        </p>
      </section>
    </main>
  );
}
