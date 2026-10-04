import type { AgentToolSchema } from '../../tool-schema';

export const TEMPLATE_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'manage_template',
  description: [
    'Mẫu dự án đóng gói đồ họa chuyển động và phong cách thiết kế để tái sử dụng giữa các dự án.',
    'action: get | list_assets | apply | copy_assets | save.',
    'get không có templateId sẽ liệt kê các mẫu đã lưu cùng ID/tên/số tư liệu; get có templateId trả về đồ họa chuyển động, tóm tắt phong cách thiết kế và số tư liệu.',
    'list_assets với templateId liệt kê tư liệu đóng gói theo ID/tên/loại để chọn tái sử dụng hay sinh lại; gọi trước apply.',
    'apply với templateId áp dụng mẫu vào dự án hiện tại. placement nhận append/replace hoặc startFrame, durationInFrames, targetTrackId chính xác. omitAssetIds bỏ qua tư liệu đóng gói và đoạn tham chiếu trực tiếp tới chúng.',
    'copy_assets với templateId chỉ sao chép tư liệu đóng gói vào dự án hiện tại và trả về ID tư liệu cục bộ mới mà không đặt dòng thời gian của mẫu.',
    'save với name đóng gói dự án hiện tại thành mẫu và thay thế mẫu cùng tên.',
  ].join(' '),
  input_schema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['get', 'list_assets', 'apply', 'copy_assets', 'save'] },
      templateId: { type: 'string', description: 'ID mẫu đích cho get details/list_assets/apply/copy_assets; gọi get không tham số để liệt kê mẫu trước.' },
      placement: {
        description: 'apply: append/replace, hoặc object chỉ định frame bắt đầu, tổng thời lượng đích và rãnh chính đích.',
        oneOf: [
          { type: 'string', enum: ['append', 'replace'] },
          {
            type: 'object',
            properties: {
              startFrame: { type: 'integer', minimum: 0 },
              durationInFrames: { type: 'integer', exclusiveMinimum: 0 },
              targetTrackId: { type: 'string' },
            },
            additionalProperties: false,
          },
        ],
      },
      omitAssetIds: { type: 'array', items: { type: 'string' }, description: 'apply: bỏ qua các tư liệu đóng gói này và đoạn tham chiếu trực tiếp tới chúng.' },
      name: { type: 'string', description: 'save: tên mẫu bắt buộc; thay thế mẫu cùng tên.' },
    },
    required: ['action'],
  },
}];

export const TEMPLATE_TOOL_NAMES = new Set(TEMPLATE_TOOL_SCHEMAS.map((t) => t.name));
