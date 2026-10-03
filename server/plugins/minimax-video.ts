import { hailuoApiResolution, type ValidVideoRequest } from './video-validation.ts';

/** MiniMax Hailuo video model families and their request shape.
 *
 * Split out of video.ts to keep that file inside the 500-line source gate once
 * settings started accepting vendor model ids newer than the list below. */

/** MiniMax S2V-01 subject-reference path (face/subject lock). Configured via MINIMAX_VIDEO_MODEL. */
export function isMinimaxSubjectModel(modelName: string): boolean {
  return /s2v/i.test(modelName);
}

export type MinimaxVideoFamily = 'subject' | 'hailuo02' | 'hailuo23' | 'hailuo23-fast' | 'legacy-t2v' | 'legacy-i2v' | 'unknown';

function minimaxVideoFamily(modelName: string): MinimaxVideoFamily {
  if (/^s2v-01$/i.test(modelName)) return 'subject';
  if (/hailuo-2\.3-fast/i.test(modelName)) return 'hailuo23-fast';
  if (/hailuo-2\.3/i.test(modelName)) return 'hailuo23';
  if (/hailuo-02/i.test(modelName)) return 'hailuo02';
  if (/^t2v-01(?:-director)?$/i.test(modelName)) return 'legacy-t2v';
  if (/^i2v-01(?:-director|-live)?$/i.test(modelName)) return 'legacy-i2v';
  // Settings accept any MiniMax video model id, so an id newer than this list
  // must reach MiniMax instead of being rejected here. 'unknown' invents no
  // capability constraints: an uncategorized model gets the current-generation
  // request shape and the vendor answers for itself.
  return 'unknown';
}

export function validateMinimaxVideoMode(input: ValidVideoRequest, modelName: string): MinimaxVideoFamily {
  const family = minimaxVideoFamily(modelName);
  if (family === 'subject') {
    if (!input.firstFramePath) throw new Error('Tham chiếu chủ thể MiniMax S2V yêu cầu firstFrame (ảnh chủ thể/khuôn mặt)');
    if (input.lastFramePath) throw new Error('Tham chiếu chủ thể MiniMax S2V không hỗ trợ lastFrame');
    if (input.durationSpecified || input.resolution) throw new Error('MiniMax S2V không nhận durationSeconds hoặc resolution');
    if (input.fastPretreatment !== undefined) throw new Error('MiniMax S2V không nhận fastPretreatment');
  }
  if (family === 'hailuo23-fast' && !input.firstFramePath) throw new Error('MiniMax-Hailuo-2.3-Fast chỉ hỗ trợ image-to-video và yêu cầu firstFrame');
  if (input.lastFramePath && family !== 'hailuo02' && family !== 'unknown') throw new Error('Chế độ first-and-last-frame của MiniMax yêu cầu model MiniMax-Hailuo-02');
  if (input.lastFramePath && input.fastPretreatment !== undefined) throw new Error('Chế độ first-and-last-frame của MiniMax không nhận fastPretreatment');
  if (input.resolution === '512p' && family !== 'hailuo02' && family !== 'unknown') throw new Error('hailuo 512p yêu cầu model MiniMax-Hailuo-02');
  const legacy = family === 'legacy-t2v' || family === 'legacy-i2v';
  if (legacy && (input.durationSeconds !== 6 || (input.resolution && input.resolution !== '720p'))) throw new Error('Model video MiniMax cũ chỉ hỗ trợ 6 giây ở 720p');
  if (legacy && input.fastPretreatment !== undefined) throw new Error('Model video MiniMax cũ không nhận fastPretreatment');
  if (family === 'legacy-t2v' && input.firstFramePath) throw new Error(`${modelName} chỉ hỗ trợ text-to-video`);
  if (family === 'legacy-i2v' && !input.firstFramePath) throw new Error(`${modelName} chỉ hỗ trợ image-to-video và yêu cầu firstFrame`);
  return family;
}

export function hailuoRequestBody(
  input: ValidVideoRequest, modelName: string, firstFrameImage?: string, lastFrameImage?: string,
): Record<string, unknown> {
  const family = validateMinimaxVideoMode(input, modelName);
  const body: Record<string, unknown> = { model: modelName, prompt: input.prompt, prompt_optimizer: input.promptOptimizer !== false };
  if (family === 'subject') {
    if (!firstFrameImage) throw new Error('Không thể phân giải firstFrame của MiniMax S2V');
    body.subject_reference = [{ type: 'character', image: [firstFrameImage] }];
    return body;
  }
  if (input.firstFramePath && !firstFrameImage) throw new Error('Không thể phân giải firstFrame của MiniMax');
  if (input.lastFramePath && !lastFrameImage) throw new Error('Không thể phân giải lastFrame của MiniMax');
  body.duration = input.durationSeconds;
  body.resolution = family.startsWith('legacy-') ? '720P' : hailuoApiResolution(input.resolution);
  if (firstFrameImage) body.first_frame_image = firstFrameImage;
  if (lastFrameImage) body.last_frame_image = lastFrameImage;
  if (input.fastPretreatment === true) body.fast_pretreatment = true;
  return body;
}
