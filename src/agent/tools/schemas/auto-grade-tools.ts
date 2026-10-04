import type { AgentToolSchema } from '../../tool-schema';

export const AUTO_GRADE_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'auto_grade',
  description:
    'Tự động hiệu chỉnh màu kỹ thuật cho tư liệu trong kho đã nhập vào dòng thời gian (video/hình ảnh/gif dưới /media/uploads). '
    + 'action=analyze đo độ sáng/tương phản/bão hòa và trả về bộ lọc đề xuất mà không ghi thay đổi. '
    + 'action=apply phân tích rồi ghi setFilters lên từng mục tiêu trong một nhóm thao tác có thể hoàn tác. '
    + 'Chỉ dọn màu trung tính — không phải LUT/look sáng tạo (dùng browse_library + edit_item cho các trường hợp đó). '
    + 'Nên dùng inspect_color sau apply để kiểm tra các chỉ số. itemIds là tùy chọn; bỏ qua để hiệu chỉnh màu mọi đoạn đủ điều kiện trên dòng thời gian đang hoạt động.',
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['analyze', 'apply'],
        description: 'analyze = chỉ xem trước đề xuất; apply = phân tích + ghi bộ lọc.',
      },
      itemIds: {
        type: 'string',
        description: 'Các ID/tiền tố đoạn, phân tách bằng dấu phẩy. Bỏ qua để chọn mọi đoạn video/hình ảnh/gif đủ điều kiện có nguồn /media/uploads.',
      },
    },
    required: ['action'],
  },
}];

export const AUTO_GRADE_TOOL_NAMES = new Set(AUTO_GRADE_TOOL_SCHEMAS.map((tool) => tool.name));
