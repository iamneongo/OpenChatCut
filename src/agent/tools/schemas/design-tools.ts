import type { AgentToolSchema } from '../../tool-schema';

const COLOR_ROLES = ['primary', 'secondary', 'accent', 'background', 'text'];
const FONT_ROLES = ['heading', 'body'];

export const DESIGN_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'manage_design_style',
  description: [
    'Quản lý phong cách thiết kế (thương hiệu) của dự án. Phong cách được áp dụng là thương hiệu của dự án và chi phối màu, phông chữ dùng cho đồ họa chuyển động và phụ đề.',
    'action: list | get | apply | update | clear | save | delete.',
    'list và get chỉ đọc, không bao giờ cần phê duyệt; apply/clear và update không đổi presetId chỉ thay đổi ProjectDoc theo cách có thể hoàn tác.',
    'apply áp dụng presetId (preset dựng sẵn hoặc do người dùng lưu) hoặc designSpec tùy chỉnh vào dự án; applyToProject mặc định là true.',
    'save, delete và update có presetId sẽ thay đổi thư viện bền vững “Phong cách của tôi” và luôn cần xác nhận lâu dài trước khi thực thi.',
    'save lưu designSpec, hoặc phong cách hiện tại của dự án nếu bỏ qua designSpec, vào thư viện người dùng; name là bắt buộc, scenarios/thumbnailUrl là tùy chọn; không thể cập nhật hoặc xóa preset dựng sẵn.',
    'Dạng designSpec/patch: {colors:[{role,value}], fonts:[{family,role}], styleGuide}.',
    `role là trường tự do, ví dụ "accent copper", "text secondary" hoặc "Chinese heading". Vai trò màu thường dùng: ${COLOR_ROLES.join('/')}; vai trò font: ${FONT_ROLES.join('/')}; cho phép các vai trò khác.`,
    'styleGuide có thể chứa đặc tả chi tiết về chuyển động, độ nảy và độ trễ tuần tự.',
    'colors/fonts cũng nhận dạng object cũ, ví dụ {colors:{primary:"#..."}, fonts:{heading:"Inter"}}; hệ thống sẽ chuẩn hóa thành mảng.',
  ].join(' '),
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      action: { type: 'string', enum: ['list', 'get', 'apply', 'update', 'clear', 'save', 'delete'] },
      presetId: { type: 'string', description: 'apply/delete: id phong cách từ preset dựng sẵn hoặc phong cách người dùng đã lưu; gọi list trước.' },
      designSpec: { type: 'string', description: 'apply/save: JSON phong cách tùy chỉnh chứa colors/fonts/styleGuide.' },
      patch: { type: 'string', description: 'update: JSON một phần chỉ chứa các trường cần thay đổi.' },
      applyToProject: { type: 'boolean', description: 'apply: áp dụng ngay vào dự án hiện tại; mặc định true.' },
      name: { type: 'string', description: 'save: tên phong cách bắt buộc; thay thế phong cách hiện có cùng tên.' },
      rename: { type: 'string', description: 'update + presetId: tên mới cho phong cách đã lưu; tên trùng được thêm hậu tố số.' },
      scenarios: { type: 'array', items: { type: 'string' }, description: 'save/update: các nhãn kịch bản; mảng rỗng sẽ xóa chúng.' },
      scenario: { type: 'string', description: 'list: chỉ trả về các phong cách có nhãn kịch bản này.' },
      thumbnailUrl: { type: 'string', description: 'save/update: URL ảnh bìa cho bộ chọn phong cách; không dùng để sinh nội dung.' },
      clearThumbnail: { type: 'boolean', description: 'update + presetId: xóa ảnh bìa mà không xóa phong cách.' },
    },
    required: ['action'],
  },
}];

export const DESIGN_TOOL_NAMES = new Set(DESIGN_TOOL_SCHEMAS.map((t) => t.name));
