import type { MusicMode, MusicRequest, MurekaStyle, ValidMusicRequest } from './music-types.ts';

const SAMPLE_RATES = new Set([16_000, 24_000, 32_000, 44_100]);
const BITRATES = new Set([32_000, 64_000, 128_000, 256_000]);
const STYLES = new Set<MurekaStyle>(['pop', 'rock', 'jazz', 'r&b', 'edm', 'ambient', 'folk', 'latin', 'k-pop', 'j-pop', 'house', 'gospel', 'lo-fi']);
const MUREKA_MODES = new Set<MusicMode>(['instrumental', 'song', 'prompt-song', 'soundtrack', 'track']);

function optionalText(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function validateRange(start: number | undefined, end: number | undefined, label: string): void {
  if (start !== undefined && (!Number.isInteger(start) || start < 0)) throw new Error(`${label} start phải là số nguyên không âm`);
  if (end !== undefined && (!Number.isInteger(end) || end < 0)) throw new Error(`${label} end phải là số nguyên không âm`);
  if (start !== undefined && end !== undefined && end <= start) throw new Error(`${label} end phải sau start`);
}

function validateMurekaMode(input: MusicRequest, mode: MusicMode, prompt: string, lyrics?: string): void {
  if (mode === 'instrumental') {
    if (Boolean(prompt) === Boolean(optionalText(input.instrumentalId))) throw new Error('mureka instrumental yêu cầu chính xác một trong prompt hoặc instrumentalId');
    if (prompt.length > 1024) throw new Error('prompt mureka instrumental dài tối đa 1024 ký tự');
  } else if (mode === 'song') {
    if (!lyrics) throw new Error('chế độ bài hát mureka yêu cầu lyrics');
    if (lyrics.length > 5000) throw new Error('lyrics mureka dài tối đa 5000 ký tự');
    if (prompt.length > 1024) throw new Error('prompt bài hát mureka dài tối đa 1024 ký tự');
    const melody = optionalText(input.melodyId);
    if (melody && (prompt || input.referenceId || input.vocalId)) throw new Error('mureka melodyId không thể kết hợp với prompt/referenceId/vocalId');
  } else if (mode === 'prompt-song') {
    if (!prompt && !input.referenceId && !input.vocalId && !input.styles?.length) throw new Error('mureka prompt-song yêu cầu prompt, styles, referenceId hoặc vocalId');
    if (prompt.length > 2000) throw new Error('prompt mureka prompt-song dài tối đa 2000 ký tự');
    if (input.styles?.some((style) => !STYLES.has(style))) throw new Error('styles mureka chứa giá trị không được hỗ trợ');
  } else if (mode === 'soundtrack') {
    if (!input.sourceAssetPath || (input.sourceAssetKind !== 'image' && input.sourceAssetKind !== 'video')) {
      throw new Error('mureka soundtrack yêu cầu sourceAssetId là ảnh hoặc video');
    }
    if (prompt.length > 1024) throw new Error('prompt mureka soundtrack dài tối đa 1024 ký tự');
    validateRange(input.audioStartMs, input.audioEndMs, 'soundtrack audio range');
    if (input.audioStartMs !== undefined && input.audioEndMs !== undefined && input.audioEndMs - input.audioStartMs < 3000) {
      throw new Error('khoảng audio mureka soundtrack phải ít nhất 3000ms');
    }
  } else {
    if (Boolean(optionalText(input.songId)) === Boolean(input.sourceAssetPath)) throw new Error('mureka track yêu cầu chính xác một trong songId hoặc sourceAssetId');
    if (input.sourceAssetPath && input.sourceAssetKind !== 'audio') throw new Error('sourceAssetId của mureka track phải là audio');
    if (!input.trackType) throw new Error('mureka track yêu cầu trackType');
    if (!prompt || prompt.length > 1024) throw new Error('prompt mureka track là bắt buộc và dài tối đa 1024 ký tự');
    if (lyrics && lyrics.length > 5000) throw new Error('lyrics mureka track dài tối đa 5000 ký tự');
    if (input.vocalGender && input.trackType !== 'Vocals') throw new Error('vocalGender chỉ được hỗ trợ cho trackType Vocals');
    validateRange(input.generateStartMs, input.generateEndMs, 'track generation range');
  }
}

function rejectMurekaOnly(input: MusicRequest): void {
  const values = [input.count, input.styles, input.gender, input.referenceId, input.instrumentalId, input.vocalId, input.melodyId,
    input.sourceAssetPath, input.sourceAssetKind, input.audioStartMs, input.audioEndMs, input.songId, input.trackType,
    input.generateStartMs, input.generateEndMs, input.vocalGender, input.stream];
  if (values.some((value) => value !== undefined)) throw new Error('các tùy chọn tạo Mureka chỉ được provider mureka hỗ trợ');
}

// Sonilo v2m scores the finished cut: the video is the input, the prompt is a
// single optional style hint (works without one). No lyrics/stems/segment
// controls exist, output is always one m4a track, and /v1 picks the model.
function validateSonilo(input: MusicRequest, mode: MusicMode, prompt: string, lyrics?: string): void {
  if (mode !== 'v2m') throw new Error('mode sonilo phải là v2m');
  if (!input.sourceAssetPath || input.sourceAssetKind !== 'video') {
    throw new Error('sonilo v2m yêu cầu sourceAssetId video của project (bản dựng đã render)');
  }
  if (prompt.length > 500) throw new Error('prompt phong cách sonilo dài tối đa 500 ký tự');
  if (lyrics) throw new Error('sonilo v2m không nhận lyrics; nhạc được tạo từ video');
  const murekaOnly = [input.styles, input.gender, input.referenceId, input.instrumentalId, input.vocalId, input.melodyId,
    input.audioStartMs, input.audioEndMs, input.songId, input.trackType, input.generateStartMs, input.generateEndMs,
    input.vocalGender, input.stream];
  if (murekaOnly.some((value) => value !== undefined)) throw new Error('các tùy chọn tạo Mureka chỉ được provider mureka hỗ trợ');
  const minimaxOnly = [input.referenceAudioPath, input.coverFeatureId, input.lyricsOptimizer, input.isInstrumental,
    input.sampleRate, input.bitrate];
  if (minimaxOnly.some((value) => value !== undefined)) throw new Error('sonilo không hỗ trợ các tùy chọn chỉ dành cho MiniMax');
  if (input.count !== undefined && input.count !== 1) throw new Error('sonilo v2m chỉ trả về một kết quả; count phải là 1');
  if (input.audioFormat) throw new Error('không thể cấu hình định dạng đầu ra sonilo (sẽ trả về m4a)');
}

function validateMinimax(input: MusicRequest, mode: MusicMode, prompt: string, lyrics?: string): void {
  if (mode !== 't2m' && mode !== 'cover') throw new Error('mode minimax phải là t2m hoặc cover');
  rejectMurekaOnly(input);
  const cover = mode === 'cover';
  if (cover) {
    if (prompt.length < 10 || prompt.length > 300) throw new Error('prompt music-cover phải dài 10–300 ký tự');
    if (Boolean(input.referenceAudioPath) === Boolean(optionalText(input.coverFeatureId))) {
      throw new Error('music-cover yêu cầu chính xác một trong referenceAssetId hoặc coverFeatureId');
    }
    if (lyrics && (lyrics.length < 10 || lyrics.length > 1000)) throw new Error('lyrics music-cover phải dài 10–1000 ký tự');
    if (input.coverFeatureId && !lyrics) throw new Error('coverFeatureId yêu cầu lyrics');
    if (input.lyricsOptimizer || input.isInstrumental) throw new Error('music-cover không dùng lyricsOptimizer/isInstrumental');
  } else {
    if (prompt.length > 2000) throw new Error('prompt MiniMax dài tối đa 2000 ký tự');
    const instrumental = input.isInstrumental ?? (!lyrics && !input.lyricsOptimizer);
    if (instrumental && !prompt) throw new Error('tạo instrumental MiniMax yêu cầu prompt');
    if (instrumental && (lyrics || input.lyricsOptimizer)) throw new Error('isInstrumental không thể kết hợp với lyrics/lyricsOptimizer');
    if (!instrumental && !lyrics && !input.lyricsOptimizer) throw new Error('vocal MiniMax yêu cầu lyrics hoặc lyricsOptimizer:true');
    if (lyrics && lyrics.length > 3500) throw new Error('lyrics MiniMax dài tối đa 3500 ký tự');
  }
  if (!SAMPLE_RATES.has(input.sampleRate ?? 44_100)) throw new Error('sampleRate phải là 16000, 24000, 32000 hoặc 44100');
  if (!BITRATES.has(input.bitrate ?? 256_000)) throw new Error('bitrate phải là 32000, 64000, 128000 hoặc 256000');
  if (input.audioFormat && !['mp3', 'wav', 'pcm'].includes(input.audioFormat)) throw new Error('audioFormat MiniMax phải là mp3, wav hoặc pcm');
}

function validateAtlas(input: MusicRequest, mode: MusicMode, prompt: string, lyrics?: string): void {
  if (mode !== 't2m') throw new Error('mode atlas phải là t2m');
  rejectMurekaOnly(input);
  if (input.referenceAudioPath || input.coverFeatureId || input.lyricsOptimizer !== undefined) {
    throw new Error('atlas không hỗ trợ tùy chọn cover và lyricsOptimizer của MiniMax');
  }
  if (!prompt || prompt.length > 2000) throw new Error('prompt Atlas là bắt buộc và dài tối đa 2000 ký tự');
  if (lyrics && lyrics.length > 3500) throw new Error('lyrics Atlas dài tối đa 3500 ký tự');
  if (input.isInstrumental && lyrics) throw new Error('tạo instrumental Atlas không thể kết hợp với lyrics');
  if (!SAMPLE_RATES.has(input.sampleRate ?? 44_100)) throw new Error('sampleRate phải là 16000, 24000, 32000 hoặc 44100');
  if (!BITRATES.has(input.bitrate ?? 256_000)) throw new Error('bitrate phải là 32000, 64000, 128000 hoặc 256000');
  if (input.audioFormat && !['mp3', 'wav', 'pcm'].includes(input.audioFormat)) throw new Error('audioFormat Atlas phải là mp3, wav hoặc pcm');
}

export function validateMusicRequest(input: MusicRequest): ValidMusicRequest {
  const provider = String(input.provider ?? 'mureka');
  if (provider !== 'mureka' && provider !== 'minimax' && provider !== 'atlas' && provider !== 'sonilo') throw new Error('provider phải là mureka, minimax, atlas hoặc sonilo');
  const inferredMode: MusicMode = provider === 'mureka' ? 'instrumental'
    : provider === 'sonilo' ? 'v2m'
      : provider === 'minimax' && (input.referenceAudioPath || input.coverFeatureId) ? 'cover' : 't2m';
  const mode = input.mode ?? inferredMode;
  const prompt = optionalText(input.prompt) ?? '';
  const lyrics = optionalText(input.lyrics);
  if (provider === 'sonilo') validateSonilo(input, mode, prompt, lyrics);
  else if (provider === 'mureka') {
    if (!MUREKA_MODES.has(mode)) throw new Error('mode mureka phải là instrumental, song, prompt-song, soundtrack hoặc track');
    if (input.referenceAudioPath || input.coverFeatureId || input.lyricsOptimizer !== undefined || input.isInstrumental !== undefined
      || input.sampleRate !== undefined || input.bitrate !== undefined) throw new Error('mureka không hỗ trợ các tùy chọn chỉ dành cho MiniMax');
    const count = input.count ?? 1;
    if (!Number.isInteger(count) || count < 1 || count > 3) throw new Error('count mureka phải là số nguyên từ 1 đến 3');
    if (input.audioFormat && !['mp3', 'wav', 'flac'].includes(input.audioFormat)) throw new Error('audioFormat Mureka phải là mp3, wav hoặc flac');
    validateMurekaMode(input, mode, prompt, lyrics);
  } else if (provider === 'minimax') validateMinimax(input, mode, prompt, lyrics);
  else validateAtlas(input, mode, prompt, lyrics);
  const name = optionalText(input.name) ?? `Music · ${(prompt || mode).slice(0, 36)}`;
  return {
    ...input, provider, mode, prompt, lyrics, name,
    isInstrumental: provider === 'mureka'
      ? mode === 'instrumental'
      : provider === 'sonilo'
        ? true
        : input.isInstrumental ?? (mode === 't2m' && !lyrics && !input.lyricsOptimizer),
    lyricsOptimizer: provider === 'minimax' && input.lyricsOptimizer === true,
    sampleRate: input.sampleRate ?? 44_100,
    bitrate: input.bitrate ?? 256_000,
    audioFormat: input.audioFormat ?? 'mp3',
    count: input.count ?? 1,
    stream: input.stream === true,
    coverMode: mode === 'cover',
  };
}
