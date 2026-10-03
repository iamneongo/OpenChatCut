import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  type Prompt,
} from '@modelcontextprotocol/sdk/types.js';
import { localized } from '../ui-locale.ts';

function prompts(): Prompt[] {
  return [
  {
    name: 'create-short-video',
    description: localized({ zh: '把当前工程剪成节奏紧凑的竖屏短视频（钩子、推进、高潮、收尾）。', en: 'Cut the current project into a tight vertical short video (hook, build, climax, ending).', vi: 'Dựng dự án hiện tại thành video ngắn dọc có nhịp gọn (mở hook, phát triển, cao trào, kết thúc).' }),
    arguments: [{ name: 'topic', description: localized({ zh: '主题/重点（可选）', en: 'Topic / focus (optional)', vi: 'Chủ đề / trọng tâm (tùy chọn)' }), required: false }],
  },
  {
    name: 'transcribe-and-caption',
    description: localized({ zh: '转写时间线上的音频/视频片段并生成字幕（无音轨片段自动跳过）。', en: 'Transcribe audio/video clips on the timeline and create captions (clips without audio are skipped).', vi: 'Chép lời các đoạn âm thanh/video trên dòng thời gian và tạo phụ đề (tự bỏ qua đoạn không có rãnh âm thanh).' }),
    arguments: [{ name: 'track', description: localized({ zh: '轨道别名，默认音频轨', en: 'Track alias; audio track by default', vi: 'Tên rãnh; mặc định là rãnh âm thanh' }), required: false }],
  },
  {
    name: 'add-background-music',
    description: localized({ zh: '为当前时间线匹配并放置合适的背景音乐，做响度标准化。', en: 'Match and place suitable background music on the timeline, with loudness normalization.', vi: 'Chọn và đặt nhạc nền phù hợp cho dòng thời gian, đồng thời chuẩn hóa âm lượng.' }),
    arguments: [{ name: 'mood', description: localized({ zh: '情绪方向（可选）', en: 'Mood direction (optional)', vi: 'Định hướng cảm xúc (tùy chọn)' }), required: false }],
  },
  {
    name: 'generate-script',
    description: localized({ zh: '按当前素材写解说词/口播稿，并规划分镜。', en: 'Write narration from the current media and plan the storyboard.', vi: 'Viết lời thuyết minh/lời thoại dựa trên tư liệu hiện tại và lập storyboard.' }),
    arguments: [{ name: 'topic', description: localized({ zh: '主题', en: 'Topic', vi: 'Chủ đề' }), required: true }],
  },
  {
    name: 'export-project',
    description: localized({ zh: '导出当前工程为成片（MP4），并报告导出历史。', en: 'Export the current project as a finished video (MP4) and report export history.', vi: 'Xuất dự án hiện tại thành video hoàn chỉnh (MP4) và báo cáo lịch sử xuất.' }),
    arguments: [{ name: 'format', description: localized({ zh: 'mp4 / prores（默认 mp4）', en: 'mp4 / prores (MP4 by default)', vi: 'mp4 / prores (mặc định MP4)' }), required: false }],
  },
  {
    name: 'clean-up-draft',
    description: localized({ zh: '检查时间线：删除填充词、静音停顿，收紧空隙。', en: 'Inspect the timeline: remove filler words and silent pauses, and tighten gaps.', vi: 'Kiểm tra dòng thời gian: xóa từ đệm, khoảng lặng và thu hẹp các khoảng trống.' }),
    arguments: [],
  },
  ];
}

