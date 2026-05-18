// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto';
import {
  NIMBUS_API_VERSION,
  NIMBUS_IR_SCHEMA_ID,
  NIMBUS_KIND,
  nimbusIrJsonSchema,
} from './nimbus-schema.js';

export const NIMBUS_COMPILER_VERSION = '0.1.0';

type TokenType =
  | 'identifier'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'doc'
  | '{'
  | '}'
  | '['
  | ']'
  | ':'
  | ','
  | '('
  | ')'
  | '.'
  | 'eof';

interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

export type NimbusValue =
  | string
  | number
  | boolean
  | null
  | NimbusValue[]
  | { [key: string]: NimbusValue }
  | { kind: 'envRef'; name: string }
  | { kind: 'reference'; path: string[] };

export interface NimbusDeclaration {
  type: string;
  name: string;
  docs?: string;
  fields: Record<string, NimbusValue>;
  declarations: NimbusDeclaration[];
  sourceSpan: { file: string; start: number; end: number };
}

export interface NimbusDocumentAst {
  type: 'Document';
  version: string;
  imports: Array<{ path: string; alias?: string }>;
  declarations: NimbusDeclaration[];
}

export interface NimbusIr {
  $schema: typeof NIMBUS_IR_SCHEMA_ID;
  apiVersion: typeof NIMBUS_API_VERSION;
  kind: typeof NIMBUS_KIND;
  metadata: {
    name: string;
    compilerVersion: string;
    sourceHash: string;
    docs?: string;
  };
  spec: {
    namespace: string;
    apps: NimbusNamedIr[];
    collections: NimbusCollectionIr[];
    indexes: NimbusNamedIr[];
    policies: NimbusNamedIr[];
    secrets: NimbusSecretIr[];
    backups: NimbusNamedIr[];
    approvals: NimbusNamedIr[];
  };
}

export interface NimbusNamedIr {
  name: string;
  docs?: string;
  attributes?: Record<string, unknown>;
}

export interface NimbusCollectionIr extends NimbusNamedIr {
  fields: Record<string, unknown>;
  indexes?: NimbusNamedIr[];
}

export interface NimbusSecretIr extends NimbusNamedIr {
  source: { kind: 'envRef'; name: string };
}

export interface CompileNimbusOptions {
  fileName?: string;
  allowSystemNamespace?: boolean;
  name?: string;
}

export interface CompileNimbusResult {
  ast: NimbusDocumentAst;
  ir: NimbusIr;
  canonicalJson: string;
  hash: string;
  schema: typeof nimbusIrJsonSchema;
}

const DECLARATION_TYPES = new Set([
  'namespace',
  'app',
  'collection',
  'index',
  'policy',
  'secret',
  'backup',
  'approval',
]);

const RESERVED_NAMESPACES = [
  'system',
  '_system',
  '_cumulus',
  'cumulus',
];

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function isReservedNamespace(namespace: string): boolean {
  return RESERVED_NAMESPACES.some((reserved) => namespace === reserved || namespace.startsWith(`${reserved}.`));
}

export function assertNimbusNamespaceAllowed(ir: NimbusIr, allowSystemNamespace = false): void {
  if (isReservedNamespace(ir.spec.namespace) && !allowSystemNamespace) {
    throw new Error(`namespace ${ir.spec.namespace} is reserved for provider-owned system documents`);
  }
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  const push = (type: TokenType, value: string, start: number, end: number) => {
    tokens.push({ type, value, start, end });
  };

  while (index < source.length) {
    const char = source[index] ?? '';
    const next = source[index + 1] ?? '';
    const start = index;

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      const doc = source[index + 2] === '/';
      index += doc ? 3 : 2;
      const textStart = index;
      while (index < source.length && source[index] !== '\n') index += 1;
      if (doc) push('doc', source.slice(textStart, index).trim(), start, index);
      continue;
    }

    if ('{}[]:,().'.includes(char)) {
      push(char as TokenType, char, start, start + 1);
      index += 1;
      continue;
    }

    if (char === '"') {
      index += 1;
      let value = '';
      while (index < source.length) {
        const current = source[index] ?? '';
        if (current === '"') {
          index += 1;
          push('string', value, start, index);
          break;
        }
        if (current === '\\') {
          const escaped = source[index + 1];
          if (escaped === undefined) throw new Error('unterminated string escape');
          const map: Record<string, string> = { n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\' };
          value += map[escaped] ?? escaped;
          index += 2;
          continue;
        }
        value += current;
        index += 1;
      }
      if (tokens[tokens.length - 1]?.start !== start) throw new Error('unterminated string literal');
      continue;
    }

    if (/[0-9-]/.test(char)) {
      index += 1;
      while (index < source.length && /[0-9._]/.test(source[index] ?? '')) index += 1;
      push('number', source.slice(start, index).replaceAll('_', ''), start, index);
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      index += 1;
      while (index < source.length && /[A-Za-z0-9_-]/.test(source[index] ?? '')) index += 1;
      const value = source.slice(start, index);
      if (value === 'true' || value === 'false') push('boolean', value, start, index);
      else if (value === 'null') push('null', value, start, index);
      else push('identifier', value, start, index);
      continue;
    }

    throw new Error(`unexpected character ${JSON.stringify(char)} at ${start}`);
  }

  tokens.push({ type: 'eof', value: '', start: source.length, end: source.length });
  return tokens;
}

