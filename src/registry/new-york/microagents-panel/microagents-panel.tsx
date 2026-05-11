"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MicroagentsLink } from "@/registry/new-york/microagents-link/microagents-link";
import { MicroagentsOrchestrationLeft } from "@/registry/new-york/microagents-orchestration-left/microagents-orchestration-left";
import { MicroagentsOrchestrationRight } from "@/registry/new-york/microagents-orchestration-right/microagents-orchestration-right";
import { MicroagentsSend } from "@/registry/new-york/microagents-send/microagents-send";

export function MicroagentsPanel() {
  return (
    <Card className="w-full max-w-3xl border-[color:var(--muted)]/30 bg-[color:var(--bg)]">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <CardTitle className="text-2xl">Microagents</CardTitle>
          <CardDescription>
            Wire together microagents, launch orchestration runs, and send prompts from a
            unified surface.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <MicroagentsOrchestrationLeft />
          <MicroagentsOrchestrationRight />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MicroagentsLink label="Investigate anomalies" description="Route to the triage microagent" />
        <MicroagentsSend />
      </CardContent>
    </Card>
  );
}
