export { DESIGN_TOOL_SCHEMAS, DESIGN_TOOL_NAMES } from './schemas/design-tools';
import type { AgentContext } from '../context';
import { executeDesignAction, type DesignToolArgs } from './design-tool-actions';

export async function execDesignTool(
  name: string,
  args: DesignToolArgs,
  ctx: AgentContext,
): Promise<unknown> {
  if (name !== 'manage_design_style') return { error: `công cụ không xác định: ${name}` };
  return executeDesignAction(String(args.action ?? ''), args, ctx);
}
