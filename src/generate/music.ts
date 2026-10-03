import type { MediaAsset, TimelineState } from '../editor/types';
import { findAssetByReference } from './asset-reference';
import { localizedCatalogText } from '../i18n/locale';

export interface SubmitMusicArgs {
  operationId?: string;
  prompt?: string;
  name?: string;
  provider?: 'mureka' | 'minimax' | 'atlas' | 'sonilo';
  mode?: 'instrumental' | 'song' | 'prompt-song' | 'soundtrack' | 'track' | 't2m' | 'cover' | 'v2m';
  lyrics?: string;
  isInstrumental?: boolean;
  lyricsOptimizer?: boolean;
  sampleRate?: number;
  bitrate?: number;
  audioFormat?: 'mp3' | 'wav' | 'pcm' | 'flac';
  /** Project audio asset id for MiniMax music-cover (requires music-cover model in settings). */
  referenceAssetId?: string;
  coverFeatureId?: string;
  count?: number;
  stream?: boolean;
  styles?: Array<'pop' | 'rock' | 'jazz' | 'r&b' | 'edm' | 'ambient' | 'folk' | 'latin' | 'k-pop' | 'j-pop' | 'house' | 'gospel' | 'lo-fi'>;
  gender?: 'female' | 'male';
  referenceId?: string;
  instrumentalId?: string;
  vocalId?: string;
  melodyId?: string;
  /** Mureka soundtrack image/video, track source audio, or Sonilo v2m video (the rendered cut). */
  sourceAssetId?: string;
  audioStartMs?: number;
  audioEndMs?: number;
  songId?: string;
  trackType?: 'Vocals' | 'Instrumental' | 'Drums' | 'Bass' | 'Guitar' | 'Keyboard' | 'Percussion' | 'Strings' | 'Synth' | 'FX' | 'Brass' | 'Woodwinds';
  generateStartMs?: number;
  generateEndMs?: number;
  vocalGender?: 'female' | 'male';
}

interface MusicResponse {
  operationId?: string;
  jobId?: string;
  status?: 'queued';
  provider?: string;
  providerTaskId?: string;
  acceptedAt?: number;
  sourceRevisions?: string[];
  error?: string;
}

export interface MusicGenerationSubmission {
  operationId: string;
  jobId: string;
  status: 'queued';
  provider?: string;
  providerTaskId?: string;
  acceptedAt?: number;
  sourceRevisions?: string[];
}

function resolveAsset(ref: string, state?: TimelineState, kind?: MediaAsset['kind']): MediaAsset {
  if (!state) throw new Error(localizedCatalogText('project state required to resolve music source asset', '解析音乐来源素材需要项目状态', undefined, 'Cần trạng thái dự án để xác định tệp nguồn nhạc'));
  const asset = findAssetByReference(ref, state.assets ?? []);
  if (!asset) throw new Error(localizedCatalogText(`music source asset not found: ${ref}`, `未找到音乐来源素材：${ref}`, undefined, `Không tìm thấy tệp nguồn nhạc: ${ref}`));
  if (kind && asset.kind !== kind) throw new Error(localizedCatalogText(`music source asset is not ${kind}: ${ref}`, `音乐来源素材不是 ${kind}：${ref}`, undefined, `Tệp nguồn nhạc không phải ${kind}: ${ref}`));
  let pathname = asset.src;
  if (pathname.startsWith('http')) {
    const url = new URL(pathname, location.origin);
    if (url.origin !== location.origin) throw new Error(localizedCatalogText(`external audio URLs are not accepted: ${ref}`, `不接受外部音频 URL：${ref}`, undefined, `Không chấp nhận URL âm thanh bên ngoài: ${ref}`));
    pathname = url.pathname;
  }
  if (!pathname.startsWith('/media/uploads/')) throw new Error(localizedCatalogText(`music source must be a project upload: ${ref}`, `音乐来源必须是项目上传素材：${ref}`, undefined, `Nguồn nhạc phải là tệp đã tải lên dự án: ${ref}`));
  return { ...asset, src: pathname };
}

export async function submitMusic(args: SubmitMusicArgs, state?: TimelineState): Promise<MusicGenerationSubmission> {
  const prompt = args.prompt?.trim() ?? '';
  const referenceAsset = args.referenceAssetId ? resolveAsset(args.referenceAssetId, state, 'audio') : undefined;
  const referenceAudioPath = referenceAsset?.src;
  const sourceAsset = args.sourceAssetId ? resolveAsset(args.sourceAssetId, state) : undefined;
  const sourceRevisions = [...new Set(
    [referenceAsset?.sourceRevision, sourceAsset?.sourceRevision].filter((revision): revision is string => Boolean(revision)),
  )];
  const response = await fetch('/generate/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...args,
      prompt,
      referenceAudioPath,
      sourceAssetPath: sourceAsset?.src,
      sourceAssetKind: sourceAsset?.kind,
      sourceRevisions,
      referenceAssetId: undefined,
      sourceAssetId: undefined,
    }),
  });
  const result = await response.json().catch(() => ({})) as MusicResponse;
  if (!response.ok) throw new Error(result.error ?? localizedCatalogText(`music generation failed (${response.status})`, `音乐生成失败（${response.status}）`, undefined, `Tạo nhạc thất bại (${response.status})`));
  if (!result.operationId || !result.jobId || result.status !== 'queued') throw new Error(localizedCatalogText('music generation returned an invalid job submission', '音乐生成返回了无效的任务提交结果', undefined, 'Tạo nhạc trả về yêu cầu tác vụ không hợp lệ'));
  return {
    operationId: result.operationId,
    jobId: result.jobId,
    status: result.status,
    provider: result.provider,
    providerTaskId: result.providerTaskId,
    acceptedAt: result.acceptedAt,
    sourceRevisions: result.sourceRevisions ?? sourceRevisions,
  };
}
