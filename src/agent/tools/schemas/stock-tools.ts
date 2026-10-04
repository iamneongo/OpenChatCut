import type { AgentToolSchema } from '../../tool-schema';

const MEDIA_TYPE_ENUM = ['audio', 'gif', 'image', 'svg', 'video'] as const;
const PUSH_TYPE_ENUM = [
  'audio', 'effect', 'gif', 'image', 'motion-graphic', 'svg', 'transition', 'video',
] as const;

export const STOCK_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'download_media',
    description: [
      'Tải tệp tư liệu từ URL công khai vào kho tư liệu của dự án.',
      'Nhận một URL hoặc mảng URL. Loại được suy ra từ phần mở rộng / Content-Type; truyền type để ghi đè.',
      'Môi trường local-dev: máy chủ tải dữ liệu vào /media/uploads (đóng vai S3). Trả về { failed, succeeded, results } giống push_asset.',
      'Tuần tự: mỗi lần gọi có cửa sổ 75 giây để bắt đầu URL, nên truyền tối đa 3 URL mỗi lần và gọi lại cho phần còn lại. Máy chủ không truy cập được sẽ là dòng failed, không bao giờ dự phòng sang nguồn từ xa.',
      'Mỗi dòng thành công có probe (thời lượng, kích thước, fps, rãnh âm thanh/video, codec, qualityRisks) được đo bằng ffprobe cục bộ lúc nhập — không gọi probe_media cho tệp vừa tải. Dữ liệu không phải tư liệu đọc được sẽ lỗi not_media và không bao giờ vào kho.',
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
          description: 'Ghi đè tên hiển thị. Bị bỏ qua khi chạy lô (>1 URL).',
        },
        type: {
          type: 'string',
          enum: [...MEDIA_TYPE_ENUM],
          description: 'Ghi đè loại tư liệu; tự phát hiện từ Content-Type / phần mở rộng URL khi bỏ qua.',
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
      'Đăng ký URL tư liệu http(s) công khai thành tư liệu của dự án.',
      'filePath = URL công khai (chuỗi hoặc mảng). Môi trường local-dev sẽ tải vào /media/uploads khi có thể.',
      'type có thể là motion-graphic (kèm duration / durationInFrames / properties). type effect/transition không phải tư liệu trong kho ở đây.',
      'KHÔNG truyền đường dẫn hệ thống tệp cục bộ. Trả về { failed, succeeded, results: [{ assetId, name, type, success } | { error, success:false }] }.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        filePath: {
          description: 'URL tư liệu http(s) công khai hoặc mảng URL. Không nhận đường dẫn cục bộ.',
        },
        name: {
          type: 'string',
          description: 'Ghi đè tên hiển thị. Bị bỏ qua khi chạy lô (>1 filePath).',
        },
        type: {
          type: 'string',
          enum: [...PUSH_TYPE_ENUM],
          description: 'Ghi đè loại tư liệu; tự phát hiện từ phần mở rộng khi bỏ qua.',
        },
        duration: {
          type: 'number',
          description: 'Thời lượng tính bằng giây (motion-graphic khi bỏ qua durationInFrames; cũng là giá trị dự phòng cho tư liệu).',
        },
        durationInFrames: {
          type: 'number',
          description: 'Thời lượng tính bằng khung theo fps dòng thời gian (thay thế duration cho motion-graphic).',
        },
        width: { type: 'number' },
        height: { type: 'number' },
        properties: {
          type: 'array',
          description: 'Thuộc tính chỉnh sửa được của motion-graphic (object có key, label, type, defaultValue).',
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
      'Bí danh cũ của push_asset: đăng ký URL tư liệu http(s) công khai thành tư liệu dự án.',
      'Ưu tiên download_media để tải vào thư viện hoặc push_asset để đăng ký URL. Hành vi cục bộ giống nhau.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL http(s) công khai của tệp tư liệu.' },
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
      'Tìm B-roll, ảnh, âm thanh hoặc nhạc trên các nền tảng tư liệu được tuyển chọn; trả về kết quả thống nhất có importUrl.',
      'kind=any|video|audio|music|image (mặc định video). platforms là danh sách nhà cung cấp phân tách bằng dấu phẩy, tùy chọn.',
      'Dùng category để thu hẹp ý định và horizontal|square|vertical cho hướng khung; tên orientation cũ vẫn được chấp nhận.',
      'Tổ hợp nhà cung cấp/type không hỗ trợ sẽ bị bỏ qua kèm cảnh báo. Ưu tiên khóa chính thức; tìm hình ảnh đủ điều kiện có thể dự phòng qua Firecrawl.',
      'Khi thành công, truyền importUrl của kết quả vào download_media hoặc push_asset.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', minLength: 1 },
        category: {
          type: 'string',
          description: 'Nhóm tùy chọn, như business, nature, technology, whoosh, piano hoặc ambient.',
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
          description: 'Số kết quả tối đa cho mỗi nền tảng và loại tư liệu.',
        },
      },
      required: ['query'],
    },
  },
];

export const STOCK_TOOL_NAMES = new Set(STOCK_TOOL_SCHEMAS.map((tool) => tool.name));
