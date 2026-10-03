import type { AgentToolSchema } from '../../tool-schema';

export const FOLLOWUP_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'ask_followup_questions',
  description:
    'Đặt tối đa 12 câu hỏi bổ sung cho người dùng trong card tương tác, sau đó CHỜ tin nhắn tiếp theo. Mỗi field nhận type "single", "multi" hoặc "text" và variant "default", "visual", "voice" hoặc "scenario". Option nhận id/label (hoặc value/display), description, preview/media, audioUrl, aspectRatio và submitPrompt. Dùng field text cho câu trả lời tự do, visual cho lựa chọn ảnh, voice cho lựa chọn giọng có thể phát và scenario cho lựa chọn workflow.',
  input_schema: {
    type: 'object',
    properties: {
      fields: {
        type: 'array',
        description: 'Các field: { id, label, type, variant?, description?, placeholder?, otherPlaceholder?, options?, required?, allowOther? }.',
        items: { type: 'object' },
      },
      prompt: { type: 'string', description: 'Text tùy chọn hiển thị phía trên card.' },
      title: { type: 'string', description: 'Tiêu đề card tùy chọn.' },
      submitLabel: { type: 'string', description: 'Nhãn nút gửi tùy chọn.' },
      messagePrefix: { type: 'string', description: 'Tiền tố tùy chọn đặt trước câu trả lời đã gửi.' },
    },
    required: ['fields'],
  },
}];

export const FOLLOWUP_TOOL_NAMES = new Set(FOLLOWUP_TOOL_SCHEMAS.map((t) => t.name));