class Parser {
  private cursor = 0;
  private pendingDocs: string[] = [];

  constructor(
    private readonly tokens: Token[],
    private readonly fileName: string,
  ) {}

  parseDocument(): NimbusDocumentAst {
    let version = 'v1alpha1';
    const imports: NimbusDocumentAst['imports'] = [];
    const declarations: NimbusDeclaration[] = [];

    this.collectDocs();
    if (this.peekValue('nimbus')) {
      this.expect('identifier', 'nimbus');
      version = this.expect('string').value;
    }

    while (!this.peek('eof')) {
      this.collectDocs();
      if (this.peek('eof')) break;
      if (this.peekValue('import')) {
        this.expect('identifier', 'import');
        const path = this.expect('string').value;
        let alias: string | undefined;
        if (this.peekValue('as')) {
          this.expect('identifier', 'as');
          alias = this.expect('identifier').value;
        }
        imports.push({ path, ...(alias ? { alias } : {}) });
        continue;
      }
      declarations.push(this.parseDeclaration());
    }

    return { type: 'Document', version, imports, declarations };
  }

  private parseDeclaration(): NimbusDeclaration {
    this.collectDocs();
    const docs = this.consumeDocs();
    const start = this.current().start;
    const type = this.expect('identifier').value;
    if (!DECLARATION_TYPES.has(type)) throw new Error(`unknown Nimbus declaration ${type}`);
    const nameToken = this.peek('string') ? this.expect('string') : this.expect('identifier');
    this.expect('{');
    const fields: Record<string, NimbusValue> = {};
    const declarations: NimbusDeclaration[] = [];

    while (!this.peek('}')) {
      this.collectDocs();
      if (this.peek('}')) break;
      if (this.peek('identifier') && DECLARATION_TYPES.has(this.current().value) && this.lookahead(1).type !== ':') {
        declarations.push(this.parseDeclaration());
        this.optionalComma();
        continue;
      }

      const fieldName = this.expect('identifier').value;
      this.expect(':');
      fields[fieldName] = this.parseValue();
      this.optionalComma();
    }

    const end = this.expect('}').end;
    return {
      type,
      name: nameToken.value,
      ...(docs ? { docs } : {}),
      fields,
      declarations,
      sourceSpan: { file: this.fileName, start, end },
    };
  }

  private parseValue(): NimbusValue {
    const token = this.current();
    if (token.type === 'string') return this.expect('string').value;
    if (token.type === 'number') return Number(this.expect('number').value);
    if (token.type === 'boolean') return this.expect('boolean').value === 'true';
    if (token.type === 'null') {
      this.expect('null');
      return null;
    }
    if (token.type === '[') return this.parseArray();
    if (token.type === '{') return this.parseObject();
    if (token.type === 'identifier') {
      if (token.value === 'env' && this.lookahead(1).type === '(') {
        this.expect('identifier', 'env');
        this.expect('(');
        const name = this.expect('string').value;
        this.expect(')');
        return { kind: 'envRef', name };
      }
      const path = [this.expect('identifier').value];
      while (this.peek('.')) {
        this.expect('.');
        path.push(this.expect('identifier').value);
      }
      return { kind: 'reference', path };
    }
    throw new Error(`unexpected value token ${token.type}`);
  }

