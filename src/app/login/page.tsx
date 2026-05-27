import Image from "next/image";
import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { CREATE_SHORT_COMMAND } from "@/lib/cumulus-create";

type AuthMode = "login" | "signup" | "forgot-password";
type SearchParamValue = string | string[] | undefined;
const darkLogo = "/create/darkmode.png";

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
      <section className="flex min-h-[40vh] flex-col justify-between rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-standard)] p-6 shadow-[var(--glass-shadow-e3)] backdrop-blur-[18px] sm:p-8 lg:min-h-[calc(100vh-7rem)] lg:p-10">
        <div className="space-y-8">
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Cumulus home">
              <Image
                src={darkLogo}
                alt="Cumulus"
                width={1122}
                height={1402}
                className="h-14 w-14 rounded-[5.5px] object-cover"
                priority
              />
              <span className="[font-family:var(--type-brand-family)] text-xl text-[color:var(--title)]">
                Cumulus
              </span>
            </Link>

            <div className="space-y-4">
              <p className="w-fit rounded-full border border-white/10 px-3 py-1 text-[0.68rem] uppercase text-[color:var(--muted)]">
                Account Access
              </p>
              <h1 className="max-w-[10ch] text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.86] text-[color:var(--title)] [font-family:var(--type-title-family)] [font-weight:var(--type-title-weight)]">
                Sign in to Cumulus.
              </h1>
              <p className="max-w-[58ch] text-[1.05rem] leading-[1.7] text-[color:var(--subtitle)]">
                Cumulus Create builds a ready app from one command.
              </p>
              <code className="block w-fit max-w-full overflow-x-auto rounded-[5.5px] border border-white/10 bg-black px-3 py-2 font-mono text-sm text-[color:var(--color-paper)]">
                {CREATE_SHORT_COMMAND}
              </code>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {experimentalApps.map((item) => (
              <div
                key={item}
                className="rounded-[5.5px] border border-white/8 bg-white/[0.025] px-4 py-4 text-sm leading-[1.6] text-[color:var(--text)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
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
