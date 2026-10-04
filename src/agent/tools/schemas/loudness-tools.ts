import type { AgentToolSchema } from '../../tool-schema';

export const LOUDNESS_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'normalize_loudness',
    description:
      'Chuẩn hóa đoạn âm thanh về độ lớn tích hợp mục tiêu (LUFS) bằng cách phân tích từng đoạn ngoại tuyến (WebAudio) và áp dụng gain tính được làm âm lượng đoạn. Mặc định là -14 LUFS (chuẩn độ lớn khi phát trực tuyến). Để chuẩn hóa NHIỀU/tất cả đoạn, gọi công cụ này MỘT LẦN và KHÔNG truyền itemId — một lần gọi sẽ xử lý mọi đoạn âm thanh trên dòng thời gian đang hoạt động và trả kết quả từng đoạn ({itemId, measuredLufs, gain}). KHÔNG gọi một lần cho từng đoạn. Chỉ truyền itemId khi muốn chuẩn hóa một đoạn cụ thể.',
    input_schema: {
      type: 'object',
      properties: {
        target: { type: 'number', description: 'Độ lớn tích hợp mục tiêu tính bằng LUFS (mặc định -14).' },
        itemId: { type: 'string', description: 'Chỉ chuẩn hóa đoạn này (chấp nhận tiền tố ID). Bỏ qua để chuẩn hóa mọi đoạn âm thanh.' },
      },
    },
  },
];

export const LOUDNESS_TOOL_NAMES = new Set(LOUDNESS_TOOL_SCHEMAS.map((t) => t.name));
