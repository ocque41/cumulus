import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { CopyCommand } from "@/components/create/copy-command";
import { CREATE_SHORT_COMMAND } from "@/lib/create-command";

type AuthMode = "login" | "signup" | "forgot-password";
type SearchParamValue = string | string[] | undefined;

function resolveInitialTab(mode: string | null): AuthMode {
  if (mode === "signup" || mode === "forgot-password") {
    return mode;
  }

  return "login";
}

function getSingleSearchParam(value: SearchParamValue): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return null;
}

const experimentalApps = [
  "Choose a template",
  "Pick hosted or self-hosted Relay",
  "Add Cumulus DB and Knowledge",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const initialTab = resolveInitialTab(getSingleSearchParam(params.mode));
  const redirectTo = getSingleSearchParam(params.redirectTo);

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1480px] gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:px-8 lg:py-14">
      <section className="flex min-h-[40vh] flex-col justify-between rounded-[5.5px] border border-[color:var(--hairline)] p-6 sm:p-8 lg:min-h-[calc(100vh-7rem)] lg:p-10">
        <div className="space-y-8">
          <div className="space-y-5">
            <Link href="/" className="font-mono text-xs uppercase text-[color:var(--title)]" aria-label="Cumulus home">
              Cumulus
            </Link>

            <div className="space-y-4">
              <p className="w-fit rounded-[5.5px] border border-[color:var(--hairline)] px-3 py-1 text-[0.68rem] uppercase text-[color:var(--muted)]">
                Account Access
              </p>
              <h1 className="max-w-[10ch] text-5xl leading-none text-[color:var(--title)] sm:text-7xl">
                Sign in to Cumulus.
              </h1>
              <p className="max-w-[58ch] text-[1.05rem] leading-[1.7] text-[color:var(--subtitle)]">
                Cumulus builds a ready app from one command.
              </p>
              <CopyCommand command={CREATE_SHORT_COMMAND} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {experimentalApps.map((item) => (
              <div
                key={item}
                className="rounded-[5.5px] border border-[color:var(--hairline)] px-4 py-4 text-sm leading-[1.6] text-[color:var(--text)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 border-t border-[color:var(--hairline)] pt-6 sm:grid-cols-2">
          <div>
            <p className="text-[0.7rem] uppercase text-[color:var(--muted)]">Create command</p>
            <p className="mt-2 text-sm leading-[1.7] text-[color:var(--text)]">
              Build the command from the dashboard, then run it in your terminal.
            </p>
          </div>
          <div>
            <p className="text-[0.7rem] uppercase text-[color:var(--muted)]">Start fast</p>
            <p className="mt-2 text-sm leading-[1.7] text-[color:var(--text)]">
              Use defaults for full, hosted, npm, no install, and no git init.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center py-4 lg:py-10">
        <div className="w-full max-w-md">
          <AuthForm initialTab={initialTab} redirectTo={redirectTo} />
        </div>
      </section>
    </div>
  );
}
