// SPDX-License-Identifier: AGPL-3.0-only
import { createServer } from 'node:http';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createHandler } from '../http.js';
import { CumulusDbEngine } from '../storage.js';
import type { CumulusDbConfig } from '../config.js';
import type { RecordType } from '../types.js';

const cleanup: Array<() => Promise<void> | void> = [];

afterEach(async () => {
  for (const fn of cleanup.splice(0)) await fn();
});

async function testServer() {
  const dataDir = await mkdtemp(join(tmpdir(), 'cumulus-db-http-'));
  const config: CumulusDbConfig = {
    dataDir,
    publicUrl: 'http://127.0.0.1:0',
    adminSecret: Buffer.alloc(32, 4).toString('base64'),
    masterKey: Buffer.alloc(32, 4),
    relayWebhookSecret: null,
    port: 0,
    embeddings: { baseUrl: null, apiKey: null, model: null },
  };
  const engine = new CumulusDbEngine(dataDir, config.masterKey);
  const server = createServer(createHandler(engine, config));
  const baseUrl = await new Promise<URL>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') throw new Error('invalid address');
      resolve(new URL(`http://127.0.0.1:${addr.port}`));
    });
  });
  cleanup.push(() => new Promise<void>((resolve) => server.close(() => resolve())));
  cleanup.push(() => engine.destroyAllForTests());
  return { baseUrl, engine };
}

describe('HTTP API', () => {
  it('creates records through REST and searches them', async () => {
    const { baseUrl, engine } = await testServer();
    const created = await engine.createWorkspace({ ownerAgentId: 'agent-1' });
    const headers = {
      Authorization: `Bearer ${created.dataToken.token}`,
      'Content-Type': 'application/json',
    };

    const write = await fetch(new URL(`/v1/databases/${created.manifest.id}/records`, baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ type: 'note', content: 'Hybrid search works for agents.' }),
    });
    expect(write.status).toBe(201);

    const search = await fetch(new URL(`/v1/databases/${created.manifest.id}/search`, baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'hybrid agents' }),
    });
    expect(search.status).toBe(200);
    const body = (await search.json()) as { hits: unknown[] };
    expect(body.hits.length).toBe(1);
  });

  it('stores every public record type and searches by text, vector, type, and limit', async () => {
    const { baseUrl, engine } = await testServer();
    const created = await engine.createWorkspace({ ownerAgentId: 'agent-1' });
    const headers = {
      Authorization: `Bearer ${created.dataToken.token}`,
      'Content-Type': 'application/json',
    };
    const recordTypes: RecordType[] = [
      'document',
      'note',
      'run',
      'message',
      'event',
      'kv',
      'tool_call',
      'artifact',
      'summary',
      'preference',
      'secret',
      'entity',
      'task',
      'observation',
    ];
    const storedTypes = new Set<string>();

    for (const [index, type] of recordTypes.entries()) {
      const payload = {
        type,
        key: type === 'kv' ? 'evidence.key' : undefined,
        title: `Evidence ${type}`,
        content: `Cumulus API evidence record for ${type}.`,
        json: { capability: type, index },
        tags: ['cumulus-api-evidence', type],
        vector: [index + 1, index % 3, 1],
        recordIsSecret: type === 'secret',
        secrets: type === 'secret' ? { EVIDENCE_TOKEN: 'demo-secret-not-real' } : undefined,
      };

      const response =
        type === 'event'
          ? await fetch(new URL(`/v1/databases/${created.manifest.id}/events`, baseUrl), {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
            })
          : type === 'kv'
            ? await fetch(new URL(`/v1/databases/${created.manifest.id}/kv/evidence.key`, baseUrl), {
                method: 'PUT',
                headers,
                body: JSON.stringify({ value: payload.json, metadata: { evidence: true } }),
              })
            : await fetch(new URL(`/v1/databases/${created.manifest.id}/records`, baseUrl), {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
              });

      expect(response.status).toBeLessThan(300);
      const body = (await response.json()) as { record: { type: string } };
      storedTypes.add(body.record.type);
    }

    expect([...storedTypes].sort()).toEqual([...recordTypes].sort());

    const textSearch = await fetch(new URL(`/v1/databases/${created.manifest.id}/search`, baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'evidence record', type: 'note', limit: 1 }),
    });
    expect(textSearch.status).toBe(200);
    const textBody = (await textSearch.json()) as { hits: Array<{ record: { type: string } }> };
    expect(textBody.hits).toHaveLength(1);
    expect(textBody.hits[0]?.record.type).toBe('note');

    const vectorSearch = await fetch(new URL(`/v1/databases/${created.manifest.id}/search`, baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ vector: [8, 1, 1], type: 'artifact', limit: 1 }),
    });
    expect(vectorSearch.status).toBe(200);
    const vectorBody = (await vectorSearch.json()) as { hits: Array<{ record: { type: string }; vectorScore: number }> };
    expect(vectorBody.hits).toHaveLength(1);
    expect(vectorBody.hits[0]?.record.type).toBe('artifact');
    expect(vectorBody.hits[0]?.vectorScore).toBeGreaterThan(0);
  });

  it('implements the advertised MCP database tools', async () => {
    const { baseUrl, engine } = await testServer();
    const created = await engine.createWorkspace({ ownerAgentId: 'agent-1' });
    const secret = await engine.writeRecord(created.manifest.id, {
      type: 'secret',
      title: 'MCP secret',
      recordIsSecret: true,
      secrets: { EVIDENCE_TOKEN: 'demo-secret-not-real' },
    });

    const manifest = await fetch(new URL('/mcp', baseUrl));
    expect(manifest.status).toBe(200);
    const manifestBody = (await manifest.json()) as { tools: string[] };
    expect(manifestBody.tools).toContain('cumulus_db_put_kv');
    expect(manifestBody.tools).toContain('cumulus_db_get_kv');
    expect(manifestBody.tools).toContain('cumulus_db_reveal_secret');

    const put = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus_db_put_kv',
        arguments: {
          database_id: created.manifest.id,
          token: created.dataToken.token,
          key: 'mcp.evidence',
          value: { ok: true },
        },
      }),
    });
    expect(put.status).toBe(200);

    const get = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus_db_get_kv',
        arguments: {
          database_id: created.manifest.id,
          token: created.dataToken.token,
          key: 'mcp.evidence',
        },
      }),
    });
    expect(get.status).toBe(200);
    const getBody = (await get.json()) as { result: { json: { ok: boolean } } };
    expect(getBody.result.json.ok).toBe(true);

    const reveal = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus_db_reveal_secret',
        arguments: {
          database_id: created.manifest.id,
          token: created.adminToken.token,
          record_id: secret.id,
          field: 'EVIDENCE_TOKEN',
        },
      }),
    });
    expect(reveal.status).toBe(200);
    const revealBody = (await reveal.json()) as { result: { value: string } };
    expect(revealBody.result.value).toBe('demo-secret-not-real');
  });
});
