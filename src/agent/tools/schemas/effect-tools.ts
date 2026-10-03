import type { AgentToolSchema } from '../../tool-schema';

export const EFFECT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'manage_effects',
    description:
      'Cách viết tắt để quản lý hiệu ứng WebGL theo từng clip. Ưu tiên browse_library rồi dùng edit_item adds:[{type:"effect",targetItemId,assetId}]. action=list trả về catalog; add/update/remove thay đổi stack hiệu ứng của clip. Cũng hỗ trợ assetId của LUT. Với zoom/transition dùng edit_item.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'add', 'update', 'remove'], description: 'Thao tác cần thực hiện.' },
        targetItemId: { type: 'string', description: 'Id clip cần tác động (chấp nhận tiền tố). Bắt buộc cho add/update/remove. Phải là clip video hoặc image.' },
        effectId: { type: 'string', description: 'update/remove: id instance hiệu ứng đích. Bỏ qua để chọn hiệu ứng đầu tiên.' },
        assetId: { type: 'string', description: 'add: hiệu ứng cần thêm, ví dụ "builtin:fx-luma-key". Lấy id từ action="list" hoặc browse_library.' },
        propertyOverrides: { type: 'object', description: 'add/update: patch một phần. Property số dùng number; màu dùng mảng RGB trong 0..1, ví dụ {"color":[1,0,0]}. Bỏ qua để dùng mặc định.' },
      },
      required: ['action'],
    },
  },
];

export const EFFECT_TOOL_NAMES = new Set(EFFECT_TOOL_SCHEMAS.map((t) => t.name));
