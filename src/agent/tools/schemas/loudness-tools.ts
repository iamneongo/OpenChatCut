import type { AgentToolSchema } from '../../tool-schema';

export const LOUDNESS_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'normalize_loudness',
    description:
      'Chuẩn hóa clip âm thanh về độ lớn tích hợp mục tiêu (LUFS) bằng cách phân tích từng clip ngoại tuyến (WebAudio) và áp dụng gain tính được làm âm lượng clip. Mặc định là -14 LUFS (chuẩn độ lớn khi phát trực tuyến). Để chuẩn hóa NHIỀU/tất cả clip, gọi tool này MỘT LẦN và KHÔNG truyền itemId — một lần gọi sẽ xử lý mọi clip âm thanh trên timeline đang hoạt động và trả kết quả từng clip ({itemId, measuredLufs, gain}). KHÔNG gọi một lần cho từng clip. Chỉ truyền itemId khi muốn chuẩn hóa một clip cụ thể.',
    input_schema: {
      type: 'object',
      properties: {
        target: { type: 'number', description: 'Độ lớn tích hợp mục tiêu tính bằng LUFS (mặc định -14).' },
        itemId: { type: 'string', description: 'Chỉ chuẩn hóa clip này (chấp nhận tiền tố id). Bỏ qua để chuẩn hóa mọi clip âm thanh.' },
      },
    },
  },
];

export const LOUDNESS_TOOL_NAMES = new Set(LOUDNESS_TOOL_SCHEMAS.map((t) => t.name));
