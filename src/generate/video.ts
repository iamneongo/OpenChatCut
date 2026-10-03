import type { MediaAsset, TimelineItem, TimelineState } from '../editor/types';
import { sourceWindowForTimelineRange } from '../editor/sourceLimit';
import { localizedCatalogText } from '../i18n/locale';

export interface SubmitVideoArgs {
  operationId?: string;
  model: 'seedance2' | 'kling' | 'hailuo' | 'byteplus' | 'grok-imagine-video' | 'ofox' | 'fal';
  /** Explicit curated Fal model ID; omitted uses the saved Fal default. */
  falModel?: string;
  prompt?: string;
  name?: string;
  durationSeconds?: number | string;
  ratio?: string;
  resolution?: '360p' | '480p' | '512p' | '540p' | '720p' | '768p' | '1080p' | '480P' | '768P' | '1080P' | '4k';
  mode?: 'std' | 'pro';
  firstFrame?: string;
  lastFrame?: string;
  refImages?: string[];
  refVideos?: string[];
  refAudios?: string[];
  /** Kling only: feature (default) = motion/style ref; base = video to edit. */
  refVideoMode?: 'feature' | 'base';
  /** Hailuo only: MiniMax prompt optimizer (default true). */
  promptOptimizer?: boolean;
  /** Hailuo only: faster pretreatment when optimizer is on. */
  fastPretreatment?: boolean;
  /** Seedance-only provider controls. */
  generateAudio?: boolean;
  seed?: number;
  cameraFixed?: boolean;
  watermark?: boolean;
  returnLastFrame?: boolean;
  executionExpiresAfter?: number;
  priority?: number;
  multiPrompts?: Array<{ prompt: string; duration: number | string; index: number }>;
  shotType?: 'customize' | 'intelligence';
}

export type GenerationReferenceRole = 'first-frame' | 'last-frame' | 'reference-image' | 'reference-video' | 'reference-audio';

interface GenerationReferenceBase {
  role: GenerationReferenceRole;
  assetId: string;
  path: string;
  sourceRevision?: string;
}

export interface AssetMasterGenerationReference extends GenerationReferenceBase {
  kind: 'asset-master';
}

export interface TimelineSliceGenerationReference extends GenerationReferenceBase {
  kind: 'timeline-slice';
  itemId: string;
  srcInFrame: number;
  srcOutFrame: number;
  playbackRate: number;
  timelineDurationInFrames: number;
  fps: number;
}

export type GenerationReference = AssetMasterGenerationReference | TimelineSliceGenerationReference;

export interface GenerationReferencePreflightIssue {
  code: string;
  model: SubmitVideoArgs['model'];
  role?: GenerationReferenceRole;
  message: string;
}

export class GenerationReferencePreflightError extends Error {
  readonly code = 'generation_reference_preflight';
  readonly issues: GenerationReferencePreflightIssue[];

  constructor(issues: GenerationReferencePreflightIssue[]) {
    super(issues.map((issue) => issue.message).join('; '));
    this.name = 'GenerationReferencePreflightError';
    this.issues = issues;
  }
}

interface VideoResponse {
  operationId?: string;
  jobId?: string;
  status?: 'queued';
  provider?: string;
  providerTaskId?: string;
  acceptedAt?: number;
  sourceRevisions?: string[];
  error?: string;
  code?: string;
  issues?: GenerationReferencePreflightIssue[];
}

export interface VideoGenerationSubmission {
  operationId: string;
  jobId: string;
  status: 'queued';
  provider?: string;
  providerTaskId?: string;
  acceptedAt?: number;
  sourceRevisions?: string[];
}

function sameOriginUploadPath(rawPath: string, ref: string): string {
  let pathname = rawPath;
  if (rawPath.startsWith('http')) {
    const url = new URL(rawPath, location.origin);
    if (url.origin !== location.origin) throw new Error(localizedCatalogText(`external asset URLs are not accepted: ${ref}`, `不接受外部素材 URL：${ref}`, undefined, `Không chấp nhận URL tệp bên ngoài: ${ref}`));
    pathname = url.pathname;
  }
  if (!pathname.startsWith('/media/uploads/')) throw new Error(localizedCatalogText(`generation reference must be a project upload: ${ref}`, `生成参考素材必须是项目上传素材：${ref}`, undefined, `Tệp tham chiếu tạo nội dung phải là tệp đã tải lên dự án: ${ref}`));
  return pathname;
}

