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
    description: 'Thời điểm cắt. auto chọn section/downbeat/beat một cách xác định dựa trên density và phân tích có sẵn.',
  },
  density: {
    type: 'string',
    enum: ['sparse', 'medium', 'dense'],
    description: 'Số điểm timing đã phân tích cần giữ lại.',
  },
  fromFrame: {
    type: 'number',
    minimum: 0,
    description: 'Frame bắt đầu của phạm vi dòng thời gian, bao gồm, tùy chọn; mặc định đầu đoạn BGM.',
  },
  toFrame: {
    type: 'number',
    minimum: 1,
    description: 'Frame kết thúc phạm vi dòng thời gian, không bao gồm, tùy chọn; mặc định cuối đoạn BGM.',
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
    description: 'ID đoạn âm thanh/video BGM trên dòng thời gian (chấp nhận tiền tố duy nhất).',
  },
  timing: {
    type: 'string',
    enum: ['auto', 'beat', 'downbeat', 'section'],
    description: 'Thời điểm đổi ảnh. auto chọn section/downbeat/beat một cách xác định dựa trên density và phân tích có sẵn.',
  },
  density: {
    type: 'string',
    enum: ['sparse', 'medium', 'dense'],
    description: 'Số điểm timing đã phân tích cần giữ lại.',
  },
  fromFrame: {
    type: 'number',
    minimum: 0,
    description: 'Frame bắt đầu của phạm vi dòng thời gian, bao gồm, tùy chọn; mặc định đầu đoạn BGM.',
  },
  toFrame: {
    type: 'number',
    minimum: 1,
    description: 'Frame kết thúc phạm vi dòng thời gian, không bao gồm, tùy chọn; mặc định cuối đoạn BGM.',
  },
  imageAssetIds: {
    type: 'array',
    items: { type: 'string' },
    maxItems: 64,
    description: 'ID/tiền tố tư liệu hình ảnh theo thứ tự hiển thị, tùy chọn. Mặc định mọi tư liệu hình ảnh theo thứ tự kho tư liệu và lặp vòng khi cần.',
  },
  track: {
    type: 'string',
    description: 'ID hoặc bí danh rãnh video đích, mặc định V1. Phạm vi đích phải rỗng và không bị khóa.',
  },
} as const;

export const MUSIC_INTELLIGENCE_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'analyze_music',
    description: [
      'Chạy mô hình Beat This + CLAP đã cài trên thiết bị cho tư liệu trong kho hoặc đoạn trên dòng thời gian và chờ hoàn tất.',
      'Trả về BPM, nhịp, độ tin cậy, nhãn, đoạn và các điểm beat/downbeat giới hạn ở dạng gọn; không bao giờ lộ embedding.',
      'Mặc định dùng lại bộ nhớ đệm hợp lệ; đặt force để tính lại. Công cụ này không tải gói mô hình và không sửa dòng thời gian.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        ...TARGET_PROPERTIES,
        force: { type: 'boolean', description: 'Tính lại ngay cả khi đã có phân tích được lưu bộ nhớ đệm hợp lệ. Mặc định false.' },
        optional: { type: 'boolean', description: 'Khi true, thiếu gói hoặc phân tích lỗi sẽ trả available=false để chỉnh sửa lớn hơn tiếp tục với bằng chứng âm thanh đơn giản hơn. Mục tiêu không hợp lệ vẫn lỗi.' },
      },
    },
  },
  {
    name: 'inspect_music',
    description: [
      'Đọc phân tích Beat This + CLAP cục bộ đã lưu bộ nhớ đệm cho tư liệu trong kho hoặc đoạn trên dòng thời gian.',
      'Trả về BPM, nhịp, độ tin cậy, nhãn, đoạn và các điểm beat/downbeat giới hạn ở dạng gọn; không bao giờ lộ embedding.',
      'Công cụ này không bắt đầu phân tích và không tải mô hình. Nếu chưa có bộ nhớ đệm, công cụ giải thích cách cài gói cần thiết và phân tích trước.',
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
      'Tạo kế hoạch cắt xác định, chỉ đọc từ phân tích nhạc đã lưu bộ nhớ đệm, ánh xạ trim/speed của đoạn BGM và các đoạn video chồng phạm vi.',
      'Trả về kế hoạch frame có giới hạn và analysisRef opaque, không có embedding hay mảng phân tích không giới hạn.',
      'Gọi công cụ này để xem chỉnh sửa nhịp đề xuất trước sync_cuts_to_music.',
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
      'Tính lại kế hoạch cắt nhạc đã lưu bộ nhớ đệm tại thời điểm thực thi và chỉ tách các đoạn video không khóa tại frame đã lập kế hoạch.',
      'Truyền analysisRef do music_edit_plan trả về để từ chối phân tích cũ. Mọi lần tách là một batch EditorCommands và một bước undo.',
      'Công cụ này không bắt đầu phân tích và không sửa chính đoạn BGM.',
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
      'Tạo kế hoạch đặt ảnh xác định, chỉ đọc từ phân tích nhạc đã lưu bộ nhớ đệm và ánh xạ trim/speed của đoạn BGM.',
      'Kế hoạch lấp đầy phạm vi yêu cầu bằng hình ảnh trong kho tư liệu, đổi ảnh tại ranh giới beat/downbeat/section và lặp vòng theo thứ tự ảnh đã chọn.',
      'Gọi trước sync_images_to_music để người dùng xem kế hoạch đặt ảnh có giới hạn. Công cụ này không bắt đầu phân tích.',
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
      'Tính lại kế hoạch ảnh nhạc đã lưu bộ nhớ đệm và thêm một đoạn hình ảnh cho mỗi khoảng beat đã lập kế hoạch.',
      'Truyền analysisRef do music_image_plan trả về để từ chối phân tích cũ. Mọi lần thêm ảnh là một batch EditorCommands và một bước undo.',
      'Rãnh video đích phải không khóa và rỗng trong phạm vi yêu cầu; công cụ này không bắt đầu phân tích và không sửa đoạn BGM.',
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
