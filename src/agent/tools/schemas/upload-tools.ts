import type { AgentToolSchema } from '../../tool-schema';

const ASSET_TYPES = ['audio', 'gif', 'image', 'svg', 'video'] as const;

export const UPLOAD_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'import_media',
    description: [
      'Tạo một phiên import bên ngoài chính thức với một slot upload ngắn hạn, chỉ dùng một lần.',
      'Slot được ràng buộc với session, project, asset, filename, phương thức POST, MIME type và số byte chính xác.',
      'Upload đúng số byte đã khai báo, sau đó truyền receipt opaque của server và assetType được phản hồi vào finalize_uploaded_asset.',
      'Không asset nào trong media pool được publish trước khi finalize thành công.',
      'Chỉ truyền assetId khi muốn thay thế asset hiện có trong pool; bỏ qua khi tạo asset mới.',
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
          description: 'Id asset hiện có trong media pool hoặc tiền tố duy nhất cần thay thế, tùy chọn.',
        },
        assetType: {
          type: 'string',
          enum: [...ASSET_TYPES],
          description: 'audio|gif|image|svg|video.',
        },
        filename: { type: 'string', description: 'Tên file gốc an toàn dùng để giới hạn phạm vi upload.' },
        contentType: { type: 'string', description: 'MIME type, ví dụ video/mp4.' },
        size: { type: 'integer', minimum: 1, description: 'Số byte chính xác bắt buộc của file upload.' },
        projectId: { type: 'string', description: 'Bỏ qua; dùng dự án đang hoạt động.' },
      },
      required: ['action', 'assetType', 'filename', 'contentType', 'size'],
    },
  },
  {
    name: 'finalize_uploaded_asset',
    description: [
      'Hoàn tất số byte đã upload qua quy trình bàn giao upload bên ngoài.',
      'Truyền receipt opaque cùng assetType từ phản hồi upload thành công; path, hash, size, filename và media type có thẩm quyền sẽ được server phân giải.',
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
          description: 'Media type được phản hồi upload gửi lại; phải khớp với receipt đáng tin cậy.',
        },
        durationInSeconds: { type: 'number', exclusiveMinimum: 0, description: 'Thời lượng của audio, gif hoặc video.' },
        width: { type: 'number', exclusiveMinimum: 0 },
        height: { type: 'number', exclusiveMinimum: 0 },
        fps: { type: 'number', exclusiveMinimum: 0, description: 'Metadata fps video tùy chọn (chỉ lưu khi hữu ích).' },
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
      'Trả về URL/path download dành cho người dùng của một asset trong media pool.',
      'Local-dev: trả về asset.src (thường là /media/uploads/…). Không dùng cho motion graphic không có src.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', description: 'ID asset của dự án hoặc tiền tố duy nhất.' },
        variant: { type: 'string', description: 'Chỉ hỗ trợ "source".' },
        projectId: { type: 'string' },
      },
      required: ['assetId'],
    },
  },
];

export const UPLOAD_TOOL_NAMES = new Set(UPLOAD_TOOL_SCHEMAS.map((t) => t.name));