function resolveAssetForReference(ref: string, state: TimelineState, kind: MediaAsset['kind'], item?: TimelineItem): MediaAsset {
  const cleanRef = ref.replace(/^asset:\/\//, '');
  const path = item?.src ? sameOriginUploadPath(item.src, ref) : cleanRef;
  const all = state.assets ?? [];
  const exact = all.filter((asset) => asset.id === cleanRef || asset.name === cleanRef || asset.src === path);
  const candidates = exact.length ? exact : all.filter((asset) => asset.id.startsWith(cleanRef));
  if (candidates.length !== 1) throw new Error(candidates.length
    ? localizedCatalogText(`asset reference is ambiguous: ${ref}`, `素材引用不明确：${ref}`, undefined, `Tài liệu tham chiếu không xác định duy nhất: ${ref}`)
    : localizedCatalogText(`asset not found: ${ref}`, `未找到素材：${ref}`, undefined, `Không tìm thấy tệp: ${ref}`));
  if (candidates[0].kind !== kind) throw new Error(localizedCatalogText(`asset is not ${kind}: ${ref}`, `素材不是 ${kind}：${ref}`, undefined, `Tệp không phải ${kind}: ${ref}`));
  return candidates[0];
}

function resolveReference(
  ref: string,
  state: TimelineState,
  kind: MediaAsset['kind'],
  role: GenerationReferenceRole,
): GenerationReference {
  const cleanRef = ref.replace(/^asset:\/\//, '');
  const item = state.items.find((candidate) => candidate.id === cleanRef || candidate.name === cleanRef);
  if (item && item.kind !== kind) throw new Error(localizedCatalogText(`timeline reference is not ${kind}: ${ref}`, `时间线引用不是 ${kind}：${ref}`, undefined, `Tham chiếu dòng thời gian không phải ${kind}: ${ref}`));
  const asset = resolveAssetForReference(ref, state, kind, item);
  const path = sameOriginUploadPath(item?.src ?? asset.src, ref);
  const sourceRevision = item?.sourceRevision ?? asset.sourceRevision;
  if (!item || (kind !== 'video' && kind !== 'audio')) {
    return { kind: 'asset-master', role, assetId: asset.id, path, sourceRevision };
  }
  const window = sourceWindowForTimelineRange(item, 0, item.durationInFrames);
  const sourceLimit = asset.durationInFrames > 0 ? asset.durationInFrames : Number.POSITIVE_INFINITY;
  const srcInFrame = Math.min(sourceLimit, window.startFrame);
  const srcOutFrame = Math.max(srcInFrame, Math.min(sourceLimit, window.endFrame));
  return {
    kind: 'timeline-slice',
    role,
    assetId: asset.id,
    itemId: item.id,
    path,
    sourceRevision,
    srcInFrame,
    srcOutFrame,
    playbackRate: Math.max(0.01, item.playbackRate ?? 1),
    timelineDurationInFrames: item.durationInFrames,
    fps: state.fps,
  };
}

/** Provider/model/role validation before a paid provider request is submitted. */
export function preflightGenerationReferences(
  model: SubmitVideoArgs['model'],
  references: readonly GenerationReference[],
): void {
  const issues: GenerationReferencePreflightIssue[] = [];
  const count = (role: GenerationReferenceRole) => references.filter((reference) => reference.role === role).length;
  const firstFrames = count('first-frame');
  const lastFrames = count('last-frame');
  const images = count('reference-image');
  const videos = count('reference-video');
  const audios = count('reference-audio');

  for (const reference of references) {
    const expected = reference.role === 'reference-video' ? 'video'
      : reference.role === 'reference-audio' ? 'audio' : 'image';
    if (reference.kind === 'timeline-slice' && expected === 'image') {
      issues.push({ code: 'role_slice_unsupported', model, role: reference.role, message: localizedCatalogText(`${model} ${reference.role} must use an image asset master, not a timeline slice`, `${model} 的 ${reference.role} 必须使用图片素材主文件，不能使用时间线片段`, undefined, `${model} ${reference.role} phải dùng tệp ảnh gốc, không dùng lát cắt dòng thời gian`) });
    }
    if (reference.kind === 'timeline-slice' && !(reference.srcOutFrame > reference.srcInFrame)) {
      issues.push({ code: 'empty_timeline_slice', model, role: reference.role, message: localizedCatalogText(`${model} ${reference.role} timeline slice is empty`, `${model} 的 ${reference.role} 时间线片段为空`, undefined, `Lát cắt dòng thời gian ${reference.role} của ${model} đang trống`) });
    }
  }
  if (lastFrames && !firstFrames) {
    issues.push({ code: 'last_frame_requires_first', model, role: 'last-frame', message: localizedCatalogText(`${model} lastFrame requires firstFrame`, `${model} 的 lastFrame 需要先提供 firstFrame`, undefined, `${model} lastFrame yêu cầu có firstFrame`) });
  }
  if (model === 'hailuo' && (images || videos || audios)) {
    issues.push({ code: 'hailuo_reference_role', model, message: localizedCatalogText('hailuo does not support reference arrays; use firstFrame and optional lastFrame', 'hailuo 不支持参考素材数组；请使用 firstFrame 和可选的 lastFrame', undefined, 'hailuo không hỗ trợ mảng tệp tham chiếu; hãy dùng firstFrame và lastFrame nếu cần') });
  }
  if (model === 'seedance2' || model === 'byteplus') {
    if (lastFrames && (images || videos || audios)) {
      issues.push({ code: 'seedance_last_frame_conflict', model, role: 'last-frame', message: localizedCatalogText(`${model} lastFrame cannot be combined with reference arrays`, `${model} 的 lastFrame 不能与参考素材数组同时使用`, undefined, `${model} lastFrame không thể dùng cùng mảng tệp tham chiếu`) });
    }
    if (images > 9 || videos > 3 || audios > 3) {
      issues.push({ code: 'seedance_reference_limit', model, message: localizedCatalogText(`${model} supports at most 9 images, 3 videos, and 3 audio references`, `${model} 最多支持 9 个图片、3 个视频和 3 个音频参考素材`, undefined, `${model} hỗ trợ tối đa 9 ảnh, 3 video và 3 tệp âm thanh tham chiếu`) });
    }
    if (audios && !firstFrames && !images && !videos) {
      issues.push({ code: 'seedance_audio_requires_visual', model, role: 'reference-audio', message: localizedCatalogText(`${model} audio references require a visual reference`, `${model} 的音频参考素材需要同时提供视觉参考`, undefined, `Tệp âm thanh tham chiếu của ${model} cần có tệp hình ảnh hoặc video tham chiếu`) });
    }
  }
  if (model === 'kling') {
    if (audios) issues.push({ code: 'kling_audio_unsupported', model, role: 'reference-audio', message: localizedCatalogText('kling does not support audio references', 'kling 不支持音频参考素材', undefined, 'kling không hỗ trợ tệp âm thanh tham chiếu') });
    if (videos > 1) issues.push({ code: 'kling_video_limit', model, role: 'reference-video', message: localizedCatalogText('kling accepts at most one reference video', 'kling 最多接受一个视频参考素材', undefined, 'kling chỉ chấp nhận tối đa một video tham chiếu') });
    const imageCount = firstFrames + lastFrames + images;
    const maxImages = videos ? 4 : 7;
    if (imageCount > maxImages) {
      issues.push({ code: 'kling_image_limit', model, role: 'reference-image', message: localizedCatalogText(`kling accepts at most ${maxImages} total image references for this request`, `本次请求中 kling 最多接受 ${maxImages} 个图片参考素材`, undefined, `Yêu cầu này của kling chỉ chấp nhận tối đa ${maxImages} ảnh tham chiếu`) });
    }
  }
  if (issues.length) throw new GenerationReferencePreflightError(issues);
}

export async function submitVideo(args: SubmitVideoArgs, state: TimelineState): Promise<VideoGenerationSubmission> {
  const firstFrame = args.firstFrame ? resolveReference(args.firstFrame, state, 'image', 'first-frame') : undefined;
  const lastFrame = args.lastFrame ? resolveReference(args.lastFrame, state, 'image', 'last-frame') : undefined;
  const refImages = (args.refImages ?? []).map((ref) => resolveReference(ref, state, 'image', 'reference-image'));
  const refVideos = (args.refVideos ?? []).map((ref) => resolveReference(ref, state, 'video', 'reference-video'));
  const refAudios = (args.refAudios ?? []).map((ref) => resolveReference(ref, state, 'audio', 'reference-audio'));
  const references = [firstFrame, lastFrame, ...refImages, ...refVideos, ...refAudios]
    .filter((reference): reference is GenerationReference => reference !== undefined);
  preflightGenerationReferences(args.model, references);
  const sourceRevisions = [...new Set(references.map((reference) => reference.sourceRevision).filter((revision): revision is string => Boolean(revision)))];
  const response = await fetch('/generate/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...args,
      generationReferences: references,
      sourceRevisions,
      firstFramePath: firstFrame?.path,
      lastFramePath: lastFrame?.path,
      refImagePaths: refImages.map((reference) => reference.path),
      refVideoPaths: refVideos.map((reference) => reference.path),
      refAudioPaths: refAudios.map((reference) => reference.path),
    }),
  });
  const result = await response.json().catch(() => ({})) as VideoResponse;
  if (!response.ok) {
    if (result.code === 'generation_reference_preflight' && result.issues?.length) {
      throw new GenerationReferencePreflightError(result.issues);
    }
    throw new Error(result.error ?? `Tạo video thất bại (${response.status})`);
  }
  if (!result.operationId || !result.jobId || result.status !== 'queued') throw new Error(localizedCatalogText('video generation returned an invalid job submission', '视频生成返回了无效的任务提交结果', undefined, 'Tạo video trả về yêu cầu tác vụ không hợp lệ'));
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
