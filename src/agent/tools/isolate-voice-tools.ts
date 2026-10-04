export { ISOLATE_VOICE_TOOL_SCHEMAS, ISOLATE_VOICE_TOOL_NAMES } from './schemas/isolate-voice-tools';
// isolate_voice — generate, attach, or clear a speech-isolation track.
import type { AgentContext } from '../context';
import type { MediaAsset, TimelineItem } from '../../editor/types';
import { isolateVoiceOnSrc } from '../../audio/isolateVoice';
import { captureTimelineItemSource, validateTimelineItemSourceResult } from '../../editor/mediaSourceRevision';

type Args = Record<string, unknown>;

function findItem(items: TimelineItem[], id: unknown): TimelineItem | null {
  const q = String(id ?? '');
  if (!q) return null;
  return items.find((it) => it.id === q || it.id.startsWith(q)) ?? null;
}

function findAsset(
  assets: MediaAsset[],
  id: unknown,
): { asset?: MediaAsset; error?: string; candidates?: Array<{ id: string; name: string; kind: string }> } {
  const query = String(id ?? '').trim();
  if (!query) return { error: 'Thiếu id tư liệu' };
  const exact = assets.find((asset) => asset.id === query);
  const matches = exact ? [exact] : assets.filter((asset) => asset.id.startsWith(query));
  if (!matches.length) return { error: `Không tìm thấy tư liệu ${query}` };
  if (matches.length > 1) {
    return {
      error: `Tiền tố tư liệu ${query} không đủ rõ ràng`,
      candidates: matches.slice(0, 6).map((asset) => ({ id: asset.id, name: asset.name, kind: asset.kind })),
    };
  }
  return { asset: matches[0] };
}

