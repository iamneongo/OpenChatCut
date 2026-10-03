import { buildFalCatalogVideoRequest } from './fal-catalog-input.ts';
export interface MultiPrompt { prompt: string; duration: number | string; index: number }
export type VideoResolution = '360p' | '480p' | '512p' | '540p' | '720p' | '768p' | '1080p' | '480P' | '768P' | '1080P' | '4k';
export type KlingVideoReferType = 'feature' | 'base';

export interface VideoRequest {
  operationId?: string;
  model?: 'seedance2' | 'kling' | 'hailuo' | 'byteplus' | 'grok-imagine-video' | 'ofox' | 'fal';
  /** Explicit curated Fal model ID; omitted uses the saved Fal default. */
  falModel?: string;
  prompt?: string;
  name?: string;
  durationSeconds?: number | string;
  ratio?: string;
  resolution?: VideoResolution;
  mode?: 'std' | 'pro';
  firstFramePath?: string;
  lastFramePath?: string;
  refImagePaths?: string[];
  refVideoPaths?: string[];
  refAudioPaths?: string[];
  /** Versioned reference descriptors; server derives provider paths from these. */
  generationReferences?: unknown[];
  sourceRevisions?: string[];
  refVideoMode?: KlingVideoReferType;
  promptOptimizer?: boolean;
  fastPretreatment?: boolean;
  generateAudio?: boolean;
  seed?: number;
  cameraFixed?: boolean;
  watermark?: boolean;
  returnLastFrame?: boolean;
  executionExpiresAfter?: number;
  priority?: number;
  multiPrompts?: MultiPrompt[];
  shotType?: 'customize' | 'intelligence';
}

export interface ValidVideoRequest extends Omit<VideoRequest, 'model' | 'prompt' | 'durationSeconds' | 'ratio' | 'refImagePaths' | 'refVideoPaths' | 'refAudioPaths'> {
  model: 'seedance2' | 'kling' | 'hailuo' | 'byteplus' | 'grok-imagine-video' | 'ofox' | 'fal';
  /** Explicit curated Fal model ID; omitted uses the saved Fal default. */
  falModel?: string;
  prompt: string;
  durationSeconds: number;
  durationSpecified: boolean;
  ratioSpecified?: boolean;
  ratio: string;
  refImagePaths: string[];
  refVideoPaths: string[];
  refAudioPaths: string[];
}

export function videoSeconds(value: number | string | undefined, fallback: number): number {
  const parsed = typeof value === 'string' ? Number(value.trim().replace(/s$/i, '')) : value ?? fallback;
  if (!Number.isInteger(parsed)) throw new Error('durationSeconds phải là số nguyên');
  return parsed;
}

export function hailuoApiResolution(resolution?: VideoResolution): '512P' | '768P' | '1080P' {
  if (resolution === '512p') return '512P';
  return resolution === '1080p' ? '1080P' : '768P';
}

export function seedanceApiResolution(resolution?: VideoResolution): '480p' | '720p' | '1080p' | '4k' {
  if (resolution === '480p' || resolution === '1080p' || resolution === '4k') return resolution;
  return '720p';
}

const SEEDANCE_KEYS = ['generateAudio', 'seed', 'cameraFixed', 'watermark', 'returnLastFrame', 'executionExpiresAfter', 'priority'] as const;

function rejectSeedanceOptions(input: VideoRequest): void {
  if (SEEDANCE_KEYS.some((key) => input[key] !== undefined)) {
    throw new Error('generateAudio/seed/cameraFixed/watermark/returnLastFrame/executionExpiresAfter/priority chỉ được seedance2/byteplus hỗ trợ');
  }
}

