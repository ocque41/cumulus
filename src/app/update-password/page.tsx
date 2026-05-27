"use client";

import Link from "next/link";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[980px] flex-col justify-center gap-8 px-4 py-12">
      <div className="space-y-3">
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-[color:var(--muted)]">Password Reset</p>
        <h1 className="max-w-[12ch] text-[clamp(2.8rem,7vw,5rem)] leading-[0.9] tracking-[-0.08em] text-[color:var(--title)] [font-family:var(--type-title-family)] [font-weight:var(--type-title-weight)]">
          Set a new Cumulus password.
        </h1>
        <p className="max-w-[52ch] text-sm leading-[1.7] text-[color:var(--subtitle)] sm:text-base">
          Finish the reset, then continue back into the dashboard.
        </p>
      </div>

      <div className="max-w-md">
        <UpdatePasswordForm />
      </div>

      <p className="text-sm text-[color:var(--muted)]">
        Need to start over?{" "}
        <Link href="/login" className="text-[color:var(--title)] underline underline-offset-4">
          Return to sign in
        </Link>
        .
      </p>
    </div>
  );
}
