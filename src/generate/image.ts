import type { MediaAsset, TimelineState } from '../editor/types';
import { localizedCatalogText } from '../i18n/locale';

export interface SubmitImageArgs {
  model?: 'gpt-image-2' | 'nano-banana' | 'image-01' | 'wavespeed' | 'byteplus' | 'grok-imagine' | 'fal';
  /** Explicit curated Fal model ID; omitted uses the saved Fal default. */
  falModel?: string;
  prompt: string;
  name: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3' | '4:5' | '5:4' | '21:9' | 'auto' | '4:1' | '1:4' | '8:1' | '1:8';
  imageSize?: '512px' | '0.5K' | '1K' | '2K' | '4K';
  /** GPT Image 2 or MiniMax image-01 custom dimensions. Must be provided together. */
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  referenceAssetIds?: string[];
  /** GPT Image edit mask; transparent pixels are replaced. */
  maskAssetId?: string;
  count?: number;
  /** GPT Image only. */
  background?: 'transparent' | 'opaque' | 'auto';
  /** GPT Image only. */
  moderation?: 'low' | 'auto';
  /** GPT Image edits only. */
  inputFidelity?: 'low' | 'high';
  /** GPT Image output encoding. */
  outputFormat?: 'png' | 'jpeg' | 'webp';
  /** GPT Image JPEG/WebP compression, 0–100. */
  outputCompression?: number;
  /** MiniMax image-01 only. */
  seed?: number;
  /** MiniMax image-01 only: prompt_optimizer (official default false). */
  promptOptimizer?: boolean;
}

interface ImageResponse {
  paths?: string[];
  width?: number;
  height?: number;
  error?: string;
}

const newId = () => crypto.randomUUID?.() ?? `generated_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export async function submitImage(args: SubmitImageArgs, state: TimelineState): Promise<MediaAsset[]> {
  const prompt = args.prompt.trim();
  const name = args.name.trim();
  if (!prompt) throw new Error(localizedCatalogText('prompt is required', '需要填写提示词', undefined, 'Cần nhập lời nhắc'));
  if (!name) throw new Error(localizedCatalogText('name is required', '需要填写名称', undefined, 'Cần nhập tên'));
  const referencePaths = (args.referenceAssetIds ?? []).map((id) => {
    const asset = (state.assets ?? []).find((candidate) => candidate.id === id);
    if (!asset) throw new Error(localizedCatalogText(`reference asset not found: ${id}`, `未找到参考素材：${id}`, undefined, `Không tìm thấy tệp tham chiếu: ${id}`));
    if (asset.kind !== 'image') throw new Error(localizedCatalogText(`reference asset is not an image: ${id}`, `参考素材不是图片：${id}`, undefined, `Tệp tham chiếu không phải hình ảnh: ${id}`));
    return asset.src;
  });
  const maskPath = args.maskAssetId
    ? (() => {
      const asset = (state.assets ?? []).find((candidate) => candidate.id === args.maskAssetId);
      if (!asset) throw new Error(localizedCatalogText(`mask asset not found: ${args.maskAssetId}`, `未找到蒙版素材：${args.maskAssetId}`, undefined, `Không tìm thấy tệp mặt nạ: ${args.maskAssetId}`));
      if (asset.kind !== 'image') throw new Error(localizedCatalogText(`mask asset is not an image: ${args.maskAssetId}`, `蒙版素材不是图片：${args.maskAssetId}`, undefined, `Tệp mặt nạ không phải hình ảnh: ${args.maskAssetId}`));
      return asset.src;
    })()
    : undefined;

  const response = await fetch('/generate/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...args, prompt, name, referencePaths, maskPath }),
  });
  const result = await response.json().catch(() => ({})) as ImageResponse;
  if (!response.ok) throw new Error(result.error ?? localizedCatalogText(`image generation failed (${response.status})`, `图片生成失败（${response.status}）`, undefined, `Tạo hình ảnh thất bại (${response.status})`));
  if (!result.paths?.length) throw new Error(localizedCatalogText('image generation returned no assets', '图片生成未返回素材', undefined, 'Tạo hình ảnh không trả về tệp'));
  // a still defaults to 3s (CapCut-style photo default) — 5s felt too long on
  // a fresh timeline; trim/extend per clip as needed.
  const durationInFrames = Math.round(state.fps * 3);
  return result.paths.map((src, index) => ({
    id: newId(),
    name: result.paths!.length === 1 ? name : `${name} ${index + 1}`,
    kind: 'image',
    src,
    durationInFrames,
    width: result.width,
    height: result.height,
  }));
}
