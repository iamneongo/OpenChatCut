import type { AgentToolSchema } from '../../tool-schema';

const TARGET_PROPERTIES = {
  itemId: {
    type: 'string',
    description: 'ID đoạn âm thanh/video trên dòng thời gian (chấp nhận tiền tố duy nhất). Dùng tư liệu trong kho tư liệu cùng ánh xạ trim/speed của đoạn.',
  },
  assetId: {
    type: 'string',
    description: 'ID tư liệu trong kho tư liệu (chấp nhận tiền tố duy nhất). Dùng itemId khi cần ánh xạ theo dòng thời gian.',
  },
} as const;

const PLAN_PROPERTIES = {
  itemId: {
    type: 'string',
    description: 'ID đoạn âm thanh/video BGM trên dòng thời gian (chấp nhận tiền tố duy nhất).',
  },
  timing: {
    type: 'string',
    enum: ['auto', 'beat', 'downbeat', 'section'],
    description: 'Timing cắt. auto chọn section/downbeat/beat một cách xác định dựa trên density và phân tích có sẵn.',
  },
  density: {
    type: 'string',
    enum: ['sparse', 'medium', 'dense'],
    description: 'Số điểm timing đã phân tích cần giữ lại.',
  },
  fromFrame: {
    type: 'number',
    minimum: 0,
    description: 'Frame bắt đầu của phạm vi timeline, bao gồm, tùy chọn; mặc định đầu clip BGM.',
  },
  toFrame: {
    type: 'number',
    minimum: 1,
    description: 'Frame kết thúc phạm vi timeline, không bao gồm, tùy chọn; mặc định cuối clip BGM.',
  },
  targetItemIds: {
    type: 'array',
    items: { type: 'string' },
    maxItems: 64,
    description: 'ID/tiền tố đoạn video tùy chọn để giới hạn mục tiêu. Mặc định là các đoạn video chồng lên phạm vi.',
  },
} as const;

const IMAGE_PLAN_PROPERTIES = {
  itemId: {
    type: 'string',
    description: 'Id clip audio/video BGM trên timeline (chấp nhận tiền tố duy nhất).',
  },
  timing: {
    type: 'string',
    enum: ['auto', 'beat', 'downbeat', 'section'],
    description: 'Timing đổi ảnh. auto chọn section/downbeat/beat một cách xác định dựa trên density và phân tích có sẵn.',
  },
  density: {
    type: 'string',
    enum: ['sparse', 'medium', 'dense'],
    description: 'Số điểm timing đã phân tích cần giữ lại.',
  },
  fromFrame: {
    type: 'number',
    minimum: 0,
    description: 'Frame bắt đầu của phạm vi timeline, bao gồm, tùy chọn; mặc định đầu clip BGM.',
  },
  toFrame: {
    type: 'number',
    minimum: 1,
    description: 'Frame kết thúc phạm vi timeline, không bao gồm, tùy chọn; mặc định cuối clip BGM.',
  },
  imageAssetIds: {
    type: 'array',
    items: { type: 'string' },
    maxItems: 64,
    description: 'Id/tiền tố asset image theo thứ tự hiển thị, tùy chọn. Mặc định mọi asset image theo thứ tự media pool và lặp vòng khi cần.',
  },
  track: {
    type: 'string',
    description: 'Id hoặc alias track video đích, mặc định V1. Phạm vi đích phải rỗng và không bị khóa.',
  },
} as const;

