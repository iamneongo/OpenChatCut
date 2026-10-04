import type { AgentToolSchema } from '../../tool-schema';

export const RUN_SKILL_SCRIPT_TOOL_NAMES = new Set(['run_skill_script']);

export const RUN_SKILL_SCRIPT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'run_skill_script',
    description: 'Chạy script trong thư mục kỹ năng đã cài trên máy (lệnh trong danh sách cho phép: bash/sh/node/npm/npx/python3/python/uv/uvx/ffmpeg/ffprobe/mkdir/cp/chmod); thư mục làm việc được khóa trong thư mục kỹ năng. Dùng để chạy các script xác định đi kèm kỹ năng (như render.mjs, check-deps.sh); hộp cát đám mây không thể truy cập tệp kỹ năng trên máy. Thời gian chờ mặc định 60 giây, tối đa 120 giây; đầu ra tối đa 512 KB.',
    input_schema: {
      type: 'object',
      properties: {
        skill: { type: 'string', description: 'Mã định danh của kỹ năng (trường skill do load_skill trả về)' },
        command: { type: 'string', description: 'Lệnh (từ đầu tiên phải là chương trình trong danh sách cho phép), ví dụ bash scripts/check-deps.sh hoặc node scripts/render.mjs' },
        timeout: { type: 'number', description: 'Tùy chọn: thời gian chờ tính bằng mili giây, mặc định 60000, tối đa 120000' },
      },
      required: ['skill', 'command'],
    },
  },
];
