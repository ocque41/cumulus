"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Archive,
  Database,
  FileCode2,
  KeyRound,
  ListTree,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Table2,
  Trash2,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const RECORD_TYPES = [
  "document",
  "note",
  "run",
  "message",
  "event",
  "kv",
  "tool_call",
  "artifact",
  "summary",
  "preference",
  "secret",
  "entity",
  "task",
  "observation",
] as const;

type RecordType = (typeof RECORD_TYPES)[number];

const TOKEN_SCOPES = [
  "records:read",
  "records:write",
  "search:read",
  "events:write",
  "kv:read",
  "kv:write",
  "secrets:write",
  "secrets:reveal",
  "tokens:manage",
  "backups:manage",
  "database:admin",
] as const;

type TokenScope = (typeof TOKEN_SCOPES)[number];

const DEFAULT_TOKEN_SCOPES: TokenScope[] = [
  "records:read",
  "records:write",
  "search:read",
  "events:write",
  "kv:read",
  "kv:write",
  "secrets:write",
];

const CONNECTION_STORAGE_KEY = "cumulus_db_connection:v1";
const EVIDENCE_TAG = "cumulus-api-evidence";

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
  type: RecordType | string;
  key?: string;
  title?: string;
  content?: string | null;
  json?: unknown;
  vector?: number[];
  metadata?: Record<string, unknown>;
  tags: string[];
  secret: {
    recordIsSecret: boolean;
    fields: string[];
    likelySecretKeys: string[];
    detectorWarnings: string[];
  };
  updatedAt: string;
};

type SearchHit = {
  record: DbRecord;
  score: number;
  lexicalScore: number;
  vectorScore: number;
};

type ProviderHealth = {
  ok: boolean;
  service?: string;
};

type McpManifest = {
  name: string;
  tools: string[];
};