function validateSeedanceOptions(input: VideoRequest): void {
  for (const key of ['generateAudio', 'cameraFixed', 'watermark', 'returnLastFrame'] as const) {
    if (input[key] !== undefined && typeof input[key] !== 'boolean') throw new Error(`${key} phải là boolean`);
  }
  if (input.seed !== undefined && !Number.isSafeInteger(input.seed)) throw new Error('seed phải là số nguyên an toàn');
  if (input.executionExpiresAfter !== undefined
    && (!Number.isInteger(input.executionExpiresAfter) || input.executionExpiresAfter < 3600 || input.executionExpiresAfter > 259200)) {
    throw new Error('executionExpiresAfter phải là số nguyên từ 3600 đến 259200');
  }
  if (input.priority !== undefined && (!Number.isInteger(input.priority) || input.priority < 0 || input.priority > 9)) {
    throw new Error('priority phải là số nguyên từ 0 đến 9');
  }
}

function common(input: VideoRequest, model: ValidVideoRequest['model']): ValidVideoRequest {
  return {
    ...input, model, prompt: String(input.prompt ?? '').trim(), ratio: String(input.ratio ?? '16:9'),
    durationSeconds: videoSeconds(input.durationSeconds, model === 'hailuo' ? 6 : 5),
    durationSpecified: input.durationSeconds !== undefined,
    ratioSpecified: input.ratio !== undefined,
    refImagePaths: input.refImagePaths ?? [], refVideoPaths: input.refVideoPaths ?? [], refAudioPaths: input.refAudioPaths ?? [],
  };
}

function validateHailuo(input: ValidVideoRequest): ValidVideoRequest {
  if (!input.prompt || input.prompt.length > 2000) throw new Error('prompt hailuo là bắt buộc và dài tối đa 2000 ký tự');
  if (input.durationSeconds !== 6 && input.durationSeconds !== 10) throw new Error('durationSeconds của hailuo phải là 6 hoặc 10');
  if (input.lastFramePath && !input.firstFramePath) throw new Error('lastFrame yêu cầu firstFrame');
  if (input.refImagePaths.length || input.refVideoPaths.length || input.refAudioPaths.length) {
    throw new Error('hailuo không hỗ trợ refImages/refVideos/refAudios; chỉ dùng firstFrame (và lastFrame nếu cần)');
  }
  if (input.mode || input.shotType || input.multiPrompts?.length) throw new Error('mode và tham số multi-shot chỉ được kling hỗ trợ');
  if (input.resolution && !['512p', '720p', '1080p'].includes(input.resolution)) throw new Error('resolution hailuo phải là 512p, 720p hoặc 1080p');
  if (input.resolution === '512p' && !input.firstFramePath) throw new Error('hailuo 512p chỉ hỗ trợ image-to-video');
  if (input.resolution === '512p' && input.lastFramePath) throw new Error('chế độ first-and-last-frame của hailuo không hỗ trợ 512p');
  if ((input.resolution ?? '720p') === '1080p' && input.durationSeconds === 10) throw new Error('hailuo 1080p chỉ hỗ trợ durationSeconds 6; dùng 720p cho 10 giây hoặc đặt durationSeconds là 6');
  if (input.refVideoMode) throw new Error('refVideoMode chỉ được kling hỗ trợ');
  rejectSeedanceOptions(input);
  if (input.promptOptimizer !== undefined && typeof input.promptOptimizer !== 'boolean') throw new Error('promptOptimizer phải là boolean');
  if (input.fastPretreatment !== undefined && typeof input.fastPretreatment !== 'boolean') throw new Error('fastPretreatment phải là boolean');
  if (input.fastPretreatment === true && input.promptOptimizer === false) throw new Error('fastPretreatment yêu cầu promptOptimizer là true (hoặc bỏ qua)');
  return input;
}

