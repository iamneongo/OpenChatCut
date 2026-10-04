import type { AgentToolSchema } from '../../tool-schema';
import { PLUGIN_SKILLS } from '../../skills/plugin-skills';

export const PLUGIN_SKILL_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'load_skill',
    description:
      'Tải một kỹ năng đóng gói hoặc kỹ năng tùy chỉnh đã chọn trong giới hạn đầu vào của lượt model hiện tại. Bỏ selector để tải SKILL.md; nếu bị phân trang, theo nextOffset tới null trước khi tải tệp hỗ trợ. Mỗi lần gọi chỉ một selector: hoặc files=[...] để tải nguyên các tệp bị bỏ qua, hoặc file cùng offset và limit để phân trang một tệp. Không bao giờ gửi file và files cùng lần gọi. Kỹ năng đóng gói: '
      + PLUGIN_SKILLS.map((skill: { slug: string }) => skill.slug).join(', ') + '.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Id kỹ năng, ví dụ "talking-head-guide", "voice", "shader-gen".' },
        file: { type: 'string', description: 'Một đường dẫn tương đối an toàn của tệp cần phân trang; dùng nextOffset trả về cho lần gọi tiếp theo. Bỏ hẳn key khi gửi files; không bao giờ truyền chuỗi rỗng.' },
        files: {
          type: 'array',
          description: 'Các đường dẫn tương đối an toàn tùy chọn lấy từ omittedFiles. Khi có, chỉ trả về nguyên các tệp này. Bỏ hẳn key khi phân trang bằng file; không bao giờ truyền mảng rỗng.',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 64,
        },
        offset: {
          type: 'integer',
          minimum: 0,
          description: 'Vị trí ký tự UTF-16 để phân trang tệp; không được cắt đôi cặp thay thế.',
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
