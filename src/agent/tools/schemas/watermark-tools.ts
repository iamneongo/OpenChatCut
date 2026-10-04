import type { AgentToolSchema } from '../../tool-schema';

export const WATERMARK_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'update_watermark',
    description:
      'Bật/tắt và cấu hình hình mờ chữ trên dòng thời gian đang hoạt động. Hình mờ là một nhãn duy nhất được ghim vào một góc, hiển thị trong bản xem trước và được ghi vào mọi bản xuất. Chỉ truyền các trường muốn thay đổi (chúng sẽ gộp với hình mờ hiện tại). Đặt enabled:false để ẩn mà không mất văn bản. Để hiển thị, hãy bật enabled VÀ truyền text không rỗng.',
    input_schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', description: 'Hiện (true) hoặc ẩn (false) hình mờ.' },
        text: { type: 'string', description: 'Nội dung nhãn hình mờ.' },
        position: { type: 'string', enum: ['tl', 'tr', 'bl', 'br'], description: 'Góc: tl=trên trái, tr=trên phải, bl=dưới trái, br=dưới phải.' },
        opacity: { type: 'number', minimum: 0, maximum: 1, description: 'Độ trong suốt lớp phủ 0..1 (mặc định 0.7).' },
      },
    },
  },
];

export const WATERMARK_TOOL_NAMES = new Set(WATERMARK_TOOL_SCHEMAS.map((t) => t.name));
