import type { AgentToolSchema } from '../../tool-schema';

export const EXPORT_QA_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'verify_export',
    description: [
      'Kiểm tra chất lượng bản export video ĐÃ HOÀN TẤT trước khi giao.',
      'Truyền renderId từ submit_render_job/track_export, hoặc src export dưới /media/uploads/.',
      'Kiểm tra sự hiện diện của stream, thời lượng, độ phân giải, frame rate, frame đen/đứng hình, khoảng im lặng dài và đỉnh âm thanh.',
      'Trả về danh sách issue có cấu trúc cùng contact sheet trước/sau có nhãn quanh các điểm chỉnh sửa trên timeline.',
      'Chạy sau mỗi lần export quan trọng; xem cảnh báo và sửa timeline trước khi export lại nếu cần.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        renderId: { type: 'string', description: 'ID render job đã hoàn tất do submit_render_job trả về.' },
        src: { type: 'string', description: 'Path export đã hoàn tất thay thế dưới /media/uploads/.' },
        maxCuts: { type: 'integer', minimum: 1, maximum: 8, description: 'Số điểm cắt tối đa đưa vào bảng bằng chứng; mặc định 8.' },
      },
    },
  },
];

export const EXPORT_QA_TOOL_NAMES = new Set(EXPORT_QA_TOOL_SCHEMAS.map((tool) => tool.name));
