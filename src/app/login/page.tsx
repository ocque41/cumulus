import Image from "next/image";
import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";

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
  "Rune for autonomous workflows",
  "Notes for lightweight capture",
  "Hub for switching across surfaces",
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
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Tado home">
              <Image
                src="/Logo-256.png"
                alt="Tado logo"
                width={72}
                height={72}
                className="h-14 w-14 object-contain brightness-110 contrast-125"
                priority
              />
              <span className="[font-family:var(--type-brand-family)] text-xl tracking-[0.2em] text-[color:var(--title)]">
                Tado
              </span>
            </Link>

            <div className="space-y-4">
              <p className="w-fit rounded-full border border-white/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Account Access
              </p>
              <h1 className="max-w-[10ch] text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.86] tracking-[-0.1em] text-[color:var(--title)] [font-family:var(--type-title-family)] [font-weight:var(--type-title-weight)]">
                Sign in to Tado.
              </h1>
              <p className="max-w-[58ch] text-[1.05rem] leading-[1.7] text-[color:var(--subtitle)]">
                Tado is the agent workspace. Spawn, message, and orchestrate agents across terminal sessions from a single canvas.
                Use one account to access the dashboard and manage your multi-agent workflows.
              </p>
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
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-[color:var(--muted)]">Local-first model</p>
            <p className="mt-2 text-sm leading-[1.7] text-[color:var(--text)]">
              Human notes, agent notes, runs, and calendar state stay readable and explicit.
            </p>
          </div>
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-[color:var(--muted)]">Need product help?</p>
            <p className="mt-2 text-sm leading-[1.7] text-[color:var(--text)]">
              Cumulus still ships the product. If you need custom work, use{" "}
              <Link href="/contact" className="text-[color:var(--title)] underline underline-offset-4">
                contact
              </Link>
              .
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
