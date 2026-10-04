// Client-side persistent multicam sync for runAiMulticamSync / multicam_sync.
// Prefer exact embedded/capture clocks per angle, then decode and correlate audio
// only for followers without clock evidence. No backend.
import type { MulticamSyncEvidence, MulticamSyncMethod, TimelineItem, TimelineState } from '../editor/types';
import { sourceFramesToTimelineFrames, sourceWindowForTimelineRange } from '../editor/sourceLimit';
import { findLag, prepareSignal, TARGET_RATE, type AlignResult } from './align';
import { persistMulticamGroup, type SyncedAnglePlacement } from './groups';
import { clockSyncPlacement } from './timecodeSync';

const MIN_CONFIDENCE = 0.08; // below this we skip (silence / unrelated audio)
const PLAYBACK_RATE_EPSILON = 1e-6;

const effectivePlaybackRate = (item: TimelineItem): number => {
  const rate = item.playbackRate ?? 1;
  return Number.isFinite(rate) ? Math.max(0.01, rate) : Number.NaN;
};

export type MulticamStatus = 'applied' | 'already_synced' | 'failed' | 'partial';

export interface MulticamSyncOffset {
  itemId: string;
  lagSeconds: number;
  confidence: number;
  /** Reference-anchored placement offset, retained for legacy callers. */
  deltaFrames: number;
  method: MulticamSyncMethod;
  evidence: Omit<MulticamSyncEvidence, 'angleId'>;
}

export interface MulticamSyncResult {
  status: MulticamStatus;
  changed: boolean;
  referenceItemId: string;
  syncedItemIds: string[];
  skippedItemIds: string[];
  /** per-follower diagnostics */
  offsets: MulticamSyncOffset[];
  groupId?: string;
  message: string;
  /** next timeline state when changed (caller applies as one undo step) */
  nextState?: TimelineState;
}

export function canMulticamItem(it: TimelineItem): boolean {
  if (it.kind === 'audio') return !!it.src;
  if (it.kind === 'video') return !!it.src;
  return false;
}

/** Timeline offset from the reference anchor for the follower's visible source in-point. */
export function multicamOffsetFrames(
  reference: TimelineItem,
  follower: TimelineItem,
  lagSeconds: number,
  fps: number,
): number {
  const referenceSourceIn = sourceWindowForTimelineRange(reference, 0, reference.durationInFrames).startFrame;
  const followerSourceIn = sourceWindowForTimelineRange(follower, 0, follower.durationInFrames).startFrame;
  const sourceOffset = followerSourceIn - referenceSourceIn - lagSeconds * fps;
  return Math.round(sourceFramesToTimelineFrames(reference, sourceOffset));
}

/** Absolute placement is reference-anchored; the follower's previous placement is intentionally irrelevant. */
export function multicamPlacementFrame(reference: TimelineItem, offsetFrames: number): number {
  return reference.startFrame + offsetFrames;
}

