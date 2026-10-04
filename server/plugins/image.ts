import { generateFalCatalogImage } from './fal-client.ts';
import { getKey } from '../keystore.ts';
import { buildFalCatalogImageRequest, type FalCatalogInput } from './fal-catalog-input.ts';
import { proxyDispatcher } from '../outbound-proxy.ts';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import type { Plugin } from 'vite';
import { generateImage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { uploadDir } from '../media-dir.ts';
import { localized } from '../ui-locale.ts';
import { fetchGeneratedResult } from './result-download.ts';
import {
  callByteplusImageProvider,
  callGeminiProvider,
  callGrokImageProvider,
  callMinimaxProvider,
  callWaveSpeedProvider,
  imageMimeType,
  imageProviderError,
  localImageAssetPath,
  type ProviderImage,
} from './image-provider-clients.ts';
// Proxy-aware fetch: attaches the configured outbound proxy (keystore
// PROXY_URL or HTTPS_PROXY/HTTP_PROXY env) via undici dispatcher.
type FetchInit = Parameters<typeof fetch>[1] & { dispatcher?: unknown };
const fetchWithProxy = (url: RequestInfo | URL, init?: FetchInit): Promise<Response> =>
  fetch(url, { ...init, dispatcher: proxyDispatcher() } as RequestInit);

const ASPECTS = new Set(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '4:5', '5:4', '21:9']);
const SIZES = new Set(['512px', '1K', '2K', '4K']);
const QUALITIES = new Set(['low', 'medium', 'high', 'auto']);
const OUTPUT_FORMATS = new Set(['png', 'jpeg', 'webp']);
const BACKGROUNDS = new Set(['transparent', 'opaque', 'auto']);
const MODERATIONS = new Set(['low', 'auto']);
const INPUT_FIDELITIES = new Set(['low', 'high']);

interface ImagePluginOptions {
  baseUrl: string;
  apiKey: string;
  geminiBaseUrl: string;
  geminiApiKey: string;
  geminiModel: string;
  minimaxBaseUrl: string;
  minimaxApiKey: string;
  minimaxModel: string;
  waveSpeedBaseUrl: string;
  waveSpeedApiKey: string;
  waveSpeedModel: string;
  byteplusBaseUrl: string;
  byteplusApiKey: string;
  byteplusModel: string;
  xaiBaseUrl: string;
  xaiApiKey: string;
  xaiImageModel: string;
}

interface ImageRequest {
  model?: string;
  falModel?: string;
  prompt?: string;
  aspectRatio?: string;
  imageSize?: string;
  width?: number;
  height?: number;
  quality?: string;
  count?: number;
  referencePaths?: string[];
  maskPath?: string;
  background?: string;
  moderation?: string;
  inputFidelity?: string;
  outputFormat?: string;
  outputCompression?: number;
  seed?: number;
  /** MiniMax image-01 only: prompt_optimizer (official default false). */
  promptOptimizer?: boolean;
}

export interface ValidImageRequest {
  model: 'gpt-image-2' | 'nano-banana' | 'image-01' | 'wavespeed' | 'byteplus' | 'grok-imagine' | 'fal';
  falModel?: string;
  falInput?: FalCatalogInput;
  prompt: string;
  aspectRatio?: string;
  imageSize: string;
  width?: number;
  height?: number;
  quality: string;
  count: number;
  referencePaths: string[];
  maskPath?: string;
  background?: 'transparent' | 'opaque' | 'auto';
  moderation?: 'low' | 'auto';
  inputFidelity?: 'low' | 'high';
  outputFormat: 'png' | 'jpeg' | 'webp';
  outputCompression?: number;
  seed?: number;
  promptOptimizer?: boolean;
}