export const MUSIC_INTELLIGENCE_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'analyze_music',
    description: [
      'Chạy mô hình Beat This + CLAP đã cài trên thiết bị cho tư liệu trong kho hoặc đoạn trên dòng thời gian và chờ hoàn tất.',
      'Trả về BPM, meter, độ tin cậy, tag, section và các điểm beat/downbeat giới hạn ở dạng gọn; không bao giờ lộ embedding.',
      'Mặc định dùng lại bộ nhớ đệm hợp lệ; đặt force để tính lại. Công cụ này không tải gói mô hình và không sửa dòng thời gian.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        ...TARGET_PROPERTIES,
        force: { type: 'boolean', description: 'Tính lại ngay cả khi đã có phân tích cache hợp lệ. Mặc định false.' },
        optional: { type: 'boolean', description: 'Khi true, thiếu pack hoặc phân tích lỗi sẽ trả available=false để chỉnh sửa lớn hơn tiếp tục với bằng chứng audio đơn giản hơn. Target không hợp lệ vẫn lỗi.' },
      },
    },
  },
  {
    name: 'inspect_music',
    description: [
      'Đọc phân tích Beat This + CLAP cục bộ đã cache cho asset media pool hoặc clip timeline.',
      'Trả về BPM, meter, độ tin cậy, tag, section và các điểm beat/downbeat giới hạn ở dạng gọn; không bao giờ lộ embedding.',
      'Tool này không bắt đầu phân tích và không tải model. Nếu chưa có cache, tool giải thích cách cài pack cần thiết và phân tích trước.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        ...TARGET_PROPERTIES,
        fromMs: { type: 'number', minimum: 0, description: 'Bắt đầu phạm vi mili giây nguồn, tùy chọn.' },
        toMs: { type: 'number', minimum: 1, description: 'Kết thúc phạm vi mili giây nguồn, không bao gồm, tùy chọn.' },
      },
    },
  },
  {
    name: 'music_edit_plan',
    description: [
      'Tạo kế hoạch cắt xác định, chỉ đọc từ phân tích nhạc đã cache, mapping trim/speed của clip BGM và các clip video chồng phạm vi.',
      'Trả về kế hoạch frame có giới hạn và analysisRef opaque, không có embedding hay mảng phân tích không giới hạn.',
      'Gọi tool này để xem chỉnh sửa nhịp đề xuất trước sync_cuts_to_music.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: PLAN_PROPERTIES,
      required: ['itemId', 'timing', 'density'],
    },
  },
  {
    name: 'sync_cuts_to_music',
    description: [
      'Tính lại kế hoạch cắt nhạc đã cache tại thời điểm thực thi và chỉ tách các clip video không khóa tại frame đã lập kế hoạch.',
      'Truyền analysisRef do music_edit_plan trả về để từ chối phân tích cũ. Mọi lần tách là một batch EditorCommands và một bước undo.',
      'Tool này không bắt đầu phân tích và không sửa chính clip BGM.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        ...PLAN_PROPERTIES,
        analysisRef: {
          type: 'string',
          description: 'Ref opaque từ music_edit_plan. Khi thực thi sẽ từ chối nếu thiếu hoặc phân tích đã cũ.',
        },
      },
      required: ['itemId', 'timing', 'density', 'analysisRef'],
    },
  },
  {
    name: 'music_image_plan',
    description: [
      'Tạo kế hoạch đặt ảnh xác định, chỉ đọc từ phân tích nhạc đã cache và mapping trim/speed của clip BGM.',
      'Kế hoạch lấp đầy phạm vi yêu cầu bằng image trong media pool, đổi ảnh tại ranh giới beat/downbeat/section và lặp vòng theo thứ tự ảnh đã chọn.',
      'Gọi trước sync_images_to_music để người dùng xem kế hoạch placement có giới hạn. Tool này không bắt đầu phân tích.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: IMAGE_PLAN_PROPERTIES,
      required: ['itemId', 'timing', 'density'],
    },
  },
  {
    name: 'sync_images_to_music',
    description: [
      'Tính lại kế hoạch ảnh nhạc đã cache và thêm một clip image cho mỗi khoảng beat đã lập kế hoạch.',
      'Truyền analysisRef do music_image_plan trả về để từ chối phân tích cũ. Mọi lần thêm ảnh là một batch EditorCommands và một bước undo.',
      'Track video đích phải không khóa và rỗng trong phạm vi yêu cầu; tool này không bắt đầu phân tích và không sửa clip BGM.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        ...IMAGE_PLAN_PROPERTIES,
        analysisRef: {
          type: 'string',
          description: 'Ref opaque từ music_image_plan. Khi thực thi sẽ từ chối nếu thiếu hoặc phân tích đã cũ.',
        },
      },
      required: ['itemId', 'timing', 'density', 'analysisRef'],
    },
  },
];

export const MUSIC_INTELLIGENCE_TOOL_NAMES = new Set(
  MUSIC_INTELLIGENCE_TOOL_SCHEMAS.map((tool) => tool.name),
);
