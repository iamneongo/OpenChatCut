import type { AgentToolSchema } from '../../tool-schema';

const MEDIA_TYPE_ENUM = ['audio', 'gif', 'image', 'svg', 'video'] as const;
const PUSH_TYPE_ENUM = [
  'audio', 'effect', 'gif', 'image', 'motion-graphic', 'svg', 'transition', 'video',
] as const;

export const STOCK_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'download_media',
    description: [
      'Tải file media từ URL công khai vào media pool của dự án.',
      'Nhận một url hoặc mảng url. Type được suy ra từ extension / Content-Type; truyền type để ghi đè.',
      'Local-dev: server tải byte vào /media/uploads (đóng vai S3). Trả về { failed, succeeded, results } giống push_asset.',
      'Tuần tự: mỗi lần gọi có cửa sổ 75s để bắt đầu URL, nên truyền tối đa 3 URL mỗi lần và gọi lại cho phần còn lại. Host không truy cập được sẽ là dòng failed, không bao giờ fallback sang remote.',
      'Mỗi dòng thành công có probe (thời lượng, kích thước, fps, track audio/video, codec, qualityRisks) được đo bằng ffprobe cục bộ lúc import — không gọi probe_media cho file vừa tải. Byte không phải media đọc được sẽ lỗi not_media và không bao giờ vào pool.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        url: {
          // Accept one URI or an array of URIs.
          anyOf: [
            { type: 'string', format: 'uri' },
            { type: 'array', items: { type: 'string', format: 'uri' } },
          ],
          description: 'URL HTTP(S) hoặc mảng URL.',
        },
        name: {
          type: 'string',
          description: 'Ghi đè tên hiển thị. Bị bỏ qua khi chạy batch (>1 url).',
        },
        type: {
          type: 'string',
          enum: [...MEDIA_TYPE_ENUM],
          description: 'Ghi đè loại asset; tự phát hiện từ Content-Type / extension URL khi bỏ qua.',
        },
        projectId: {
          type: 'string',
          description: 'Bỏ qua vì OpenChatCut dùng dự án đang hoạt động.',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'push_asset',
    description: [
      'Đăng ký URL media http(s) công khai thành asset của dự án.',
      'filePath = URL công khai (chuỗi hoặc mảng). Local-dev sẽ tải vào /media/uploads khi có thể.',
      'type có thể là motion-graphic (kèm duration / durationInFrames / properties). type effect/transition không phải media pool ở đây.',
      'KHÔNG truyền path filesystem cục bộ. Trả về { failed, succeeded, results: [{ assetId, name, type, success } | { error, success:false }] }.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        filePath: {
          description: 'URL media http(s) công khai hoặc mảng URL. Không nhận path cục bộ.',
        },
        name: {
          type: 'string',
          description: 'Ghi đè tên hiển thị. Bị bỏ qua khi chạy batch (>1 filePath).',
        },
        type: {
          type: 'string',
          enum: [...PUSH_TYPE_ENUM],
          description: 'Ghi đè loại asset; tự phát hiện từ extension khi bỏ qua.',
        },
        duration: {
          type: 'number',
          description: 'Thời lượng tính bằng giây (motion-graphic khi bỏ qua durationInFrames; cũng là fallback cho media).',
        },
        durationInFrames: {
          type: 'number',
          description: 'Thời lượng tính bằng frame theo fps timeline (thay thế duration cho motion-graphic).',
        },
        width: { type: 'number' },
        height: { type: 'number' },
        properties: {
          type: 'array',
          description: 'Property chỉnh sửa được của motion-graphic (object có key, label, type, defaultValue).',
          items: {},
        },
        projectId: {
          type: 'string',
          description: 'Bỏ qua vì OpenChatCut dùng dự án đang hoạt động.',
        },
      },
      required: ['filePath'],
    },
  },
  {
    name: 'import_url_asset',
    description: [
      'Alias cũ của push_asset: đăng ký URL media http(s) công khai thành asset dự án.',
      'Ưu tiên download_media để tải vào thư viện hoặc push_asset để đăng ký URL. Hành vi cục bộ giống nhau.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL http(s) công khai của file media.' },
        name: { type: 'string', description: 'Tên hiển thị; mặc định theo tên file trong URL.' },
        kind: {
          type: 'string',
          enum: ['video', 'image', 'audio'],
          description: 'Ghi đè phát hiện kind khi extension URL không rõ ràng.',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'search_stock_media',
    description: [
      'Tìm B-roll, ảnh, âm thanh hoặc nhạc trên các nền tảng stock được tuyển chọn; trả về kết quả thống nhất có importUrl.',
      'kind=any|video|audio|music|image (mặc định video). platforms là danh sách provider phân tách bằng dấu phẩy, tùy chọn.',
      'Dùng category để thu hẹp ý định và horizontal|square|vertical cho hướng khung; tên orientation cũ vẫn được chấp nhận.',
      'Tổ hợp provider/type không hỗ trợ sẽ bị bỏ qua kèm cảnh báo. Ưu tiên key chính thức; tìm hình ảnh đủ điều kiện có thể fallback qua Firecrawl.',
      'Khi thành công, truyền importUrl của kết quả vào download_media hoặc push_asset.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', minLength: 1 },
        category: {
          type: 'string',
          description: 'Category tùy chọn, như business, nature, technology, whoosh, piano hoặc ambient.',
        },
        kind: {
          type: 'string',
          enum: ['any', 'video', 'audio', 'music', 'image'],
          description: 'Mặc định video. music tìm trên Freesound và trả về audio có thể import.',
        },
        orientation: {
          type: 'string',
          enum: ['horizontal', 'square', 'vertical', 'landscape', 'portrait', 'squarish'],
          description: 'Ưu tiên horizontal|square|vertical; vẫn chấp nhận giá trị cũ landscape|portrait|squarish.',
        },
        platforms: {
          type: 'string',
          description: 'Danh sách tùy chọn phân tách bằng dấu phẩy: pexels,pixabay,unsplash,freesound.',
        },
        limitPerPlatform: {
          type: 'integer',
          minimum: 1,
          maximum: 6,
          default: 3,
          description: 'Số kết quả tối đa cho mỗi platform và loại media.',
        },
      },
      required: ['query'],
    },
  },
];

export const STOCK_TOOL_NAMES = new Set(STOCK_TOOL_SCHEMAS.map((tool) => tool.name));
