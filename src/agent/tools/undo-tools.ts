export { UNDO_TOOL_SCHEMAS, UNDO_TOOL_NAMES } from './schemas/undo-tools';
// undo_last_change / redo_last_change: respond to "undo" / "redo" without
// directly walking the live history stack (that would invalidate draft baselines).
// Instead apply the target ProjectDoc via applyDoc so propose→approve treats
// the rollback as a normal, still-undoable edit.
import type { AgentContext } from '../context';
import type { ProjectDoc } from '../../editor/types';

type HistoryCtx = Pick<AgentContext, 'commands' | 'getDoc' | 'getUndoTarget' | 'getRedoTarget'>;

function applyHistoryTarget(
  label: 'undo' | 'redo',
  target: ProjectDoc,
  ctx: HistoryCtx,
): unknown {
  const before = ctx.getDoc();
  ctx.commands.applyDoc(target);
  return {
    ok: true,
    restored: label === 'undo' ? 'previous project state' : 'redone project state',
    timelines: target.timelines.length,
    activeTimelineId: target.activeTimelineId,
    note: before.activeTimelineId !== target.activeTimelineId
      ? 'Dòng thời gian đang hoạt động cũng được đưa về dòng thời gian mở trong bản chụp đó.'
      : undefined,
  };
}

/** Tool execution: Get undo/redo target → proposed as whole project replacement. */
export function execUndoTool(name: string, ctx: HistoryCtx): unknown {
  if (name === 'undo_last_change') {
    if (!ctx.getUndoTarget) return { error: 'undo không khả dụng trong phiên này' };
    const target = ctx.getUndoTarget();
    if (!target) return { error: 'không có gì để undo — phiên này chưa có thay đổi nào được áp dụng' };
    return applyHistoryTarget('undo', target, ctx);
  }
  if (name === 'redo_last_change') {
    if (!ctx.getRedoTarget) return { error: 'redo không khả dụng trong phiên này' };
    const target = ctx.getRedoTarget();
    if (!target) {
      return { error: 'không có gì để redo — redo chỉ hoạt động sau undo, cho đến khi chỉnh sửa mới xóa redo stack' };
    }
    return applyHistoryTarget('redo', target, ctx);
  }
  return { error: `tool không được nhận diện: ${name}` };
}