function validateSeedance(input: ValidVideoRequest): ValidVideoRequest {
  const model = input.model; // seedance2 or byteplus — same Ark Seedance API/constraints
  if (!input.prompt) throw new Error('prompt là bắt buộc');
  if (input.durationSeconds < 2 || input.durationSeconds > 15) throw new Error(`${model} durationSeconds phải từ 2 đến 15`);
  if (!['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', 'adaptive'].includes(input.ratio)) throw new Error(`${model} không hỗ trợ ratio ${input.ratio}`);
  if (input.resolution && !['480p', '720p', '1080p', '4k'].includes(input.resolution)) throw new Error(`${model} resolution phải là 480p, 720p, 1080p hoặc 4k`);
  if (input.lastFramePath && !input.firstFramePath) throw new Error('lastFrame yêu cầu firstFrame');
  if (input.lastFramePath && (input.refImagePaths.length || input.refVideoPaths.length || input.refAudioPaths.length)) throw new Error(`${model} không thể kết hợp chế độ lastFrame với references`);
  if (input.refImagePaths.length > 9 || input.refVideoPaths.length > 3 || input.refAudioPaths.length > 3) throw new Error(`${model} đã vượt quá giới hạn reference`);
  if (input.refAudioPaths.length && !input.firstFramePath && !input.refImagePaths.length && !input.refVideoPaths.length) throw new Error(`${model} cần visual reference khi dùng audio references`);
  if (input.shotType || input.multiPrompts?.length) throw new Error('tham số multi-shot chỉ được kling hỗ trợ');
  if (input.refVideoMode) throw new Error('refVideoMode chỉ được kling hỗ trợ');
  if (input.promptOptimizer !== undefined || input.fastPretreatment !== undefined) throw new Error('promptOptimizer/fastPretreatment chỉ được hailuo hỗ trợ');
  validateSeedanceOptions(input);
  return input;
}

function validateKlingShots(input: ValidVideoRequest): void {
  if (input.shotType !== 'customize') {
    if (input.multiPrompts?.length) throw new Error('kling multiPrompts yêu cầu shotType=customize');
    if (!input.prompt) throw new Error('prompt là bắt buộc');
    return;
  }
  if (input.prompt) throw new Error('hãy bỏ prompt khi dùng kling customize; dùng multiPrompts');
  const shots = input.multiPrompts ?? [];
  if (shots.length < 2 || shots.length > 6) throw new Error('kling customize yêu cầu từ 2 đến 6 multiPrompts');
  let total = 0;
  shots.forEach((shot, index) => {
    const duration = videoSeconds(shot.duration, 0);
    if (shot.index !== index + 1) throw new Error('chỉ số kling multiPrompt phải liên tiếp từ 1');
    if (!shot.prompt?.trim() || shot.prompt.length > 512) throw new Error('mỗi kling multiPrompt yêu cầu prompt dài tối đa 512 ký tự');
    if (duration < 1) throw new Error('duration của mỗi kling multiPrompt phải ít nhất 1 giây');
    total += duration;
  });
  if (total !== input.durationSeconds) throw new Error('tổng duration của kling multiPrompt phải bằng durationSeconds');
}

function validateKling(input: ValidVideoRequest): ValidVideoRequest {
  if (input.durationSeconds < 3 || input.durationSeconds > 15) throw new Error('durationSeconds của kling phải từ 3 đến 15');
  if (!['16:9', '9:16', '1:1'].includes(input.ratio)) throw new Error(`kling không hỗ trợ ratio ${input.ratio}`);
  if (input.lastFramePath && !input.firstFramePath) throw new Error('lastFrame yêu cầu firstFrame');
  if (input.refAudioPaths.length) throw new Error('kling không hỗ trợ refAudios');
  if (input.refVideoPaths.length > 1) throw new Error('kling nhận tối đa 1 reference video');
  if (input.refVideoMode && input.refVideoMode !== 'feature' && input.refVideoMode !== 'base') {
    throw new Error('refVideoMode của kling phải là feature hoặc base');
  }
  if (input.refVideoMode && !input.refVideoPaths.length) throw new Error('refVideoMode yêu cầu refVideos');
  const imageCount = Number(Boolean(input.firstFramePath)) + Number(Boolean(input.lastFramePath)) + input.refImagePaths.length;
  const maxImages = input.refVideoPaths.length ? 4 : 7;
  if (imageCount > maxImages) throw new Error(input.refVideoPaths.length ? 'kling có refVideos nhận tối đa 4 image (first/last/refImages)' : 'kling nhận tối đa 7 image');
  if (input.resolution && !['720p', '1080p'].includes(input.resolution)) throw new Error('resolution của kling phải là 720p hoặc 1080p');
  if (input.mode && input.resolution && (input.mode === 'pro') !== (input.resolution === '1080p')) throw new Error('mode và resolution của kling xung đột');
  if (input.promptOptimizer !== undefined || input.fastPretreatment !== undefined) throw new Error('promptOptimizer/fastPretreatment chỉ được hailuo hỗ trợ');
  rejectSeedanceOptions(input);
  validateKlingShots(input);
  if (input.prompt.length > 2500) throw new Error('prompt kling dài tối đa 2500 ký tự');
  return input;
}