function customDimensions(input: ImageRequest, model: ValidImageRequest['model']) {
  const width = input.width;
  const height = input.height;
  if ((width == null) !== (height == null)) throw new Error('width và height phải được cung cấp cùng nhau');
  if (width == null || height == null) return {};
  if (input.aspectRatio != null) throw new Error('width/height tùy chỉnh không thể dùng cùng aspectRatio');
  if (model === 'nano-banana') throw new Error('nano-banana không hỗ trợ width/height tùy chỉnh');
  if (model === 'grok-imagine') throw new Error('grok-imagine không hỗ trợ width/height tùy chỉnh');
  if (!Number.isInteger(width) || !Number.isInteger(height)) throw new Error('width và height phải là số nguyên');
  const [minimum, maximum, divisor] = model === 'image-01' ? [512, 2048, 8] : [512, 3840, 16];
  if (width < minimum || width > maximum || height < minimum || height > maximum) {
    throw new Error(`width và height của ${model} phải nằm trong khoảng ${minimum} đến ${maximum}`);
  }
  if (width % divisor || height % divisor) throw new Error(`width và height của ${model} phải chia hết cho ${divisor}`);
  const aspect = width / height;
  if (model === 'gpt-image-2' && (aspect < 1 / 3 || aspect > 3)) throw new Error('aspect ratio tùy chỉnh của gpt-image-2 phải nằm trong khoảng 1:3 đến 3:1');
  return { width, height };
}

function validateGptOptions(input: ImageRequest, hasReferences: boolean) {
  if (input.background != null && !BACKGROUNDS.has(input.background)) throw new Error('background phải là transparent, opaque hoặc auto');
  if (input.moderation != null && !MODERATIONS.has(input.moderation)) throw new Error('moderation phải là low hoặc auto');
  if (input.inputFidelity != null && !INPUT_FIDELITIES.has(input.inputFidelity)) throw new Error('inputFidelity phải là low hoặc high');
  if (input.inputFidelity != null && !hasReferences) throw new Error('inputFidelity yêu cầu ảnh tham chiếu');
  if (input.maskPath != null && !hasReferences) throw new Error('maskPath yêu cầu ảnh tham chiếu');
  if (input.outputFormat != null && !OUTPUT_FORMATS.has(input.outputFormat)) throw new Error('outputFormat phải là png, jpeg hoặc webp');
  if (input.outputCompression != null && (!Number.isInteger(input.outputCompression) || input.outputCompression < 0 || input.outputCompression > 100)) {
    throw new Error('outputCompression phải là số nguyên từ 0 đến 100');
  }
  if (input.outputCompression != null && (input.outputFormat ?? 'png') === 'png') {
    throw new Error('outputCompression yêu cầu outputFormat là jpeg hoặc webp');
  }
}

function rejectForeignImageOptions(input: ImageRequest, model: ValidImageRequest['model']) {
  if (model !== 'gpt-image-2') {
    const gptOnly = [input.maskPath, input.background, input.moderation, input.inputFidelity, input.outputFormat, input.outputCompression, input.quality];
    if (gptOnly.some((value) => value != null)) throw new Error(`Các tùy chọn GPT Image không được ${model} hỗ trợ`);
  }
  if (model !== 'image-01' && input.promptOptimizer != null) {
    throw new Error('promptOptimizer chỉ được image-01 (MiniMax) hỗ trợ');
  }
  if (model !== 'image-01' && input.seed != null) throw new Error('seed chỉ được image-01 (MiniMax) hỗ trợ');
}

