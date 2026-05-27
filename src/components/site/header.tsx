"use client";

import Image from "next/image";
import Link from "next/link";

import { CREATE_SHORT_COMMAND } from "@/lib/cumulus-create";

const darkLogo = "/create/darkmode.png";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--hairline)] bg-[color:var(--bg)]/95">
      <div className="mx-auto flex w-full max-w-[1560px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-3" aria-label="Cumulus home">
          <Image src={darkLogo} alt="Cumulus" width={1122} height={1402} className="h-10 w-10 rounded-[5.5px] object-cover" priority />
          <span className="hidden font-mono text-xs uppercase text-[color:var(--title)] sm:inline">
            Cumulus Create
          </span>
        </Link>

        <code className="hidden min-w-0 max-w-[52vw] overflow-x-auto rounded-[5.5px] border border-[color:var(--hairline)] px-3 py-2 font-mono text-xs text-[color:var(--subtitle)] md:block">
          {CREATE_SHORT_COMMAND}
        </code>

        <Link
          href="/dashboard"
          className="rounded-[5.5px] bg-[color:var(--color-paper)] px-4 py-2 text-sm font-semibold text-[color:var(--color-ink)] transition hover:opacity-90"
        >
          Dashboard
        </Link>
      </div>
    </header>
  );
}
