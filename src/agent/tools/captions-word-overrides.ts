import type { TimelineItem } from '../../editor/types';
import { resolveCaptionWordIndices, resolveCaptionWordRefs } from '../../captions/resolve';
import type { CaptionsData, CaptionWordOverride } from '../../captions/types';
import {
  captionWordOverride,
  clearCaptionWordOverride,
  setCaptionWordOverride,
  stableOverrideKeys,
} from '../../captions/wordOverrides';

type RawOverride = Record<string, unknown>;
interface WordTarget { index: number; wordRef: string }
export interface DisplayTextResult {
  wordOverrides: Record<number, CaptionWordOverride>;
  errors: string[];
  ignored: string[];
}

function resolveTarget(entry: RawOverride, indices: number[], refs: string[]): WordTarget | string {
  if (entry.wordRef !== undefined) {
    if (typeof entry.wordRef !== 'string' || !entry.wordRef.trim()) return 'wordRef không hợp lệ';
    const matches = refs.flatMap((ref, position) => ref === entry.wordRef ? [position] : []);
    if (!matches.length) return `wordRef không xác định hoặc đã cũ: ${JSON.stringify(entry.wordRef)}`;
    if (matches.length > 1) return `wordRef bị trùng: ${JSON.stringify(entry.wordRef)}`;
    const position = matches[0]!;
    return { index: indices[position]!, wordRef: refs[position]! };
  }
  const wordIndex = entry.wordIndex;
  if (typeof wordIndex !== 'number' || !Number.isInteger(wordIndex) || wordIndex < 0) {
    return `wordIndex không hợp lệ: ${JSON.stringify(wordIndex)}`;
  }
  const matches = indices.flatMap((index, position) => index === wordIndex ? [position] : []);
  if (!matches.length) return `wordIndex không xác định hoặc không khả dụng: ${wordIndex}`;
  if (matches.length > 1) return `wordIndex bị trùng: ${wordIndex}; hãy dùng wordRef`;
  return { index: wordIndex, wordRef: refs[matches[0]!]! };
}

function patchFor(entry: RawOverride): CaptionWordOverride {
  const patch: CaptionWordOverride = {};
  if (typeof entry.hidden === 'boolean') patch.hidden = entry.hidden;
  if (typeof entry.text === 'string') patch.text = entry.text;
  if (typeof entry.forcePageBreak === 'boolean') patch.forceBreak = entry.forcePageBreak;
  else if (typeof entry.forceBreak === 'boolean') patch.forceBreak = entry.forceBreak;
  return patch;
}

export function applyDisplayTextEntries(
  raw: unknown[],
  captions: CaptionsData,
  items: TimelineItem[],
  fps: number,
): DisplayTextResult {
  const indices = resolveCaptionWordIndices(captions, items, fps);
  const refs = resolveCaptionWordRefs(captions, items, fps);
  let next = { ...(captions.wordOverrides ?? {}) };
  const errors: string[] = [];
  const ignored: string[] = [];
  for (const value of raw) {
    if (!value || typeof value !== 'object') { errors.push('mục nhập không phải object'); continue; }
    const entry = value as RawOverride;
    if (entry.key !== undefined && entry.wordIndex === undefined && entry.wordRef === undefined) {
      ignored.push('key (hãy dùng wordRef từ read_captions)'); continue;
    }
    if ('keepWithPrevious' in entry) ignored.push('keepWithPrevious');
    const target = resolveTarget(entry, indices, refs);
    if (typeof target === 'string') { errors.push(target); continue; }
    if (stableOverrideKeys(next, target.wordRef).length > 1) {
      errors.push(`override đã lưu bị trùng cho wordRef ${JSON.stringify(target.wordRef)}`); continue;
    }
    if (entry.clear === true) {
      next = clearCaptionWordOverride(next, target.index, target.wordRef); continue;
    }
    const patch = patchFor(entry);
    const current = captionWordOverride(next, target.index, target.wordRef);
    if (entry.text === null && current?.text !== undefined) {
      const withoutText = { ...current }; delete withoutText.text;
      next = clearCaptionWordOverride(next, target.index, target.wordRef);
      next = setCaptionWordOverride(next, indices, target.index, target.wordRef, { ...withoutText, ...patch });
    } else if (Object.keys(patch).length) {
      next = setCaptionWordOverride(next, indices, target.index, target.wordRef, patch);
    }
  }
  return { wordOverrides: next, errors, ignored };
}
