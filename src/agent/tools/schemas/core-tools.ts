import type { AgentToolSchema } from '../../tool-schema';
import { jianyingExportToolSchema } from '../jianying-export-tool';

/** Core schemas shared by the browser registry and the server-side data-only executor. */
export const CORE_TOOL_SCHEMAS: AgentToolSchema[] = [
  jianyingExportToolSchema,
  {
    name: 'read_timeline',
    description: 'Đọc dòng thời gian hiện tại: fps và mọi đoạn, gồm liên kết tư liệu chuẩn (sourceAssetId, resolvedSourceAssetId, linkStatus), khoảng nguồn chính xác (srcInFrame, sourceStartFrame, sourceDurationInFrames, sourceEndFrameExclusive) và trạng thái có thể chỉnh sửa (keyframes, transform, filters, volume, fades). Gọi công cụ này trước để xem trạng thái hiện tại rồi mới chỉnh sửa.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_templates',
    description: 'Khám phá mẫu đồ họa chuyển động. Không có tham số: trả về danh sách nhóm kèm số lượng. Có category: trả về tên các mẫu trong đó. Có khoảng 211 mẫu, nên ưu tiên truyền category hoặc dùng search_templates thay vì liệt kê tất cả.',
    input_schema: { type: 'object', properties: { category: { type: 'string', description: 'Nhóm tùy chọn cần liệt kê (ví dụ "title-cards", "lower-thirds").' } } },
  },
  {
    name: 'search_templates',
    description: 'Tìm gần đúng mẫu theo tên/từ khóa nhóm. Dùng công cụ này để tìm một mẫu cụ thể trong khoảng 211 mẫu.',
    input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  },
  {
    name: 'add_motion_graphic',
    description: 'Thêm mẫu đồ họa chuyển động thành đoạn mới. Đoạn được đặt ở cuối rãnh nếu không truyền startFrame. ripple:true tạo chỗ trống — các đoạn cùng rãnh tại/sau startFrame dịch sang phải theo độ dài đoạn mới thay vì chồng lên nhau (insert edit).',
    input_schema: {
      type: 'object',
      properties: {
        templateName: { type: 'string', description: 'Tên mẫu (khớp gần đúng với list_templates).' },
        track: { type: 'string', description: 'Bí danh hoặc ID ổn định của rãnh video hiện tại (mặc định V1).' },
        startFrame: { type: 'number', description: 'Frame bắt đầu chính xác, tùy chọn; bỏ qua để nối vào cuối.' },
        ripple: { type: 'boolean', description: 'Chèn: đẩy các đoạn cùng rãnh tại/sau startFrame sang phải để tạo chỗ.' },
      },
      required: ['templateName'],
    },
  },
  {
    name: 'update_item_props',
    description: 'Thay đổi một hoặc nhiều prop có thể chỉnh sửa của đoạn (ví dụ chữ, màu). Chỉ dùng prop có trong schema của mẫu.',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', minLength: 1 },
        props: { type: 'object', description: 'Map từ propKey → giá trị mới.' },
      },
      required: ['itemId', 'props'],
    },
  },
  {
    name: 'move_item',
    description: 'Di chuyển đoạn sang rãnh khác và/hoặc frame bắt đầu khác.',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', minLength: 1 },
        track: { type: 'string', description: 'Bí danh hoặc ID ổn định của rãnh tương thích hiện tại.' },
        startFrame: { type: 'number' },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'set_item_timing',
    description: 'Đổi thời gian đoạn: thay frame bắt đầu và/hoặc thời lượng (tính bằng frame), và/hoặc đặt fade-in / fade-out. Dùng để cắt ngắn, kéo dài hoặc tạo fade cho đoạn. Fade tính bằng GIÂY (theo ngữ nghĩa fadeIn/fadeOut của edit_item) — đoạn video fade opacity, đoạn âm thanh fade volume; 0 xóa fade. ripple:true dịch các đoạn cùng rãnh phía sau khi mép phải thay đổi (rút ngắn thì đóng khoảng trống; kéo dài thì đẩy sang phải).',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', minLength: 1 },
        startFrame: { type: 'number' },
        durationInFrames: { type: 'number' },
        fadeInSeconds: { type: 'number', description: 'Độ dài fade-in tính bằng giây (0 để xóa).' },
        fadeOutSeconds: { type: 'number', description: 'Độ dài fade-out tính bằng giây (0 để xóa).' },
        ripple: { type: 'boolean', description: 'Khi duration/start làm mép phải dịch chuyển, dịch các đoạn cùng rãnh phía sau theo cùng delta.' },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'duplicate_item',
    description: 'Nhân bản đoạn (bản sao được nối vào cuối rãnh của nó).',
    input_schema: { type: 'object', properties: { itemId: { type: 'string', minLength: 1 } }, required: ['itemId'] },
  },
  {
    name: 'remove_item',
    description: 'Xóa đoạn khỏi dòng thời gian. ripple:true cũng đóng khoảng trống — các đoạn phía sau trên cùng rãnh dịch sang trái theo độ dài đoạn bị xóa (ripple delete); mặc định giữ lại khoảng trống.',
    input_schema: { type: 'object', properties: { itemId: { type: 'string', minLength: 1 }, ripple: { type: 'boolean' } }, required: ['itemId'] },
  },
  {
    name: 'split_item',
    description: 'Tách đoạn thành hai tại frame tuyệt đối được chỉ định.',
    input_schema: { type: 'object', properties: { itemId: { type: 'string', minLength: 1 }, atFrame: { type: 'number' } }, required: ['itemId', 'atFrame'] },
  },
  {
    name: 'list_audio',
    description: 'Liệt kê tư liệu âm thanh có sẵn (nhạc / SFX) có thể đặt trên rãnh âm thanh A1/A2.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'add_audio',
    description: 'Thêm tư liệu âm thanh (nhạc/SFX) thành đoạn trên rãnh âm thanh (A1/A2). Đoạn được nối vào cuối rãnh nếu không truyền startFrame.',
    input_schema: {
      type: 'object',
      properties: {
        audioName: { type: 'string', description: 'Tên tư liệu âm thanh (khớp gần đúng với list_audio).' },
        track: { type: 'string', description: 'Bí danh hoặc ID ổn định của rãnh âm thanh hiện tại (mặc định A1).' },
        startFrame: { type: 'number', description: 'Frame bắt đầu chính xác, tùy chọn; bỏ qua để nối vào cuối.' },
        ripple: { type: 'boolean', description: 'Chèn: đẩy các đoạn cùng rãnh tại/sau startFrame sang phải để tạo chỗ.' },
      },
      required: ['audioName'],
    },
  },
  {
    // submit_motion_graphic: sync LLM codegen + sandbox — creates the asset only
    // (media pool), no timeline placement.
    name: 'submit_motion_graphic',
    description: [
      'Gửi một tác vụ sinh Motion Graphic.',
      'Tạo MỘT tư liệu đồ họa chuyển động trong kho tư liệu từ mô tả; KHÔNG đặt tư liệu lên dòng thời gian.',
      'Sau khi thành công, đặt bằng edit_item với adds:[{type:"motion-graphic", assetId, trackId?, fromFrame?}].',
      'Ưu tiên mẫu trong thư viện (browse_library / add_motion_graphic) nếu phù hợp; chỉ dùng công cụ này cho hình ảnh hoàn toàn mới.',
      'Chỉ gọi khi người dùng nói rõ muốn tạo MG mới.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Mô tả ngắn về nội dung/hành động cần hiển thị hoặc tạo chuyển động.' },
        description: { type: 'string', description: 'Bí danh cục bộ của prompt.' },
        name: { type: 'string', description: 'Tên hiển thị ngắn trong kho tư liệu.' },
        durationSeconds: { type: 'number', minimum: 0.5, maximum: 600, description: 'Thời lượng tính bằng giây (mặc định 3).' },
        durationInFrames: { type: 'number', minimum: 15, maximum: 36000, description: 'Thời lượng tính bằng frame (ghi đè durationSeconds khi được đặt).' },
        width: { type: 'number', minimum: 16, maximum: 8192, description: 'Chiều rộng tự nhiên tính bằng px (mặc định 1920).' },
        height: { type: 'number', minimum: 16, maximum: 8192, description: 'Chiều cao tự nhiên tính bằng px (mặc định 1080).' },
      },
      required: ['name'],
    },
  },
  {
    // Legacy alias kept for older prompts/skills; same executor as submit_motion_graphic.
    name: 'create_motion_graphic',
    description: 'Bí danh của submit_motion_graphic (chỉ sinh MG trong kho). Ưu tiên submit_motion_graphic. Không đặt lên dòng thời gian — dùng edit_item sau đó.',
    input_schema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Nội dung/hành động đồ họa chuyển động cần hiển thị hoặc animate.' },
        prompt: { type: 'string', description: 'Bí danh của description.' },
        name: { type: 'string', description: 'Tên hiển thị ngắn.' },
        durationSeconds: { type: 'number', minimum: 0.5, maximum: 600, description: 'Thời lượng tính bằng giây (mặc định 3).' },
        durationInFrames: { type: 'number', minimum: 15, maximum: 36000 },
        width: { type: 'number', minimum: 16, maximum: 8192 },
        height: { type: 'number', minimum: 16, maximum: 8192 },
      },
      required: ['name'],
    },
  },
  {
    name: 'clear_timeline',
    description: 'Xóa TẤT CẢ đoạn khỏi dòng thời gian. Chỉ dùng khi người dùng nói rõ muốn bắt đầu lại / xóa mọi thứ.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'set_aspect_ratio',
    description: 'Đổi khung hình sang tỷ lệ khác để chuyển video ngang sang dọc (cùng ngữ nghĩa ratio+fit với manage_timelines). Ví dụ chuyển video 16:9 thành dọc cho Shorts/Reels. fit: contain (letterbox) giữ toàn bộ nội dung; cover (fill+crop) lấp đầy khung và cắt hai bên.',
    input_schema: {
      type: 'object',
      properties: {
        ratio: { type: 'string', enum: ['16:9', '9:16', '1:1', '4:3', '3:4'] },
        fit: { type: 'string', enum: ['contain', 'cover'], description: 'Cách các đoạn hiện có thích ứng với tỷ lệ mới.' },
      },
      required: ['ratio'],
    },
  },
];

export const CORE_TOOL_NAMES = new Set(CORE_TOOL_SCHEMAS.map((tool) => tool.name));
