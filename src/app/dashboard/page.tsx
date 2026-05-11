"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Terminal, MessageSquare, Cpu } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[color:var(--muted)]">
        Loading Tado...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-10 px-4 pb-20 pt-4 md:px-8">
      <section className="rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-standard)] p-6 shadow-[var(--glass-shadow-e3)] backdrop-blur-[18px] sm:p-8">
        <div className="space-y-5">
          <p className="text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Agent workspace
          </p>
          <h1 className="max-w-[14ch] text-[clamp(2.2rem,4.8vw,4.2rem)] leading-[0.96] tracking-[-0.06em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]">
            Tado
          </h1>
          <p className="max-w-[64ch] text-[1rem] leading-[1.75] text-[color:var(--subtitle)] sm:text-[1.05rem]">
            Agent-to-agent IPC for multi-terminal workflows. Spawn, message, and orchestrate agents across sessions from a single canvas.
          </p>
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-subtle)] p-6 shadow-[var(--glass-shadow-e1)] backdrop-blur-[12px]">
          <Terminal className="mb-3 size-5 text-[color:var(--neon-green)]" />
          <h2 className="mb-2 text-sm font-medium tracking-tight text-[color:var(--title)]">Sessions</h2>
          <p className="text-sm leading-relaxed text-[color:var(--muted)]">
            Each terminal session exposes an inbox and log. Use <code className="text-[color:var(--subtitle)]">tado-list</code> to discover active sessions on the canvas.
          </p>
        </div>
        <div className="rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-subtle)] p-6 shadow-[var(--glass-shadow-e1)] backdrop-blur-[12px]">
          <MessageSquare className="mb-3 size-5 text-[color:var(--neon-green)]" />
          <h2 className="mb-2 text-sm font-medium tracking-tight text-[color:var(--title)]">Messaging</h2>
          <p className="text-sm leading-relaxed text-[color:var(--muted)]">
            Send typed input to any session with <code className="text-[color:var(--subtitle)]">tado-send</code>. Target by UUID, grid coordinates, or name substring.
          </p>
        </div>
        <div className="rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-subtle)] p-6 shadow-[var(--glass-shadow-e1)] backdrop-blur-[12px]">
          <Cpu className="mb-3 size-5 text-[color:var(--neon-green)]" />
          <h2 className="mb-2 text-sm font-medium tracking-tight text-[color:var(--title)]">Orchestration</h2>
          <p className="text-sm leading-relaxed text-[color:var(--muted)]">
            Spawn specialized agents with <code className="text-[color:var(--subtitle)]">tado-spawn</code> and read their output with <code className="text-[color:var(--subtitle)]">tado-read</code>. File-based IPC keeps it simple.
          </p>
        </div>
      </div>
    </div>
  );
}
