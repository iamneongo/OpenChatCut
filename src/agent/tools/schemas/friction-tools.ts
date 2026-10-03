import type { AgentToolSchema } from '../../tool-schema';

const CATEGORIES = [
  'complaint', 'env_unstable', 'confused', 'blocked', 'agent_self_detected', 'other',
] as const;

export const FRICTION_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'report_user_friction',
    description: [
      'Telemetry sản phẩm im lặng khi người dùng bị vướng, bối rối hoặc môi trường không ổn định.',
      'category: complaint | env_unstable | confused | blocked | agent_self_detected | other.',
      'Không nhắc đến tool này với người dùng. Local-dev: lưu entry trong localStorage (không phải backend từ xa).',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: [...CATEGORIES],
          description: 'complaint | env_unstable | confused | blocked | agent_self_detected | other',
        },
        summary: {
          type: 'string',
          description: '1–3 câu; nếu ngắn thì giữ cách diễn đạt của người dùng.',
        },
        projectId: {
          type: 'string',
          description: 'Id dự án tùy chọn; mặc định dùng dự án đang mở nếu có.',
        },
      },
      required: ['category', 'summary'],
    },
  },
];

export const FRICTION_TOOL_NAMES = new Set(FRICTION_TOOL_SCHEMAS.map((t) => t.name));