function promptText(name: string): string | undefined {
  const variants: Record<string, { zh: string; en: string; vi: string }> = {
    'create-short-video': { zh: '请把当前时间线剪成节奏紧凑的竖屏短视频：先梳理素材，确定钩子、推进、高潮和收尾，再执行剪辑、配乐、字幕与发布前检查。主题：{topic}。', en: 'Cut the current timeline into a tight vertical short video: organize the media, define the hook, build, climax, and ending, then edit, add music and captions, and run a pre-publish check. Topic: {topic}.', vi: 'Hãy dựng dòng thời gian hiện tại thành video ngắn dọc có nhịp gọn: sắp xếp tư liệu, xác định phần mở hook, phát triển, cao trào và kết thúc, rồi dựng, thêm nhạc, phụ đề và kiểm tra trước khi đăng. Chủ đề: {topic}.' },
    'transcribe-and-caption': { zh: '请转写 {track} 轨道的音频/视频片段并生成字幕；没有音轨的片段跳过即可，完成后汇报哪些片段跳过了。', en: 'Transcribe the audio/video clips on track {track} and create captions. Skip clips without audio and report which clips were skipped when finished.', vi: 'Hãy chép lời các đoạn âm thanh/video trên rãnh {track} và tạo phụ đề. Bỏ qua đoạn không có âm thanh và báo cáo những đoạn đã bỏ qua khi hoàn tất.' },
    'add-background-music': { zh: '请为当前时间线选择并放置合适的背景音乐，标准化到约 -14 LUFS，并确保不与口播冲突。{topic}', en: 'Choose and place suitable background music on the current timeline, normalize it to about -14 LUFS, and keep it from competing with narration. {topic}', vi: 'Hãy chọn và đặt nhạc nền phù hợp cho dòng thời gian hiện tại, chuẩn hóa khoảng -14 LUFS và bảo đảm không lấn át lời thoại. {topic}' },
    'export-project': { zh: '请导出当前工程为成片（默认 MP4），导出前检查素材完整性，完成后报告导出历史与文件位置。', en: 'Export the current project as a finished video (MP4 by default). Check media integrity before exporting, then report export history and the file location.', vi: 'Hãy xuất dự án hiện tại thành video hoàn chỉnh (mặc định MP4). Kiểm tra tính đầy đủ của tư liệu trước khi xuất, rồi báo cáo lịch sử xuất và vị trí tệp.' },
    'clean-up-draft': { zh: '请检查当前时间线：删除口播中的填充词、删除静音停顿并收紧空隙，保持字幕与画面同步。', en: 'Inspect the current timeline: remove filler words and silent pauses, tighten gaps, and keep captions synchronized with the picture.', vi: 'Hãy kiểm tra dòng thời gian hiện tại: xóa từ đệm và khoảng lặng trong lời thoại, thu hẹp khoảng trống, đồng thời giữ phụ đề đồng bộ với hình ảnh.' },
  };
  const value = variants[name];
  return value ? localized(value) : undefined;
}

export function registerMcpPrompts(server: Server): void {
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: prompts() }));
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const name = request.params.name;
    const args = request.params.arguments ?? {};
    const topic = typeof args.topic === 'string' ? args.topic.trim() : '';
    const track = typeof args.track === 'string' ? args.track.trim() : '';
    const mood = typeof args.mood === 'string' ? args.mood.trim() : '';
    const template = name === 'generate-script'
      ? localized({ zh: `请围绕「${topic}」写一段解说词/口播稿：先明确结构（开头钩子、主体要点、结尾行动引导），再规划与素材匹配的分镜。`, en: `Write narration about “${topic}”: define the structure (opening hook, key points, call to action), then plan a storyboard matched to the media.`, vi: `Hãy viết lời thuyết minh về “${topic}”: xác định cấu trúc (hook mở đầu, ý chính, lời kêu gọi hành động), rồi lập storyboard phù hợp với tư liệu.` })
      : promptText(name);
    if (!template) throw new Error(`Unknown prompt ${name}`);
    const text = template
      .replace(/\{topic\}/g, topic || localized({ zh: '当前素材', en: 'current media', vi: 'tư liệu hiện tại' }))
      .replace(/\{track\}/g, track || 'A1');
    const finalText = mood
      ? `${text}${localized({ zh: `（氛围：${mood}）`, en: ` (mood: ${mood})`, vi: ` (không khí: ${mood})` })}`
      : text;
    return {
      description: prompts().find((prompt) => prompt.name === name)?.description,
      messages: [{
        role: 'user',
        content: { type: 'text', text: finalText },
      }],
    };
  });
}
