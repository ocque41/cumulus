import Link from "next/link";

import { CopyCommand } from "@/components/create/copy-command";
import { CREATE_SHORT_COMMAND } from "@/lib/create-command";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--hairline)] bg-[color:var(--bg)]">
      <div className="mx-auto flex w-full max-w-[1560px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <Link href="/" className="font-mono text-xs uppercase text-[color:var(--title)]" aria-label="Cumulus home">
          Cumulus
        </Link>

        <CopyCommand
          command={CREATE_SHORT_COMMAND}
          className="hidden min-w-0 max-w-[52vw] px-3 py-2 md:flex"
        />

        <Link
          href="/dashboard"
          className="rounded-[5.5px] border border-[color:var(--hairline)] px-4 py-2 text-sm font-semibold text-[color:var(--title)]"
        >
          Dashboard
        </Link>
      </div>
    </header>
  );
}
