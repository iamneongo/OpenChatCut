import type { AgentToolSchema } from '../../tool-schema';

export const WATERMARK_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'update_watermark',
    description:
      'Bật/tắt và cấu hình watermark chữ trên timeline đang hoạt động. Watermark là một nhãn duy nhất được ghim vào một góc, hiển thị trong preview và được ghi vào mọi bản export. Chỉ truyền các trường muốn thay đổi (chúng sẽ gộp với watermark hiện tại). Đặt enabled:false để ẩn mà không mất text. Để hiển thị, hãy bật enabled VÀ truyền text không rỗng.',
    input_schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', description: 'Hiện (true) hoặc ẩn (false) watermark.' },
        text: { type: 'string', description: 'Nội dung nhãn watermark.' },
        position: { type: 'string', enum: ['tl', 'tr', 'bl', 'br'], description: 'Góc: tl=trên trái, tr=trên phải, bl=dưới trái, br=dưới phải.' },
        opacity: { type: 'number', minimum: 0, maximum: 1, description: 'Độ trong suốt overlay 0..1 (mặc định 0.7).' },
      },
    },
  },
];

export const WATERMARK_TOOL_NAMES = new Set(WATERMARK_TOOL_SCHEMAS.map((t) => t.name));
