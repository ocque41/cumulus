"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Database,
  FileCode2,
  KeyRound,
  ListChecks,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CONNECTION_STORAGE_KEY = "cumulus_db_system_connection:v1";

const SAMPLE_NIMBUS_SOURCE = `namespace acme {
  collection agents {
    fields: {
      id: { type: "ulid", required: true },
      status: { type: "string" }
    }
  }
}`;

type SystemScope = {
  scope: string;
  label: string;
  dangerous: boolean;
  approvalRequired: boolean;
};

type SystemPrincipal = {
  id: string;
  type: "human" | "agent" | "app" | "system" | string;
  displayName: string;
  status: string;
  createdAt: string;
  lastSeenAt: string | null;
  grants: string[];
};

type SystemApproval = {
  id: string;
  planId: string;
  planHash: string;
  scope: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  actorType: string;
  actorId: string;
  targetVersionId?: string | null;
  targetSnapshotId?: string | null;
  approvalToken?: string;
};

type SchemaOperation = {
  kind: string;
  target: string;
  risk: string;
  summary: string;
};

type SchemaPlan = {
  id: string;
  planHash: string;
  desiredHash: string;
  operations: SchemaOperation[];
  riskLevel: string;
  status: string;
  createdAt: string;
  appliedAt: string | null;
  approvalRequired: boolean;
  snapshotRequired: boolean;
  baseLiveHash: string | null;
  baseLastAppliedHash: string | null;
};

type SchemaVersion = {
  id: string;
  desiredHash: string;
  planId: string;
  planHash: string;
  riskLevel: string;
  applyStatus: string;
  createdAt: string;
  appliedAt: string;
  revertedAt?: string;
};

type SystemSnapshot = {
  id: string;
  kind: string;
  createdAt: string;
  createdByType: string;
  createdById: string;
  storage?: string;
  metadata: Record<string, unknown>;
};

type SystemState = {
  version: 1;
  org: {
    id: string;
    slug: string;
    name: string;
    status: string;
    humanOwnerEmail: string | null;
    createdAt: string;
    claimedAt: string | null;
  };
  principals: SystemPrincipal[];
  approvals: SystemApproval[];
  schema: {
    live: unknown | null;
    liveHash: string | null;
    lastApplied: unknown | null;
    lastAppliedHash: string | null;
    plans: SchemaPlan[];
    versions: SchemaVersion[];
    snapshots: SystemSnapshot[];
  };
};

type AuditEvent = {
  action?: string;
  at?: string;
  actor?: unknown;
  target?: unknown;
  metadata?: unknown;
  [key: string]: unknown;
};

type StoredConnection = {
  databaseId: string;
  token: string;
};

type ActionResult = {
  label: string;
  value: unknown;
};

