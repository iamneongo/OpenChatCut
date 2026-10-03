import type { AgentToolSchema } from '../../tool-schema';

export const MULTICAM_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'multicam_sync',
    description: [
      'Đồng bộ multicam bền vững. Ưu tiên source timecode đã chuẩn hóa, sau đó capture clock, rồi fallback sang',
      'tương quan audio theo từng góc máy. Tạo hoặc cập nhật group bền vững với reference/master, snapshot nguồn,',
      'offset, độ tin cậy và bằng chứng đồng bộ; mọi placement và metadata được commit thành một thay đổi trạng thái có thể undo.',
      'Mọi góc máy được chọn phải dùng cùng playback rate; hãy thống nhất rate trước khi thử lại sync bị từ chối.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        itemIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Id item timeline cho mọi góc (reference + follower). Tối thiểu 2.',
        },
        referenceItemId: {
          type: 'string',
          description: 'Id góc reference tùy chọn (phải nằm trong itemIds). Mặc định là clip video đầu tiên.',
        },
        groupId: {
          type: 'string',
          description: 'Id group multicam hiện có cần cập nhật. Bỏ qua để tạo hoặc tìm group từ các item đã chọn.',
        },
        masterItemId: {
          type: 'string',
          description: 'Id item góc program/master tùy chọn. Mặc định referenceItemId.',
        },
      },
      required: ['itemIds'],
    },
  },
  {
    name: 'change_cam',
    description: [
      'Chuyển góc multicam theo khoảng một cách bền vững. Truyền groupId + targetAngleId và [fromSeconds,toSeconds); editor',
      'dùng planner split/remove không ripple, khôi phục coverage nguồn khi quyết định trước đó đã loại góc đó,',
      'và lưu quyết định góc mở bên phải có thể thay thế. Toàn bộ kết quả commit một lần; lỗi thì không commit gì.',
      'Vẫn chấp nhận itemIds + targetItemId cũ cho group được tạo bởi multicam_sync.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'string',
          description: 'Id group multicam bền vững. Ưu tiên hơn itemIds.',
        },
        targetAngleId: {
          type: 'string',
          description: 'Id góc bền vững (hoặc id item gốc) cần hiển thị.',
        },
        itemIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tra cứu group cũ: id hiện tại/gốc của các góc đã truyền trước đó vào multicam_sync.',
        },
        targetItemId: { type: 'string', description: 'Alias cũ của targetAngleId.' },
        fromSeconds: { type: 'number', description: 'Thời điểm bắt đầu chuyển, tính bằng giây trên timeline.' },
        toSeconds: { type: 'number', description: 'Thời điểm kết thúc (không bao gồm), tính bằng giây trên timeline. Mặc định: cuối source đích.' },
      },
      required: ['fromSeconds'],
    },
  },
  {
    name: 'manage_link_group',
    description: [
      'Tạo hoặc xóa quan hệ chỉnh sửa timeline bền vững trong một thay đổi có thể undo.',
      'action=link ghép thao tác move, trim và remove của A/V; action=sync_lock giữ timing group qua move trực tiếp',
      'và chỉnh sửa ripple; action=unlink xóa các membership đã chọn. Truyền từ 2 itemId trở lên cho link/sync_lock.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['link', 'sync_lock', 'unlink'] },
        itemIds: { type: 'array', items: { type: 'string' } },
        anchorItemId: { type: 'string', description: 'Anchor tùy chọn; mặc định là item đã phân giải đầu tiên.' },
      },
      required: ['action', 'itemIds'],
    },
  },
];

export const MULTICAM_TOOL_NAMES = new Set(MULTICAM_TOOL_SCHEMAS.map((t) => t.name));