/** Pure request validation — exported for unit checks. */
export function validateImageRequest(input: ImageRequest): ValidImageRequest {
  const model = String(input.model ?? 'gpt-image-2');
  if (model === 'fal') {
    if (!input.falModel?.trim()) throw new Error('Hãy chọn model ảnh Fal trong Cài đặt hoặc chỉ định falModel');
    for (const key of ['width', 'height', 'quality', 'maskPath', 'background', 'moderation', 'inputFidelity', 'outputFormat', 'outputCompression', 'seed', 'promptOptimizer'] as const) {
      if (input[key] !== undefined) throw new Error(`${key} không được tích hợp ảnh Fal hỗ trợ`);
    }
    const falInput: FalCatalogInput = {
      falModel: input.falModel, prompt: String(input.prompt ?? '').trim(), count: input.count ?? 1,
      aspectRatio: input.aspectRatio, resolution: input.imageSize === '512px' ? '0.5K' : input.imageSize,
      imageUrls: input.referencePaths ?? [],
    };
    buildFalCatalogImageRequest(falInput);
    return { model, falModel: input.falModel, falInput, prompt: falInput.prompt, count: input.count ?? 1,
      referencePaths: input.referencePaths ?? [], aspectRatio: input.aspectRatio ?? '16:9',
      imageSize: input.imageSize ?? '1K', quality: 'high', outputFormat: 'png' };
  }
  if (model !== 'gpt-image-2' && model !== 'nano-banana' && model !== 'image-01' && model !== 'wavespeed' && model !== 'byteplus' && model !== 'grok-imagine') {
    throw new Error(`model không được hỗ trợ: ${model}`);
  }
  const prompt = String(input.prompt ?? '').trim();
  if (!prompt) throw new Error('cần có prompt');
  const dimensions = customDimensions(input, model);
  const aspectRatio = dimensions.width ? undefined : String(input.aspectRatio ?? '16:9');
  const imageSize = String(input.imageSize ?? '1K');
  const quality = String(input.quality ?? 'high');
  const count = input.count ?? 1;
  if (!Number.isInteger(count) || count < 1 || count > 10) throw new Error('count phải là số nguyên từ 1 đến 10');
  if (aspectRatio && !ASPECTS.has(aspectRatio)) throw new Error(`aspect ratio không được hỗ trợ: ${aspectRatio}`);
  if (!SIZES.has(imageSize)) throw new Error(`kích thước ảnh không được hỗ trợ: ${imageSize}`);
  if (!QUALITIES.has(quality)) throw new Error(`quality không được hỗ trợ: ${quality}`);
  const referencePaths = input.referencePaths ?? [];
  const referenceLimit = model === 'nano-banana' ? 14 : model === 'gpt-image-2' ? 16 : model === 'image-01' ? 1 : 0;
  // wavespeed and byteplus (Seedream) are text-to-image only in this integration; no reference-image support yet.
  if (referencePaths.length > referenceLimit) {
    throw new Error(`quá nhiều ảnh tham chiếu cho ${model}`);
  }
  rejectForeignImageOptions(input, model);
  if (model === 'image-01') {
    if (prompt.length > 1500) throw new Error('prompt image-01 dài tối đa 1500 ký tự');
    if (count > 9) throw new Error('image-01 hỗ trợ tối đa 9 ảnh mỗi lần gọi');
    if (aspectRatio === '4:5' || aspectRatio === '5:4') throw new Error(`image-01 không hỗ trợ aspect ratio ${aspectRatio}`);
    if (input.promptOptimizer !== undefined && typeof input.promptOptimizer !== 'boolean') {
      throw new Error('promptOptimizer phải là boolean');
    }
    if (input.seed != null && !Number.isSafeInteger(input.seed)) throw new Error('seed phải là số nguyên an toàn');
  } else if (model === 'gpt-image-2') {
    if (prompt.length > 32_000) throw new Error('prompt gpt-image-2 dài tối đa 32000 ký tự');
    if (imageSize === '512px') throw new Error('imageSize của gpt-image-2 phải là 1K, 2K hoặc 4K');
    validateGptOptions(input, referencePaths.length > 0);
  } else if (model === 'grok-imagine') {
    if (count > 4) throw new Error('grok-imagine hỗ trợ tối đa 4 ảnh mỗi lần gọi');
    if (imageSize === '512px' || imageSize === '4K') throw new Error('imageSize của grok-imagine phải là 1K hoặc 2K');
    if (aspectRatio && !['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'].includes(aspectRatio)) {
      throw new Error(`grok-imagine không hỗ trợ aspect ratio ${aspectRatio}`);
    }
    if (prompt.length > 8000) throw new Error('prompt grok-imagine dài tối đa 8000 ký tự');
  }
  return {
    model,
    prompt,
    aspectRatio,
    imageSize,
    ...dimensions,
    quality,
    count,
    referencePaths,
    maskPath: input.maskPath,
    background: input.background as ValidImageRequest['background'],
    moderation: input.moderation as ValidImageRequest['moderation'],
    inputFidelity: input.inputFidelity as ValidImageRequest['inputFidelity'],
    outputFormat: (input.outputFormat ?? 'png') as ValidImageRequest['outputFormat'],
    outputCompression: input.outputCompression,
    seed: input.seed,
    promptOptimizer: input.promptOptimizer,
  };
}