async function systemFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${normalizeToken(token)}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api/cumulus-db/system${path}`, {
    ...init,
    headers,
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }

  return body;
}

function normalizeToken(value: string) {
  return value.trim().replace(/^bearer\s+/i, "");
}

function splitScopes(value: string) {
  return value
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatJson(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function shortId(value: string | null | undefined, prefix = 10) {
  if (!value) return "None";
  return value.length > prefix + 8 ? `${value.slice(0, prefix)}...${value.slice(-6)}` : value;
}

function statusTone(value: string): "good" | "warn" | "danger" | "neutral" {
  if (["active", "applied", "low", "none", "used"].includes(value)) return "good";
  if (["destructive", "failed", "rejected", "disabled", "revoked"].includes(value)) return "danger";
  if (["planned", "pending_claim", "high", "medium"].includes(value)) return "warn";
  return "neutral";
}

function Panel({
  action,
  children,
  icon: Icon,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <section className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-[color:var(--title)]">
          <Icon className="size-4 text-[color:var(--accent)]" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "good" | "warn" | "danger" | "neutral" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[5.5px] border px-2 py-1 font-mono text-[11px]",
        tone === "good" && "border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10 text-[color:var(--title)]",
        tone === "warn" && "border-amber-400/35 bg-amber-400/10 text-amber-100",
        tone === "danger" && "border-red-400/35 bg-red-400/10 text-red-100",
        tone === "neutral" && "border-white/10 text-[color:var(--muted)]",
      )}
    >
      {children}
    </span>
  );
}

function JsonBlock({ value, className }: { value: unknown; className?: string }) {
  const text = formatJson(value);
  if (!text) return null;
  return (
    <pre className={cn("max-h-72 overflow-auto rounded-[5.5px] border border-white/10 bg-black/20 p-3 text-xs leading-5 text-[color:var(--subtitle)]", className)}>
      {text}
    </pre>
  );
}

export default function SystemPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [databaseId, setDatabaseId] = useState("");
  const [token, setToken] = useState("");
  const [scopes, setScopes] = useState<SystemScope[]>([]);
  const [system, setSystem] = useState<SystemState | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [snapshots, setSnapshots] = useState<SystemSnapshot[]>([]);
  const [nimbusSource, setNimbusSource] = useState(SAMPLE_NIMBUS_SOURCE);
  const [actorId, setActorId] = useState("dashboard-operator");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [approvalToken, setApprovalToken] = useState("");
  const [revertApprovalToken, setRevertApprovalToken] = useState("");
  const [revertVersionId, setRevertVersionId] = useState("");
  const [revertSnapshotId, setRevertSnapshotId] = useState("");
  const [snapshotKind, setSnapshotKind] = useState("manual");
  const [auditLimit, setAuditLimit] = useState("50");
  const [grantPrincipalId, setGrantPrincipalId] = useState("");
  const [grantScopes, setGrantScopes] = useState("");
  const [agentDisplayName, setAgentDisplayName] = useState("dashboard-agent");
  const [agentId, setAgentId] = useState("");
  const [agentAction, setAgentAction] = useState("disable");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, router, user]);

  useEffect(() => {
    const raw = window.localStorage.getItem(CONNECTION_STORAGE_KEY);
    if (!raw) return;

    try {
      const stored = JSON.parse(raw) as StoredConnection;
      if (stored.databaseId) setDatabaseId(stored.databaseId);
      if (stored.token) setToken(stored.token);
    } catch {
      window.localStorage.removeItem(CONNECTION_STORAGE_KEY);
    }
  }, []);

  const plannedPlans = useMemo(
    () => system?.schema.plans.filter((plan) => plan.status === "planned") ?? [],
    [system?.schema.plans],
  );
  const selectedPlan = useMemo(
    () => system?.schema.plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [selectedPlanId, system?.schema.plans],
  );
  const activeConnection = Boolean(databaseId.trim() && normalizeToken(token));
  const dangerousScopes = scopes.filter((scope) => scope.dangerous).length;

  const getConnection = useCallback(() => {
    const dbId = databaseId.trim();
    const bearer = normalizeToken(token);
    if (!dbId) throw new Error("Database id is required.");
    if (!bearer) throw new Error("Bearer token is required.");
    return { dbId, bearer };
  }, [databaseId, token]);

  const persistConnection = useCallback((dbId: string, bearer: string) => {
    window.localStorage.setItem(CONNECTION_STORAGE_KEY, JSON.stringify({ databaseId: dbId, token: bearer }));
  }, []);

  const loadScopes = useCallback(
    async (connection = getConnection()) => {
      const body = await systemFetch<{ scopes: SystemScope[] }>("/scopes", connection.bearer);
      setScopes(body.scopes ?? []);
    },
    [getConnection],
  );

  const loadState = useCallback(
    async (connection = getConnection()) => {
      const body = await systemFetch<{ system: SystemState }>(
        `/state?dbId=${encodeURIComponent(connection.dbId)}`,
        connection.bearer,
      );
      setSystem(body.system);
      setGrantPrincipalId((current) => current || body.system.principals[0]?.id || "");
      setGrantScopes((current) => current || body.system.principals[0]?.grants.join(", ") || "");
      setSelectedPlanId((current) => current || body.system.schema.plans.find((plan) => plan.status === "planned")?.id || "");
    },
    [getConnection],
  );

  const loadAudit = useCallback(
    async (connection = getConnection()) => {
      const parsedLimit = Number.parseInt(auditLimit, 10);
      const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;
      const body = await systemFetch<{ audit: AuditEvent[] }>(
        `/audit?dbId=${encodeURIComponent(connection.dbId)}&limit=${limit}`,
        connection.bearer,
      );
      setAudit(body.audit ?? []);
    },
    [auditLimit, getConnection],
  );

  const loadSnapshots = useCallback(
    async (connection = getConnection()) => {
      const body = await systemFetch<{ snapshots: SystemSnapshot[] }>(
        `/snapshots?dbId=${encodeURIComponent(connection.dbId)}`,
        connection.bearer,
      );
      setSnapshots(body.snapshots ?? []);
    },
    [getConnection],
  );

  async function runAction(label: string, action: (connection: { dbId: string; bearer: string }) => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      const connection = getConnection();
      persistConnection(connection.dbId, connection.bearer);
      const result = await action(connection);
      setActionResult({ label, value: result });
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function refreshAll() {
    await runAction("refresh", async (connection) => {
      const results = await Promise.allSettled([
        loadScopes(connection),
        loadState(connection),
        loadAudit(connection),
        loadSnapshots(connection),
      ]);
      const failure = results.find((result) => result.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
      return { refreshed: true, dbId: connection.dbId };
    });
  }

  async function planSchema() {
    const result = await runAction("plan", async (connection) => {
      const body = await systemFetch<{ plan: SchemaPlan }>(
        "/schema/plan",
        connection.bearer,
        {
          method: "POST",
          body: JSON.stringify({
            dbId: connection.dbId,
            fileName: "dashboard.nimbus",
            source: nimbusSource,
          }),
        },
      );
      setSelectedPlanId(body.plan.id);
      await loadState(connection);
      return body.plan;
    });
    if (result && typeof result === "object" && "id" in result) {
      setApprovalToken("");
    }
  }

  async function requestPlanApproval() {
    await runAction("approval", async (connection) => {
      if (!selectedPlanId.trim()) throw new Error("Select a schema plan first.");
      const body = await systemFetch<{ approval: SystemApproval }>(
        "/schema/approvals",
        connection.bearer,
        {
          method: "POST",
          body: JSON.stringify({
            dbId: connection.dbId,
            planId: selectedPlanId.trim(),
            actorId: actorId.trim() || "dashboard-operator",
          }),
        },
      );
      setApprovalToken(body.approval.approvalToken ?? "");
      await loadState(connection);
      return body.approval;
    });
  }

  async function applyPlan() {
    await runAction("apply", async (connection) => {
      if (!selectedPlanId.trim()) throw new Error("Select a schema plan first.");
      const body = await systemFetch(
        "/schema/apply",
        connection.bearer,
        {
          method: "POST",
          body: JSON.stringify({
            dbId: connection.dbId,
            planId: selectedPlanId.trim(),
            approvalToken: approvalToken.trim() || undefined,
            actorId: actorId.trim() || "dashboard-operator",
          }),
        },
      );
      await Promise.all([loadState(connection), loadAudit(connection), loadSnapshots(connection)]);
      setApprovalToken("");
      return body;
    });
  }

  async function createSnapshot() {
    await runAction("snapshot", async (connection) => {
      const body = await systemFetch(
        "/snapshots",
        connection.bearer,
        {
          method: "POST",
          body: JSON.stringify({ dbId: connection.dbId, kind: snapshotKind }),
        },
      );
      await Promise.all([loadState(connection), loadSnapshots(connection), loadAudit(connection)]);
      return body;
    });
  }

  async function requestRevertApproval() {
    await runAction("revert approval", async (connection) => {
      if (!revertVersionId.trim() && !revertSnapshotId.trim()) {
        throw new Error("Choose a version or snapshot target before requesting revert approval.");
      }
      const body = await systemFetch<{ approval: SystemApproval }>(
        "/schema/approvals",
        connection.bearer,
        {
          method: "POST",
          body: JSON.stringify({
            dbId: connection.dbId,
            kind: "revert",
            versionId: revertVersionId.trim() || undefined,
            snapshotId: revertSnapshotId.trim() || undefined,
            actorId: actorId.trim() || "dashboard-operator",
          }),
        },
      );
      setRevertApprovalToken(body.approval.approvalToken ?? "");
      await loadState(connection);
      return body.approval;
    });
  }

  async function revertSchema() {
    await runAction("revert", async (connection) => {
      if (!revertVersionId.trim() && !revertSnapshotId.trim()) {
        throw new Error("Choose a version or snapshot target before reverting.");
      }
      const body = await systemFetch(
        "/schema/revert",
        connection.bearer,
        {
          method: "POST",
          body: JSON.stringify({
            dbId: connection.dbId,
            versionId: revertVersionId.trim() || undefined,
            snapshotId: revertSnapshotId.trim() || undefined,
            approvalToken: revertApprovalToken.trim() || approvalToken.trim() || undefined,
            actorId: actorId.trim() || "dashboard-operator",
          }),
        },
      );
      await Promise.all([loadState(connection), loadAudit(connection), loadSnapshots(connection)]);
      setRevertApprovalToken("");
      return body;
    });
  }

  async function submitGrantUpdate() {
    await runAction("grants", async (connection) => {
      if (!grantPrincipalId.trim()) throw new Error("Principal id is required.");
      const body = await systemFetch(
        "/grants",
        connection.bearer,
        {
          method: "POST",
          body: JSON.stringify({
            dbId: connection.dbId,
            principalId: grantPrincipalId.trim(),
            grants: splitScopes(grantScopes),
            actorId: actorId.trim() || "dashboard-operator",
          }),
        },
      );
      await loadState(connection);
      return body;
    });
  }

  async function bootstrapAgent() {
    await runAction("agent bootstrap", async (connection) => {
      const body = await systemFetch(
        "/agents/bootstrap",
        connection.bearer,
        {
          method: "POST",
          body: JSON.stringify({ displayName: agentDisplayName.trim() || "dashboard-agent" }),
        },
      );
      return body;
    });
  }

  async function runAgentLifecycleAction() {
    await runAction("agent lifecycle", async (connection) => {
      if (!agentId.trim()) throw new Error("Agent id is required.");
      const body = await systemFetch(
        `/agents/${encodeURIComponent(agentId.trim())}/${agentAction}`,
        connection.bearer,
        {
          method: "POST",
          body: JSON.stringify({
            dbId: connection.dbId,
            agentId: agentId.trim(),
            actorId: actorId.trim() || "dashboard-operator",
          }),
        },
      );
      await loadState(connection);
      return body;
    });
  }

  if (isLoading) {
    return <div className="px-4 py-12 text-sm text-[color:var(--muted)]">Loading system console...</div>;
  }

  if (!user) return null;

  return (
    <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-8 px-4 pb-20 pt-4 md:px-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-standard)] p-6">
          <div className="mb-6">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--muted)]">Cumulus DB System</p>
              <h1 className="mt-2 max-w-[15ch] text-4xl leading-none tracking-[-0.03em] text-[color:var(--title)] sm:text-5xl">
                System console
              </h1>
            </div>
          </div>

          {error ? (
            <div className="mb-4 flex items-start gap-3 rounded-[5.5px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <form
            className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              void refreshAll();
            }}
          >
            <label className="sr-only" htmlFor="system-db-id">
              Database id
            </label>
            <Input
              id="system-db-id"
              value={databaseId}
              onChange={(event) => setDatabaseId(event.target.value)}
              placeholder="Database id"
              autoComplete="off"
              className="font-mono text-xs"
            />
            <label className="sr-only" htmlFor="system-db-token">
              Cumulus DB bearer token
            </label>
            <Input
              id="system-db-token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Bearer token"
              type="password"
              autoComplete="off"
              className="font-mono text-xs"
            />
            <Button type="submit" disabled={!activeConnection || Boolean(busy)}>
              <RefreshCw className="size-4" />
              Connect
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={activeConnection ? "good" : "neutral"}>{activeConnection ? "token ready" : "token required"}</Badge>
            <Badge tone={system ? statusTone(system.org.status) : "neutral"}>{system?.org.status ?? "not loaded"}</Badge>
            <Badge tone="neutral">admin key never forwarded</Badge>
          </div>
        </div>

        <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
          <ShieldCheck className="mb-3 size-5 text-[color:var(--accent)]" />
          <dl className="space-y-3 text-xs text-[color:var(--muted)]">
            <div>
              <dt className="uppercase tracking-[0.16em]">Organization</dt>
              <dd className="mt-1 break-all font-mono text-[color:var(--subtitle)]">{system?.org.id ?? "None"}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.16em]">Live schema hash</dt>
              <dd className="mt-1 break-all font-mono text-[color:var(--subtitle)]">{shortId(system?.schema.liveHash)}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.16em]">Principals</dt>
              <dd className="mt-1 font-mono text-[color:var(--subtitle)]">{system?.principals.length ?? 0}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.16em]">Snapshots</dt>
              <dd className="mt-1 font-mono text-[color:var(--subtitle)]">{snapshots.length || system?.schema.snapshots.length || 0}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <Panel
          icon={KeyRound}
          title="Scopes"
          action={
            <Button size="sm" variant="secondary" onClick={() => void runAction("scopes", (connection) => loadScopes(connection))} disabled={!activeConnection || Boolean(busy)}>
              <RefreshCw className="size-4" />
              Load
            </Button>
          }
        >
          <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-[5.5px] border border-white/10 p-3">
              <div className="uppercase tracking-[0.16em] text-[color:var(--muted)]">Known scopes</div>
              <div className="mt-2 font-mono text-lg text-[color:var(--title)]">{scopes.length}</div>
            </div>
            <div className="rounded-[5.5px] border border-white/10 p-3">
              <div className="uppercase tracking-[0.16em] text-[color:var(--muted)]">Sensitive</div>
              <div className="mt-2 font-mono text-lg text-[color:var(--title)]">{dangerousScopes}</div>
            </div>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <div className="flex flex-wrap gap-2">
              {scopes.map((scope) => (
                <Badge key={scope.scope} tone={scope.dangerous ? "warn" : "neutral"}>
                  {scope.scope}
                </Badge>
              ))}
              {!scopes.length ? <p className="text-sm text-[color:var(--muted)]">No scopes loaded.</p> : null}
            </div>
          </div>
        </Panel>

        <Panel
          icon={Users}
          title="Principals and grants"
          action={
            <Button size="sm" variant="secondary" onClick={() => void runAction("state", (connection) => loadState(connection))} disabled={!activeConnection || Boolean(busy)}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs text-[color:var(--muted)]">
              <thead className="border-b border-white/10 uppercase tracking-[0.16em]">
                <tr>
                  <th className="py-2 pr-3 font-normal">Principal</th>
                  <th className="py-2 pr-3 font-normal">Type</th>
                  <th className="py-2 pr-3 font-normal">Status</th>
                  <th className="py-2 pr-3 font-normal">Grants</th>
                  <th className="py-2 pr-3 font-normal">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {(system?.principals ?? []).map((principal) => (
                  <tr key={principal.id} className="border-b border-white/5">
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        onClick={() => {
                          setGrantPrincipalId(principal.id);
                          setGrantScopes(principal.grants.join(", "));
                          setAgentId(principal.type === "agent" ? principal.id : agentId);
                        }}
                        className="break-all font-mono text-[color:var(--subtitle)]"
                      >
                        {principal.displayName || principal.id}
                      </button>
                    </td>
                    <td className="py-3 pr-3 font-mono">{principal.type}</td>
                    <td className="py-3 pr-3">
                      <Badge tone={statusTone(principal.status)}>{principal.status}</Badge>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex max-w-xl flex-wrap gap-1">
                        {principal.grants.map((grant) => (
                          <span key={grant} className="rounded-[5.5px] border border-white/10 px-2 py-0.5 font-mono text-[10px]">
                            {grant}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-mono">{formatDate(principal.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!system?.principals.length ? <div className="py-8 text-center text-sm text-[color:var(--muted)]">No system state loaded.</div> : null}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,220px)_1fr_auto]">
            <Input value={grantPrincipalId} onChange={(event) => setGrantPrincipalId(event.target.value)} placeholder="Principal id" className="font-mono text-xs" />
            <Input value={grantScopes} onChange={(event) => setGrantScopes(event.target.value)} placeholder="Scopes, comma-separated" className="font-mono text-xs" />
            <Button onClick={submitGrantUpdate} disabled={!activeConnection || Boolean(busy)}>
              <CheckCircle2 className="size-4" />
              Save grants
            </Button>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel icon={FileCode2} title="Nimbus source">
          <Textarea
            value={nimbusSource}
            onChange={(event) => setNimbusSource(event.target.value)}
            className="min-h-[320px] font-mono text-xs"
            spellCheck={false}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={planSchema} disabled={!activeConnection || Boolean(busy)}>
              <Workflow className="size-4" />
              Plan
            </Button>
            <Button variant="secondary" onClick={() => setNimbusSource(SAMPLE_NIMBUS_SOURCE)}>
              Reset sample
            </Button>
          </div>
        </Panel>

        <Panel icon={ListChecks} title="Plans">
          <div className="space-y-3">
            {(system?.schema.plans ?? []).slice(0, 10).map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={cn(
                  "w-full rounded-[5.5px] border p-3 text-left",
                  selectedPlanId === plan.id ? "border-[color:var(--accent)]/45 bg-[color:var(--accent)]/10" : "border-white/10 bg-black/10",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[color:var(--subtitle)]">{shortId(plan.id, 14)}</span>
                  <div className="flex gap-2">
                    <Badge tone={statusTone(plan.riskLevel)}>{plan.riskLevel}</Badge>
                    <Badge tone={statusTone(plan.status)}>{plan.status}</Badge>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {plan.operations.slice(0, 4).map((operation) => (
                    <div key={`${plan.id}-${operation.kind}-${operation.target}`} className="text-xs leading-5 text-[color:var(--muted)]">
                      {operation.summary}
                    </div>
                  ))}
                  {!plan.operations.length ? <div className="text-xs text-[color:var(--muted)]">No operations.</div> : null}
                </div>
              </button>
            ))}
            {!system?.schema.plans.length ? <p className="text-sm text-[color:var(--muted)]">No plans loaded.</p> : null}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel icon={Play} title="Approvals and apply">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Plan id</span>
              <Input value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)} placeholder="plan id" className="font-mono text-xs" />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Actor id</span>
              <Input value={actorId} onChange={(event) => setActorId(event.target.value)} placeholder="actor id" className="font-mono text-xs" />
            </label>
          </div>
          <label className="mt-3 block space-y-2">
            <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Approval token</span>
            <Input value={approvalToken} onChange={(event) => setApprovalToken(event.target.value)} placeholder="approval token" className="font-mono text-xs" />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={requestPlanApproval} disabled={!activeConnection || !selectedPlanId.trim() || Boolean(busy)}>
              Request approval
            </Button>
            <Button onClick={applyPlan} disabled={!activeConnection || !selectedPlanId.trim() || Boolean(busy)}>
              Apply plan
            </Button>
          </div>
          {selectedPlan ? (
            <div className="mt-4 rounded-[5.5px] border border-white/10 p-3 text-xs text-[color:var(--muted)]">
              Selected plan requires approval: <span className="font-mono text-[color:var(--subtitle)]">{selectedPlan.approvalRequired ? "yes" : "no"}</span>
            </div>
          ) : null}
          {plannedPlans.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {plannedPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className="rounded-[5.5px] border border-white/10 px-2 py-1 font-mono text-[11px] text-[color:var(--muted)]"
                >
                  {shortId(plan.id, 12)}
                </button>
              ))}
            </div>
          ) : null}
        </Panel>

        <Panel icon={RotateCcw} title="Revert">
          <div className="grid gap-3 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Version id</span>
              <Input value={revertVersionId} onChange={(event) => setRevertVersionId(event.target.value)} placeholder="version id" className="font-mono text-xs" />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Snapshot id</span>
              <Input value={revertSnapshotId} onChange={(event) => setRevertSnapshotId(event.target.value)} placeholder="snapshot id" className="font-mono text-xs" />
            </label>
          </div>
          <label className="mt-3 block space-y-2">
            <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Revert approval token</span>
            <Input value={revertApprovalToken} onChange={(event) => setRevertApprovalToken(event.target.value)} placeholder="revert approval token" className="font-mono text-xs" />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={requestRevertApproval} disabled={!activeConnection || Boolean(busy)}>
              Request revert approval
            </Button>
            <Button onClick={revertSchema} disabled={!activeConnection || Boolean(busy)}>
              Revert
            </Button>
          </div>
          <div className="mt-4 max-h-40 space-y-2 overflow-auto">
            {(system?.schema.versions ?? []).slice(0, 6).map((version) => (
              <button
                key={version.id}
                type="button"
                onClick={() => {
                  setRevertVersionId(version.id);
                  setRevertSnapshotId("");
                }}
                className="flex w-full items-center justify-between gap-3 rounded-[5.5px] border border-white/10 px-3 py-2 text-left text-xs"
              >
                <span className="break-all font-mono text-[color:var(--subtitle)]">{shortId(version.id, 12)}</span>
                <Badge tone={statusTone(version.applyStatus)}>{version.applyStatus}</Badge>
              </button>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel
          icon={Archive}
          title="Snapshots"
          action={
            <Button size="sm" variant="secondary" onClick={() => void runAction("snapshots", (connection) => loadSnapshots(connection))} disabled={!activeConnection || Boolean(busy)}>
              <RefreshCw className="size-4" />
              Load
            </Button>
          }
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-[180px_auto]">
            <select
              value={snapshotKind}
              onChange={(event) => setSnapshotKind(event.target.value)}
              className="h-10 rounded-[5.5px] border border-white/10 bg-[color:var(--bg)] px-3 text-sm text-[color:var(--fg)] outline-none"
            >
              <option value="manual">manual</option>
              <option value="pre_apply">pre_apply</option>
              <option value="revert_point">revert_point</option>
            </select>
            <Button onClick={createSnapshot} disabled={!activeConnection || Boolean(busy)}>
              Create snapshot
            </Button>
          </div>
          <div className="space-y-2">
            {snapshots.map((snapshot) => (
              <button
                key={snapshot.id}
                type="button"
                onClick={() => {
                  setRevertSnapshotId(snapshot.id);
                  setRevertVersionId("");
                }}
                className="w-full rounded-[5.5px] border border-white/10 bg-black/10 p-3 text-left"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="break-all font-mono text-xs text-[color:var(--subtitle)]">{snapshot.id}</span>
                  <Badge tone="neutral">{snapshot.kind}</Badge>
                </div>
                <div className="mt-2 text-xs text-[color:var(--muted)]">
                  {formatDate(snapshot.createdAt)} by {snapshot.createdByType}:{snapshot.createdById}
                </div>
              </button>
            ))}
            {!snapshots.length ? <p className="text-sm text-[color:var(--muted)]">No snapshots loaded.</p> : null}
          </div>
        </Panel>

        <Panel icon={Database} title="Agent lifecycle">
          <div className="space-y-3">
            <Input value={agentDisplayName} onChange={(event) => setAgentDisplayName(event.target.value)} placeholder="Agent display name" />
            <Button onClick={bootstrapAgent} disabled={!activeConnection || Boolean(busy)}>
              Bootstrap agent
            </Button>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
              <Input value={agentId} onChange={(event) => setAgentId(event.target.value)} placeholder="Agent id" className="font-mono text-xs" />
              <select
                value={agentAction}
                onChange={(event) => setAgentAction(event.target.value)}
                className="h-10 rounded-[5.5px] border border-white/10 bg-[color:var(--bg)] px-3 text-sm text-[color:var(--fg)] outline-none"
              >
                <option value="disable">disable</option>
                <option value="rotate">rotate</option>
                <option value="revoke">revoke</option>
              </select>
              <Button onClick={runAgentLifecycleAction} disabled={!activeConnection || !agentId.trim() || Boolean(busy)}>
                Run
              </Button>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel
          icon={Activity}
          title="Audit"
          action={
            <Button size="sm" variant="secondary" onClick={() => void runAction("audit", (connection) => loadAudit(connection))} disabled={!activeConnection || Boolean(busy)}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          }
        >
          <div className="mb-4 max-w-[160px]">
            <Input value={auditLimit} onChange={(event) => setAuditLimit(event.target.value)} inputMode="numeric" placeholder="Limit" />
          </div>
          <div className="max-h-[520px] space-y-2 overflow-auto">
            {audit.map((event, index) => (
              <div key={`${event.action ?? "event"}-${event.at ?? index}`} className="rounded-[5.5px] border border-white/10 bg-black/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[color:var(--subtitle)]">{event.action ?? "audit.event"}</span>
                  <span className="font-mono text-[11px] text-[color:var(--muted)]">{formatDate(event.at)}</span>
                </div>
                <JsonBlock value={event} className="mt-3 max-h-44" />
              </div>
            ))}
            {!audit.length ? <p className="text-sm text-[color:var(--muted)]">No audit events loaded.</p> : null}
          </div>
        </Panel>

        <Panel icon={CheckCircle2} title="Last result">
          {busy ? (
            <div className="rounded-[5.5px] border border-white/10 p-3 text-sm text-[color:var(--muted)]">Running {busy}...</div>
          ) : null}
          {actionResult ? (
            <div>
              <div className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">{actionResult.label}</div>
              <JsonBlock value={actionResult.value} />
            </div>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">No system action has completed in this session.</p>
          )}
        </Panel>
      </section>
    </div>
  );
}
