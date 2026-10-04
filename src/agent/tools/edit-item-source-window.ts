import type { MediaAsset, TimelineItem } from '../../editor/types';
import { sourceFramesToTimelineFrames } from '../../editor/sourceLimit';
import { hasOperationalTranscript } from '../../transcript/types';

type OpResult = Record<string, unknown>;
type SourceBound = { value?: number; error?: string };

const finiteNum = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

function sourceBound(
  entry: Record<string, unknown>,
  secondsKey: 'sourceStartSeconds' | 'sourceEndSeconds',
  millisecondsKey: 'sourceStartMs' | 'sourceEndMs',
): SourceBound {
  const secondsRaw = entry[secondsKey];
  const millisecondsRaw = entry[millisecondsKey];
  if (secondsRaw !== undefined && millisecondsRaw !== undefined) {
    return { error: `chỉ dùng ${secondsKey} hoặc ${millisecondsKey}, không dùng cả hai` };
  }
  const raw = secondsRaw ?? millisecondsRaw;
  if (raw === undefined) return {};
  const parsed = finiteNum(raw);
  if (parsed === undefined) {
    return { error: `${secondsRaw !== undefined ? secondsKey : millisecondsKey} phải là số hữu hạn` };
  }
  const value = millisecondsRaw !== undefined ? parsed / 1000 : parsed;
  return value >= 0
    ? { value }
    : { error: `${secondsRaw !== undefined ? secondsKey : millisecondsKey} không được âm` };
}

export function validateSourceFrameUpdate(
  item: TimelineItem,
  entry: Record<string, unknown>,
): OpResult {
  const sourceStart = finiteNum(entry.sourceStartFrame);
  const srcInFrame = finiteNum(entry.srcInFrame);
  const sourceDuration = finiteNum(entry.sourceDurationInFrames);
  const duration = finiteNum(entry.durationInFrames);
  if (entry.sourceStartFrame !== undefined && (sourceStart === undefined || sourceStart < 0)) {
    return { error: 'sourceStartFrame phải là số frame hữu hạn không âm' };
  }
  if (entry.srcInFrame !== undefined && srcInFrame === undefined) {
    return { error: 'srcInFrame phải là số hữu hạn' };
  }
  if (sourceStart !== undefined && srcInFrame !== undefined
    && Math.round(sourceStart) !== Math.round(srcInFrame)) {
    return { error: 'srcInFrame và sourceStartFrame phải khớp khi cùng được cung cấp' };
  }
  if (entry.sourceDurationInFrames !== undefined && (sourceDuration === undefined || sourceDuration <= 0)) {
    return { error: 'sourceDurationInFrames phải là số frame hữu hạn dương' };
  }
  if (entry.durationInFrames !== undefined && duration === undefined) {
    return { error: 'durationInFrames phải là số hữu hạn' };
  }
  if (sourceDuration !== undefined && duration !== undefined) {
    return { error: 'chỉ dùng sourceDurationInFrames hoặc durationInFrames, không dùng cả hai' };
  }
  if ((sourceStart !== undefined || sourceDuration !== undefined)
    && item.kind !== 'video' && item.kind !== 'audio') {
    return { error: `cửa sổ khung nguồn chỉ áp dụng cho đoạn video/audio (nhận ${item.kind})` };
  }
  if ((sourceStart !== undefined || sourceDuration !== undefined)
    && item.kind === 'audio' && hasOperationalTranscript(item)) {
    return { error: 'không hỗ trợ cửa sổ khung nguồn thô cho âm thanh có bản chép lời đang hoạt động' };
  }
  const requestedStart = sourceStart ?? srcInFrame;
  return {
    ...(requestedStart !== undefined ? { srcInFrame: Math.max(0, Math.round(requestedStart)) } : {}),
    ...(sourceDuration !== undefined
      ? { durationInFrames: Math.max(1, Math.round(sourceFramesToTimelineFrames(item, sourceDuration))) }
      : duration !== undefined ? { durationInFrames: Math.max(1, Math.round(duration)) } : {}),
  };
}

