import catalogData from '../../assets/agent/openchatcut-tool-schemas.json';
import { assertValidAgentToolSchemas, validateAgentToolInvocation } from '../../src/agent/execution-policy';
import type { AgentToolSchema } from '../../src/agent/tool-schema';

function objectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parsedSchema(value: unknown): AgentToolSchema {
  if (!objectRecord(value)
    || typeof value.name !== 'string'
    || !objectRecord(value.input_schema)
    || value.input_schema.type !== 'object') {
    throw new Error('Schema tool server được tạo không hợp lệ.');
  }
  const description = typeof value.description === 'string'
    ? value.description
    : undefined;
  const properties = value.input_schema.properties;
  const required = value.input_schema.required;
  if (properties !== undefined && !objectRecord(properties)) {
    throw new Error(`Các thuộc tính của tool được tạo ${value.name} không hợp lệ.`);
  }
  if (required !== undefined
    && (!Array.isArray(required)
      || required.some((item) => typeof item !== 'string'))) {
    throw new Error(`Các trường bắt buộc của tool được tạo ${value.name} không hợp lệ.`);
  }
  return {
    name: value.name,
    ...(description ? { description } : {}),
    input_schema: {
      ...value.input_schema,
      type: 'object',
      ...(properties ? { properties } : {}),
      ...(required ? { required } : {}),
    },
  };
}

function generatedCatalog(key: 'edit' | 'ask'): readonly AgentToolSchema[] {
  if (!objectRecord(catalogData)
    || catalogData.version !== 1
    || !Array.isArray(catalogData[key])) {
    throw new Error('Danh mục tool server được tạo không hợp lệ.');
  }
  const schemas = catalogData[key].map(parsedSchema);
  assertValidAgentToolSchemas(schemas);
  return Object.freeze(schemas);
}

const EDIT_TOOL_SCHEMAS = generatedCatalog('edit');
const ASK_TOOL_SCHEMAS = generatedCatalog('ask');

function canonicalJson(value: unknown): string {
  if (!objectRecord(value)) {
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
    return JSON.stringify(value);
  }
  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(',')}}`;
}

function sameSchema(
  left: Record<string, unknown>,
  right: AgentToolSchema,
): boolean {
  return left.name === right.name
    && (left.description ?? '') === (right.description ?? '')
    && canonicalJson(left.input_schema) === canonicalJson(right.input_schema);
}
export function canonicalServerRunToolCatalog(
  askOnly: boolean,
): readonly AgentToolSchema[] {
  const canonical = askOnly ? ASK_TOOL_SCHEMAS : EDIT_TOOL_SCHEMAS;
  return canonical;
}

/** Resolve a browser-supplied tool list to immutable canonical request-scoped schemas. */
export function resolveServerRunToolCatalog(
  requested: readonly unknown[],
  askOnly: boolean,
): readonly AgentToolSchema[] {
  const canonical = canonicalServerRunToolCatalog(askOnly);
  const byName = new Map(canonical.map((schema) => [schema.name, schema]));
  const selected: AgentToolSchema[] = [];
  const names = new Set<string>();
  for (const value of requested) {
    if (!objectRecord(value)) {
      throw new Error('Schema tool của lượt chạy server không hợp lệ.');
    }
    const name = typeof value.name === 'string' ? value.name : '';
    const schema = byName.get(name);
    if (!schema || !sameSchema(value, schema)) {
      throw new Error(`Schema tool của lượt chạy server không chính tắc hoặc không hoạt động: ${name || '[unknown]'}.`);
    }
    if (names.has(name)) throw new Error(`Schema tool của lượt chạy server bị trùng: ${name}.`);
    names.add(name);
    selected.push(schema);
  }
  return selected;
}

export function assertCanonicalToolInvocation(
  schema: AgentToolSchema,
  args: Record<string, unknown>,
  active: readonly AgentToolSchema[],
): void {
  const expected = active.find((candidate) => candidate.name === schema.name);
  if (!expected) throw new Error(`Tool không hoạt động trong request này: ${schema.name}`);
  if (canonicalJson(schema.input_schema) !== canonicalJson(expected.input_schema)) {
    throw new Error('Schema tool đã thay đổi trong lúc xử lý request.');
  }
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw new Error(`Đối số của tool ${schema.name} không hợp lệ.`);
  }
  const validation = validateAgentToolInvocation(schema, args, active);
  if (!validation.ok) throw new Error(validation.error);
}
