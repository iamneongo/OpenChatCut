import type { MediaAsset, TimelineState } from '../editor/types';
import { findAssetByReference } from './asset-reference';
import { localizedCatalogText } from '../i18n/locale';

export interface SubmitSoundArgs {
  operationId?: string;
  provider?: 'elevenlabs' | 'sonilo';
  prompt?: string;
  durationSeconds?: number;
  promptInfluence?: number;
  loop?: boolean;
  outputFormat?: string;
  /** Sonilo only: project video asset (the rendered cut) the SFX are generated from. */
  sourceAssetId?: string;
  name?: string;
}

interface SoundResponse {
  operationId?: string;
  jobId?: string;
  status?: 'queued';
  provider?: string;
  providerTaskId?: string;
  acceptedAt?: number;
  sourceRevisions?: string[];
  path?: string;
  durationSeconds?: number;
  licenseId?: string;
  error?: string;
}

export interface SoundGenerationSubmission {
  operationId: string;
  jobId: string;
  status: 'queued';
  provider?: string;
  providerTaskId?: string;
  acceptedAt?: number;
  sourceRevisions?: string[];
}

const newId = () => crypto.randomUUID?.() ?? `generated_${Date.now()}_${Math.random().toString(36).slice(2)}`;

function resolveVideoAsset(ref: string, state: TimelineState): MediaAsset {
  const asset = findAssetByReference(ref, state.assets ?? []);
  if (!asset) throw new Error(localizedCatalogText(`sound source asset not found: ${ref}`, `未找到音效来源素材：${ref}`, undefined, `Không tìm thấy tệp nguồn âm thanh: ${ref}`));
  if (asset.kind !== 'video') throw new Error(localizedCatalogText(`sound source asset is not video: ${ref}`, `音效来源素材不是视频：${ref}`, undefined, `Tệp nguồn âm thanh không phải video: ${ref}`));
  let pathname = asset.src;
  if (pathname.startsWith('http')) {
    const url = new URL(pathname, location.origin);
    if (url.origin !== location.origin) throw new Error(localizedCatalogText(`external video URLs are not accepted: ${ref}`, `不接受外部视频 URL：${ref}`, undefined, `Không chấp nhận URL video bên ngoài: ${ref}`));
    pathname = url.pathname;
  }
  if (!pathname.startsWith('/media/uploads/')) throw new Error(localizedCatalogText(`sound source must be a project upload: ${ref}`, `音效来源必须是项目上传素材：${ref}`, undefined, `Nguồn âm thanh phải là tệp đã tải lên dự án: ${ref}`));
  return { ...asset, src: pathname };
}

export async function submitSound(
  args: SubmitSoundArgs,
  state: TimelineState,
): Promise<MediaAsset | SoundGenerationSubmission> {
  const provider = args.provider === 'sonilo' ? 'sonilo' : 'elevenlabs';
  const prompt = args.prompt?.trim() ?? '';
  if (provider === 'elevenlabs' && !prompt) throw new Error(localizedCatalogText('prompt is required', '需要填写提示词', undefined, 'Cần nhập lời nhắc'));
  const sourceAsset = provider === 'sonilo' && args.sourceAssetId
    ? resolveVideoAsset(args.sourceAssetId, state)
    : undefined;
  const sfxLabel = localizedCatalogText('SFX', '音效', undefined, 'Hiệu ứng âm thanh');
  const soundLabel = localizedCatalogText('Sound', '声音', undefined, 'Âm thanh');
  const fallbackName = provider === 'sonilo'
    ? `${sfxLabel} · ${(sourceAsset?.name ?? 'cut').slice(0, 36)}`
    : `${soundLabel} · ${prompt.slice(0, 36)}`;
  const name = args.name?.trim() || fallbackName;
  const sourceRevisions = sourceAsset?.sourceRevision ? [sourceAsset.sourceRevision] : [];
  const response = await fetch('/generate/sound', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...args,
      provider,
      prompt,
      name,
      sourceRevisions,
      sourceAssetPath: sourceAsset?.src,
      sourceAssetKind: sourceAsset?.kind,
      sourceAssetId: undefined,
    }),
  });
  const result = await response.json().catch(() => ({})) as SoundResponse;
  if (!response.ok) throw new Error(result.error ?? localizedCatalogText(`sound generation failed (${response.status})`, `音效生成失败（${response.status}）`, undefined, `Tạo âm thanh thất bại (${response.status})`));
  if (provider === 'sonilo') {
    if (!result.operationId || !result.jobId || result.status !== 'queued') {
      throw new Error(localizedCatalogText('sound generation returned an invalid job submission', '音效生成返回了无效的任务提交结果', undefined, 'Tạo âm thanh trả về yêu cầu tác vụ không hợp lệ'));
    }
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
  if (!result.path || !result.durationSeconds) throw new Error(localizedCatalogText('sound generation returned invalid audio', '音效生成返回了无效音频', undefined, 'Tạo âm thanh trả về dữ liệu âm thanh không hợp lệ'));
  return {
    id: newId(),
    name,
    kind: 'audio',
    src: result.path,
    durationInFrames: Math.max(1, Math.round(result.durationSeconds * state.fps)),
  };
}