async function readJson(req: IncomingMessage): Promise<ImageRequest> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > 1_000_000) throw new Error('thân yêu cầu quá lớn');
    chunks.push(buf);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as ImageRequest;
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function dimensions(aspectRatio: string, imageSize: string): [number, number] {
  const [rw, rh] = aspectRatio.split(':').map(Number);
  const longEdge = imageSize === '4K' ? 3840 : imageSize === '2K' ? 2048 : imageSize === '512px' ? 512 : 1536;
  const landscape = rw >= rh;
  const width = landscape ? longEdge : Math.round(longEdge * rw / rh / 16) * 16;
  const height = landscape ? Math.round(longEdge * rh / rw / 16) * 16 : longEdge;
  return [width, height];
}

interface GptImageInput {
  model: string;
  prompt: string;
  quality: string;
  count: number;
  size: string;
  referencePaths: string[];
  maskPath?: string;
  background?: string;
  moderation?: string;
  inputFidelity?: string;
  outputFormat: string;
  outputCompression?: number;
}

function appendGptOptions(target: FormData | Record<string, unknown>, body: GptImageInput) {
  const set = (key: string, value: unknown) => {
    if (value == null) return;
    if (target instanceof FormData) target.set(key, String(value));
    else target[key] = value;
  };
  set('background', body.background);
  set('moderation', body.moderation);
  set('input_fidelity', body.inputFidelity);
  set('output_format', body.outputFormat);
  set('output_compression', body.outputCompression);
}

async function appendImageFile(form: FormData, field: string, path: string, filename: string) {
  const file = localImageAssetPath(path);
  const bytes = await readFile(file);
  const ext = extname(file).slice(1).toLowerCase() || 'png';
  form.append(field, new Blob([bytes], { type: imageMimeType(file) }), `${filename}.${ext}`);
}

/** OpenAI Images via the AI SDK for the plain text-to-image path — the SDK
 * owns body construction and error shapes; gpt options map onto the openai
 * provider metadata (quality/background/moderation/input_fidelity/
 * output_format/output_compression). The edits path (reference images +
 * mask) keeps the hand-rolled multipart call below. */
async function callOpenaiViaSdk(baseUrl: string, apiKey: string, body: GptImageInput): Promise<ProviderImage[]> {
  // The AI SDK appends the API path directly to baseURL (no implicit version
  // segment). The legacy hand-rolled call always added /v1, and the official
  // default baseURL carries it too — mirror that for custom endpoints.
  const base = /\/v\d+\/?$/i.test(baseUrl) ? baseUrl : `${baseUrl.replace(/\/+$/, '')}/v1`;
  const openai = createOpenAI({ apiKey, baseURL: base });
  const { images } = await generateImage({
    model: openai.image(body.model),
    prompt: body.prompt,
    n: body.count,
    size: body.size as `${number}x${number}`,
    maxRetries: 0,
    providerOptions: {
      openai: {
        quality: body.quality,
        ...(body.background ? { background: body.background } : {}),
        ...(body.moderation ? { moderation: body.moderation } : {}),
        ...(body.inputFidelity ? { inputFidelity: body.inputFidelity } : {}),
        ...(body.outputFormat ? { outputFormat: body.outputFormat } : {}),
        ...(body.outputCompression != null ? { outputCompression: body.outputCompression } : {}),
      },
    },
  });
  return images.map((image) => ({ b64_json: image.base64 }));
}

