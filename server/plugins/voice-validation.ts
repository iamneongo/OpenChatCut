import type { ValidVoiceRequest, VoiceRequest } from './voice-types.ts';
import { MINIMAX_LANGUAGE_BOOSTS } from '../../shared/media-provider-params.ts';

const EMOTIONS = new Set(['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'calm', 'fluent', 'whisper']);
const ELEVEN_OUTPUTS = new Set([
  'mp3_22050_32', 'mp3_24000_48', 'mp3_44100_32', 'mp3_44100_64', 'mp3_44100_96', 'mp3_44100_128', 'mp3_44100_192',
  'pcm_8000', 'pcm_16000', 'pcm_22050', 'pcm_24000', 'pcm_32000', 'pcm_44100', 'pcm_48000',
  'ulaw_8000', 'alaw_8000', 'opus_48000_32', 'opus_48000_64', 'opus_48000_96', 'opus_48000_128', 'opus_48000_192',
  'wav_8000', 'wav_16000', 'wav_22050', 'wav_24000', 'wav_32000', 'wav_44100', 'wav_48000',
]);
const MINIMAX_RATES = new Set([8_000, 16_000, 22_050, 24_000, 32_000, 44_100]);
const MINIMAX_BITRATES = new Set([32_000, 64_000, 128_000, 256_000]);
const MINIMAX_FORMATS = new Set(['mp3', 'pcm', 'flac', 'wav', 'pcmu_raw', 'pcmu_wav', 'opus']);
const MINIMAX_LANGUAGES = new Set<string>(MINIMAX_LANGUAGE_BOOSTS);

function range(value: number | undefined, min: number, max: number, name: string): void {
  if (value != null && (!Number.isFinite(value) || value < min || value > max)) throw new Error(`${name} phải nằm trong khoảng ${min} đến ${max}`);
}

function reject(values: unknown[], message: string): void {
  if (values.some((value) => value !== undefined)) throw new Error(message);
}

function validateEleven(input: VoiceRequest): void {
  for (const [value, min, max, name] of [[input.stability, 0, 1, 'stability'], [input.similarityBoost, 0, 1, 'similarityBoost'],
    [input.style, 0, 1, 'style'], [input.speed, 0.7, 1.2, 'speed']] as Array<[number | undefined, number, number, string]>) range(value, min, max, name);
  if (!ELEVEN_OUTPUTS.has(input.outputFormat ?? 'mp3_44100_128')) throw new Error('outputFormat ElevenLabs không được hỗ trợ');
  if (input.seed != null && (!Number.isInteger(input.seed) || input.seed < 0 || input.seed > 4_294_967_295)) throw new Error('seed phải là số nguyên từ 0 đến 4294967295');
  if (input.optimizeStreamingLatency != null && (!Number.isInteger(input.optimizeStreamingLatency) || input.optimizeStreamingLatency < 0 || input.optimizeStreamingLatency > 4)) {
    throw new Error('optimizeStreamingLatency phải là số nguyên từ 0 đến 4');
  }
  if (input.pronunciationDictionaryLocators && input.pronunciationDictionaryLocators.length > 3) throw new Error('ElevenLabs hỗ trợ tối đa 3 pronunciation dictionary');
  reject([input.speedRatio, input.emotion, input.emotionScale, input.loudnessRatio, input.pitch, input.volume, input.performancePrompt,
    input.explicitDialect, input.sampleRate, input.bitrate, input.audioFormat, input.channel, input.forceCbr, input.languageBoost,
    input.stream, input.excludeAggregatedAudio, input.textNormalization, input.latexRead, input.pronunciations,
    input.timbreWeights, input.voiceModify, input.subtitleEnable, input.subtitleType],
  'ElevenLabs không nhận các tham số voice chỉ dành cho Doubao/MiniMax');
}

function validateDoubao(input: VoiceRequest, voiceId: string): void {
  range(input.speedRatio, 0.5, 2, 'speedRatio');
  range(input.emotionScale, 1, 5, 'emotionScale');
  range(input.loudnessRatio, 0.5, 2, 'loudnessRatio');
  range(input.pitch, -12, 12, 'pitch');
  if (input.performancePrompt && input.performancePrompt.length > 200) throw new Error('performancePrompt dài tối đa 200 ký tự');
  if (input.emotionScale != null && !input.emotion) throw new Error('emotionScale yêu cầu emotion');
  if (input.explicitDialect && voiceId !== 'vivi') throw new Error('explicitDialect chỉ được preset Vivi hỗ trợ');
  reject([input.modelId, input.stability, input.speed, input.similarityBoost, input.style, input.useSpeakerBoost, input.languageCode,
    input.seed, input.outputFormat, input.optimizeStreamingLatency, input.enableLogging, input.applyTextNormalization,
    input.applyLanguageTextNormalization, input.pronunciationDictionaryLocators, input.previousText, input.nextText,
    input.previousRequestIds, input.nextRequestIds, input.volume, input.sampleRate, input.bitrate, input.audioFormat, input.channel,
    input.forceCbr, input.stream, input.excludeAggregatedAudio, input.languageBoost, input.textNormalization, input.latexRead,
    input.pronunciations, input.timbreWeights, input.voiceModify, input.subtitleEnable, input.subtitleType],
  'Doubao không nhận các tham số voice chỉ dành cho ElevenLabs/MiniMax');
}

function validateMinimax(input: VoiceRequest, text: string): void {
  range(input.speed, 0.5, 2, 'speed');
  if (input.volume != null && (!Number.isFinite(input.volume) || input.volume <= 0 || input.volume > 10)) {
    throw new Error('volume phải lớn hơn 0 và tối đa 10');
  }
  range(input.pitch, -12, 12, 'pitch');
  if (input.emotion && !EMOTIONS.has(input.emotion)) throw new Error(`emotion MiniMax phải là một trong: ${[...EMOTIONS].join(', ')}`);
  if (text.length > 10_000) throw new Error('text MiniMax dài tối đa 10000 ký tự');
  if (!MINIMAX_RATES.has(input.sampleRate ?? 32_000)) throw new Error('sampleRate MiniMax không được hỗ trợ');
  const format = input.audioFormat ?? 'mp3';
  if (!MINIMAX_FORMATS.has(format)) throw new Error('audioFormat MiniMax không được hỗ trợ');
  if (input.bitrate !== undefined && !MINIMAX_BITRATES.has(input.bitrate)) throw new Error('bitrate MiniMax không được hỗ trợ');
  if (input.bitrate !== undefined && format !== 'mp3') throw new Error('bitrate MiniMax chỉ áp dụng cho MP3');
  if (input.channel != null && input.channel !== 1 && input.channel !== 2) throw new Error('channel phải là 1 hoặc 2');
  if (input.forceCbr === true && (input.stream !== true || format !== 'mp3')) throw new Error('forceCbr MiniMax yêu cầu stream=true và audioFormat=mp3');
  if (input.excludeAggregatedAudio !== undefined && input.stream !== true) throw new Error('excludeAggregatedAudio yêu cầu stream=true');
  if (input.languageBoost && !MINIMAX_LANGUAGES.has(input.languageBoost)) throw new Error('languageBoost MiniMax không được hỗ trợ');
  if (input.latexRead === true && input.languageBoost && input.languageBoost !== 'Chinese') throw new Error('latexRead MiniMax yêu cầu languageBoost=Chinese hoặc bỏ qua');
  if (input.subtitleType && input.subtitleEnable !== true) throw new Error('subtitleType yêu cầu subtitleEnable=true');
  if (input.subtitleType === 'word_streaming' && input.stream !== true) throw new Error('subtitleType word_streaming yêu cầu stream=true');
  if (input.pronunciations && input.pronunciations.some((tone) => !tone.trim())) throw new Error('pronunciations không được chứa giá trị rỗng');
  if (input.timbreWeights && (input.timbreWeights.length < 1 || input.timbreWeights.length > 4
    || input.timbreWeights.some((item) => !item.voiceId.trim() || !Number.isInteger(item.weight) || item.weight < 1 || item.weight > 100))) {
    throw new Error('timbreWeights phải chứa 1–4 mục voiceId/weight với weight là số nguyên 1–100');
  }
  for (const key of ['pitch', 'intensity', 'timbre'] as const) range(input.voiceModify?.[key], -100, 100, `voiceModify.${key}`);
  if (input.voiceModify && (input.stream === true ? format !== 'mp3' : !['mp3', 'wav', 'flac'].includes(format))) {
    throw new Error('voiceModify MiniMax chỉ hỗ trợ mp3/wav/flac không streaming hoặc mp3 streaming');
  }
  if (input.timbreWeights?.length && input.voiceId?.trim()) throw new Error('timbreWeights MiniMax yêu cầu voiceId rỗng');
  reject([input.modelId, input.stability, input.similarityBoost, input.style, input.useSpeakerBoost, input.languageCode,
    input.seed, input.outputFormat, input.optimizeStreamingLatency, input.enableLogging, input.applyTextNormalization,
    input.applyLanguageTextNormalization, input.pronunciationDictionaryLocators, input.previousText, input.nextText,
    input.previousRequestIds, input.nextRequestIds, input.speedRatio, input.emotionScale, input.loudnessRatio,
    input.performancePrompt, input.explicitDialect], 'MiniMax không nhận các tham số voice chỉ dành cho ElevenLabs/Doubao');
}

/** Inworld / Fish Audio / Speechify only take text, voiceId, and an optional modelId override. */
function validateMinimalProvider(input: VoiceRequest, label: string): void {
  reject([input.stability, input.speed, input.similarityBoost, input.style, input.useSpeakerBoost, input.languageCode,
    input.seed, input.outputFormat, input.optimizeStreamingLatency, input.enableLogging, input.applyTextNormalization,
    input.applyLanguageTextNormalization, input.pronunciationDictionaryLocators, input.previousText, input.nextText,
    input.previousRequestIds, input.nextRequestIds, input.speedRatio, input.emotion, input.emotionScale, input.loudnessRatio,
    input.pitch, input.volume, input.performancePrompt, input.explicitDialect, input.sampleRate, input.bitrate,
    input.audioFormat, input.channel, input.forceCbr, input.stream, input.excludeAggregatedAudio, input.languageBoost,
    input.textNormalization, input.latexRead, input.pronunciations, input.timbreWeights, input.voiceModify,
    input.subtitleEnable, input.subtitleType],
  `${label} chỉ nhận text, voiceId và modelId`);
}
function isAiProvider(provider: string | undefined): provider is 'openai' | 'gemini' | 'mistral' | 'cartesia' {
  return provider === 'openai' || provider === 'gemini' || provider === 'mistral' || provider === 'cartesia';
}

function validateAiProvider(input: VoiceRequest, provider: 'openai' | 'gemini' | 'mistral' | 'cartesia'): void {
  if (input.speed != null && provider !== 'openai' && provider !== 'cartesia') {
    throw new Error(`${provider} không hỗ trợ speed`);
  }
  range(input.speed, provider === 'cartesia' ? 0.6 : 0.25, provider === 'cartesia' ? 1.5 : 4, 'speed');
  if (input.languageCode != null && provider !== 'cartesia') throw new Error(`${provider} không hỗ trợ languageCode`);
  if (input.languageCode != null && !/^(?:auto|[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)$/.test(input.languageCode)) {
    throw new Error('languageCode phải là mã ngôn ngữ ISO hoặc auto');
  }
  if (input.instructions != null && provider !== 'openai' && provider !== 'gemini') {
    throw new Error(`${provider} không hỗ trợ instructions`);
  }
  reject([input.stability, input.similarityBoost, input.style, input.useSpeakerBoost, input.seed,
    input.optimizeStreamingLatency, input.enableLogging, input.applyTextNormalization, input.applyLanguageTextNormalization,
    input.pronunciationDictionaryLocators, input.previousText, input.nextText, input.previousRequestIds, input.nextRequestIds,
    input.speedRatio, input.emotion, input.emotionScale, input.loudnessRatio, input.pitch, input.volume,
    input.performancePrompt, input.explicitDialect, input.sampleRate, input.bitrate, input.audioFormat, input.channel,
    input.forceCbr, input.stream, input.excludeAggregatedAudio, input.languageBoost, input.textNormalization,
    input.latexRead, input.pronunciations, input.timbreWeights, input.voiceModify, input.subtitleEnable, input.subtitleType],
  `${provider} chỉ nhận text, voiceId, modelId, speed, languageCode, outputFormat và instructions`);
}

export function validateVoiceRequest(input: VoiceRequest): ValidVoiceRequest {
  const provider = input.provider;
  if (provider !== 'elevenlabs' && provider !== 'doubao' && provider !== 'minimax'
    && provider !== 'inworld' && provider !== 'fishaudio' && provider !== 'speechify' && !isAiProvider(provider)) {
    throw new Error('provider voice không được hỗ trợ');
  }
  const text = String(input.text ?? '').trim();
  const requestedVoiceId = String(input.voiceId ?? '').trim();
  const voiceId = requestedVoiceId || (provider === 'minimax' && !input.timbreWeights?.length ? 'female-yujie' : '');
  if (!text) throw new Error('text là bắt buộc');
  if (!voiceId && !(provider === 'minimax' && input.timbreWeights?.length)) throw new Error('voiceId là bắt buộc');
  if (provider === 'elevenlabs') validateEleven(input);
  else if (provider === 'doubao') validateDoubao(input, voiceId);
  else if (provider === 'minimax') validateMinimax(input, text);
  else if (isAiProvider(provider)) validateAiProvider(input, provider);
  else {
    if (provider === 'inworld' && text.length > 2_000) throw new Error('text Inworld TTS dài tối đa 2000 ký tự');
    validateMinimalProvider(input, provider === 'inworld' ? 'Inworld' : provider === 'fishaudio' ? 'Fish Audio' : 'Speechify');
  }
  if (isAiProvider(provider)) {
    return { ...input, provider, text, voiceId, outputFormat: input.outputFormat ?? (provider === 'gemini' ? 'wav' : 'mp3'),
      sampleRate: 24_000, audioFormat: 'mp3', channel: 1 };
  }
  return { ...input, provider, text, voiceId, outputFormat: input.outputFormat ?? 'mp3_44100_128',
    sampleRate: input.sampleRate ?? 32_000,
    bitrate: input.bitrate ?? ((input.audioFormat ?? 'mp3') === 'mp3' ? 128_000 : undefined),
    audioFormat: input.audioFormat ?? 'mp3', channel: input.channel ?? 1 };
}
