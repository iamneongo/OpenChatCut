export { AUTO_GRADE_TOOL_SCHEMAS, AUTO_GRADE_TOOL_NAMES } from './schemas/auto-grade-tools';
import type { AgentContext } from '../context';
import type { TimelineItem, TimelineState } from '../../editor/types';
import { analyzeAutoGrade, type AutoGradeResponse } from '../../color/autoGrade';
import { sourceWindowForTimelineRange } from '../../editor/sourceLimit';

type Args = Record<string, unknown>;

function isAutoGradeTarget(item: TimelineItem, state: TimelineState): boolean {
  if (item.kind !== 'video' && item.kind !== 'image' && item.kind !== 'gif') return false;
  if (state.tracks?.[item.track]?.locked) return false;
  return /^\/media\/uploads\/[^/]+(?:\?.*)?$/.test(item.src ?? '');
}

function parseItemRefs(raw: unknown): string[] {
  return String(raw ?? '').split(',').map((id) => id.trim()).filter(Boolean);
}

function resolveTargets(state: TimelineState, refs: string[]): { targets: TimelineItem[]; missing: string[] } {
  if (!refs.length) {
    return { targets: state.items.filter((item) => isAutoGradeTarget(item, state)), missing: [] };
  }
  const targets: TimelineItem[] = [];
  const missing: string[] = [];
  for (const ref of refs) {
    const hits = state.items.filter((item) => item.id === ref || item.id.startsWith(ref));
    if (hits.length === 1) {
      const item = hits[0]!;
      if (!isAutoGradeTarget(item, state)) {
        missing.push(`${ref} (không đủ điều kiện: cần video/image/gif đã mở khóa trong /media/uploads)`);
      } else {
        targets.push(item);
      }
    } else if (hits.length === 0) {
      missing.push(ref);
    } else {
      missing.push(`${ref} (không xác định được duy nhất: ${hits.slice(0, 4).map((h) => h.id).join(',')})`);
    }
  }
  return { targets, missing };
}

export async function execAutoGradeTool(name: string, args: Args, ctx: AgentContext): Promise<unknown> {
  if (name !== 'auto_grade') return { error: `Công cụ không xác định: ${name}` };
  const action = String(args.action ?? '');
  if (action !== 'analyze' && action !== 'apply') {
    return { error: 'action phải là analyze hoặc apply' };
  }
  const state = ctx.getState();
  const { targets, missing } = resolveTargets(state, parseItemRefs(args.itemIds));
  if (!targets.length) {
    return {
      error: missing.length
        ? `không có clip đủ điều kiện; vấn đề: ${missing.join('; ')}`
        : 'không có clip đủ điều kiện — cần video/image/gif đã mở khóa với src /media/uploads (hãy nhập media trước)',
      missing,
    };
  }

  const fps = state.fps || 30;
  const cache = new Map<string, Promise<AutoGradeResponse>>();
  const recommendations: Array<{
    itemId: string;
    name: string;
    filters: AutoGradeResponse['filters'];
    adjustments: string[];
    profile: AutoGradeResponse['profile'];
    stats: AutoGradeResponse['stats'];
  }> = [];
  const failures: Array<{ itemId: string; error: string }> = [];

  for (const item of targets) {
    const window = sourceWindowForTimelineRange(item, 0, item.durationInFrames);
    const startSeconds = window.startFrame / fps;
    const durationSeconds = Math.max(1 / fps, (window.endFrame - window.startFrame) / fps);
    const cacheKey = `${item.src}\u0000${startSeconds.toFixed(3)}\u0000${durationSeconds.toFixed(3)}`;
    try {
      let pending = cache.get(cacheKey);
      if (!pending) {
        pending = analyzeAutoGrade({ src: item.src!, startSeconds, durationSeconds });
        cache.set(cacheKey, pending);
      }
      const analysis = await pending;
      recommendations.push({
        itemId: item.id,
        name: item.name,
        filters: analysis.filters,
        adjustments: analysis.adjustments,
        profile: analysis.profile,
        stats: analysis.stats,
      });
    } catch (error) {
      failures.push({
        itemId: item.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (!recommendations.length) {
    return {
      error: 'Phân tích chỉnh màu tự động thất bại cho mọi mục tiêu',
      failures,
      missing,
    };
  }

  if (action === 'analyze') {
    return {
      ok: true,
      action,
      applied: false,
      recommendations,
      failedCount: failures.length,
      failures: failures.length ? failures : undefined,
      missing: missing.length ? missing : undefined,
      note: 'Chỉ xem trước — gọi auto_grade action=apply để ghi bộ lọc (hoặc dùng edit_item để cập nhật filters).',
    };
  }

  ctx.commands.batch(
    recommendations.map((row) => ({
      type: 'setFilters' as const,
      id: row.itemId,
      patch: row.filters,
    })),
    'Áp dụng chỉnh màu tự động',
  );

  return {
    ok: true,
    action,
    applied: true,
    appliedCount: recommendations.length,
    recommendations: recommendations.map((row) => ({
      itemId: row.itemId,
      name: row.name,
      filters: row.filters,
      adjustments: row.adjustments,
    })),
    failedCount: failures.length,
    failures: failures.length ? failures : undefined,
    missing: missing.length ? missing : undefined,
    note: 'Các bộ lọc đã được ghi thành một bước hoàn tác. Kiểm tra bằng inspect_color hoặc view_timeline_frames.',
  };
}
