import type { AgentToolSchema } from '../../tool-schema';

/** Cross-project full-text search over chats, captions and transcripts. */
export const SEARCH_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'search_content',
    description: [
      'Tìm nội dung dự án trong thư viện cục bộ: tin nhắn chat agent, text caption và',
      'từ transcript (FTS5, phân đoạn có hỗ trợ tiếng Trung). Dùng khi người dùng hỏi "tôi đã',
      'nói X ở đâu" / "dự án nào có caption về Y" / hoặc nhắc tới chỉnh sửa hay từ trước đó.',
      'Trả về kind cho từng kết quả (chat|caption|transcript), projectId, ref và score, sắp xếp tốt nhất trước.',
      'Query được phân đoạn bằng cùng dictionary với index nên từ tiếng Trung 2 ký tự vẫn hoạt động.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nội dung cần tìm, ví dụ âm lượng nhạc nền / kiểu phụ đề / bãi biển lúc hoàng hôn' },
        projectId: {
          type: 'string',
          description: 'Id dự án tùy chọn để giới hạn tìm kiếm; bỏ qua để tìm mọi dự án.',
        },
        limit: { type: 'number', description: 'Số kết quả tối đa tùy chọn (mặc định 20, tối đa 50).' },
      },
      required: ['query'],
    },
  },
];

export const SEARCH_TOOL_NAMES: ReadonlySet<string> = new Set(
  SEARCH_TOOL_SCHEMAS.map((tool) => tool.name),
);