export async function execIsolateVoiceTool(
  name: string,
  args: Args,
  ctx: AgentContext,
): Promise<unknown> {
  if (name !== 'isolate_voice') return { error: `Công cụ không xác định: ${name}` };

  const state = ctx.getState();
  const item = findItem(state.items, args.itemId);
  if (!item) {
    return {
      error: `Không tìm thấy đoạn ${args.itemId ?? '(thiếu itemId)'}`,
      available: state.items
        .filter((it) => it.kind === 'video' || it.kind === 'audio')
        .map((it) => ({ itemId: it.id, name: it.name, kind: it.kind })),
    };
  }
  if (item.kind !== 'video' && item.kind !== 'audio') {
    return { error: `isolate_voice chỉ áp dụng cho video/audio, kind hiện tại=${item.kind}` };
  }

  const action = String(args.action ?? 'apply').toLowerCase();
  if (action === 'clear') {
    if (!item.denoisedSrc) {
      return { ok: true, itemId: item.id, action: 'clear', note: 'Clip vốn chưa có tách giọng' };
    }
    ctx.commands.setItemDenoise(item.id, null);
    return { ok: true, itemId: item.id, action: 'clear', denoisedSrc: null };
  }

  const strength = Number.isFinite(Number(args.strength))
    ? Math.max(0, Math.min(100, Number(args.strength)))
    : 70;

  if (action === 'attach') {
    const assets = ctx.getDoc().assets ?? [];
    const sourceMatch = findAsset(assets, args.sourceAssetId);
    if (!sourceMatch.asset) return { error: `sourceAssetId: ${sourceMatch.error}`, candidates: sourceMatch.candidates };
    const sourceAsset = sourceMatch.asset;
    if (sourceAsset.kind !== 'audio' && sourceAsset.kind !== 'video') {
      return { error: `sourceAssetId phải là video/audio, kind hiện tại=${sourceAsset.kind}` };
    }
    if (!item.src || item.src !== sourceAsset.src) {
      return {
        error: 'sourceAssetId không khớp với nguồn của đoạn đích',
        itemSrc: item.src ?? null,
        sourceAssetId: sourceAsset.id,
        sourceSrc: sourceAsset.src,
      };
    }

    const denoisedMatch = findAsset(assets, args.denoisedAssetId);
    if (!denoisedMatch.asset) return { error: `denoisedAssetId: ${denoisedMatch.error}`, candidates: denoisedMatch.candidates };
    const denoisedAsset = denoisedMatch.asset;
    if (denoisedAsset.kind !== 'audio') {
      return { error: `denoisedAssetId phải là audio, kind hiện tại=${denoisedAsset.kind}` };
    }
    if (denoisedAsset.id === sourceAsset.id || denoisedAsset.src === sourceAsset.src) {
      return { error: 'denoisedAssetId không được trùng với tư liệu nguồn' };
    }

    const unchanged = item.denoisedSrc === denoisedAsset.src
      && (item.denoiseStrength ?? 100) === strength;
    ctx.commands.setItemDenoise(item.id, denoisedAsset.src, strength);
    return {
      ok: true,
      itemId: item.id,
      action: 'attach',
      sourceAssetId: sourceAsset.id,
      denoisedAssetId: denoisedAsset.id,
      denoisedSrc: denoisedAsset.src,
      strength,
      unchanged,
      note: 'Đã gắn âm thanh đã tách trong kho tư liệu; không thay đổi tư liệu nguồn hoặc tư liệu dùng chung.',
    };
  }

  if (action !== 'apply') {
    return { error: `Action không xác định: ${action} (dùng apply, attach hoặc clear)` };
  }

  if (args.sourceAssetId) {
    const sourceMatch = findAsset(ctx.getDoc().assets ?? [], args.sourceAssetId);
    if (!sourceMatch.asset) return { error: `sourceAssetId: ${sourceMatch.error}`, candidates: sourceMatch.candidates };
    if (sourceMatch.asset.src !== item.src) return { error: 'sourceAssetId không khớp với nguồn của đoạn đích' };
  }

  const src = item.src ?? '';
  if (!src.startsWith('/media/uploads/')) {
    return {
      error: 'isolate_voice cần tệp nguồn trong /media/uploads (hãy finalize/tải lên kho tư liệu trước). Chưa thể tách từ bản xem trước placeholder blob:.',
      src: src || null,
    };
  }

  const sourceSnapshot = captureTimelineItemSource(item, ctx.getDoc().assets ?? []);
  try {
    const r = await isolateVoiceOnSrc(src, strength, {
      force: args.force === true,
      sourceRevision: sourceSnapshot.sourceRevision,
    });
    const currentItem = ctx.getState().items.find((candidate) => candidate.id === item.id);
    const validation = validateTimelineItemSourceResult(
      sourceSnapshot,
      currentItem,
      ctx.getDoc().assets ?? [],
      r.sourceRevision,
    );
    if (validation.status === 'stale') {
      return {
        ok: false,
        status: 'stale',
        stale: true,
        itemId: item.id,
        action: 'apply',
        reason: validation.reason,
        sourceRevision: validation.sourceRevision,
        currentSourceRevision: validation.currentSourceRevision,
        resultSourceRevision: validation.resultSourceRevision,
        note: 'Tư liệu nguồn đã thay đổi trong lúc tách; đã bỏ kết quả dẫn xuất và không sửa timeline.',
      };
    }
    ctx.commands.setItemDenoise(item.id, r.path, r.strength);
    return {
      ok: true,
      itemId: item.id,
      action: 'apply',
      denoisedSrc: r.path,
      strength: r.strength,
      engine: r.engine ?? 'ffmpeg-open-box',
      sourceRevision: r.sourceRevision,
      bytes: r.bytes,
      note: 'Đã gắn bản khử nhiễu bằng ffmpeg open-box; src gốc không đổi. Dùng action=clear để gỡ.',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Yêu cầu isolate_voice thất bại';
    return {
      error: msg,
      hint: /503|ffmpeg|spawn/i.test(msg)
        ? 'ffmpeg trên máy không khả dụng; có thể khử nhiễu bên ngoài rồi nhập lại, hoặc cài ffmpeg.'
        : 'Hãy xác nhận dev server đã gắn /api/isolate-voice và tệp nguồn nằm trong /media/uploads.',
    };
  }
}
