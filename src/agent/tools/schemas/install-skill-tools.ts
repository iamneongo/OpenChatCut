import type { AgentToolSchema } from '../../tool-schema';


export const INSTALL_SKILL_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'install_skill',
    description: 'Cài một kho kỹ năng từ GitHub vào thư mục kỹ năng trên máy (~/.openchatcut/skills/<slug>/), bao gồm đầy đủ SKILL.md và references/scripts/assets/examples. Sau khi cài, kỹ năng sẽ tự xuất hiện trong bảng “Kỹ năng” của thư viện; có thể kích hoạt bằng /skill:<slug> hoặc từ bảng. repo nhận URL GitHub hoặc owner/repo (ví dụ "Jane-xiaoer/paper-collage-ad-codex"). slug là tùy chọn, mặc định lấy name trong SKILL.md hoặc tên repo.',
    input_schema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'Kho GitHub: URL đầy đủ (https://github.com/owner/repo) hoặc owner/repo' },
        slug: { type: 'string', description: 'Tùy chọn: tên thư mục cài đặt (phải ở dạng kebab-case), mặc định lấy name trong phần đầu của SKILL.md hoặc tên repo' },
      },
      required: ['repo'],
    },
  },
];

export const INSTALL_SKILL_TOOL_NAMES = new Set(INSTALL_SKILL_TOOL_SCHEMAS.map((t) => t.name));
