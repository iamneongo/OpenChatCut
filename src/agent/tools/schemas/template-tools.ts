import type { AgentToolSchema } from '../../tool-schema';

export const TEMPLATE_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'manage_template',
  description: [
    'Template dự án đóng gói đồ họa chuyển động và phong cách thiết kế để tái sử dụng giữa các dự án.',
    'action: get | list_assets | apply | copy_assets | save.',
    'get không có templateId sẽ liệt kê template đã lưu cùng id/name/số asset; get có templateId trả về motion graphic, tóm tắt phong cách thiết kế và số asset.',
    'list_assets với templateId liệt kê media asset đóng gói theo id/name/kind để chọn tái sử dụng hay sinh lại; gọi trước apply.',
    'apply với templateId áp dụng template vào dự án hiện tại. placement nhận append/replace hoặc startFrame, durationInFrames, targetTrackId chính xác. omitAssetIds bỏ qua asset đóng gói và clip tham chiếu trực tiếp tới chúng.',
    'copy_assets với templateId chỉ sao chép asset đóng gói vào dự án hiện tại và trả về id asset cục bộ mới mà không đặt timeline của template.',
    'save với name đóng gói dự án hiện tại thành template và thay thế template cùng tên.',
  ].join(' '),
  input_schema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['get', 'list_assets', 'apply', 'copy_assets', 'save'] },
      templateId: { type: 'string', description: 'Id template đích cho get details/list_assets/apply/copy_assets; gọi get không tham số để liệt kê template trước.' },
      placement: {
        description: 'apply: append/replace, hoặc object chỉ định frame bắt đầu, tổng thời lượng đích và track chính đích.',
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
      omitAssetIds: { type: 'array', items: { type: 'string' }, description: 'apply: bỏ qua các asset đóng gói này và clip tham chiếu trực tiếp tới chúng.' },
      name: { type: 'string', description: 'save: tên template bắt buộc; thay thế template cùng tên.' },
    },
    required: ['action'],
  },
}];

export const TEMPLATE_TOOL_NAMES = new Set(TEMPLATE_TOOL_SCHEMAS.map((t) => t.name));
