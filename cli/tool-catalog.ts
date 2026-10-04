// The CLI's tool surface. `headlessToolNames()` is the whitelist `occ` obeys: the
// reviewed server-direct subset from src/agent/external-tool-policy.ts, which is
// also what MCP offline sessions expose. A tool outside it needs the editor open,
// so the CLI refuses with a reason instead of pretending to run it — growing this
// set means reviewing a tool's runtime dependencies in the shared policy, never
// bypassing it here.
import { TOOL_SCHEMAS } from '../src/agent/tools.ts';
import { offlineExternalToolSchemas } from '../server/external-agent/offline-tools.ts';
import { CliError, UsageError } from './errors.ts';

export interface ToolRow {
  readonly name: string;
  readonly headless: boolean;
  readonly description: string;
}

export interface ToolOp {
  readonly tool: string;
  readonly args: Record<string, unknown>;
}

export function headlessToolNames(): Set<string> {
  return new Set(offlineExternalToolSchemas().map((tool) => tool.name));
}

export function toolRows(all: boolean): ToolRow[] {
  const headless = headlessToolNames();
  const schemas = all ? TOOL_SCHEMAS : offlineExternalToolSchemas();
  return schemas
    .filter((tool) => all || headless.has(tool.name))
    .map((tool) => ({
      name: tool.name,
      headless: headless.has(tool.name),
      description: (tool.description ?? '').split('\n')[0] ?? '',
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function requireHeadlessTool(tool: string): void {
  if (headlessToolNames().has(tool)) return;
  const known = TOOL_SCHEMAS.some((schema) => schema.name === tool);
  throw new CliError(
    `Không thể chạy ${tool}: ${known ? 'công cụ này không thuộc nhóm công cụ ngoại tuyến' : 'không có công cụ này'}. `
    + 'Chạy `occ tools ls --all` để xem đầy đủ; các công cụ cần trình duyệt phải có trình chỉnh sửa đang mở '
    + 'và được điều khiển qua MCP.',
  );
}

export function parseJsonObject(text: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new UsageError(`${label} không phải JSON hợp lệ: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new UsageError(`${label} phải là một đối tượng JSON`);
  }
  return parsed as Record<string, unknown>;
}

export function parseToolOp(value: unknown, index: number): ToolOp {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new UsageError(`ops[${index}] phải là đối tượng có "tool" và "args" tùy chọn`);
  }
  const record = value as Record<string, unknown>;
  const tool = record.tool;
  if (typeof tool !== 'string' || !tool.trim()) {
    throw new UsageError(`ops[${index}].tool phải là tên công cụ`);
  }
  requireHeadlessTool(tool);
  const args = record.args === undefined ? {} : record.args;
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw new UsageError(`ops[${index}].args phải là một đối tượng JSON`);
  }
  return { tool, args: args as Record<string, unknown> };
}

export function parseToolOps(text: string): ToolOp[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new UsageError(`--ops không phải JSON hợp lệ: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new UsageError('--ops phải là mảng JSON không rỗng gồm các mục {tool, args}');
  }
  return parsed.map(parseToolOp);
}
