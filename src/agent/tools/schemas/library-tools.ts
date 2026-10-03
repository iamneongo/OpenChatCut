import type { AgentToolSchema } from '../../tool-schema';

const LIBRARY_CATEGORIES = [
  'motion-graphics', 'luts', 'zoom', 'fx', 'audio-fx', 'sound-effects', 'transitions',
] as const;

export const LIBRARY_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'browse_library',
    description:
      'Duyệt thư viện OpenChatCut (không phải media pool của người dùng). Các category tương ứng với tab Library: motion-graphics, luts, zoom, fx, audio-fx, sound-effects, transitions. Cách dùng: (1) chỉ category → tổng quan nhóm; (2) category+group hoặc query → danh sách id/name/description; (3) id → chi tiết đầy đủ + hướng dẫn dùng edit_item. Sau khi tìm được asset, hãy đưa vào bằng edit_item (effect/transition/zoom/audio).',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: [...LIBRARY_CATEGORIES],
          description: 'Bộ lọc tab Library tùy chọn.',
        },
        group: { type: 'string', description: 'Nhóm tùy chọn trong category (ví dụ category template hoặc tên nhóm âm thanh).' },
        query: { type: 'string', description: 'Tìm không phân biệt hoa thường trong id/name/description/group. Trả về danh sách.' },
        id: { type: 'string', description: 'Id chính xác của asset thư viện để xem chi tiết + hướng dẫn sử dụng.' },
        limit: { type: 'number', description: 'Số kết quả tối đa (mặc định 30, tối đa 50).' },
        offset: { type: 'number', description: 'Vị trí bắt đầu danh sách (mặc định 0).' },
      },
    },
  },
];

export const LIBRARY_TOOL_NAMES = new Set(LIBRARY_TOOL_SCHEMAS.map((t) => t.name));
