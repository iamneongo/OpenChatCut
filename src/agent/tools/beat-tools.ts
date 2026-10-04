export { BEAT_TOOL_SCHEMAS, BEAT_TOOL_NAMES } from './schemas/beat-tools';
// detect_beats - native beat detection (stuck point clipping): spectral flux + autocorrelation + phase grid, zero model
// Depends on (src/audio/beats.ts). You can optionally mark the shooting points as timeline markers (reuse addMarker batch,
// The mapping semantics are consistent with scene detection: srcIn + playbackRate).
import type { AgentContext } from '../context';
import type { AtomicAction } from '../../editor/reduce';
import type { TimelineItem } from '../../editor/types';
import { sourceFramesToTimelineFrames, sourceWindowForTimelineRange } from '../../editor/sourceLimit';
import { analyzeAssetBeats, type BeatAnalysis } from '../../audio/beats';

type Args = Record<string, unknown>;

/** The maximum number of beats that can be returned in the response (the full number of beats for a long song is too many and unnecessary, the total number is reported). */
const MAX_LISTED = 200;
const DEFAULT_MARKER_CAP = 120;

/** Source seconds → timeline frame (same mapping as scene detection: srcIn + playbackRate, discard outside window).*/
function mapToTimelineFrames(times: readonly number[], item: TimelineItem, fps: number): number[] {
  const window = sourceWindowForTimelineRange(item, 0, item.durationInFrames);
  const frames = times.flatMap((seconds) => {
    const sourceFrame = seconds * fps;
    if (sourceFrame <= window.startFrame || sourceFrame >= window.endFrame) return [];
    const local = Math.round(sourceFramesToTimelineFrames(item, sourceFrame - window.startFrame));
    if (local <= 0 || local >= item.durationInFrames) return [];
    return [item.startFrame + local];
  });
  return [...new Set(frames)].sort((a, b) => a - b);
}

function markerActions(
  item: TimelineItem,
  frames: readonly number[],
  kind: 'beat' | 'downbeat',
  cap: number,
): AtomicAction[] {
  return frames.slice(0, cap).map((fromFrame, index) => ({
    type: 'addMarker',
    marker: {
      id: `marker_${crypto.randomUUID()}`,
      scope: 'item',
      itemId: item.id,
      fromFrame,
      durationFrames: 0,
      note: kind === 'downbeat' ? `Ô nhịp ${index + 1}` : `Nhịp ${index + 1}`,
      color: kind === 'downbeat' ? 'purple' : 'cyan',
    },
  }));
}

const listed = (times: readonly number[]): number[] => times.slice(0, MAX_LISTED);

export async function execBeatTool(name: string, args: Args, ctx: AgentContext): Promise<unknown> {
  if (name !== 'detect_beats') return { error: `Tool không xác định: ${name}` };
  try {
    const state = ctx.getState();
    let src = '';
    let item: TimelineItem | undefined;
    if (typeof args.itemId === 'string' && args.itemId.trim()) {
      const q = args.itemId.trim();
      item = state.items.find((it) => (it.id === q || it.id.startsWith(q)) && (it.kind === 'video' || it.kind === 'audio'));
      if (!item) return { error: `Không tìm thấy đoạn âm thanh/video ${q}` };
      if (!item.src) return { error: `Đoạn ${item.id} không có nguồn tư liệu` };
      src = item.src;
    } else if (typeof args.assetId === 'string' && args.assetId.trim()) {
      const q = args.assetId.trim();
      const asset = ctx.getDoc().assets.find((a) => a.id === q || a.id.startsWith(q));
      if (!asset) return { error: `Không tìm thấy tư liệu trong kho tư liệu ${q}` };
      src = asset.src;
    } else {
      return { error: 'Hãy truyền assetId (kho tư liệu) hoặc itemId (đoạn trên dòng thời gian)' };
    }

    const analysis: BeatAnalysis = await analyzeAssetBeats(src);
    if (analysis.bpm === 0) {
      return {
        bpm: 0,
        confidence: analysis.confidence,
        beats: [],
        note: 'Không phát hiện nhịp ổn định (qua bộ lọc độ tin cậy thấp): tài nguyên có thể là giọng nói/âm thanh môi trường hoặc tiết tấu không ổn định.',
      };
    }

    const base: Record<string, unknown> = {
      bpm: analysis.bpm,
      confidence: analysis.confidence,
      beatCount: analysis.beats.length,
      downbeatCount: analysis.downbeats.length,
      beats: listed(analysis.beats),
      downbeats: listed(analysis.downbeats),
      ...(analysis.beats.length > MAX_LISTED ? { note: `beats chỉ liệt kê ${MAX_LISTED} nhịp đầu; xem tổng số trong beatCount` } : {}),
    };
    if (!item) return base;

    const beatFrames = mapToTimelineFrames(analysis.beats, item, state.fps);
    const downbeatFrames = mapToTimelineFrames(analysis.downbeats, item, state.fps);
    const wantMarkers = args.markers === 'beats' || args.markers === 'downbeats';
    let markersCreated = 0;
    if (wantMarkers) {
      const cap = typeof args.markerLimit === 'number' ? Math.max(1, Math.min(500, Math.round(args.markerLimit))) : DEFAULT_MARKER_CAP;
      const frames = args.markers === 'downbeats' ? downbeatFrames : beatFrames;
      const actions = markerActions(item, frames, args.markers === 'downbeats' ? 'downbeat' : 'beat', cap);
      if (actions.length) ctx.commands.batch(actions, 'Đánh dấu nhịp');
      markersCreated = actions.length;
    }
    return {
      ...base,
      itemId: item.id,
      timelineBeatFrames: beatFrames.slice(0, MAX_LISTED),
      timelineDownbeatFrames: downbeatFrames.slice(0, MAX_LISTED),
      ...(wantMarkers ? { markersCreated } : {}),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
