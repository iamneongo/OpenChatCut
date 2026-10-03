import type { AgentToolSchema } from '../../tool-schema';

export const AUTO_GRADE_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'auto_grade',
  description:
    'Tự động hiệu chỉnh màu kỹ thuật cho media trong pool đã nhập vào timeline (video/image/gif dưới /media/uploads). '
    + 'action=analyze đo độ sáng/tương phản/bão hòa và trả về filter đề xuất mà không ghi thay đổi. '
    + 'action=apply phân tích rồi ghi setFilters lên từng mục tiêu trong một batch undo. '
    + 'Chỉ dọn màu trung tính — không phải LUT/look sáng tạo (dùng browse_library + edit_item cho các trường hợp đó). '
    + 'Nên dùng inspect_color sau apply để kiểm tra các chỉ số. itemIds là tùy chọn; bỏ qua để grade mọi clip đủ điều kiện trên timeline đang hoạt động.',
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['analyze', 'apply'],
        description: 'analyze = chỉ xem trước đề xuất; apply = phân tích + ghi filter.',
      },
      itemIds: {
        type: 'string',
        description: 'Các id/tiền tố clip, phân tách bằng dấu phẩy. Bỏ qua để chọn mọi clip video/image/gif đủ điều kiện có source /media/uploads.',
      },
    },
    required: ['action'],
  },
}];

export const AUTO_GRADE_TOOL_NAMES = new Set(AUTO_GRADE_TOOL_SCHEMAS.map((tool) => tool.name));
