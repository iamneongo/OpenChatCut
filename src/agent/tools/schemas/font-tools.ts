import type { AgentToolSchema } from '../../tool-schema';

export const FONT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'search_fonts',
    description: [
      'Tìm trong danh mục phông chữ mà bộ kết xuất cục bộ/headless có thể tải (Google Fonts được đóng gói trong ứng dụng',
      '+ các font chữ Hán của nhà đúc chữ được đóng gói cục bộ, source:"bundled"). Dùng khi xuất báo font không được hỗ trợ',
      'hoặc khi chọn fontFamily cho item đồ họa chuyển động / phụ đề. Kết quả trả về tên family chuẩn',
      'để dùng nguyên văn. Tìm theo chuỗi con trong tên family VÀ alias tên gốc',
      '(không phân biệt hoa thường/dấu câu) — ví dụ "inter", "playfair", "noto sc", "思源黑体", "得意黑",',
      '"抖音美好体". loadable=false nghĩa là font chỉ có trong catalog; hãy ưu tiên font thay thế có thể tải hoặc',
      'gọi confirmFontFallback khi xuất.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Chuỗi con để khớp tên family font hoặc alias tên gốc.',
        },
        projectId: {
          type: 'string',
          description: 'Bỏ qua; dùng dự án đang hoạt động.',
        },
      },
      required: ['query'],
    },
  },
];

export const FONT_TOOL_NAMES = new Set(FONT_TOOL_SCHEMAS.map((t) => t.name));