  private parseArray(): NimbusValue[] {
    const items: NimbusValue[] = [];
    this.expect('[');
    while (!this.peek(']')) {
      items.push(this.parseValue());
      this.optionalComma();
    }
    this.expect(']');
    return items;
  }

  private parseObject(): Record<string, NimbusValue> {
    const object: Record<string, NimbusValue> = {};
    this.expect('{');
    while (!this.peek('}')) {
      const key = this.peek('string') ? this.expect('string').value : this.expect('identifier').value;
      this.expect(':');
      object[key] = this.parseValue();
      this.optionalComma();
    }
    this.expect('}');
    return object;
  }

  private collectDocs(): void {
    while (this.peek('doc')) this.pendingDocs.push(this.expect('doc').value);
  }

  private consumeDocs(): string | undefined {
    const docs = this.pendingDocs.join('\n').trim();
    this.pendingDocs = [];
    return docs || undefined;
  }

  private optionalComma(): void {
    if (this.peek(',')) this.expect(',');
  }

  private current(): Token {
    return this.tokens[this.cursor] ?? this.tokens[this.tokens.length - 1]!;
  }

  private lookahead(offset: number): Token {
    return this.tokens[this.cursor + offset] ?? this.tokens[this.tokens.length - 1]!;
  }

  private peek(type: TokenType): boolean {
    return this.current().type === type;
  }

  private peekValue(value: string): boolean {
    const token = this.current();
    return token.type === 'identifier' && token.value === value;
  }

  private expect(type: TokenType, value?: string): Token {
    const token = this.current();
    if (token.type !== type || (value !== undefined && token.value !== value)) {
      throw new Error(`expected ${value ?? type}, got ${token.value || token.type}`);
    }
    this.cursor += 1;
    return token;
  }
}

export function parseNimbus(source: string, options: CompileNimbusOptions = {}): NimbusDocumentAst {
  return new Parser(tokenize(source), options.fileName ?? 'document.nimbus').parseDocument();
}

export function compileNimbus(source: string, options: CompileNimbusOptions = {}): CompileNimbusResult {
  const ast = parseNimbus(source, options);
  const ir = astToIr(ast, source, options);
  const canonicalJson = canonicalStringify(ir);
  return {
    ast,
    ir,
    canonicalJson,
    hash: sha256(canonicalJson),
    schema: nimbusIrJsonSchema,
  };
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(sortCanonical(value));
}

function sortCanonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortCanonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortCanonical(entry)]),
  );
}

function astToIr(ast: NimbusDocumentAst, source: string, options: CompileNimbusOptions): NimbusIr {
  const namespaces = ast.declarations.filter((item) => item.type === 'namespace');
  const namespace = namespaces[0]?.name ?? 'default';

  const rootDeclarations = namespaces[0] ? namespaces[0].declarations : ast.declarations;
  const rootFields = namespaces[0]?.fields ?? {};
  const docs = namespaces[0]?.docs;
  const metadataName =
    options.name ??
    asString(rootFields.name) ??
    (namespace === 'default' ? 'nimbus-document' : namespace.replaceAll('.', '-'));

  const collections = rootDeclarations
    .filter((item) => item.type === 'collection')
    .map((item) => collectionToIr(item));

  const indexes = rootDeclarations
    .filter((item) => item.type === 'index')
    .map((item) => namedToIr(item));

  const ir: NimbusIr = {
    $schema: NIMBUS_IR_SCHEMA_ID,
    apiVersion: NIMBUS_API_VERSION,
    kind: NIMBUS_KIND,
    metadata: {
      name: metadataName,
      compilerVersion: NIMBUS_COMPILER_VERSION,
      sourceHash: sha256(source),
      ...(docs ? { docs } : {}),
    },
    spec: {
      namespace,
      apps: rootDeclarations.filter((item) => item.type === 'app').map((item) => namedToIr(item)),
      collections,
      indexes,
      policies: rootDeclarations.filter((item) => item.type === 'policy').map((item) => namedToIr(item)),
      secrets: rootDeclarations.filter((item) => item.type === 'secret').map((item) => secretToIr(item)),
      backups: rootDeclarations.filter((item) => item.type === 'backup').map((item) => namedToIr(item)),
      approvals: rootDeclarations.filter((item) => item.type === 'approval').map((item) => namedToIr(item)),
    },
  };

  validateNimbusIr(ir);
  assertNimbusNamespaceAllowed(ir, options.allowSystemNamespace);
  return ir;
}