async function callProvider(baseUrl: string, apiKey: string, body: GptImageInput): Promise<ProviderImage[]> {
  if (!body.referencePaths.length) return callOpenaiViaSdk(baseUrl, apiKey, body);
  const endpoint = '/v1/images/edits';
  let requestBody: string | FormData;
  let headers: Record<string, string> = { Authorization: `Bearer ${apiKey}` };

  if (body.referencePaths.length) {
    const form = new FormData();
    form.set('model', body.model);
    form.set('prompt', body.prompt);
    form.set('quality', body.quality);
    form.set('size', body.size);
    form.set('n', String(body.count));
    appendGptOptions(form, body);
    for (const path of body.referencePaths) {
      await appendImageFile(form, 'image[]', path, 'reference');
    }
    if (body.maskPath) await appendImageFile(form, 'mask', body.maskPath, 'mask');
    requestBody = form;
  } else {
    headers = { ...headers, 'Content-Type': 'application/json' };
    const json: Record<string, unknown> = { model: body.model, prompt: body.prompt, quality: body.quality, size: body.size, n: body.count };
    appendGptOptions(json, body);
    requestBody = JSON.stringify(json);
  }

  const response = await fetchWithProxy(`${baseUrl.replace(/\/$/, '')}${endpoint}`, { method: 'POST', headers, body: requestBody });
  if (!response.ok) throw new Error(await imageProviderError(response));
  const result = await response.json() as { data?: ProviderImage[] };
  if (!result.data?.length) throw new Error('image provider không trả về ảnh nào');
  return result.data;
}

const SAVED_IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp']);

async function saveImage(image: ProviderImage, fallbackExt: string): Promise<string> {
  let bytes: Buffer;
  let ext = fallbackExt === 'jpeg' ? 'jpg' : fallbackExt;
  if (image.b64_json) {
    bytes = Buffer.from(image.b64_json, 'base64');
    if (bytes[0] === 0xff && bytes[1] === 0xd8) ext = 'jpg';
    else if (bytes[0] === 0x89 && bytes[1] === 0x50) ext = 'png';
    else if (bytes.slice(0, 4).toString('latin1') === 'RIFF') ext = 'webp';
  } else if (image.url) {
    const response = await fetchGeneratedResult(image.url, 'image');
    bytes = Buffer.from(await response.arrayBuffer());
    const urlExt = extname(new URL(image.url).pathname).slice(1).toLowerCase();
    if (SAVED_IMAGE_EXTS.has(urlExt)) ext = urlExt;
  } else throw new Error('image provider không trả về bytes hoặc URL');

  if (!bytes.length) throw new Error('image provider trả về ảnh rỗng');
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(join(dir, filename), bytes);
  return `/media/uploads/${filename}`;
}

