import type { AgentToolSchema } from '../../tool-schema';
import { PLUGIN_SKILLS } from '../../skills/plugin-skills';

export const PLUGIN_SKILL_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'load_skill',
    description:
      'Tải một skill đóng gói hoặc skill tùy chỉnh đã chọn trong giới hạn input của lượt model hiện tại. Bỏ selector để tải SKILL.md; nếu bị phân trang, theo nextOffset tới null trước khi tải file hỗ trợ. Mỗi lần gọi chỉ một selector: hoặc files=[...] để tải nguyên các file bị bỏ qua, hoặc file cùng offset và limit để phân trang một file. Không bao giờ gửi file và files cùng lần gọi. Skill đóng gói: '
      + PLUGIN_SKILLS.map((skill: { slug: string }) => skill.slug).join(', ') + '.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Id skill, ví dụ "talking-head-guide", "voice", "shader-gen".' },
        file: { type: 'string', description: 'Một path tương đối an toàn của file cần phân trang; dùng nextOffset trả về cho lần gọi tiếp theo. Bỏ hẳn key khi gửi files; không bao giờ truyền chuỗi rỗng.' },
        files: {
          type: 'array',
          description: 'Các path tương đối an toàn tùy chọn lấy từ omittedFiles. Khi có, chỉ trả về nguyên các file này. Bỏ hẳn key khi phân trang bằng file; không bao giờ truyền mảng rỗng.',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 64,
        },
        offset: {
          type: 'integer',
          minimum: 0,
          description: 'Offset ký tự UTF-16 để phân trang file; không được cắt đôi surrogate pair.',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 48_000,
          description: 'Số ký tự UTF-16 tối đa yêu cầu; runtime có thể trả trang nhỏ hơn nhưng chính xác để vừa giới hạn input hiện tại.',
        },
      },
      required: ['name'],
    },
  },
];

export const PLUGIN_SKILL_TOOL_NAMES = new Set(PLUGIN_SKILL_TOOL_SCHEMAS.map((t) => t.name));
