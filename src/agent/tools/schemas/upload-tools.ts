import type { AgentToolSchema } from '../../tool-schema';

const ASSET_TYPES = ['audio', 'gif', 'image', 'svg', 'video'] as const;

export const UPLOAD_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'import_media',
    description: [
      'Tạo một phiên nhập bên ngoài chính thức với một ô tải lên ngắn hạn, chỉ dùng một lần.',
      'Ô được ràng buộc với phiên, dự án, tư liệu, tên tệp, phương thức POST, loại MIME và số byte chính xác.',
      'Tải đúng số byte đã khai báo, sau đó truyền receipt opaque của máy chủ và assetType được phản hồi vào finalize_uploaded_asset.',
      'Không tư liệu nào trong kho được công bố trước khi finalize thành công.',
      'Chỉ truyền assetId khi muốn thay thế tư liệu hiện có trong kho; bỏ qua khi tạo tư liệu mới.',
      'Ưu tiên download_media cho URL công khai.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create_session'],
          description: 'Bắt buộc là create_session.',
        },
        assetId: {
          type: 'string',
          description: 'ID tư liệu hiện có trong kho hoặc tiền tố duy nhất cần thay thế, tùy chọn.',
        },
        assetType: {
          type: 'string',
          enum: [...ASSET_TYPES],
          description: 'audio|gif|image|svg|video.',
        },
        filename: { type: 'string', description: 'Tên tệp gốc an toàn dùng để giới hạn phạm vi tải lên.' },
        contentType: { type: 'string', description: 'Loại MIME, ví dụ video/mp4.' },
        size: { type: 'integer', minimum: 1, description: 'Số byte chính xác bắt buộc của tệp tải lên.' },
        projectId: { type: 'string', description: 'Bỏ qua; dùng dự án đang hoạt động.' },
      },
      required: ['action', 'assetType', 'filename', 'contentType', 'size'],
    },
  },
  {
    name: 'finalize_uploaded_asset',
    description: [
      'Hoàn tất số byte đã upload qua quy trình bàn giao upload bên ngoài.',
      'Truyền receipt không hiển thị cùng assetType từ phản hồi tải lên thành công; đường dẫn, mã băm, kích thước, tên tệp và loại tư liệu chính thức sẽ được máy chủ phân giải.',
      'Receipt được claim trong quá trình kiểm tra và chuẩn hóa, sau đó chỉ bị tiêu thụ khi commit asset thành công.',
      'durationInSeconds là bắt buộc trong schema với audio/video/gif; width/height có thể cung cấp metadata media.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        receipt: { type: 'string', description: 'Receipt opaque chỉ dùng một lần từ phản hồi upload thành công.' },
        assetType: {
          type: 'string',
          enum: [...ASSET_TYPES],
          description: 'Loại tư liệu được phản hồi tải lên gửi lại; phải khớp với receipt đáng tin cậy.',
        },
        durationInSeconds: { type: 'number', exclusiveMinimum: 0, description: 'Thời lượng của audio, gif hoặc video.' },
        width: { type: 'number', exclusiveMinimum: 0 },
        height: { type: 'number', exclusiveMinimum: 0 },
        fps: { type: 'number', exclusiveMinimum: 0, description: 'Siêu dữ liệu fps video tùy chọn (chỉ lưu khi hữu ích).' },
        hasAudioTrack: { type: 'boolean' },
        projectId: { type: 'string' },
      },
      required: ['receipt', 'assetType'],
      allOf: [{
        if: {
          properties: { assetType: { enum: ['audio', 'gif', 'video'] } },
          required: ['assetType'],
        },
        then: { required: ['durationInSeconds'] },
      }],
    },
  },
  {
    name: 'request_asset_download',
    description: [
      'Trả về URL/đường dẫn tải xuống dành cho người dùng của một tư liệu trong kho.',
      'Môi trường phát triển cục bộ: trả về asset.src (thường là /media/uploads/…). Không dùng cho đồ họa chuyển động không có src.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', description: 'ID tư liệu của dự án hoặc tiền tố duy nhất.' },
        variant: { type: 'string', description: 'Chỉ hỗ trợ "source".' },
        projectId: { type: 'string' },
      },
      required: ['assetId'],
    },
  },
];

export const UPLOAD_TOOL_NAMES = new Set(UPLOAD_TOOL_SCHEMAS.map((t) => t.name));
