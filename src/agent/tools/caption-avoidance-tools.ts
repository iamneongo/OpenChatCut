import type { AgentContext } from '../context';
import type { AgentToolSchema } from '../tool-schema';
import type { TimelineState } from '../../editor/types';
import type { CaptionAnchor, CaptionLayoutPolicy } from '../../captions/types';
import {
  analyzeAssetGeometry,
  type VisualGeometryAsset,
} from '../../geometry/visual-geometry';
import {
  bestCaptionLayoutForGeometries,
  captionFaceConflicts,
  captionLayoutKey,
  suggestCaptionAvoidance,
  type CaptionLayoutLike,
} from '../../geometry/caption-collision';
import {
  captionGeometryTargets,
  visibleGeometryForCaptionTarget,
  type CaptionGeometryTarget,
  type CaptionSet,
} from '../../geometry/caption-qa';
import type { CaptionPlacementSource } from '../../captions/lanes';

type Args = Record<string, unknown>;

export const CAPTION_AVOIDANCE_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'apply_caption_avoidance',
    description: [
      'Phân tích các lớp video hiển thị bên dưới từng khoảng thời gian phụ đề đã kết xuất và đưa phụ đề ra khỏi vị trí của người nói.',
      'Dùng hình học người/khuôn mặt theo thời gian nguồn, giữ nguyên bố cục đã rõ ràng và cập nhật bố cục chung, mục nguồn hoặc slot chính sách theo thứ tự ưu tiên của bộ kết xuất.',
      'Gọi khi người dùng phàn nàn phụ đề che mặt. edit_captions cũng tự động chạy công cụ này sau khi bật phụ đề hoặc thêm nguồn.',
    ].join(' '),
    input_schema: { type: 'object', properties: {} },
  },
];

export const CAPTION_AVOIDANCE_TOOL_NAMES: ReadonlySet<string> = new Set(CAPTION_AVOIDANCE_TOOL_SCHEMAS.map((tool) => tool.name));

export interface CaptionAvoidanceResult {
  ok: boolean;
  adjusted?: number;
  error?: string;
  sources?: Array<{ source: string; adjusted: number; details: string[] }>;
  note?: string;
}

interface AnalyzedTarget {
  target: CaptionGeometryTarget;
  geometry: VisualGeometryAsset;
}

function captionSetsWithTracks(state: TimelineState): Array<{ set: CaptionSet; trackId: string | null }> {
  const out: Array<{ set: CaptionSet; trackId: string | null }> = [];
  for (const [trackId, track] of Object.entries(state.tracks ?? {})) {
    if (track?.kind === 'caption' && track.captions) out.push({ set: track.captions, trackId });
  }
  if (state.captions?.enabled && !out.some((entry) => entry.set === state.captions)) {
    out.push({ set: state.captions, trackId: null });
  }
  return out.filter((entry) => entry.set.enabled !== false);
}

function clearsEveryGeometry(geometries: readonly VisualGeometryAsset[], layout: CaptionLayoutLike): boolean {
  return geometries.every((geometry) => captionFaceConflicts(geometry, [layout]).length === 0);
}

function replacementFor(
  geometries: readonly VisualGeometryAsset[],
  current: CaptionLayoutLike,
): CaptionLayoutLike | null {
  const firstConflict = geometries
    .flatMap((geometry) => captionFaceConflicts(geometry, [current]))
    .at(0);
  if (!firstConflict) return null;
  const suggestion = suggestCaptionAvoidance(firstConflict);
  if (suggestion) {
    const shifted = { ...current, offsetYRatio: suggestion.offsetYRatio };
    if (clearsEveryGeometry(geometries, shifted)) return shifted;
  }
  const best = bestCaptionLayoutForGeometries(geometries, current);
  return captionLayoutKey(best) === captionLayoutKey(current) ? null : best;
}

function writeLayout(
  next: CaptionSet,
  sources: readonly CaptionPlacementSource[],
  layout: CaptionLayoutLike,
): boolean {
  let wrote = false;
  for (const source of sources) {
    if (source.kind === 'layout') {
      next.layout = {
        ...(next.layout ?? {}),
        anchor: layout.anchor as CaptionAnchor | undefined,
        offsetXRatio: layout.offsetXRatio,
        offsetYRatio: layout.offsetYRatio,
      };
      wrote = true;
      continue;
    }
    if (source.kind === 'entry') {
      const entry = next.sourceEntries?.find((candidate) => candidate.id === source.sourceId);
      if (!entry) continue;
      entry.anchor = layout.anchor as CaptionAnchor | undefined;
      entry.offsetXRatio = layout.offsetXRatio;
      entry.offsetYRatio = layout.offsetYRatio;
      wrote = true;
      continue;
    }
    const policy = next.layoutPolicy;
    if (policy?.mode !== 'manual-slots') continue;
    const slot = policy.slots.find((candidate) => candidate.id === source.slotId);
    if (!slot) continue;
    slot.anchor = layout.anchor as CaptionAnchor;
    slot.offsetXRatio = layout.offsetXRatio;
    slot.offsetYRatio = layout.offsetYRatio;
    wrote = true;
  }
  return wrote;
}

