"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DbManifest = {
  id: string;
  ownerAgentId: string;
  humanOwnerEmail: string | null;
  relaySignupId: string | null;
  updatedAt: string;
  recordCount: number;
  lastCompactedAt: string | null;
};

type DbRecord = {
  id: string;
  type: string;
  key?: string;
  title?: string;
  content?: string | null;
  json?: unknown;
  tags: string[];
  secret: {
    recordIsSecret: boolean;
    fields: string[];
    likelySecretKeys: string[];
    detectorWarnings: string[];
  };
  updatedAt: string;
};

type EnvParse = {
  variables: Array<{
    key: string;
    value: string;
    isLikelySecret: boolean;
    reason: string | null;
  }>;
  warnings: string[];
  invalidLines: Array<{ line: number; reason: string }>;
  duplicateKeys: string[];
  suggestedSecretKeys: string[];
};

const CONNECTION_STORAGE_KEY = "cumulus_db_connection:v1";

type StoredConnection = {
  databaseId: string;
  token: string;
};

async function jsonFetch<T>(url: string, init?: RequestInit, token?: string): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, {
    ...init,
    headers,
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Request failed: ${response.status}`);
  return body;
}

export default function DatabaseDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [databases, setDatabases] = useState<DbManifest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [records, setRecords] = useState<DbRecord[]>([]);
  const [connectionDatabaseId, setConnectionDatabaseId] = useState("");
  const [connectionToken, setConnectionToken] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DbRecord[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recordIsSecret, setRecordIsSecret] = useState(false);
  const [envText, setEnvText] = useState("");
  const [envParse, setEnvParse] = useState<EnvParse | null>(null);
  const [revealed, setRevealed] = useState<{ field: string; value: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, router, user]);

  useEffect(() => {
    const raw = window.localStorage.getItem(CONNECTION_STORAGE_KEY);
    if (!raw) return;

    try {
      const stored = JSON.parse(raw) as StoredConnection;
      if (!stored.databaseId || !stored.token) return;
      setConnectionDatabaseId(stored.databaseId);
      setConnectionToken(stored.token);
      setSelectedId(stored.databaseId);
      setDatabases([
        {
          id: stored.databaseId,
          ownerAgentId: "connected",
          humanOwnerEmail: null,
          relaySignupId: null,
          updatedAt: new Date().toISOString(),
          recordCount: 0,
          lastCompactedAt: null,
        },
      ]);
    } catch {
      window.localStorage.removeItem(CONNECTION_STORAGE_KEY);
    }
  }, []);

  const selected = useMemo(
    () =>
      databases.find((database) => database.id === selectedId) ??
      (selectedId
        ? {
            id: selectedId,
            ownerAgentId: "connected",
            humanOwnerEmail: null,
            relaySignupId: null,
            updatedAt: new Date().toISOString(),
            recordCount: records.length,
            lastCompactedAt: null,
          }
        : null),
    [databases, records.length, selectedId],
  );

  const loadDatabases = useCallback(async () => {
    if (!user || !connectionDatabaseId.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const id = connectionDatabaseId.trim();
      window.localStorage.setItem(
        CONNECTION_STORAGE_KEY,
        JSON.stringify({ databaseId: id, token: connectionToken.trim() }),
      );
      setSelectedId(id);
      setDatabases([
        {
          id,
          ownerAgentId: "connected",
          humanOwnerEmail: null,
          relaySignupId: null,
          updatedAt: new Date().toISOString(),
          recordCount: records.length,
          lastCompactedAt: null,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [connectionDatabaseId, connectionToken, records.length, user]);

  const loadRecords = useCallback(async () => {
    if (!selectedId || !connectionToken.trim()) return;
    setError(null);
    try {
      const body = await jsonFetch<{ database: DbManifest; records: DbRecord[] }>(
        `/api/cumulus-db/databases/${selectedId}`,
        undefined,
        connectionToken.trim(),
      );
      setRecords(body.records);
      setDatabases((current) =>
        current.map((database) =>
          database.id === selectedId
            ? { ...database, recordCount: body.records.length, updatedAt: body.database.updatedAt }
            : database,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [connectionToken, selectedId]);

  useEffect(() => {
    void loadDatabases();
  }, [loadDatabases]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  async function createRecord() {
    if (!selectedId || !content.trim() || !connectionToken.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await jsonFetch(`/api/cumulus-db/databases/${selectedId}/records`, {
        method: "POST",
        body: JSON.stringify({
          type: recordIsSecret ? "secret" : "note",
          title: title || undefined,
          content,
          recordIsSecret,
          tags: recordIsSecret ? ["secret"] : ["manual"],
        }),
      }, connectionToken.trim());
      setTitle("");
      setContent("");
      setRecordIsSecret(false);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function runSearch() {
    if (!selectedId || !connectionToken.trim()) return;
    setError(null);
    const body = await jsonFetch<{ hits: Array<{ record: DbRecord }> }>(
      `/api/cumulus-db/databases/${selectedId}/search`,
      {
        method: "POST",
        body: JSON.stringify({ query, limit: 12 }),
      },
      connectionToken.trim(),
    );
    setResults(body.hits.map((hit) => hit.record));
  }

  async function parseEnv() {
    setError(null);
    const body = await jsonFetch<EnvParse>("/api/cumulus-db/env/parse", {
      method: "POST",
      body: JSON.stringify({ content: envText }),
    });
    setEnvParse(body);
  }

  async function saveEnvRecord() {
    if (!selectedId || !envParse || !connectionToken.trim()) return;
    const secrets = Object.fromEntries(
      envParse.variables
        .filter((item) => item.isLikelySecret)
        .map((item) => [item.key, item.value]),
    );
    const publicVars = Object.fromEntries(
      envParse.variables
        .filter((item) => !item.isLikelySecret)
        .map((item) => [item.key, item.value]),
    );
    await jsonFetch(`/api/cumulus-db/databases/${selectedId}/records`, {
      method: "POST",
      body: JSON.stringify({
        type: Object.keys(secrets).length ? "secret" : "document",
        title: "Environment variables",
        json: publicVars,
        secrets,
        tags: ["env"],
      }),
    }, connectionToken.trim());
    setEnvText("");
    setEnvParse(null);
    await loadRecords();
  }

  async function revealSecret(recordId: string, field: string) {
    if (!selectedId || !connectionToken.trim()) return;
    const body = await jsonFetch<{ secret: { field: string; value: string } }>(
      `/api/cumulus-db/databases/${selectedId}/secrets/reveal`,
      {
        method: "POST",
        body: JSON.stringify({ recordId, field }),
      },
      connectionToken.trim(),
    );
    setRevealed(body.secret);
  }

  if (isLoading) {
    return <div className="px-4 py-12 text-sm text-[color:var(--muted)]">Loading database dashboard...</div>;
  }

  if (!user) return null;

  return (
    <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-8 px-4 pb-20 pt-4 md:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-standard)] p-6 shadow-[var(--glass-shadow-e2)] backdrop-blur-[18px]">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Cumulus Database
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--title)]">
                Agent workspaces
              </h1>
            </div>
            <Button size="sm" onClick={loadRecords} disabled={busy || !selectedId || !connectionToken.trim()}>
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
          </div>

          {error ? (
            <div className="mb-4 flex items-start gap-3 rounded-[5.5px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Input
              value={connectionDatabaseId}
              onChange={(event) => setConnectionDatabaseId(event.target.value)}
              placeholder="Database id"
              className="font-mono text-xs"
            />
            <Input
              value={connectionToken}
              onChange={(event) => setConnectionToken(event.target.value)}
              placeholder="Scoped data token"
              type="password"
              className="font-mono text-xs"
            />
            <Button onClick={loadDatabases} disabled={!connectionDatabaseId.trim() || !connectionToken.trim() || busy}>
              Connect
            </Button>
          </div>

          {selected ? (
            <div className="mt-4 rounded-[5.5px] border border-white/10 bg-white/[0.03] p-4 text-sm text-[color:var(--muted)]">
              Connected to <span className="font-mono text-[color:var(--subtitle)]">{selected.id}</span>. Tokens stay in this browser and are forwarded as bearer tokens.
            </div>
          ) : null}
        </div>

        <div className="rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-subtle)] p-5 shadow-[var(--glass-shadow-e1)] backdrop-blur-[14px]">
          <ShieldCheck className="mb-3 size-5 text-[color:var(--neon-green)]" />
          <h2 className="text-sm font-medium text-[color:var(--title)]">Selected workspace</h2>
          <dl className="mt-4 space-y-3 text-xs text-[color:var(--muted)]">
            <div>
              <dt className="uppercase tracking-[0.16em]">Database</dt>
              <dd className="mt-1 break-all font-mono text-[color:var(--subtitle)]">{selected?.id ?? "None"}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.16em]">Relay signup</dt>
              <dd className="mt-1 break-all font-mono text-[color:var(--subtitle)]">
                {selected?.relaySignupId ?? "Not linked"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {selected ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex gap-3">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search records"
                />
                <Button onClick={runSearch}>
                  <Search className="mr-2 size-4" />
                  Search
                </Button>
              </div>
              <RecordList
                records={results.length ? results : records}
                onReveal={revealSecret}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-4 text-sm font-medium text-[color:var(--title)]">New record</h2>
              <div className="space-y-3">
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
                <Textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Record content"
                  className="min-h-28"
                />
                <label className="flex items-center gap-2 text-sm text-[color:var(--subtitle)]">
                  <input
                    type="checkbox"
                    checked={recordIsSecret}
                    onChange={(event) => setRecordIsSecret(event.target.checked)}
                  />
                  Flag as secret
                </label>
                <Button onClick={createRecord} disabled={!content.trim() || busy}>
                  <Plus className="mr-2 size-4" />
                  Add record
                </Button>
              </div>
            </div>

            <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-[color:var(--title)]">
                <KeyRound className="size-4" />
                Env paste
              </h2>
              <Textarea
                value={envText}
                onChange={(event) => setEnvText(event.target.value)}
                placeholder="KEY=value"
                className="min-h-32 font-mono text-xs"
              />
              <div className="mt-3 flex gap-3">
                <Button variant="secondary" onClick={parseEnv} disabled={!envText.trim()}>
                  Parse
                </Button>
                <Button onClick={saveEnvRecord} disabled={!envParse}>
                  Save parsed
                </Button>
              </div>
              {envParse ? (
                <div className="mt-4 max-h-56 space-y-2 overflow-auto text-xs">
                  {envParse.variables.map((variable) => (
                    <div key={`${variable.key}-${variable.value}`} className="flex items-center justify-between gap-3">
                      <span className="truncate font-mono text-[color:var(--subtitle)]">{variable.key}</span>
                      {variable.isLikelySecret ? (
                        <span className="rounded-full border border-red-500/30 px-2 py-0.5 text-red-100">
                          secret
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {revealed ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-[5.5px] border border-white/10 bg-[#111] p-4 shadow-xl">
          <div className="mb-2 text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Revealed {revealed.field}
          </div>
          <code className="block break-all text-sm text-[color:var(--title)]">{revealed.value}</code>
          <Button className="mt-3" size="sm" variant="secondary" onClick={() => setRevealed(null)}>
            Hide
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function RecordList({
  records,
  onReveal,
}: {
  records: DbRecord[];
  onReveal: (recordId: string, field: string) => void;
}) {
  if (!records.length) {
    return <div className="py-10 text-center text-sm text-[color:var(--muted)]">No records.</div>;
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <article key={record.id} className="rounded-[5.5px] border border-white/10 bg-black/10 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-[color:var(--title)]">
                {record.title ?? record.key ?? record.id}
              </h3>
              <p className="font-mono text-[11px] text-[color:var(--muted)]">
                {record.type} · {new Date(record.updatedAt).toLocaleString()}
              </p>
            </div>
            {record.secret.fields.length || record.secret.recordIsSecret ? (
              <span className="rounded-full border border-red-500/30 px-2 py-1 text-xs text-red-100">
                secret
              </span>
            ) : null}
          </div>
          <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--subtitle)]">
            {record.content ?? JSON.stringify(record.json ?? {}, null, 2)}
          </p>
          {record.secret.detectorWarnings.length ? (
            <div className="mt-3 text-xs text-amber-100">
              This record might contain secrets. Flag it if it should be protected.
            </div>
          ) : null}
          {record.secret.fields.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {record.secret.fields.map((field) => (
                <Button key={field} size="sm" variant="secondary" onClick={() => onReveal(record.id, field)}>
                  Reveal {field}
                </Button>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
