import type { AgentToolSchema } from '../../tool-schema';

export const SKILL_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'manage_skill',
  description: [
    'Kỹ năng sáng tạo tùy chỉnh là hướng dẫn quy trình có thể tái sử dụng trong bodyMarkdown. Kỹ năng xuất hiện cạnh kỹ năng dựng sẵn trong bộ chọn Creative Mode và được tải qua load_skill sau khi chọn.',
    'action: list | get | current | activate | create | update | delete.',
    'list trả về mọi skill dựng sẵn và tùy chỉnh chỉ đọc với id/slug/name/summary cùng activeSkillId.',
    'get với skillId trả về chi tiết gồm toàn bộ nội dung và cờ builtin.',
    'current trả về creative mode đang hoạt động hoặc active:null.',
    'activate với skillId chuyển creative mode của dự án; truyền chuỗi rỗng để xóa. Tin nhắn tiếp theo được hướng dẫn tải skill đã chọn trước khi hành động.',
    'create với name + body và summary/scenarios tùy chọn sẽ tạo kỹ năng tùy chỉnh và id; name trong phần đầu SKILL.md trở thành slug load_skill.',
    'update với skillId và các trường thay đổi sẽ sửa kỹ năng tùy chỉnh; kỹ năng dựng sẵn chỉ đọc.',
    'delete với skillId xóa kỹ năng tùy chỉnh; không thể xóa kỹ năng dựng sẵn.',
  ].join(' '),
  input_schema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['list', 'get', 'current', 'activate', 'create', 'update', 'delete'] },
      skillId: { type: 'string', description: 'Id kỹ năng đích cho get/update/delete/activate; gọi list trước. Truyền chuỗi rỗng cho activate để xóa Creative Mode.' },
      name: { type: 'string', description: 'create/update: tên hiển thị; bắt buộc và không rỗng khi create.' },
      body: { type: 'string', description: 'create/update: quy trình Markdown do load_skill trả về; bắt buộc và không rỗng khi create.' },
      summary: { type: 'string', description: 'create/update: mô tả một dòng tùy chọn; create mặc định theo name.' },
      scenarios: { type: 'array', items: { type: 'string' }, description: 'create/update: từ khóa kịch bản kích hoạt, tùy chọn.' },
    },
    required: ['action'],
  },
}];

export const SKILL_TOOL_NAMES = new Set(SKILL_TOOL_SCHEMAS.map((t) => t.name));
