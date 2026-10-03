import type { ClipFilters, ClipTransform } from '../../editor/types';
import { FLEX_CROP_EDGES, flexCropAxisSize, flexCropPxToFraction, type FlexCropEdge } from '../../editor/flexCrop';

const finiteNum = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

export const clampNum = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export function parseFiltersArg(raw: unknown): { filters?: ClipFilters; error?: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: 'filters phải là đối tượng {brightness?,contrast?,saturate?,blur?}' };
  }
  const src = raw as Record<string, unknown>;
  const out: ClipFilters = {};
  for (const key of ['brightness', 'contrast', 'saturate', 'blur'] as const) {
    if (src[key] === undefined) continue;
    const n = finiteNum(src[key]);
    if (n === undefined) return { error: `filters.${key} phải là số hữu hạn` };
    if (key === 'blur') {
      if (n < 0 || n > 30) return { error: 'filters.blur phải nằm trong 0..30 (px)' };
      out.blur = Math.round(n * 10) / 10;
    } else {
      if (n < 0 || n > 2) return { error: `filters.${key} phải nằm trong 0..2 (1 = bình thường)` };
      out[key] = Math.round(n * 1000) / 1000;
    }
  }
  if (!Object.keys(out).length) return { error: 'filters cần ít nhất một trong brightness/contrast/saturate/blur' };
  return { filters: out };
}

const CROP_EDGES = FLEX_CROP_EDGES;

const FLEX_CROP_KEYS = ['crop', 'flexCrop', 'flexcrop', 'flex_crop'] as const;

function flexCropRaw(src: Record<string, unknown>): { raw?: unknown; error?: string } {
  const present = FLEX_CROP_KEYS.filter((key) => src[key] !== undefined);
  if (present.length > 1) {
    return { error: 'flex crop: chỉ gửi transform.crop hoặc transform.flexCrop, không gửi cả hai' };
  }
  if (!present.length) return {};
  return { raw: src[present[0]!] };
}

function parseCropArg(
  raw: unknown,
  canvas: { width: number; height: number },
): { crop?: ClipTransform['crop']; clear?: true; error?: string } {
  if (raw === null) return { clear: true };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: 'flex crop phải là null (xóa) hoặc {left?,right?,top?,bottom?} theo pixel composition (transform.crop / transform.flexCrop)' };
  }
  const width = canvas.width;
  const height = canvas.height;
  if (!(width > 0) || !(height > 0)) {
    return { error: 'flex crop cần kích thước canvas dương' };
  }
  const src = raw as Record<string, unknown>;
  const unknown = Object.keys(src).filter((key) => !CROP_EDGES.includes(key as FlexCropEdge));
  if (unknown.length) return { error: `Trường flex crop không xác định: ${unknown.join(', ')}` };
  const crop: NonNullable<ClipTransform['crop']> = {};
  for (const edge of CROP_EDGES) {
    if (src[edge] === undefined) continue;
    const n = finiteNum(src[edge]);
    const axis = flexCropAxisSize(edge, width, height);
    if (n === undefined || n < 0 || n > axis) {
      return { error: `flex crop ${edge} phải nằm trong 0..${axis} (pixel composition)` };
    }
    crop[edge] = flexCropPxToFraction(n, axis);
  }
  if (!Object.keys(crop).length) {
    return { error: 'flex crop cần ít nhất một trong left/right/top/bottom, hoặc null để xóa' };
  }
  return { crop };
}

export function parseTransformArg(
  raw: unknown,
  canvas: { width: number; height: number } = { width: 0, height: 0 },
): {
  transform?: ClipTransform;
  cropClear?: boolean;
  error?: string;
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: 'transform phải là đối tượng {scale?,scaleX?,scaleY?,x?,y?,rotation?,opacity?,borderRadius?,crop?|flexCrop?}' };
  }
  const src = raw as Record<string, unknown>;
  const out: ClipTransform = {};
  let cropClear = false;
  const cropField = flexCropRaw(src);
  if (cropField.error) return { error: cropField.error };
  if (src.scale !== undefined) {
    const n = finiteNum(src.scale);
    if (n === undefined || n < 0.05 || n > 16) return { error: 'transform.scale phải nằm trong 0.05..16 (1 = 100%)' };
    out.scale = Math.round(n * 1000) / 1000;
  }
  for (const key of ['scaleX', 'scaleY'] as const) {
    if (src[key] === undefined) continue;
    const n = finiteNum(src[key]);
    if (n === undefined || n < 0.05 || n > 16) return { error: `transform.${key} phải nằm trong 0.05..16 (1 = 100%)` };
    out[key] = Math.round(n * 1000) / 1000;
  }
  if (src.x !== undefined) {
    const n = finiteNum(src.x);
    if (n === undefined || n < -400 || n > 400) return { error: 'transform.x phải nằm trong -400..400 (% chiều rộng canvas)' };
    out.x = Math.round(n * 100) / 100;
  }
  if (src.y !== undefined) {
    const n = finiteNum(src.y);
    if (n === undefined || n < -400 || n > 400) return { error: 'transform.y phải nằm trong -400..400 (% chiều cao canvas)' };
    out.y = Math.round(n * 100) / 100;
  }
  if (src.rotation !== undefined) {
    const n = finiteNum(src.rotation);
    if (n === undefined) return { error: 'transform.rotation phải là số hữu hạn (độ)' };
    out.rotation = Math.round(n * 100) / 100;
  }
  if (src.opacity !== undefined) {
    const n = finiteNum(src.opacity);
    if (n === undefined || n < 0 || n > 1) return { error: 'transform.opacity phải nằm trong 0..1' };
    out.opacity = Math.round(n * 1000) / 1000;
  }
  if (src.borderRadius !== undefined) {
    const n = finiteNum(src.borderRadius);
    if (n === undefined || n < 0) return { error: 'transform.borderRadius phải ≥ 0 (pixel composition)' };
    out.borderRadius = Math.round(n * 10) / 10;
  }
  if (cropField.raw !== undefined) {
    const parsed = parseCropArg(cropField.raw, canvas);
    if (parsed.error) return { error: parsed.error };
    if (parsed.clear) cropClear = true;
    else out.crop = parsed.crop;
  }
  if (!Object.keys(out).length && !cropClear) {
    return { error: 'transform cần ít nhất một trong các trường scale/scaleX/scaleY/x/y/rotation/opacity/borderRadius/crop/flexCrop' };
  }
  return { transform: out, cropClear };
}
