import type { AgentContext } from '../context';
import type { AgentToolSchema } from '../tool-schema';
import {
  timelineTrackIds,
  trackKind,
  type TimelineItem,
  type TimelineState,
} from '../../editor/types';
import { sourceFrameAt } from '../../editor/sourceLimit';
import {
  safeBoxForRange,
  projectGeometryThroughItem,
  transformFromSafeBox,
} from '../../geometry/placement';
import { analyzeAssetGeometry, type VisualGeometryAsset } from '../../geometry/visual-geometry';

type Args = Record<string, unknown>;

export const PLACE_GRAPHICS_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'place_graphics_in_safe_zone',
    description: [
      'Đưa các lớp phủ đồ họa (đoạn motion-graphic / text / solid) vào vùng an toàn của video bên dưới: ',
      'hình học trực quan (phân đoạn người + khuôn mặt) sẽ chọn vùng trống lớn nhất trong khoảng thời gian của từng đoạn, ',
      'sau đó ghi transform của đoạn (x/y theo % canvas, scale) để đặt nó vào giữa vùng đó. Không bao giờ che khuôn mặt.',
      'Dùng bộ nhớ đệm hình học; lần gọi đầu tiên sẽ phân tích video bên dưới (mất vài giây).',
      'Gọi khi lớp phủ che người nói hoặc sau khi thêm đồ họa vào video dạng talking-head.',
      'Truyền itemId để đặt một đoạn; bỏ qua itemId để đặt mọi lớp phủ đồ họa.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Tùy chọn: chỉ đặt đoạn này (ID đầy đủ hoặc tiền tố duy nhất).' },
      },
    },
  },
];

export const PLACE_GRAPHICS_TOOL_NAMES: ReadonlySet<string> = new Set(PLACE_GRAPHICS_TOOL_SCHEMAS.map((tool) => tool.name));

const GRAPHIC_KINDS: Record<string, true> = {
  'motion-graphic': true,
  text: true,
  solid: true,
};
const DEFAULT_GRAPHIC_ASPECT = 16 / 9;

function findItem(items: TimelineItem[], id: unknown): TimelineItem | null {
  const q = String(id ?? '');
  if (!q) return null;
  const exact = items.find((item) => item.id === q);
  if (exact) return exact;
  const matches = items.filter((item) => item.id.startsWith(q));
  return matches.length === 1 ? matches[0]! : null;
}

/** Pick the nearest visible video layer below the graphic with time overlap. */
export function pickUnderlyingVideo(
  state: TimelineState,
  graphic: TimelineItem,
  fromFrame: number,
  toFrame: number,
): TimelineItem | null {
  const visualTracks = timelineTrackIds(state).filter((trackId) => trackKind(state, trackId) === 'video');
  const graphicLayer = visualTracks.indexOf(graphic.track);
  let best: TimelineItem | null = null;
  let bestLayer = Number.POSITIVE_INFINITY;
  let bestOverlap = 0;
  for (const item of state.items) {
    if (item.kind !== 'video' || state.tracks?.[item.track]?.hidden) continue;
    const layer = visualTracks.indexOf(item.track);
    if (layer < 0 || (graphicLayer >= 0 && layer <= graphicLayer)) continue;
    const overlap = Math.min(toFrame, item.startFrame + item.durationInFrames)
      - Math.max(fromFrame, item.startFrame);
    if (overlap <= 0) continue;
    if (layer < bestLayer || (layer === bestLayer && overlap > bestOverlap)) {
      best = item;
      bestLayer = layer;
      bestOverlap = overlap;
    }
  }
  return best;
}

/** Source-seconds window of the video clip covered by the graphic's frames. */
function sourceWindowOf(
  video: TimelineItem,
  graphicFrom: number,
  graphicTo: number,
  fps: number,
): { startSec: number; endSec: number } | null {
  const videoStart = video.startFrame;
  const videoEnd = video.startFrame + video.durationInFrames;
  const localStart = Math.max(graphicFrom, videoStart) - videoStart;
  const localEnd = Math.min(graphicTo, videoEnd) - videoStart;
  if (localEnd <= localStart || fps <= 0) return null;
  return {
    startSec: sourceFrameAt(video, localStart) / fps,
    endSec: sourceFrameAt(video, localEnd) / fps,
  };
}