export function validateSourceWindow(
  type: string,
  asset: MediaAsset,
  fps: number,
  entry: Record<string, unknown>,
  durationInFrames: number | undefined,
): OpResult | null {
  const frameStartRaw = entry.sourceStartFrame;
  const frameDurationRaw = entry.sourceDurationInFrames;
  const usesFrameWindow = frameStartRaw !== undefined || frameDurationRaw !== undefined;
  const usesTimeWindow = entry.sourceStartSeconds !== undefined || entry.sourceEndSeconds !== undefined
    || entry.sourceStartMs !== undefined || entry.sourceEndMs !== undefined;
  if (usesFrameWindow && usesTimeWindow) {
    return { error: 'chỉ dùng cửa sổ frame nguồn hoặc cửa sổ giây/mili-giây, không dùng cả hai' };
  }
  if (usesFrameWindow) {
    const sourceStartFrame = frameStartRaw === undefined ? 0 : finiteNum(frameStartRaw);
    const sourceDurationInFrames = frameDurationRaw === undefined ? undefined : finiteNum(frameDurationRaw);
    if (sourceStartFrame === undefined || sourceStartFrame < 0) {
      return { error: 'sourceStartFrame phải là số frame hữu hạn không âm' };
    }
    if (sourceDurationInFrames !== undefined && sourceDurationInFrames <= 0) {
      return { error: 'sourceDurationInFrames phải là số frame hữu hạn dương' };
    }
    if (durationInFrames !== undefined || entry.srcInFrame !== undefined) {
      return { error: 'không kết hợp cửa sổ frame nguồn với durationInFrames/srcInFrame' };
    }
    if (type !== 'video' && type !== 'audio') {
      return { error: `cửa sổ frame nguồn chỉ áp dụng cho adds video/audio (nhận ${type})` };
    }
    if (type === 'audio' && hasOperationalTranscript(asset)) {
    return { error: 'không hỗ trợ cửa sổ khung nguồn thô cho âm thanh có bản chép lời đang hoạt động' };
    }
    const startFrameIn = Math.round(sourceStartFrame);
    const available = asset.durationInFrames > 0 ? asset.durationInFrames - startFrameIn : null;
    if (available !== null && available <= 0) {
    return { error: `sourceStartFrame ${startFrameIn} nằm sau cuối tư liệu ${asset.id}` };
    }
    const sourceFrames = sourceDurationInFrames === undefined
      ? available
      : Math.round(sourceDurationInFrames);
    if (sourceFrames === null) return { error: 'Cần có sourceDurationInFrames khi chưa biết thời lượng asset' };
    if (available !== null && sourceFrames > available) {
      return { error: `Cửa sổ khung nguồn vượt quá độ dài ${asset.durationInFrames} của tư liệu ${asset.id}` };
    }
    return {
      srcInFrame: startFrameIn,
      durationInFrames: Math.max(1, sourceFrames),
      sourceRange: {
        startFrame: startFrameIn,
        durationInFrames: Math.max(1, sourceFrames),
        endFrameExclusive: startFrameIn + Math.max(1, sourceFrames),
      },
    };
  }
  const start = sourceBound(entry, 'sourceStartSeconds', 'sourceStartMs');
  const end = sourceBound(entry, 'sourceEndSeconds', 'sourceEndMs');
  if (start.error || end.error) return { error: start.error ?? end.error };
  if (start.value === undefined && end.value === undefined) return null;
  if (type !== 'video' && type !== 'audio' && type !== 'gif') {
    return { error: `cửa sổ nguồn chỉ áp dụng cho adds video/audio/gif (nhận ${type})` };
  }
  if (type === 'gif') {
    return {
      error: 'Không hỗ trợ cửa sổ nguồn cho GIF vì playback GIF không dùng srcInFrame; hãy chuyển GIF thành video để cắt nguồn',
    };
  }
  if (type === 'audio' && hasOperationalTranscript(asset)) {
    return {
      error: [
        'Không hỗ trợ cửa sổ nguồn thô cho audio có transcript hoạt động',
        'audio có transcript được kết xuất thành luồng đã chỉnh sửa, nên không thể biểu diễn an toàn timestamp thô bằng srcInFrame',
        'hãy thêm audio mà không dùng sourceStart/sourceEnd rồi chỉnh luồng transcript, hoặc dùng audio không có transcript để cắt theo thời gian thô',
      ].join('; '),
    };
  }
  if (durationInFrames !== undefined || entry.srcInFrame !== undefined) {
    return { error: 'không kết hợp cửa sổ nguồn với durationInFrames/srcInFrame — cửa sổ nguồn tự xác định phần cắt và thời lượng' };
  }
  const assetFrames = asset.durationInFrames > 0 ? asset.durationInFrames : null;
  const startSec = start.value ?? 0;
  const startFrameIn = Math.round(startSec * fps);
  if (assetFrames !== null && startFrameIn >= assetFrames) {
    return { error: `source start ${startSec}s nằm sau cuối tư liệu (${(assetFrames / fps).toFixed(2)}s)` };
  }
  const endSec = end.value ?? (assetFrames !== null ? assetFrames / fps : undefined);
  if (endSec === undefined) return { error: 'Cần có source end khi chưa biết thời lượng asset' };
  if (endSec <= startSec) {
    return { error: `source end ${endSec}s phải lớn hơn source start ${startSec}s` };
  }
  const endFrameIn = Math.max(startFrameIn + 1, Math.round(endSec * fps));
  if (assetFrames !== null && endFrameIn > assetFrames) {
    return { error: `source end ${endSec}s vượt quá độ dài tư liệu (${(assetFrames / fps).toFixed(2)}s)` };
  }
  return {
    srcInFrame: startFrameIn,
    durationInFrames: endFrameIn - startFrameIn,
    sourceRange: { startSeconds: startSec, endSeconds: endSec },
  };
}