/** xAI Grok Imagine Video (text-to-video): 1–15s, its own ratio set, 480/720/1080p.
 * Audio is always generated; no reference or editing options in this integration. */
function validateGrok(input: ValidVideoRequest): ValidVideoRequest {
  if (!input.prompt || input.prompt.length > 4000) throw new Error('prompt grok-imagine-video là bắt buộc và dài tối đa 4000 ký tự');
  if (input.durationSeconds < 1 || input.durationSeconds > 15) throw new Error('durationSeconds của grok-imagine-video phải từ 1 đến 15');
  if (!['16:9', '9:16', '1:1', '4:3', '3:4', '3:2', '2:3'].includes(input.ratio)) {
    throw new Error(`grok-imagine-video không hỗ trợ ratio ${input.ratio}`);
  }
  if (input.resolution && !['480p', '720p', '1080p'].includes(input.resolution)) throw new Error('resolution grok-imagine-video phải là 480p, 720p hoặc 1080p');
  if (input.firstFramePath || input.lastFramePath || input.refImagePaths.length || input.refVideoPaths.length || input.refAudioPaths.length) {
    throw new Error('grok-imagine-video chỉ hỗ trợ text-to-video; không hỗ trợ references và frames');
  }
  if (input.mode || input.shotType || input.multiPrompts?.length || input.refVideoMode) {
    throw new Error('grok-imagine-video không hỗ trợ tùy chọn multi-shot và editing');
  }
  rejectSeedanceOptions(input);
  if (input.promptOptimizer !== undefined || input.fastPretreatment !== undefined) {
    throw new Error('promptOptimizer/fastPretreatment chỉ được hailuo hỗ trợ');
  }
  return input;
}

const OFOX_UNSUPPORTED_ARK_KEYS = ['cameraFixed', 'watermark', 'returnLastFrame', 'executionExpiresAfter', 'priority'] as const;

/** OFox multi-model video gateway: the API validates duration, resolution and
 * vendor per model with a clear 400 before any task is created, so only
 * cross-provider limits and unsupported options are enforced here. Text,
 * first/last-frame and image-reference modes are wired; frame anchors and
 * references are mutually exclusive at the API level (400 references_conflict),
 * enforced locally before any paid submission. */
