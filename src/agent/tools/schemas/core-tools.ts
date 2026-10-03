import type { AgentToolSchema } from '../../tool-schema';
import { jianyingExportToolSchema } from '../jianying-export-tool';

/** Core schemas shared by the browser registry and the server-side data-only executor. */
export const CORE_TOOL_SCHEMAS: AgentToolSchema[] = [
  jianyingExportToolSchema,
  {
    name: 'read_timeline',
    description: 'Đọc timeline hiện tại: fps và mọi clip, gồm liên kết media chuẩn (sourceAssetId, resolvedSourceAssetId, linkStatus), khoảng nguồn chính xác (srcInFrame, sourceStartFrame, sourceDurationInFrames, sourceEndFrameExclusive) và trạng thái có thể chỉnh sửa (keyframes, transform, filters, volume, fades). Gọi tool này trước để xem trạng thái hiện tại rồi mới chỉnh sửa.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_templates',
    description: 'Khám phá template đồ họa chuyển động. Không có tham số: trả về danh sách category kèm số lượng. Có category: trả về tên các template trong đó. Có khoảng 211 template, nên ưu tiên truyền category hoặc dùng search_templates thay vì liệt kê tất cả.',
    input_schema: { type: 'object', properties: { category: { type: 'string', description: 'Category tùy chọn cần liệt kê (ví dụ "title-cards", "lower-thirds").' } } },
  },
  {
    name: 'search_templates',
    description: 'Tìm gần đúng template theo tên/từ khóa category. Dùng tool này để tìm một template cụ thể trong khoảng 211 template.',
    input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  },
  {
    name: 'add_motion_graphic',
    description: 'Thêm template đồ họa chuyển động thành clip mới. Clip được đặt ở cuối track nếu không truyền startFrame. ripple:true tạo chỗ trống — các clip cùng track tại/sau startFrame dịch sang phải theo độ dài clip mới thay vì chồng lên nhau (insert edit).',
    input_schema: {
      type: 'object',
      properties: {
        templateName: { type: 'string', description: 'Tên template (khớp gần đúng với list_templates).' },
        track: { type: 'string', description: 'Alias hoặc id ổn định của track video hiện tại (mặc định V1).' },
        startFrame: { type: 'number', description: 'Frame bắt đầu chính xác, tùy chọn; bỏ qua để nối vào cuối.' },
        ripple: { type: 'boolean', description: 'Insert edit: đẩy các clip cùng track tại/sau startFrame sang phải để tạo chỗ.' },
      },
      required: ['templateName'],
    },
  },
  {
    name: 'update_item_props',
    description: 'Thay đổi một hoặc nhiều prop có thể chỉnh sửa của clip (ví dụ text, màu). Chỉ dùng prop có trong schema của template.',
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
    description: 'Di chuyển clip sang track khác và/hoặc frame bắt đầu khác.',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', minLength: 1 },
        track: { type: 'string', description: 'Alias hoặc id ổn định của track tương thích hiện tại.' },
        startFrame: { type: 'number' },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'set_item_timing',
    description: 'Đổi timing clip: thay frame bắt đầu và/hoặc thời lượng (tính bằng frame), và/hoặc đặt fade-in / fade-out. Dùng để cắt ngắn, kéo dài hoặc tạo fade cho clip. Fade tính bằng GIÂY (theo ngữ nghĩa fadeIn/fadeOut của edit_item) — clip video fade opacity, clip âm thanh fade volume; 0 xóa fade. ripple:true dịch các clip cùng track phía sau khi mép phải thay đổi (rút ngắn thì đóng khoảng trống; kéo dài thì đẩy sang phải).',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', minLength: 1 },
        startFrame: { type: 'number' },
        durationInFrames: { type: 'number' },
        fadeInSeconds: { type: 'number', description: 'Độ dài fade-in tính bằng giây (0 để xóa).' },
        fadeOutSeconds: { type: 'number', description: 'Độ dài fade-out tính bằng giây (0 để xóa).' },
        ripple: { type: 'boolean', description: 'Khi duration/start làm mép phải dịch chuyển, dịch các clip cùng track phía sau theo cùng delta.' },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'duplicate_item',
    description: 'Nhân bản clip (bản sao được nối vào cuối track của nó).',
    input_schema: { type: 'object', properties: { itemId: { type: 'string', minLength: 1 } }, required: ['itemId'] },
  },
  {
    name: 'remove_item',
    description: 'Xóa clip khỏi timeline. ripple:true cũng đóng khoảng trống — các clip phía sau trên cùng track dịch sang trái theo độ dài clip bị xóa (ripple delete); mặc định giữ lại khoảng trống.',
    input_schema: { type: 'object', properties: { itemId: { type: 'string', minLength: 1 }, ripple: { type: 'boolean' } }, required: ['itemId'] },
  },
  {
    name: 'split_item',
    description: 'Tách clip thành hai tại frame tuyệt đối được chỉ định.',
    input_schema: { type: 'object', properties: { itemId: { type: 'string', minLength: 1 }, atFrame: { type: 'number' } }, required: ['itemId', 'atFrame'] },
  },
  {
    name: 'list_audio',
    description: 'Liệt kê asset âm thanh có sẵn (nhạc / SFX) có thể đặt trên track âm thanh A1/A2.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'add_audio',
    description: 'Thêm asset âm thanh (nhạc/SFX) thành clip trên track âm thanh (A1/A2). Clip được nối vào cuối track nếu không truyền startFrame.',
    input_schema: {
      type: 'object',
      properties: {
        audioName: { type: 'string', description: 'Tên asset âm thanh (khớp gần đúng với list_audio).' },
        track: { type: 'string', description: 'Alias hoặc id ổn định của track âm thanh hiện tại (mặc định A1).' },
        startFrame: { type: 'number', description: 'Frame bắt đầu chính xác, tùy chọn; bỏ qua để nối vào cuối.' },
        ripple: { type: 'boolean', description: 'Insert edit: đẩy các clip cùng track tại/sau startFrame sang phải để tạo chỗ.' },
      },
      required: ['audioName'],
    },
  },
  {
    // submit_motion_graphic: sync LLM codegen + sandbox — creates the asset only
    // (media pool), no timeline placement.
    name: 'submit_motion_graphic',
    description: [
      'Gửi một job sinh Motion Graphic.',
      'Tạo MỘT asset đồ họa chuyển động trong media pool từ brief; KHÔNG đặt asset lên timeline.',
      'Sau khi thành công, đặt bằng edit_item với adds:[{type:"motion-graphic", assetId, trackId?, fromFrame?}].',
      'Ưu tiên template trong thư viện (browse_library / add_motion_graphic) nếu phù hợp; chỉ dùng tool này cho hình ảnh hoàn toàn mới.',
      'Chỉ gọi khi người dùng nói rõ muốn tạo MG mới.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Brief về nội dung/hành động cần hiển thị hoặc animate.' },
        description: { type: 'string', description: 'Alias cục bộ của prompt.' },
        name: { type: 'string', description: 'Tên hiển thị ngắn trong media pool.' },
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
    description: 'Alias của submit_motion_graphic (chỉ sinh MG trong pool). Ưu tiên submit_motion_graphic. Không đặt lên timeline — dùng edit_item sau đó.',
    input_schema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Nội dung/hành động đồ họa chuyển động cần hiển thị hoặc animate.' },
        prompt: { type: 'string', description: 'Alias của description.' },
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
    description: 'Xóa TẤT CẢ clip khỏi timeline. Chỉ dùng khi người dùng nói rõ muốn bắt đầu lại / xóa mọi thứ.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'set_aspect_ratio',
    description: 'Đổi canvas sang tỷ lệ khung hình khác để chuyển video ngang sang dọc (cùng ngữ nghĩa ratio+fit với manage_timelines). Ví dụ chuyển video 16:9 thành dọc cho Shorts/Reels. fit: contain (letterbox) giữ toàn bộ nội dung; cover (fill+crop) lấp đầy khung và cắt hai bên.',
    input_schema: {
      type: 'object',
      properties: {
        ratio: { type: 'string', enum: ['16:9', '9:16', '1:1', '4:3', '3:4'] },
        fit: { type: 'string', enum: ['contain', 'cover'], description: 'Cách các clip hiện có thích ứng với tỷ lệ mới.' },
      },
      required: ['ratio'],
    },
  },
];

export const CORE_TOOL_NAMES = new Set(CORE_TOOL_SCHEMAS.map((tool) => tool.name));
