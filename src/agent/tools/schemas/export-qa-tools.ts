import type { AgentToolSchema } from '../../tool-schema';

export const EXPORT_QA_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'verify_export',
    description: [
      'Kiểm tra chất lượng bản xuất video ĐÃ HOÀN TẤT trước khi giao.',
      'Truyền renderId từ submit_render_job/track_export, hoặc src bản xuất dưới /media/uploads/.',
      'Kiểm tra sự hiện diện của luồng, thời lượng, độ phân giải, tốc độ khung hình, khung đen/đứng hình, khoảng im lặng dài và đỉnh âm thanh.',
      'Trả về danh sách vấn đề có cấu trúc cùng bảng liên hệ trước/sau có nhãn quanh các điểm chỉnh sửa trên dòng thời gian.',
      'Chạy sau mỗi lần xuất quan trọng; xem cảnh báo và sửa dòng thời gian trước khi xuất lại nếu cần.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        renderId: { type: 'string', description: 'ID tác vụ kết xuất đã hoàn tất do submit_render_job trả về.' },
        src: { type: 'string', description: 'Đường dẫn bản xuất đã hoàn tất thay thế dưới /media/uploads/.' },
        maxCuts: { type: 'integer', minimum: 1, maximum: 8, description: 'Số điểm cắt tối đa đưa vào bảng bằng chứng; mặc định 8.' },
      },
    },
  },
];

export const EXPORT_QA_TOOL_NAMES = new Set(EXPORT_QA_TOOL_SCHEMAS.map((tool) => tool.name));