export function imageGenerationPlugin(options: ImagePluginOptions): Plugin {
  return {
    name: 'openchatcut-image-generation',
    configureServer(server) {
      server.middlewares.use('/generate/image', async (req, res) => {
        if (req.method !== 'POST') { sendJson(res, 405, { error: 'method không được phép — hãy dùng POST' }); return; }
        try {
          const raw = await readJson(req);
          if (raw.model === 'fal' && !raw.falModel) raw.falModel = getKey('FAL_IMAGE_MODEL').trim() || undefined;
          const input = validateImageRequest(raw);
          const {
            model, prompt, aspectRatio, imageSize, quality, count, referencePaths, maskPath,
            background, moderation, inputFidelity, outputFormat, outputCompression,
            seed, promptOptimizer,
          } = input;
          const [width, height] = input.width != null && input.height != null
            ? [input.width, input.height]
            : model === 'fal' ? [0, 0] : dimensions(aspectRatio!, imageSize);
          let images: ProviderImage[];
          if (model === 'fal') {
            images = await generateFalCatalogImage(input.falInput!);
          } else if (model === 'nano-banana') {
            if (!options.geminiApiKey) throw new Error('Nano Banana chưa được cấu hình. Hãy đặt GEMINI_API_KEY trong .env.local.');
            if (!aspectRatio) throw new Error('Nano Banana yêu cầu aspectRatio');
            images = await callGeminiProvider(options.geminiBaseUrl, options.geminiApiKey, options.geminiModel, {
              prompt, count, aspectRatio, imageSize, referencePaths,
            });
          } else if (model === 'image-01') {
            if (!options.minimaxApiKey) throw new Error(localized({ zh: 'MiniMax is not configured. Set MINIMAX_API_KEY in .env.local or 设置面板.', en: 'MiniMax is not configured. Set MINIMAX_API_KEY in .env.local or Settings.', vi: 'Chưa cấu hình MiniMax. Hãy đặt MINIMAX_API_KEY trong .env.local hoặc phần Cài đặt.' }));
            // aspect_ratio is passed straight through; imageSize/quality do not apply to MiniMax.
            // Actual MiniMax model id comes from settings (image-01 / image-01-live).
            images = await callMinimaxProvider(options.minimaxBaseUrl, options.minimaxApiKey, options.minimaxModel, {
              prompt, count, aspectRatio, width: input.width, height: input.height,
              seed, referencePaths, promptOptimizer,
            });
          } else if (model === 'wavespeed') {
            if (!options.waveSpeedApiKey) throw new Error('WaveSpeed chưa được cấu hình. Hãy đặt WAVESPEED_API_KEY trong .env.local.');
            images = await callWaveSpeedProvider(options.waveSpeedBaseUrl, options.waveSpeedApiKey, options.waveSpeedModel, {
              prompt, count, width, height,
            });
          } else if (model === 'byteplus') {
            if (!options.byteplusApiKey) throw new Error('BytePlus chưa được cấu hình. Hãy đặt BYTEPLUS_API_KEY trong .env.local.');
            images = await callByteplusImageProvider(options.byteplusBaseUrl, options.byteplusApiKey, options.byteplusModel, {
              prompt, count, width, height,
            });
          } else if (model === 'grok-imagine') {
            images = await callGrokImageProvider(options.xaiBaseUrl, options.xaiApiKey, options.xaiImageModel, {
              prompt, count, aspectRatio, imageSize,
            });
          } else {
            if (!options.apiKey) throw new Error('Tạo hình ảnh chưa được cấu hình. Hãy đặt IMAGE_API_KEY hoặc OPENAI_API_KEY trong .env.local.');
            images = await callProvider(options.baseUrl, options.apiKey, {
              model, prompt, quality, count, size: `${width}x${height}`, referencePaths, maskPath,
              background, moderation, inputFidelity, outputFormat, outputCompression,
            });
          }
          const paths = await Promise.all(images.map((image) => saveImage(image, model === 'gpt-image-2' ? outputFormat : 'png')));
          const reportDimensions = model !== 'image-01' || input.width != null;
          const imageDimensions = model === 'fal'
            ? (images[0].width && images[0].height ? { width: images[0].width, height: images[0].height } : {})
            : reportDimensions ? { width, height } : {};
          sendJson(res, 200, { paths, ...imageDimensions });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const detail = error instanceof Error && error.cause
            ? ` cause=${error.cause instanceof Error ? `${error.cause.name}: ${error.cause.message}` : JSON.stringify(error.cause)}`
            : '';
          server.config.logger.error(`[generate:image] ${message}${detail}`);
          if (!res.headersSent) sendJson(res, 400, { error: message });
        }
      });
    },
  };
}