export async function applyCaptionAvoidance(
  ctx: AgentContext,
  options: { maxSamples?: number } = {},
): Promise<CaptionAvoidanceResult> {
  const state = ctx.getState();
  const doc = ctx.getDoc();
  const summary: NonNullable<CaptionAvoidanceResult['sources']> = [];
  let sourceCount = 0;
  let geometryCount = 0;
  let total = 0;
  let blocked = 0;

  for (const { set, trackId } of captionSetsWithTracks(state)) {
    const targets = captionGeometryTargets(set, state, doc);
    sourceCount += targets.length;
    const analyzed: AnalyzedTarget[] = [];
    const geometryCache = new Map<string, VisualGeometryAsset>();
    for (const target of targets) {
      let geometry = geometryCache.get(target.asset.id);
      if (!geometry) {
        const result = await analyzeAssetGeometry(target.asset, undefined, options);
        if (!result.geometry) continue;
        geometry = result.geometry;
        geometryCache.set(target.asset.id, geometry);
      }
      const visibleGeometry = visibleGeometryForCaptionTarget(geometry, state, target);
      if (visibleGeometry.segments.length) analyzed.push({ target, geometry: visibleGeometry });
    }
    geometryCount += analyzed.length;
    const groups = new Map<string, AnalyzedTarget[]>();
    for (const target of analyzed) {
      const key = target.target.placementSources
        .map((source) => source.kind === 'layout' ? 'layout' : `${source.kind}:${source.kind === 'slot' ? source.slotId : source.sourceId}`)
        .join(',');
      groups.set(key, [...(groups.get(key) ?? []), target]);
    }
    const layoutPolicy: CaptionLayoutPolicy | null | undefined = set.layoutPolicy?.mode === 'manual-slots'
      ? { ...set.layoutPolicy, slots: set.layoutPolicy.slots.map((slot) => ({ ...slot })) }
      : set.layoutPolicy ? { ...set.layoutPolicy } : set.layoutPolicy;
    const next: CaptionSet = {
      ...set,
      layout: set.layout ? { ...set.layout } : undefined,
      layoutPolicy,
      sourceEntries: set.sourceEntries?.map((entry) => ({ ...entry })),
    };
    const details: string[] = [];
    let adjusted = 0;
    for (const group of groups.values()) {
      const representative = [...group].sort((a, b) =>
        (b.target.layout.stackCount ?? 1) - (a.target.layout.stackCount ?? 1))[0]!;
      const current = representative.target.layout;
      const geometries = group.map((entry) => entry.geometry);
      const hasConflict = geometries.some((geometry) => captionFaceConflicts(geometry, [current]).length > 0);
      const replacement = replacementFor(geometries, current);
      if (!replacement) {
        if (hasConflict) {
          blocked += 1;
          details.push('Phát hiện phụ đề che khuất, nhưng không có vị trí an toàn khả dụng nên chưa điều chỉnh');
        }
        continue;
      }
      if (!writeLayout(next, representative.target.placementSources, replacement)) {
        blocked += 1;
        details.push('Vị trí phụ đề hiện tại do layout policy không thể sửa đổi kiểm soát nên chưa điều chỉnh');
        continue;
      }
      adjusted += 1;
      const label = representative.target.placementSources
        .map((source) => source.kind === 'layout' ? 'phụ đề tổng thể' : source.kind === 'slot' ? `ô phụ đề "${source.slotId}"` : `dải phụ đề "${source.sourceId}"`)
        .join(', ');
      details.push(`${label} đã tránh khuôn mặt`);
    }
    if (adjusted) ctx.commands.setCaptions(next, trackId ?? undefined);
    total += adjusted;
    const names = [...new Set(analyzed.map((entry) => entry.target.asset.name))];
    if (names.length) summary.push({ source: names.join(', '), adjusted, details });
  }

  if (!sourceCount) {
    return { ok: false, error: 'Không tìm thấy hình ảnh video hiển thị trong thời gian phụ đề xuất hiện; chưa sửa layout phụ đề' };
  }
  if (!geometryCount) {
    return { ok: false, error: 'Không có dữ liệu phân tích hình học của hình ảnh video hiển thị; chưa sửa layout phụ đề' };
  }
  return {
    ok: true,
    adjusted: total,
    sources: summary,
    note: total
      ? `Đã tự động tránh ${total} bố cục phụ đề (phân tích người/khuôn mặt theo khung hình hiển thị và thời lượng phụ đề).`
      : blocked
        ? `Phát hiện ${blocked} vị trí phụ đề che khuất, nhưng vị trí khả dụng do policy layout không thể chỉnh sửa kiểm soát nên chưa thay đổi.`
        : 'Không phát hiện phụ đề che khuất khuôn mặt; không cần điều chỉnh bố cục.',
  };
}

export async function execCaptionAvoidanceTool(name: string, _args: Args, ctx: AgentContext): Promise<unknown> {
  if (name !== 'apply_caption_avoidance') return { error: `Công cụ không xác định: ${name}` };
  return applyCaptionAvoidance(ctx);
}