function collectionToIr(declaration: NimbusDeclaration): NimbusCollectionIr {
  const childIndexes = declaration.declarations.filter((item) => item.type === 'index').map((item) => namedToIr(item));
  const fields = unknownRecord(declaration.fields.fields ?? {});
  if (!Object.keys(fields).length) throw new Error(`collection ${declaration.name} must define fields`);
  const attributes = attributesWithout(declaration.fields, ['fields']);
  return {
    name: declaration.name,
    ...(declaration.docs ? { docs: declaration.docs } : {}),
    fields,
    ...(childIndexes.length ? { indexes: childIndexes } : {}),
    ...(Object.keys(attributes).length ? { attributes } : {}),
  };
}

function secretToIr(declaration: NimbusDeclaration): NimbusSecretIr {
  const from = declaration.fields.from ?? declaration.fields.source;
  if (!isEnvRef(from)) throw new Error(`secret ${declaration.name} must use from: env("NAME")`);
  const attributes = attributesWithout(declaration.fields, ['from', 'source']);
  return {
    name: declaration.name,
    ...(declaration.docs ? { docs: declaration.docs } : {}),
    source: from,
    ...(Object.keys(attributes).length ? { attributes } : {}),
  };
}

function namedToIr(declaration: NimbusDeclaration): NimbusNamedIr {
  const attributes = Object.fromEntries(
    Object.entries(declaration.fields).map(([key, value]) => [key, normalizeValue(value)]),
  );
  return {
    name: declaration.name,
    ...(declaration.docs ? { docs: declaration.docs } : {}),
    ...(Object.keys(attributes).length ? { attributes } : {}),
  };
}

function attributesWithout(fields: Record<string, NimbusValue>, skipped: string[]): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([key]) => !skipped.includes(key))
      .map(([key, value]) => [key, normalizeValue(value)]),
  );
}

function normalizeValue(value: NimbusValue): unknown {
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (isEnvRef(value)) return value;
  if (isReference(value)) return { kind: 'reference', path: value.path.join('.') };
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeValue(entry as NimbusValue)]));
  }
  return value;
}

function unknownRecord(value: NimbusValue): Record<string, unknown> {
  const normalized = normalizeValue(value);
  if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) {
    throw new Error('expected object value');
  }
  return normalized as Record<string, unknown>;
}

function asString(value: NimbusValue | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function isEnvRef(value: unknown): value is { kind: 'envRef'; name: string } {
  return Boolean(value && typeof value === 'object' && (value as { kind?: unknown }).kind === 'envRef');
}

function isReference(value: unknown): value is { kind: 'reference'; path: string[] } {
  return Boolean(value && typeof value === 'object' && (value as { kind?: unknown }).kind === 'reference');
}

export function validateNimbusIr(ir: NimbusIr): void {
  if (ir.$schema !== NIMBUS_IR_SCHEMA_ID) throw new Error('invalid Nimbus IR schema id');
  if (ir.apiVersion !== NIMBUS_API_VERSION) throw new Error('invalid Nimbus IR apiVersion');
  if (ir.kind !== NIMBUS_KIND) throw new Error('invalid Nimbus IR kind');
  if (!ir.metadata.name || !ir.metadata.compilerVersion || !ir.metadata.sourceHash) {
    throw new Error('Nimbus IR metadata is incomplete');
  }
  if (!ir.spec.namespace) throw new Error('Nimbus IR namespace is required');
  for (const key of ['apps', 'collections', 'indexes', 'policies', 'secrets', 'backups', 'approvals'] as const) {
    if (!Array.isArray(ir.spec[key])) throw new Error(`Nimbus IR spec.${key} must be an array`);
  }
  for (const collection of ir.spec.collections) {
    if (!collection.name) throw new Error('collection name is required');
    if (!collection.fields || !Object.keys(collection.fields).length) {
      throw new Error(`collection ${collection.name} must define fields`);
    }
  }
  for (const secret of ir.spec.secrets) {
    if (secret.source.kind !== 'envRef' || !secret.source.name) {
      throw new Error(`secret ${secret.name} must compile to an envRef source`);
    }
  }
}
