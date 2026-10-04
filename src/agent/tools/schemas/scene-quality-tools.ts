import type { AgentToolSchema } from '../../tool-schema';

export const SCENE_QUALITY_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'review_scene_plan',
    description: [
      'Rà soát mang tính tư vấn một kế hoạch nhiều cảnh để phát hiện lặp lại, hình ảnh trang trí, lạm dụng thẻ tĩnh và ngôn ngữ chung chung.',
      'Trả về điểm rủi ro chuẩn hóa 0–5, lời khuyên sửa và số thứ tự các cảnh bị ảnh hưởng.',
      'Báo cáo chỉ là tư vấn tùy chọn, không bao giờ chặn hoặc cấp phép submit_image/submit_video.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        scenes: {
          type: 'array',
          minItems: 1,
          description: 'Các cảnh theo thứ tự cần rà soát. So sánh type sẽ bỏ khoảng trắng và không phân biệt hoa thường; trường trách nhiệm trống được tính là thiếu.',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Dạng cảnh, ví dụ video, image, text_card, chart.' },
              description: { type: 'string', description: 'Mô tả hình ảnh cụ thể.' },
              shotIntent: { type: 'string', description: 'Lý do cảnh quay này tồn tại.' },
              informationRole: { type: 'string', description: 'Cảnh này truyền đạt điều gì.' },
            },
            required: ['type'],
            additionalProperties: false,
          },
        },
      },
      required: ['scenes'],
      additionalProperties: false,
    },
  },
];

export const SCENE_QUALITY_TOOL_NAMES = new Set(SCENE_QUALITY_TOOL_SCHEMAS.map((tool) => tool.name));
