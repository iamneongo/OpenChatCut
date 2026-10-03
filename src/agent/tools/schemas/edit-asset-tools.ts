import type { AgentToolSchema } from '../../tool-schema';

export const EDIT_ASSET_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'edit_asset',
    description: [
      'Cập nhật hoặc xóa asset trong media pool, không phải clip timeline; dùng move_item/remove_item cho clip.',
      'action=update thay đổi name, props hoặc metadata sourceTimecode/captureClock chính xác; asset code như đồ họa chuyển động được sinh có thể nhận code mới,',
      'nhưng code phải vượt qua bước biên dịch sandbox trước khi lưu thay đổi. Metadata đồng hồ dùng frameCount + frameRate dạng hữu tỉ + dropFrame đã chuẩn hóa.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['update', 'delete'] },
        assetId: { type: 'string', description: 'Id asset đích hoặc tiền tố duy nhất.' },
        name: { type: 'string', description: 'update: tên hiển thị mới.' },
        code: { type: 'string', description: 'update: source mới cho asset code như đồ họa chuyển động; được kiểm tra bằng sandbox.' },
        props: { type: 'object', description: 'update: gộp vào props của asset để thay đổi giá trị mặc định.' },
        favorite: { type: 'boolean', description: 'update: cờ yêu thích.' },
        sourceTimecode: {
          type: 'object',
          description: 'Timecode nhúng đã chuẩn hóa: {frameCount, frameRate:{numerator,denominator}, dropFrame}.',
          properties: {
            frameCount: { type: 'number' },
            frameRate: {
              type: 'object',
              properties: { numerator: { type: 'number' }, denominator: { type: 'number' } },
              required: ['numerator', 'denominator'],
            },
            dropFrame: { type: 'boolean' },
          },
          required: ['frameCount', 'frameRate', 'dropFrame'],
        },
        captureClock: {
          type: 'object',
          description: 'Đồng hồ ghi hình đã chuẩn hóa với đúng cấu trúc như sourceTimecode.',
          properties: {
            frameCount: { type: 'number' },
            frameRate: {
              type: 'object',
              properties: { numerator: { type: 'number' }, denominator: { type: 'number' } },
              required: ['numerator', 'denominator'],
            },
            dropFrame: { type: 'boolean' },
          },
          required: ['frameCount', 'frameRate', 'dropFrame'],
        },
        clearSourceTimecode: { type: 'boolean', description: 'update: xóa metadata timecode nguồn được nhúng.' },
        clearCaptureClock: { type: 'boolean', description: 'update: xóa metadata đồng hồ ghi hình.' },
        confirm: { type: 'boolean', description: 'delete: xác nhận xóa khi clip vẫn tham chiếu asset (confirmImpact).' },
      },
      required: ['action', 'assetId'],
    },
  },
];

export const EDIT_ASSET_TOOL_NAMES = new Set(EDIT_ASSET_TOOL_SCHEMAS.map((t) => t.name));