function graphicAspectOf(item: TimelineItem): number {
  return item.width && item.height && item.width > 0 && item.height > 0
    ? item.width / item.height
    : DEFAULT_GRAPHIC_ASPECT;
}

export function canPlaceGraphic(state: TimelineState, item: TimelineItem): boolean {
  const track = state.tracks?.[item.track];
  return !track?.hidden && !track?.locked;
}

export async function execPlaceGraphicsTool(name: string, args: Args, ctx: AgentContext): Promise<unknown> {
  if (name !== 'place_graphics_in_safe_zone') return { error: `tool không được nhận diện: ${name}` };
  const state = ctx.getState();
  const doc = ctx.getDoc();
  const fps = state.fps || 30;

  const requested = typeof args.itemId === 'string' && args.itemId.trim() ? args.itemId.trim() : null;
  const graphics = state.items.filter((item) => GRAPHIC_KINDS[item.kind]);
  const targets = requested
    ? (() => {
      const item = findItem(graphics, requested);
      return item ? [item] : [];
    })()
    : graphics;
  if (requested && !targets.length) {
    return { error: `Không tìm thấy clip đồ họa ${requested} (các loại khả dụng: motion-graphic/text/solid)`, available: graphics.map((g) => ({ itemId: g.id, name: g.name, kind: g.kind })) };
  }
  if (!targets.length) {
    return { ok: true, adjusted: 0, note: 'Timeline không có đồ họa phủ nào có thể sắp xếp (motion-graphic/text/solid).' };
  }

  const geometryBySrc = new Map<string, VisualGeometryAsset | null>();
  const placed: Array<{ itemId: string; name: string; x: number; y: number; scale: number }> = [];
  const skipped: string[] = [];
  for (const item of targets) {
    if (!canPlaceGraphic(state, item)) {
      skipped.push(`${item.name} (track đã bị ẩn hoặc khóa)`);
      continue;
    }
    const from = item.startFrame;
    const to = item.startFrame + item.durationInFrames;
    const video = pickUnderlyingVideo(state, item, from, to);
    if (!video?.src) {
      skipped.push(`${item.name} (không có video bên dưới)`);
      continue;
    }
    let geometry = geometryBySrc.get(video.src);
    if (geometry === undefined) {
      const asset = doc.assets.find((candidate) => candidate.src === video.src);
      if (!asset) {
        skipped.push(`${item.name} (video không có trong kho media)`);
        continue;
      }
      const result = await analyzeAssetGeometry(asset);
      geometry = result.geometry;
      geometryBySrc.set(video.src, geometry);
    }
    if (!geometry) {
      skipped.push(`${item.name} (không có dữ liệu hình học khả dụng)`);
      continue;
    }
    const window = sourceWindowOf(video, from, to, fps);
    if (!window) {
      skipped.push(`${item.name} (không chồng thời gian với video)`);
      continue;
    }
    const projectedGeometry = projectGeometryThroughItem(geometry, state, video);
    const box = safeBoxForRange(projectedGeometry, window.startSec, window.endSec);
    const transform = box ? transformFromSafeBox(box, graphicAspectOf(item)) : null;
    if (!transform) {
      skipped.push(`${item.name} (vùng an toàn không đủ chỗ)`);
      continue;
    }
    ctx.commands.setItemTransform(item.id, { x: transform.x, y: transform.y, scale: transform.scale });
    placed.push({ itemId: item.id, name: item.name, x: transform.x, y: transform.y, scale: transform.scale });
  }

  return {
    ok: true,
    adjusted: placed.length,
    placed,
    ...(skipped.length ? { skipped } : {}),
    note: placed.length
      ? `Đã chuyển ${placed.length} đồ họa vào vùng an toàn (tránh khuôn mặt/chủ thể).`
      : 'Không có đồ họa nào được di chuyển; ' + (skipped.length ? `bỏ qua: ${skipped.join('; ')}` : 'tất cả vùng an toàn đều khả dụng.'),
  };
}
