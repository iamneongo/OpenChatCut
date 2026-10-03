import type { AgentToolSchema } from '../../tool-schema';

export const PROJECT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'list_projects',
    description: [
      'Liệt kê các dự án OpenChatCut mà trình duyệt này sở hữu (id, name, updatedAt, editorUrl), mới nhất trước.',
      'Chỉ khám phá — không chuyển editor sang dự án khác. Gọi target_project trước khi chỉnh sửa dự án khác.',
      'Truyền includeDeleted=true để liệt kê cả dự án đã xóa mềm cho restore_project.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        editorBaseUrl: { type: 'string', description: 'Origin cho URL trả về; mặc định location.origin.' },
        includeDeleted: { type: 'boolean', description: 'Bao gồm dự án đã xóa mềm (mặc định false).' },
      },
    },
  },
  {
    name: 'create_project',
    description: [
      'Tạo dự án rỗng mới (một timeline, một track video) và trả về projectId + editorUrl.',
      'Không tự mở trừ khi gọi target_project với id được trả về.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Tên hiển thị (mặc định: tên dự án mới đã bản địa hóa).' },
        description: { type: 'string' },
        compositionWidth: { type: 'number', description: 'Mặc định 1920.' },
        compositionHeight: { type: 'number', description: 'Mặc định 1080.' },
        fps: { type: 'number', description: 'Mặc định 30.' },
        editorBaseUrl: { type: 'string' },
      },
    },
  },
  {
    name: 'delete_project',
    description: [
      'Xóa mềm một dự án (giống thao tác xóa trên dashboard). Ẩn khỏi list_projects; khôi phục bằng restore_project.',
      'Bắt buộc có projectId rõ ràng — không bao giờ mặc định dùng dự án hiện tại.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Id dự án đầy đủ từ list_projects hoặc URL editor.' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'restore_project',
    description: 'Khôi phục dự án đã xóa mềm để dự án xuất hiện lại trong list_projects / dashboard.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        editorBaseUrl: { type: 'string' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'duplicate_project',
    description: [
      'Sao chép toàn bộ dự án (timeline, asset, caption). Lịch sử chat không được sao chép.',
      'activate=true (mặc định) điều hướng editor tới bản sao mới khi openProject khả dụng.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Id dự án nguồn; mặc định dự án hiện tại.' },
        name: { type: 'string', description: 'Tên hiển thị bản sao; mặc định "[Copy] <source>".' },
        activate: { type: 'boolean', description: 'Mở bản sao trong editor (mặc định true).' },
        editorBaseUrl: { type: 'string' },
      },
    },
  },
  {
    name: 'edit_project',
    description: [
      'Cập nhật cài đặt cấp dự án hoặc người nói. action=update: đổi name/description qua json {"name"?, "description"?}.',
      'action=speaker-update: đổi tên/gộp người nói trên toàn dự án — {from:"A", to:"Tên mới"} đổi nhãn mọi từ của người nói đó trên tất cả clip đã chuyển lời trong dự án đang mở.',
      'speaker-create/speaker-delete không được hỗ trợ ở đây (không có danh sách speaker — speaker là nhãn diarization theo từng từ); dùng speaker-update để đổi nhãn, hoặc manage_transcript fix theo từng clip.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['update', 'speaker-create', 'speaker-update', 'speaker-delete'],
        },
        id: { type: 'string', description: 'ID speaker (cho speaker ops) — nhãn diarization hiện có cần tác động (alias của from / json.id).' },
        from: { type: 'string', description: 'speaker-update: nhãn speaker hiện có cần đổi tên (ví dụ "A").' },
        to: { type: 'string', description: 'speaker-update: tên speaker mới.' },
        json: { type: 'string', description: 'update: {name?, description?}. speaker-update cũng nhận {from,to} ở đây.' },
        projectId: { type: 'string', description: 'Mặc định dự án hiện tại (speaker-update cần dự án đang mở).' },
      },
      required: ['action'],
    },
  },
  {
    name: 'target_project',
    description: [
      'Gắn session với một dự án hiện có và mở dự án đó trong editor (điều hướng bằng hash).',
      'Dùng sau list_projects. Các tool tiếp theo sẽ chạy trên dự án mới mở sau khi reload.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Id dự án hoặc tiền tố duy nhất từ list_projects.' },
        editorBaseUrl: { type: 'string' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_editor_url',
    description: [
      'Trả về URL editor cho projectId mục tiêu hoặc được truyền (origin + #/editor/<id>).',
      'Không bao giờ tự đoán hostname — dùng location.origin hoặc editorBaseUrl.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        editorBaseUrl: { type: 'string' },
        openPricing: { type: 'boolean' },
        pricingSource: { type: 'string' },
      },
    },
  },
];

export const PROJECT_TOOL_NAMES = new Set(PROJECT_TOOL_SCHEMAS.map((t) => t.name));
