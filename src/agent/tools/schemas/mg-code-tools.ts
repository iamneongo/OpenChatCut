import type { AgentToolSchema } from '../../tool-schema';

export const MG_CODE_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'create_motion_graphic_from_code',
    description: [
      'Tạo tư liệu đồ họa chuyển động mới từ mã React/JSX inline.',
      'Bắt buộc: code, name, width, height. Thời lượng qua durationInFrames hoặc durationInSeconds.',
      'JSX HOÀN CHỈNH phải nằm trong một lần gọi này — không khai báo trước rồi điền sau; gọi không có code sẽ bị từ chối.',
      'Mã phải vượt qua sandbox MG cục bộ (giống edit_asset). Không tự đặt lên dòng thời gian —',
      'dùng edit_item / add_motion_graphic / manage_media_pool để đặt sau đó.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'React/JSX đồ họa chuyển động inline. Không phải đường dẫn tệp.' },
        name: { type: 'string', description: 'Tên hiển thị tư liệu.' },
        width: { type: 'number', description: 'Chiều rộng hộp tự nhiên tính bằng pixel.' },
        height: { type: 'number', description: 'Chiều cao hộp tự nhiên tính bằng pixel.' },
        durationInFrames: {
          type: 'number',
          description: 'Thời lượng tính bằng frame trên dòng thời gian (loại trừ lẫn nhau với durationInSeconds).',
        },
        durationInSeconds: {
          type: 'number',
          description: 'Thời lượng tính bằng giây (loại trừ lẫn nhau với durationInFrames).',
        },
        description: { type: 'string', description: 'Mô tả dành cho người dùng, tùy chọn (lưu trong props).' },
        properties: {
          type: 'array',
          description: 'Props có thể chỉnh sửa: { key, label?, type?, defaultValue }[].',
          items: {},
        },
        projectId: { type: 'string', description: 'Bỏ qua; dùng dự án đang hoạt động.' },
      },
      required: ['code', 'name', 'width', 'height'],
    },
  },
];

export const MG_CODE_TOOL_NAMES = new Set(MG_CODE_TOOL_SCHEMAS.map((t) => t.name));
