import type { TranscriptWord } from '../transcript/types';
import type { CaptionsData } from './types';
import { updateManualCue } from './manualCaptions';

export const CAPTION_CUE_TRANSLATION_LANGS = [
  { id: 'English', label: '英文', flag: '🇺🇸' },
  { id: '日本語', label: '日文', flag: '🇯🇵' },
  { id: '한국어', label: '韩文', flag: '🇰🇷' },
  { id: 'Español', label: '西班牙文', flag: '🇪🇸' },
  { id: 'Français', label: '法文', flag: '🇫🇷' },
  { id: 'Deutsch', label: '德文', flag: '🇩🇪' },
  { id: 'Português', label: '葡萄牙文', flag: '🇵🇹' },
] as const;

export interface CaptionCueTextTarget {
  laneId: string;
  index: number;
  words: readonly TranscriptWord[];
}

export function captionCueText(target: CaptionCueTextTarget): string {
  return target.words[target.index]?.text.trim() ?? '';
}

export function replaceCaptionCueText(
  captions: CaptionsData,
  target: CaptionCueTextTarget,
  text: string,
): Partial<CaptionsData> | null {
  const cue = target.words[target.index];
  const clean = text.trim();
  if (!cue || !clean) return null;
  return updateManualCue(captions, target.laneId, target.index, clean, cue.start, cue.end);
}

export function captionCueAgentSeed(text: string): string {
  return text.trim();
}