function validateOfox(input: ValidVideoRequest): ValidVideoRequest {
  if (!input.prompt || input.prompt.length > 4000) throw new Error('prompt ofox là bắt buộc và dài tối đa 4000 ký tự');
  if (input.durationSeconds < 2 || input.durationSeconds > 30) throw new Error('durationSeconds của ofox phải từ 2 đến 30 (API áp dụng giới hạn theo model)');
  if (!['16:9', '9:16', '1:1', '4:3', '3:4', '3:2', '2:3', '21:9', '9:21'].includes(input.ratio)) {
    throw new Error(`ofox không hỗ trợ ratio ${input.ratio}`);
  }
  if (input.resolution && !['480p', '720p', '1080p'].includes(input.resolution)) throw new Error('resolution của ofox phải là 480p, 720p hoặc 1080p (API sẽ áp dụng hỗ trợ theo model)');
  if (input.lastFramePath && !input.firstFramePath) throw new Error('lastFrame yêu cầu firstFrame');
  if ((input.firstFramePath || input.lastFramePath) && input.refImagePaths.length) {
    throw new Error('frame anchor của ofox (firstFrame/lastFrame) không thể kết hợp với refImages');
  }
  if (input.refImagePaths.length > 9) throw new Error('ofox nhận tối đa 9 refImages');
  if (input.refVideoPaths.length || input.refAudioPaths.length) {
    throw new Error('ofox chưa tích hợp refVideos/refAudios; hãy dùng refImages hoặc firstFrame/lastFrame');
  }
  if (input.mode || input.shotType || input.multiPrompts?.length || input.refVideoMode) {
    throw new Error('ofox không hỗ trợ tùy chọn multi-shot và editing');
  }
  for (const key of OFOX_UNSUPPORTED_ARK_KEYS) {
    if (input[key] !== undefined) throw new Error(`${key} chỉ được seedance2/byteplus hỗ trợ`);
  }
  if (input.generateAudio !== undefined && typeof input.generateAudio !== 'boolean') throw new Error('generateAudio phải là boolean');
  if (input.seed !== undefined && !Number.isSafeInteger(input.seed)) throw new Error('seed phải là số nguyên an toàn');
  if (input.promptOptimizer !== undefined || input.fastPretreatment !== undefined) {
    throw new Error('promptOptimizer/fastPretreatment chỉ được hailuo hỗ trợ');
  }
  return input;
}

export function validateVideoRequest(input: VideoRequest): ValidVideoRequest {
  if (input.model === 'fal') {
    if (!input.falModel?.trim()) throw new Error('Hãy chọn model video Fal trong Cài đặt hoặc chỉ định falModel');
    for (const key of ['mode', 'refVideoMode', 'promptOptimizer', 'fastPretreatment', 'seed', 'cameraFixed', 'watermark', 'returnLastFrame', 'executionExpiresAfter', 'priority', 'multiPrompts', 'shotType'] as const) {
      if (input[key] !== undefined) throw new Error(`${key} không được tích hợp video Fal hỗ trợ`);
    }
    const normalized = common(input, 'fal');
    buildFalCatalogVideoRequest(falVideoCatalogInput(normalized));
    return normalized;
  }
  if (input.model !== 'seedance2' && input.model !== 'kling' && input.model !== 'hailuo' && input.model !== 'byteplus' && input.model !== 'grok-imagine-video' && input.model !== 'ofox') {
    throw new Error('model phải là seedance2, kling, hailuo, byteplus, grok-imagine-video, ofox hoặc fal');
  }
  if (input.model === 'hailuo' && input.ratio !== undefined) throw new Error('hailuo không nhận ratio; framing sẽ theo first frame nếu có');
  const normalized = common(input, input.model);
  if (normalized.model === 'hailuo') return validateHailuo(normalized);
  if (normalized.model === 'kling') return validateKling(normalized);
  if (normalized.model === 'grok-imagine-video') return validateGrok(normalized);
  if (normalized.model === 'ofox') return validateOfox(normalized);
  return validateSeedance(normalized);
}

/** Shared pure mapping: validation and submission must send identical settings. */
export function falVideoCatalogInput(input: ValidVideoRequest) {
  return {
    falModel: input.falModel!, prompt: input.prompt,
    duration: input.durationSpecified ? input.durationSeconds : undefined,
    aspectRatio: input.ratioSpecified ? input.ratio : undefined, resolution: input.resolution,
    imageUrls: input.refImagePaths, videoUrls: input.refVideoPaths, audioUrls: input.refAudioPaths,
    firstFrame: input.firstFramePath, lastFrame: input.lastFramePath, generateAudio: input.generateAudio,
  };
}

/** Restore omitted model defaults when revalidating a persisted Fal job. */
export function validateSavedVideoRequest(saved: VideoRequest & { durationSpecified?: boolean; ratioSpecified?: boolean }): ValidVideoRequest {
  return validateVideoRequest(saved.model === 'fal' ? {
    ...saved,
    durationSeconds: saved.durationSpecified === false ? undefined : saved.durationSeconds,
    ratio: saved.ratioSpecified === false ? undefined : saved.ratio,
  } : saved);
}
