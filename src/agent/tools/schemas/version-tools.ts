import type { AgentToolSchema } from '../../tool-schema';

export const VERSION_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'manage_versions',
  description:
    'Lịch sử phiên bản có tên của dự án (bảng Lịch sử phiên bản): liệt kê checkpoint, lưu dự án hiện tại thành ảnh chụp có tên, '
    + 'khôi phục ảnh chụp bằng cách thay thế toàn bộ dự án (propose→confirm, cùng luồng với undo), hoặc xóa phiên bản đã lưu. '
    + 'Phiên bản là các mốc giữa những lần làm việc — không phải ngăn xếp hoàn tác chi tiết. restore thay thế toàn bộ dự án đang mở.',
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'save', 'restore', 'delete'],
        description: 'list ảnh chụp; save tài liệu hiện tại; restore theo versionId; delete một ảnh chụp.',
      },
      name: {
        type: 'string',
        description: 'save: tên hiển thị cho checkpoint (ví dụ "Hoàn tất dựng thô").',
      },
      versionId: {
        type: 'string',
        description: 'restore/delete: ID phiên bản hoặc tiền tố duy nhất lấy từ list.',
      },
      confirm: {
        type: 'boolean',
        description:
          'restore: lần gọi đầu không có confirm sẽ trả về bản tóm tắt needsConfirm; gửi lại với confirm:true để applyDoc snapshot.',
      },
    },
    required: ['action'],
  },
}];

export const VERSION_TOOL_NAMES = new Set(VERSION_TOOL_SCHEMAS.map((tool) => tool.name));
