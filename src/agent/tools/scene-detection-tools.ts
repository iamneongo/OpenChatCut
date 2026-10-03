export { SCENE_DETECTION_TOOL_SCHEMAS, SCENE_DETECTION_TOOL_NAMES } from './schemas/scene-detection-tools';
import type { AgentContext } from '../context';
import type { MediaAsset, TimelineItem } from '../../editor/types';
import type { SceneChange } from '../../scene-detection/detect';
import {
  mapScenesToItem,
  sceneMarkerActions,
  sceneSplitActions,
} from '../../scene-detection/apply';

type Args = Record<string, unknown>;
type ApplyMode = 'report' | 'markers' | 'split';

const prefixed = <T extends { id: string }>(items: readonly T[], value: unknown): T | null => {
  const id = String(value ?? '').trim();
  return id ? (items.find((item) => item.id === id || item.id.startsWith(id)) ?? null) : null;
};

function sourceFor(ctx: AgentContext, args: Args): { asset: MediaAsset | null; item: TimelineItem | null; src: string } | { error: string } {
  const state = ctx.getState();
  const item = prefixed(state.items, args.itemId);
  if (args.itemId && !item) return { error: `không tìm thấy item trên timeline: ${String(args.itemId)}` };
  if (item && item.kind !== 'video' && item.kind !== 'gif') return { error: `item ${item.id} là ${item.kind}; phát hiện cảnh cần video/gif` };
  const asset = prefixed(ctx.getDoc().assets, args.assetId)
    ?? (item?.src ? ctx.getDoc().assets.find((candidate) => candidate.src === item.src) ?? null : null);
  if (args.assetId && !asset) return { error: `không tìm thấy tư liệu media: ${String(args.assetId)}` };
  if (asset && asset.kind !== 'video' && asset.kind !== 'gif') return { error: `tư liệu ${asset.id} là ${asset.kind}; phát hiện cảnh cần video/gif` };
  const src = item?.src ?? asset?.src ?? '';
  if (!src) return { error: 'itemId hoặc assetId là bắt buộc và phải trỏ tới video nguồn' };
  if (!src.startsWith('/media/uploads/')) {
    return { error: 'phát hiện cảnh cần media cục bộ đã lưu dưới /media/uploads; hãy tải lên hoặc liên kết lại tư liệu trước' };
  }
  return { asset, item, src };
}

export async function execSceneDetectionTool(name: string, args: Args, ctx: AgentContext): Promise<unknown> {
  if (name !== 'detect_scenes') return { error: `công cụ không xác định: ${name}` };
  const target = sourceFor(ctx, args);
  if ('error' in target) return target;
  const apply = (args.apply === 'markers' || args.apply === 'split' ? args.apply : 'report') as ApplyMode;
  if (apply !== 'report' && !target.item) return { error: `apply=${apply} yêu cầu itemId để ánh xạ các đoạn cắt nguồn lên timeline` };
  if (target.item && ctx.getState().tracks?.[target.item.track]?.locked && apply !== 'report') {
    return { error: `rãnh chứa ${target.item.id} đang bị khóa` };
  }

  const minSceneSeconds = Number(args.minSceneSeconds);
  const body = {
    src: target.src,
    threshold: Number.isFinite(Number(args.threshold)) ? Number(args.threshold) : undefined,
    minSceneMs: Number.isFinite(minSceneSeconds) ? Math.round(minSceneSeconds * 1000) : undefined,
    maxScenes: Number.isFinite(Number(args.maxScenes)) ? Number(args.maxScenes) : undefined,
  };
  const response = await fetch('/api/detect-scenes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => ({}))) as {
    error?: string;
    durationMs?: number;
    threshold?: number;
    minSceneMs?: number;
    scenes?: SceneChange[];
  };
  if (!response.ok) return { error: result.error ?? `phát hiện cảnh thất bại (${response.status})` };
  const scenes = result.scenes ?? [];
  const mapped = target.item ? mapScenesToItem(scenes, target.item, ctx.getState().fps) : [];

  if (target.item && apply !== 'report' && mapped.length) {
    const actions = apply === 'markers'
      ? sceneMarkerActions(target.item, mapped)
      : sceneSplitActions(target.item, mapped);
    ctx.commands.batch(actions, apply === 'markers' ? 'Thêm marker cảnh' : 'Tách clip tại điểm đổi cảnh');
  }

  return {
    ok: true,
    apply,
    assetId: target.asset?.id ?? null,
    itemId: target.item?.id ?? null,
    durationMs: result.durationMs ?? null,
    threshold: result.threshold ?? null,
    minSceneMs: result.minSceneMs ?? null,
    detectedCount: scenes.length,
    applicableCount: target.item ? mapped.length : null,
    appliedCount: apply === 'report' ? 0 : mapped.length,
    scenes: target.item
      ? mapped.map((scene) => ({
          sourceTimeMs: scene.timeMs,
          timelineFrame: scene.timelineFrame,
          itemLocalFrame: scene.itemLocalFrame,
          score: scene.score,
          kind: scene.kind,
        }))
      : scenes.map((scene) => ({ sourceTimeMs: scene.timeMs, score: scene.score, kind: scene.kind })),
  };
}