async function decodeMono(src: string): Promise<{ samples: Float32Array; sampleRate: number } | { error: string }> {
  try {
    const res = await fetch(src);
    if (!res.ok) return { error: `Tải dữ liệu âm thanh thất bại (${res.status})` };
    const buf = await res.arrayBuffer();
    // OfflineAudioContext exists in browser; length is placeholder
    const Offline = (globalThis as unknown as { OfflineAudioContext?: typeof OfflineAudioContext }).OfflineAudioContext;
    if (!Offline) return { error: 'OfflineAudioContext không khả dụng' };
    const probe = new Offline(1, 1, 44100);
    const audio = await probe.decodeAudioData(buf.slice(0));
    const channels: Float32Array[] = [];
    for (let c = 0; c < audio.numberOfChannels; c++) channels.push(audio.getChannelData(c));
    const samples = prepareSignal(channels, audio.length, audio.sampleRate);
    if (samples.length < 64) return { error: 'âm thanh quá ngắn' };
    return { samples, sampleRate: TARGET_RATE };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

function resolveSrc(it: TimelineItem, assets: TimelineState['assets']): string | null {
  if (it.src) return it.src;
  // pool asset fallback by name match is not reliable; need assetId if we had it
  void assets;
  return null;
}

/**
 * Run multicam sync on selected clips.
 * - referenceItemId defaults to the first video-kind item, else earliest startFrame
 * - only items with decodable audio are aligned; others skipped
 */
export async function runMulticamSync(args: {
  state: TimelineState;
  itemIds: string[];
  referenceItemId?: string;
  groupId?: string;
  masterItemId?: string;
  makeId?: () => string;
}): Promise<MulticamSyncResult> {
  const { state } = args;
  const ids = [...new Set(args.itemIds.map(String).filter(Boolean))];
  const items = ids.map((id) => state.items.find((x) => x.id === id || x.id.startsWith(id)))
    .filter((x): x is TimelineItem => !!x);
  if (items.length < 2) {
    return {
      status: 'failed', changed: false, referenceItemId: '',
      syncedItemIds: [], skippedItemIds: ids,
      offsets: [], message: 'Trước hết hãy chọn từ 2 clip video/âm thanh trở lên.',
    };
  }
  const eligible = items.filter(canMulticamItem);
  if (eligible.length < 2) {
    return {
      status: 'failed', changed: false, referenceItemId: '',
      syncedItemIds: [], skippedItemIds: items.map((x) => x.id),
      offsets: [], message: 'Đồng bộ multicam chỉ hoạt động với clip video hoặc âm thanh có media.',
    };
  }

  let refId = args.referenceItemId?.trim() || '';
  if (refId) {
    const hit = eligible.find((x) => x.id === refId || x.id.startsWith(refId));
    if (!hit) {
      return {
        status: 'failed', changed: false, referenceItemId: refId,
        syncedItemIds: [], skippedItemIds: eligible.map((x) => x.id),
        offsets: [], message: 'referenceItemId phải là một trong các clip đã chọn.',
      };
    }
    refId = hit.id;
  } else {
    const video = eligible.find((x) => x.kind === 'video');
    refId = (video ?? [...eligible].sort((a, b) => a.startFrame - b.startFrame)[0]!).id;
  }

  const refItem = eligible.find((x) => x.id === refId)!;
  const fps = state.fps || 30;
  const followers = eligible.filter((x) => x.id !== refId);
  const referenceRate = effectivePlaybackRate(refItem);
  if (!Number.isFinite(referenceRate)) {
    return {
      status: 'failed',
      changed: false,
      referenceItemId: refId,
      syncedItemIds: [],
      skippedItemIds: followers.map((item) => item.id),
      offsets: [],
      message: `clip tham chiếu "${refItem.name || refItem.id}" có tốc độ phát không hợp lệ. Hãy đặt lại thành tốc độ hữu hạn rồi thử đồng bộ multicam.`,
    };
  }
  const rateMismatches = followers.filter((follower) => {
    const followerRate = effectivePlaybackRate(follower);
    return !Number.isFinite(followerRate)
      || Math.abs(followerRate - referenceRate) > PLAYBACK_RATE_EPSILON;
  });
  if (rateMismatches.length) {
    const mismatchSummary = rateMismatches
      .map((item) => `${item.name || item.id} (${effectivePlaybackRate(item)}×)`)
      .join(', ');
    return {
      status: 'failed',
      changed: false,
      referenceItemId: refId,
      syncedItemIds: [],
      skippedItemIds: followers.map((item) => item.id),
      offsets: [],
      message: `đồng bộ multicam yêu cầu các clip có cùng tốc độ phát. Hãy đặt tất cả clip đã chọn thành ${referenceRate}× rồi thử lại; clip không khớp: ${mismatchSummary}.`,
    };
  }
  const offsets: MulticamSyncOffset[] = [];
  const placements: SyncedAnglePlacement[] = [];
  const skippedItemIds: string[] = [];
  const audioFollowers: TimelineItem[] = [];

  for (const follower of followers) {
    const clock = clockSyncPlacement(refItem, follower, state.assets, fps);
    if (!clock) {
      audioFollowers.push(follower);
      continue;
    }
    offsets.push({
      itemId: follower.id,
      lagSeconds: 0,
      confidence: clock.confidence,
      deltaFrames: clock.offsetFrames,
      method: clock.method,
      evidence: clock.evidence,
    });
    if (clock.startFrame < 0) {
      skippedItemIds.push(follower.id);
      continue;
    }
    placements.push({
      itemId: follower.id,
      startFrame: clock.startFrame,
      offsetFrames: clock.offsetFrames,
      confidence: clock.confidence,
      method: clock.method,
      evidence: clock.evidence,
    });
  }

  if (audioFollowers.length) {
    const refSrc = resolveSrc(refItem, state.assets);
    const refDecoded = refSrc ? await decodeMono(refSrc) : { error: 'không có nguồn tư liệu' };
    if ('error' in refDecoded) {
      skippedItemIds.push(...audioFollowers.map((item) => item.id));
    } else {
      for (const follower of audioFollowers) {
        const src = resolveSrc(follower, state.assets);
        const decoded = src ? await decodeMono(src) : { error: 'không có nguồn tư liệu' };
        if ('error' in decoded) {
          skippedItemIds.push(follower.id);
          continue;
        }
        const align: AlignResult = findLag(refDecoded.samples, decoded.samples, TARGET_RATE);
        const offsetFrames = multicamOffsetFrames(refItem, follower, align.lagSeconds, fps);
        const evidence = {
          method: 'audio' as const,
          confidence: align.confidence,
          offsetFrames,
          lagSeconds: align.lagSeconds,
        };
        offsets.push({
          itemId: follower.id,
          lagSeconds: align.lagSeconds,
          confidence: align.confidence,
          deltaFrames: offsetFrames,
          method: 'audio',
          evidence,
        });
        if (align.confidence < MIN_CONFIDENCE) {
          skippedItemIds.push(follower.id);
          continue;
        }
        placements.push({
          itemId: follower.id,
          startFrame: Math.max(0, multicamPlacementFrame(refItem, offsetFrames)),
          offsetFrames,
          confidence: align.confidence,
          method: 'audio',
          evidence,
        });
      }
    }
  }

  if (!placements.length) {
    return {
      status: 'failed',
      changed: false,
      referenceItemId: refId,
      syncedItemIds: [],
      skippedItemIds,
      offsets,
      message: 'không thể căn chỉnh clip phụ nào (thiếu metadata đồng hồ, độ tin cậy thấp hoặc giải mã thất bại).',
    };
  }

  let fallbackId = 0;
  const makeId = args.makeId ?? (() => globalThis.crypto?.randomUUID?.()
    ?? `multicam_${Date.now().toString(36)}_${fallbackId++}`);
  const persisted = persistMulticamGroup(state, refId, placements, {
    groupId: args.groupId,
    masterItemId: args.masterItemId,
    makeId,
  });
  if (!persisted) {
    return {
      status: 'failed', changed: false, referenceItemId: refId,
      syncedItemIds: [], skippedItemIds, offsets,
      message: 'không thể lưu nhóm multicam.',
    };
  }
  const syncedItemIds = placements
    .filter((placement) => state.items.find((item) => item.id === placement.itemId)?.startFrame !== placement.startFrame)
    .map((placement) => placement.itemId);
  const status: MulticamStatus = skippedItemIds.length
    ? 'partial'
    : syncedItemIds.length ? 'applied' : 'already_synced';
  const previousGroup = state.multicamGroups?.find((group) => group.id === persisted.group.id);
  const groupChanged = !previousGroup || JSON.stringify(previousGroup) !== JSON.stringify(persisted.group);
  const membershipChanged = eligible.some((item) =>
    item.multicamGroupId !== persisted.group.id
    || !persisted.group.angles.some((angle) => angle.id === item.multicamAngleId));
  const changed = syncedItemIds.length > 0 || groupChanged || membershipChanged;
  return {
    status,
    changed,
    referenceItemId: refId,
    syncedItemIds,
    skippedItemIds,
    offsets,
    groupId: persisted.group.id,
    message: status === 'partial'
      ? `Đã lưu nhóm multicam; đã căn chỉnh ${placements.length} góc máy, bỏ qua ${skippedItemIds.length}.`
      : status === 'already_synced'
        ? `Đã lưu nhóm multicam; ${placements.length + 1} góc máy đã được căn chỉnh từ trước.`
        : `Đã lưu nhóm multicam và căn chỉnh ${syncedItemIds.length} góc máy.`,
    ...(changed ? { nextState: persisted.state } : {}),
  };
}