type TokenSummary = {
  id: string;
  label: string;
  scopes: TokenScope[];
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

type TokenIssue = {
  id: string;
  token: string;
  scopes: TokenScope[];
};

type BackupResult = {
  path: string;
  records: number;
};

type CompactResult = {
  segment: string;
  records: number;
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

type StoredConnection = {
  databaseId: string;
  token: string;
};

type EvidenceRun = {
  id: string;
  created: number;
  searchHits: number;
};

type DisplayItem = {
  record: DbRecord;
  score?: number;
  lexicalScore?: number;
  vectorScore?: number;
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

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalJson(value: string): unknown {
  if (!value.trim()) return undefined;
  return JSON.parse(value);
}

function parseOptionalObject(value: string, label: string): Record<string, unknown> | undefined {
  const parsed = parseOptionalJson(value);
  if (parsed === undefined) return undefined;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

function parseVector(value: string): number[] | undefined {
  if (!value.trim()) return undefined;
  const vector = value
    .split(",")
    .map((item) => Number(item.trim()));
  if (!vector.length || vector.some((item) => !Number.isFinite(item))) {
    throw new Error("Vector must be comma-separated numbers, for example: 1, 0.4, 0.2");
  }
  return vector;
}

function parseSecretFields(value: string): Record<string, string> | undefined {
  const entries = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf("=");
      if (separator === -1) throw new Error("Secret fields must use KEY=value lines.");
      const key = line.slice(0, separator).trim();
      const secretValue = line.slice(separator + 1).trim();
      if (!key) throw new Error("Secret field key cannot be empty.");
      return [key, secretValue] as const;
    });

  return entries.length ? Object.fromEntries(entries) : undefined;
}

function formatJson(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function evidenceRecord(type: RecordType, index: number, runId: string) {
  const vector = [index + 1, (index % 4) + 1, 1];
  const tag = `${EVIDENCE_TAG}:${runId}`;
  const base = {
    type,
    title: `Cumulus API evidence: ${type}`,
    content: `Cumulus API evidence ${runId}. This ${type} record proves the database can store and search typed agent workspace data.`,
    json: {
      evidenceRunId: runId,
      capability: type,
      source: "dashboard",
      proof: "created through Cumulus DB HTTP API",
    },
    tags: [EVIDENCE_TAG, tag, type],
    vector,
    metadata: {
      evidenceRunId: runId,
      source: "dashboard",
    },
  };

  if (type === "secret") {
    const secretKey = ["DEMO", "SECRET"].join("_");
    return {
      ...base,
      recordIsSecret: true,
      secrets: {
        [secretKey]: ["placeholder", runId, "not-real"].join("-"),
      },
    };
  }

  if (type === "kv") {
    return {
      ...base,
      key: `evidence.${runId}`,
    };
  }

  return base;
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
  const [searchType, setSearchType] = useState<"all" | RecordType>("all");
  const [searchLimit, setSearchLimit] = useState("12");
  const [searchVector, setSearchVector] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [recordType, setRecordType] = useState<RecordType>("note");
  const [recordKey, setRecordKey] = useState("");
  const [recordTags, setRecordTags] = useState("manual");
  const [recordJson, setRecordJson] = useState("");
  const [recordVector, setRecordVector] = useState("");
  const [secretText, setSecretText] = useState("DEMO_SECRET=placeholder-not-real");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recordIsSecret, setRecordIsSecret] = useState(false);
  const [envText, setEnvText] = useState("");
  const [envParse, setEnvParse] = useState<EnvParse | null>(null);
  const [evidenceRun, setEvidenceRun] = useState<EvidenceRun | null>(null);
  const [revealed, setRevealed] = useState<{ field: string; value: string } | null>(null);
  const [health, setHealth] = useState<ProviderHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [mcpManifest, setMcpManifest] = useState<McpManifest | null>(null);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [recordView, setRecordView] = useState<"detailed" | "compact">("detailed");
  const [kvKey, setKvKey] = useState("");
  const [kvValue, setKvValue] = useState('{"status":"ok"}');
  const [kvMetadata, setKvMetadata] = useState('{"source":"dashboard"}');
  const [kvResult, setKvResult] = useState<DbRecord | null>(null);
  const [eventTitle, setEventTitle] = useState("Agent event");
  const [eventContent, setEventContent] = useState("Dashboard event written through the events endpoint.");
  const [eventJson, setEventJson] = useState('{"source":"dashboard"}');
  const [eventTags, setEventTags] = useState("event,dashboard");
  const [tokens, setTokens] = useState<TokenSummary[]>([]);
  const [tokenLabel, setTokenLabel] = useState("Dashboard token");
  const [selectedScopes, setSelectedScopes] = useState<TokenScope[]>(DEFAULT_TOKEN_SCOPES);
  const [issuedToken, setIssuedToken] = useState<TokenIssue | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [backupResult, setBackupResult] = useState<BackupResult | null>(null);
  const [compactResult, setCompactResult] = useState<CompactResult | null>(null);
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

  const coverage = useMemo(
    () =>
      RECORD_TYPES.map((type) => {
        const count = records.filter((record) => record.type === type).length;
        return { type, count, present: count > 0 };
      }),
    [records],
  );

  const displayItems = useMemo<DisplayItem[]>(() => {
    if (hasSearched) return searchHits;
    return records.map((record) => ({ record }));
  }, [hasSearched, records, searchHits]);

  const kvRecords = useMemo(
    () => records.filter((record) => record.type === "kv"),
    [records],
  );

  const eventRecords = useMemo(
    () => records.filter((record) => record.type === "event"),
    [records],
  );

  const loadProviderMetadata = useCallback(async () => {
    try {
      setHealthError(null);
      setHealth(await jsonFetch<ProviderHealth>("/api/cumulus-db/health"));
    } catch (err) {
      setHealth(null);
      setHealthError(err instanceof Error ? err.message : String(err));
    }

    try {
      setMcpError(null);
      setMcpManifest(await jsonFetch<McpManifest>("/api/cumulus-db/mcp"));
    } catch (err) {
      setMcpManifest(null);
      setMcpError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void loadProviderMetadata();
  }, [loadProviderMetadata]);

  const loadTokens = useCallback(async () => {
    if (!selectedId || !connectionToken.trim()) return;
    try {
      setTokenError(null);
      const body = await jsonFetch<{ tokens: TokenSummary[] }>(
        `/api/cumulus-db/databases/${selectedId}/tokens`,
        undefined,
        connectionToken.trim(),
      );
      setTokens(body.tokens);
    } catch (err) {
      setTokens([]);
      setTokenError(err instanceof Error ? err.message : String(err));
    }
  }, [connectionToken, selectedId]);

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

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  async function createRecord() {
    if (!selectedId || !connectionToken.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const json = parseOptionalJson(recordJson);
      const vector = parseVector(recordVector);
      const isSecret = recordType === "secret" || recordIsSecret;
      const secrets = isSecret ? parseSecretFields(secretText) : undefined;
      await jsonFetch(
        `/api/cumulus-db/databases/${selectedId}/records`,
        {
          method: "POST",
          body: JSON.stringify({
            type: recordType,
            key: recordKey || undefined,
            title: title || undefined,
            content: content || undefined,
            json,
            vector,
            recordIsSecret: isSecret,
            secrets,
            tags: splitCsv(recordTags),
          }),
        },
        connectionToken.trim(),
      );
      setTitle("");
      setContent("");
      setRecordKey("");
      setRecordJson("");
      setRecordVector("");
      setRecordIsSecret(false);
      setHasSearched(false);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function seedEvidence() {
    if (!selectedId || !connectionToken.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
      let created = 0;

      for (const [index, type] of RECORD_TYPES.entries()) {
        const record = evidenceRecord(type, index, runId);
        if (type === "event") {
          await jsonFetch(
            `/api/cumulus-db/databases/${selectedId}/events`,
            {
              method: "POST",
              body: JSON.stringify(record),
            },
            connectionToken.trim(),
          );
        } else if (type === "kv") {
          await jsonFetch(
            `/api/cumulus-db/databases/${selectedId}/kv/${encodeURIComponent(`evidence.${runId}`)}`,
            {
              method: "PUT",
              body: JSON.stringify({
                value: record.json,
                metadata: {
                  evidenceRunId: runId,
                  source: "dashboard",
                },
              }),
            },
            connectionToken.trim(),
          );
        } else {
          await jsonFetch(
            `/api/cumulus-db/databases/${selectedId}/records`,
            {
              method: "POST",
              body: JSON.stringify(record),
            },
            connectionToken.trim(),
          );
        }
        created += 1;
      }

      const proof = await jsonFetch<{ hits: SearchHit[] }>(
        `/api/cumulus-db/databases/${selectedId}/search`,
        {
          method: "POST",
          body: JSON.stringify({
            query: runId,
            type: "note",
            limit: 1,
          }),
        },
        connectionToken.trim(),
      );

      setEvidenceRun({ id: runId, created, searchHits: proof.hits.length });
      setSearchHits(proof.hits);
      setHasSearched(true);
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
    try {
      const vector = parseVector(searchVector);
      const parsedLimit = Number.parseInt(searchLimit, 10);
      const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 12;
      const body = await jsonFetch<{ hits: SearchHit[] }>(
        `/api/cumulus-db/databases/${selectedId}/search`,
        {
          method: "POST",
          body: JSON.stringify({
            ...(query.trim() ? { query: query.trim() } : {}),
            ...(searchType !== "all" ? { type: searchType } : {}),
            ...(vector ? { vector } : {}),
            limit,
          }),
        },
        connectionToken.trim(),
      );
      setSearchHits(body.hits);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function parseEnv() {
    setError(null);
    try {
      const body = await jsonFetch<EnvParse>("/api/cumulus-db/env/parse", {
        method: "POST",
        body: JSON.stringify({ content: envText }),
      });
      setEnvParse(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function saveEnvRecord() {
    if (!selectedId || !envParse || !connectionToken.trim()) return;
    setBusy(true);
    setError(null);
    try {
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
      await jsonFetch(
        `/api/cumulus-db/databases/${selectedId}/records`,
        {
          method: "POST",
          body: JSON.stringify({
            type: Object.keys(secrets).length ? "secret" : "document",
            title: "Environment variables",
            json: publicVars,
            secrets,
            tags: ["env"],
          }),
        },
        connectionToken.trim(),
      );
      setEnvText("");
      setEnvParse(null);
      setHasSearched(false);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function revealSecret(recordId: string, field: string) {
    if (!selectedId || !connectionToken.trim()) return;
    setError(null);
    try {
      const body = await jsonFetch<{ secret: { field: string; value: string } }>(
        `/api/cumulus-db/databases/${selectedId}/secrets/reveal`,
        {
          method: "POST",
          body: JSON.stringify({ recordId, field }),
        },
        connectionToken.trim(),
      );
      setRevealed(body.secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function putKv() {
    if (!selectedId || !connectionToken.trim() || !kvKey.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const value = parseOptionalJson(kvValue);
      if (value === undefined) throw new Error("KV value is required.");
      const metadata = parseOptionalObject(kvMetadata, "KV metadata");
      const body = await jsonFetch<{ record: DbRecord }>(
        `/api/cumulus-db/databases/${selectedId}/kv/${encodeURIComponent(kvKey.trim())}`,
        {
          method: "PUT",
          body: JSON.stringify({ value, metadata }),
        },
        connectionToken.trim(),
      );
      setKvResult(body.record);
      setHasSearched(false);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function getKv() {
    if (!selectedId || !connectionToken.trim() || !kvKey.trim()) return;
    setError(null);
    try {
      const body = await jsonFetch<{ record: DbRecord }>(
        `/api/cumulus-db/databases/${selectedId}/kv/${encodeURIComponent(kvKey.trim())}`,
        undefined,
        connectionToken.trim(),
      );
      setKvResult(body.record);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function appendEvent() {
    if (!selectedId || !connectionToken.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await jsonFetch(
        `/api/cumulus-db/databases/${selectedId}/events`,
        {
          method: "POST",
          body: JSON.stringify({
            type: "event",
            title: eventTitle || undefined,
            content: eventContent || undefined,
            json: parseOptionalJson(eventJson),
            tags: splitCsv(eventTags),
          }),
        },
        connectionToken.trim(),
      );
      setHasSearched(false);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function toggleScope(scope: TokenScope) {
    setSelectedScopes((current) =>
      current.includes(scope)
        ? current.filter((item) => item !== scope)
        : [...current, scope],
    );
  }

  async function createToken() {
    if (!selectedId || !connectionToken.trim()) return;
    setBusy(true);
    setTokenError(null);
    setIssuedToken(null);
    try {
      const body = await jsonFetch<{ token: TokenIssue }>(
        `/api/cumulus-db/databases/${selectedId}/tokens`,
        {
          method: "POST",
          body: JSON.stringify({ label: tokenLabel || "Dashboard token", scopes: selectedScopes }),
        },
        connectionToken.trim(),
      );
      setIssuedToken(body.token);
      await loadTokens();
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function rotateToken(tokenId: string) {
    if (!selectedId || !connectionToken.trim()) return;
    setBusy(true);
    setTokenError(null);
    setIssuedToken(null);
    try {
      const body = await jsonFetch<{ token: TokenIssue }>(
        `/api/cumulus-db/databases/${selectedId}/tokens/${encodeURIComponent(tokenId)}/rotate`,
        { method: "POST" },
        connectionToken.trim(),
      );
      setIssuedToken(body.token);
      await loadTokens();
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function revokeToken(tokenId: string) {
    if (!selectedId || !connectionToken.trim()) return;
    setBusy(true);
    setTokenError(null);
    try {
      await jsonFetch(
        `/api/cumulus-db/databases/${selectedId}/tokens/${encodeURIComponent(tokenId)}`,
        { method: "DELETE" },
        connectionToken.trim(),
      );
      await loadTokens();
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function createBackup() {
    if (!selectedId || !connectionToken.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const body = await jsonFetch<{ backup: BackupResult }>(
        `/api/cumulus-db/databases/${selectedId}/backups`,
        { method: "POST" },
        connectionToken.trim(),
      );
      setBackupResult(body.backup);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function compactDatabase() {
    if (!selectedId || !connectionToken.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const body = await jsonFetch<{ compaction: CompactResult }>(
        `/api/cumulus-db/databases/${selectedId}/compact`,
        { method: "POST" },
        connectionToken.trim(),
      );
      setCompactResult(body.compaction);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
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
                API evidence console
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

          <form
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              void loadDatabases();
            }}
          >
            <label className="sr-only" htmlFor="cumulus-db-database-id">
              Database id
            </label>
            <Input
              id="cumulus-db-database-id"
              value={connectionDatabaseId}
              onChange={(event) => setConnectionDatabaseId(event.target.value)}
              placeholder="Database id"
              autoComplete="off"
              className="font-mono text-xs"
            />
            <label className="sr-only" htmlFor="cumulus-db-token">
              Scoped token
            </label>
            <Input
              id="cumulus-db-token"
              value={connectionToken}
              onChange={(event) => setConnectionToken(event.target.value)}
              placeholder="Scoped token"
              type="password"
              autoComplete="off"
              aria-describedby="cumulus-db-token-hint"
              className="font-mono text-xs"
            />
            <Button type="submit" disabled={!connectionDatabaseId.trim() || !connectionToken.trim() || busy}>
              Connect
            </Button>
          </form>
          <p id="cumulus-db-token-hint" className="mt-3 text-xs leading-5 text-[color:var(--muted)]">
            Data tokens can read, write, search, and store secrets. Revealing encrypted secret values requires an admin token.
          </p>

          {selected ? (
            <div className="mt-4 rounded-[5.5px] border border-white/10 bg-white/[0.03] p-4 text-sm text-[color:var(--muted)]">
              Connected to <span className="font-mono text-[color:var(--subtitle)]">{selected.id}</span>. Tokens stay in this browser and are forwarded as bearer tokens.
            </div>
          ) : null}
        </div>

        <div className="rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-subtle)] p-5 shadow-[var(--glass-shadow-e1)] backdrop-blur-[14px]">
          <ShieldCheck className="mb-3 size-5 text-[color:var(--neon-green)]" />
          <h2 className="text-sm font-medium text-[color:var(--title)]">Selected database</h2>
          <dl className="mt-4 space-y-3 text-xs text-[color:var(--muted)]">
            <div>
              <dt className="uppercase tracking-[0.16em]">Database</dt>
              <dd className="mt-1 break-all font-mono text-[color:var(--subtitle)]">{selected?.id ?? "None"}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.16em]">Records</dt>
              <dd className="mt-1 font-mono text-[color:var(--subtitle)]">{records.length}</dd>
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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--title)]">
                <Activity className="size-4" />
                Provider health
              </div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Live status for the configured Cumulus DB endpoint.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={loadProviderMetadata}>
              <RefreshCw className="size-4" />
              Check
            </Button>
          </div>
          <div className="mt-4 rounded-[5.5px] border border-white/10 bg-black/10 p-4">
            {health ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[color:var(--muted)]">Service</span>
                <span className="font-mono text-[color:var(--subtitle)]">
                  {health.service ?? "cumulus-db"} · {health.ok ? "healthy" : "unhealthy"}
                </span>
              </div>
            ) : (
              <div className="text-sm text-amber-100">{healthError ?? "No health response yet."}</div>
            )}
          </div>
        </div>

        <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--title)]">
            <FileCode2 className="size-4" />
            MCP metadata
          </div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Advertised tool surface exposed by the provider MCP endpoint.
          </p>
          <div className="mt-4 rounded-[5.5px] border border-white/10 bg-black/10 p-4">
            {mcpManifest ? (
              <>
                <div className="mb-3 text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {mcpManifest.name}
                </div>
                <div className="flex flex-wrap gap-2">
                  {mcpManifest.tools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full border border-white/10 px-2 py-1 font-mono text-[11px] text-[color:var(--subtitle)]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-amber-100">{mcpError ?? "No MCP metadata yet."}</div>
            )}
          </div>
        </div>
      </section>

      {selected ? (
        <>
          <section className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-sm font-medium text-[color:var(--title)]">Record type coverage</h2>
                <p className="mt-2 max-w-[72ch] text-sm leading-6 text-[color:var(--muted)]">
                  The evidence seed writes all supported Cumulus DB record types through HTTP/token API calls, including dedicated event and key-value endpoints.
                </p>
              </div>
              <Button onClick={seedEvidence} disabled={busy || !connectionToken.trim()}>
                <Plus className="mr-2 size-4" />
                Seed evidence
              </Button>
            </div>

            {evidenceRun ? (
              <div className="mt-4 rounded-[5.5px] border border-[color:var(--neon-green)]/30 bg-[color:var(--neon-green)]/10 p-4 text-sm text-[color:var(--subtitle)]">
                Created {evidenceRun.created} evidence records for run{" "}
                <span className="font-mono text-[color:var(--title)]">{evidenceRun.id}</span>. Search proof returned{" "}
                {evidenceRun.searchHits} hit.
              </div>
            ) : null}

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {coverage.map((item) => (
                <div
                  key={item.type}
                  className={`rounded-[5.5px] border px-3 py-3 text-xs ${
                    item.present
                      ? "border-[color:var(--neon-green)]/30 bg-[color:var(--neon-green)]/10"
                      : "border-white/10 bg-black/10"
                  }`}
                >
                  <div className="font-mono text-[color:var(--title)]">{item.type}</div>
                  <div className="mt-1 text-[color:var(--muted)]">{item.count} stored</div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-medium text-[color:var(--title)]">
                    <Database className="size-4" />
                    Key-value store
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    Read and write dedicated KV entries without using the generic record form.
                  </p>
                </div>
                <div className="font-mono text-xs text-[color:var(--muted)]">{kvRecords.length} keys</div>
              </div>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                <Input
                  value={kvKey}
                  onChange={(event) => setKvKey(event.target.value)}
                  placeholder="KV key, e.g. agent.state"
                  className="font-mono text-xs"
                />
                <Button variant="secondary" onClick={getKv} disabled={!kvKey.trim() || busy}>
                  Read
                </Button>
                <Button onClick={putKv} disabled={!kvKey.trim() || busy}>
                  Write
                </Button>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <Textarea
                  value={kvValue}
                  onChange={(event) => setKvValue(event.target.value)}
                  placeholder='Value JSON, e.g. {"status":"ok"}'
                  className="min-h-28 font-mono text-xs"
                />
                <Textarea
                  value={kvMetadata}
                  onChange={(event) => setKvMetadata(event.target.value)}
                  placeholder='Metadata JSON, e.g. {"source":"dashboard"}'
                  className="min-h-28 font-mono text-xs"
                />
              </div>
              {kvResult ? (
                <pre className="mt-3 max-h-44 overflow-auto rounded-[5.5px] border border-white/10 bg-black/20 p-3 text-xs leading-5 text-[color:var(--subtitle)]">
                  {formatJson(kvResult.json)}
                </pre>
              ) : null}
              {kvRecords.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {kvRecords.slice(0, 12).map((record) => (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => setKvKey(record.key ?? "")}
                      className="rounded-full border border-white/10 px-2 py-1 font-mono text-[11px] text-[color:var(--muted)] hover:text-[color:var(--title)]"
                    >
                      {record.key ?? record.id}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-medium text-[color:var(--title)]">
                    <ListTree className="size-4" />
                    Events
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    Append event records through the event-specific endpoint and inspect the latest stream entries.
                  </p>
                </div>
                <div className="font-mono text-xs text-[color:var(--muted)]">{eventRecords.length} events</div>
              </div>
              <div className="space-y-3">
                <Input value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} placeholder="Event title" />
                <Textarea
                  value={eventContent}
                  onChange={(event) => setEventContent(event.target.value)}
                  placeholder="Event content"
                  className="min-h-20"
                />
                <Textarea
                  value={eventJson}
                  onChange={(event) => setEventJson(event.target.value)}
                  placeholder='Event JSON, e.g. {"source":"dashboard"}'
                  className="min-h-20 font-mono text-xs"
                />
                <Input value={eventTags} onChange={(event) => setEventTags(event.target.value)} placeholder="Tags, comma-separated" />
                <Button onClick={appendEvent} disabled={busy}>
                  <Plus className="mr-2 size-4" />
                  Append event
                </Button>
              </div>
              {eventRecords.length ? (
                <div className="mt-4 max-h-64 space-y-2 overflow-auto">
                  {eventRecords.slice(0, 6).map((record) => (
                    <div key={record.id} className="rounded-[5.5px] border border-white/10 bg-black/10 p-3">
                      <div className="truncate text-sm text-[color:var(--title)]">{record.title ?? record.id}</div>
                      <div className="mt-1 font-mono text-[11px] text-[color:var(--muted)]">
                        {new Date(record.updatedAt).toLocaleString()}
                      </div>
                      {record.content ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-[color:var(--subtitle)]">{record.content}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-medium text-[color:var(--title)]">
                    <KeyRound className="size-4" />
                    Token management
                  </h2>
                  <p className="mt-2 max-w-[72ch] text-sm leading-6 text-[color:var(--muted)]">
                    Requires a token with token management scope. Newly issued token values are shown once.
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={loadTokens} disabled={busy || !connectionToken.trim()}>
                  <RefreshCw className="size-4" />
                  Load tokens
                </Button>
              </div>
              {tokenError ? (
                <div className="mb-4 rounded-[5.5px] border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                  {tokenError}. Use an admin token for this panel.
                </div>
              ) : null}
              {issuedToken ? (
                <div className="mb-4 rounded-[5.5px] border border-[color:var(--neon-green)]/30 bg-[color:var(--neon-green)]/10 p-3 text-sm text-[color:var(--subtitle)]">
                  New token: <code className="break-all text-[color:var(--title)]">{issuedToken.token}</code>
                </div>
              ) : null}
              <div className="grid gap-3 lg:grid-cols-[minmax(0,220px)_1fr_auto]">
                <Input value={tokenLabel} onChange={(event) => setTokenLabel(event.target.value)} placeholder="Token label" />
                <div className="flex flex-wrap gap-2">
                  {TOKEN_SCOPES.map((scope) => (
                    <label
                      key={scope}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border px-2 py-1 font-mono text-[11px] ${
                        selectedScopes.includes(scope)
                          ? "border-[color:var(--neon-green)]/30 bg-[color:var(--neon-green)]/10 text-[color:var(--title)]"
                          : "border-white/10 text-[color:var(--muted)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope)}
                        onChange={() => toggleScope(scope)}
                        className="size-3"
                      />
                      {scope}
                    </label>
                  ))}
                </div>
                <Button onClick={createToken} disabled={busy || !selectedScopes.length}>
                  Create
                </Button>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs text-[color:var(--muted)]">
                  <thead className="border-b border-white/10 uppercase tracking-[0.16em]">
                    <tr>
                      <th className="py-2 pr-3 font-normal">Label</th>
                      <th className="py-2 pr-3 font-normal">Scopes</th>
                      <th className="py-2 pr-3 font-normal">Last used</th>
                      <th className="py-2 pr-3 font-normal">Status</th>
                      <th className="py-2 pr-3 font-normal">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((token) => (
                      <tr key={token.id} className="border-b border-white/5">
                        <td className="py-3 pr-3 font-mono text-[color:var(--subtitle)]">{token.label}</td>
                        <td className="py-3 pr-3">
                          <div className="flex max-w-lg flex-wrap gap-1">
                            {token.scopes.map((scope) => (
                              <span key={scope} className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px]">
                                {scope}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-3 font-mono">{token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleString() : "never"}</td>
                        <td className="py-3 pr-3">{token.revokedAt ? "revoked" : "active"}</td>
                        <td className="py-3 pr-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => rotateToken(token.id)} disabled={busy || Boolean(token.revokedAt)}>
                              <RotateCcw className="size-4" />
                              Rotate
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => revokeToken(token.id)} disabled={busy || Boolean(token.revokedAt)}>
                              <Trash2 className="size-4" />
                              Revoke
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!tokens.length ? (
                  <div className="py-8 text-center text-sm text-[color:var(--muted)]">No tokens loaded.</div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-[color:var(--title)]">
                <Archive className="size-4" />
                Backup and compact
              </h2>
              <p className="text-sm leading-6 text-[color:var(--muted)]">
                Requires backup management scope. Backups snapshot records and tokens; compaction rewrites the active segment and updates the manifest.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={createBackup} disabled={busy}>
                  <Archive className="mr-2 size-4" />
                  Backup
                </Button>
                <Button onClick={compactDatabase} disabled={busy}>
                  <Table2 className="mr-2 size-4" />
                  Compact
                </Button>
              </div>
              <dl className="mt-5 space-y-3 text-xs text-[color:var(--muted)]">
                <div>
                  <dt className="uppercase tracking-[0.16em]">Last compacted</dt>
                  <dd className="mt-1 font-mono text-[color:var(--subtitle)]">{selected.lastCompactedAt ?? "Never"}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.16em]">Backup result</dt>
                  <dd className="mt-1 break-all font-mono text-[color:var(--subtitle)]">
                    {backupResult ? `${backupResult.records} records · ${backupResult.path}` : "No backup this session"}
                  </dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.16em]">Compact result</dt>
                  <dd className="mt-1 break-all font-mono text-[color:var(--subtitle)]">
                    {compactResult ? `${compactResult.records} records · ${compactResult.segment}` : "No compaction this session"}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-6">
              <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_120px]">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Text query"
                  />
                  <select
                    value={searchType}
                    onChange={(event) => setSearchType(event.target.value as "all" | RecordType)}
                    className="h-10 rounded-[5.5px] border border-white/10 bg-[color:var(--bg)] px-3 text-sm text-[color:var(--fg)] outline-none"
                  >
                    <option value="all">All types</option>
                    {RECORD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={searchLimit}
                    onChange={(event) => setSearchLimit(event.target.value)}
                    inputMode="numeric"
                    placeholder="Limit"
                  />
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <Input
                    value={searchVector}
                    onChange={(event) => setSearchVector(event.target.value)}
                    placeholder="Vector search, e.g. 8, 1, 1"
                    className="font-mono text-xs"
                  />
                  <Button variant="secondary" onClick={() => {
                    setHasSearched(false);
                    setSearchHits([]);
                  }}>
                    Clear
                  </Button>
                  <Button onClick={runSearch}>
                    <Search className="mr-2 size-4" />
                    Search
                  </Button>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    {hasSearched ? `${searchHits.length} search hits` : `${records.length} stored records`}
                  </div>
                  <div className="flex gap-2">
                    {(["detailed", "compact"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setRecordView(mode)}
                        className={`rounded-[5.5px] border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${
                          recordView === mode
                            ? "border-[color:var(--neon-green)]/30 bg-[color:var(--neon-green)]/10 text-[color:var(--title)]"
                            : "border-white/10 text-[color:var(--muted)]"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <RecordList
                    items={displayItems}
                    compact={recordView === "compact"}
                    onReveal={revealSecret}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
                <h2 className="mb-4 text-sm font-medium text-[color:var(--title)]">Write record</h2>
                <div className="space-y-3">
                  <select
                    value={recordType}
                    onChange={(event) => setRecordType(event.target.value as RecordType)}
                    className="h-10 w-full rounded-[5.5px] border border-white/10 bg-[color:var(--bg)] px-3 text-sm text-[color:var(--fg)] outline-none"
                  >
                    {RECORD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <Input value={recordKey} onChange={(event) => setRecordKey(event.target.value)} placeholder="Key, optional" />
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
                  <Textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Record content"
                    className="min-h-24"
                  />
                  <Textarea
                    value={recordJson}
                    onChange={(event) => setRecordJson(event.target.value)}
                    placeholder='JSON payload, e.g. {"status":"done"}'
                    className="min-h-24 font-mono text-xs"
                  />
                  <Input
                    value={recordVector}
                    onChange={(event) => setRecordVector(event.target.value)}
                    placeholder="Vector, e.g. 1, 0.4, 0.2"
                    className="font-mono text-xs"
                  />
                  <Input value={recordTags} onChange={(event) => setRecordTags(event.target.value)} placeholder="Tags, comma-separated" />
                  <label className="flex items-center gap-2 text-sm text-[color:var(--subtitle)]">
                    <input
                      type="checkbox"
                      checked={recordIsSecret}
                      onChange={(event) => setRecordIsSecret(event.target.checked)}
                    />
                    Encrypt content as secret
                  </label>
                  {(recordType === "secret" || recordIsSecret) ? (
                    <Textarea
                      value={secretText}
                      onChange={(event) => setSecretText(event.target.value)}
                      placeholder="KEY=value"
                      className="min-h-20 font-mono text-xs"
                    />
                  ) : null}
                  <Button onClick={createRecord} disabled={busy}>
                    <Plus className="mr-2 size-4" />
                    Add record
                  </Button>
                </div>
              </div>

              <div className="rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-[color:var(--title)]">
                  <KeyRound className="size-4" />
                  Env parser
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
                  <Button onClick={saveEnvRecord} disabled={!envParse || busy}>
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
        </>
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
  compact,
  items,
  onReveal,
}: {
  compact: boolean;
  items: DisplayItem[];
  onReveal: (recordId: string, field: string) => void;
}) {
  if (!items.length) {
    return <div className="py-10 text-center text-sm text-[color:var(--muted)]">No records.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const record = item.record;
        if (compact) {
          return (
            <article
              key={record.id}
              className="grid gap-2 rounded-[5.5px] border border-white/10 bg-black/10 p-3 text-xs md:grid-cols-[120px_minmax(0,1fr)_160px_auto]"
            >
              <div className="font-mono text-[color:var(--muted)]">{record.type}</div>
              <div className="min-w-0">
                <div className="truncate text-sm text-[color:var(--title)]">{record.title ?? record.key ?? record.id}</div>
                <div className="truncate font-mono text-[11px] text-[color:var(--muted)]">{record.id}</div>
              </div>
              <div className="font-mono text-[color:var(--muted)]">{new Date(record.updatedAt).toLocaleString()}</div>
              {record.secret.fields.length ? (
                <Button size="sm" variant="secondary" onClick={() => onReveal(record.id, record.secret.fields[0]!)}>
                  Reveal
                </Button>
              ) : (
                <span className="text-[color:var(--muted)]">-</span>
              )}
            </article>
          );
        }

        return (
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

            {item.score !== undefined ? (
              <div className="mb-3 grid gap-2 text-[11px] text-[color:var(--muted)] sm:grid-cols-3">
                <span>score {item.score.toFixed(3)}</span>
                <span>text {item.lexicalScore?.toFixed(3) ?? "0.000"}</span>
                <span>vector {item.vectorScore?.toFixed(3) ?? "0.000"}</span>
              </div>
            ) : null}

            {record.content ? (
              <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--subtitle)]">
                {record.content}
              </p>
            ) : null}

            {record.json !== undefined ? (
              <pre className="mt-3 max-h-44 overflow-auto rounded-[5.5px] border border-white/10 bg-black/20 p-3 text-xs leading-5 text-[color:var(--subtitle)]">
                {formatJson(record.json)}
              </pre>
            ) : null}

            {record.vector?.length ? (
              <div className="mt-3 font-mono text-[11px] text-[color:var(--muted)]">
                vector [{record.vector.join(", ")}]
              </div>
            ) : null}

            {record.tags.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {record.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-[color:var(--muted)]">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

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
        );
      })}
    </div>
  );
}
