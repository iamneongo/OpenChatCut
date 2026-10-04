import type { AgentToolSchema } from '../../tool-schema';

const FORMAT_ENUM = [
  'markdown', 'html', 'rawHtml', 'images', 'links',
  'branding', 'summary', 'screenshot', 'videos',
] as const;

export const WEB_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'web_browser',
    description: [
      'Trích xuất một trang web qua Firecrawl (web_browser → Firecrawl /scrape).',
      'formats: markdown (mặc định), html, rawHtml, images, links, branding, summary, screenshot, videos.',
      'branding = bộ nhận diện thương hiệu gốc (màu/phông chữ/logo); summary = tóm tắt trang gốc.',
      'screenshot được tự động lưu vào kho tư liệu dưới dạng screenshotAssetId khi có thể.',
      'Với nhiều URL đã biết dùng web_batch_scrape; khám phá trang dùng web_map; quét nhiều trang dùng web_crawl; tìm kiếm dùng web_search.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL trang (http/https).' },
        formats: {
          type: 'array',
          items: { type: 'string', enum: [...FORMAT_ENUM] },
          description: "Mặc định ['markdown'].",
        },
        onlyMainContent: { type: 'boolean', description: 'Bỏ thanh điều hướng/chân trang (mặc định true).' },
        fullPage: { type: 'boolean', description: 'Chụp toàn trang khi format có screenshot.' },
        waitFor: { type: 'number', description: 'Số ms chờ trước khi trích xuất (0–10000).' },
        timeout: { type: 'number', description: 'Timeout ms (tối đa 60000).' },
        country: { type: 'string', description: "Mã quốc gia địa lý, ví dụ 'US'." },
        query: { type: 'string', description: 'Lời nhắc trích xuất có cấu trúc bằng ngôn ngữ tự nhiên.' },
        schema: { description: 'Schema JSON cho trích xuất có cấu trúc.' },
        actions: {
          type: 'array',
          description: 'Thao tác trên trang Firecrawl trước khi trích xuất (click/wait/scroll/…), tối đa 10. '
            + 'Với type=executeJavascript, script KHÔNG ĐƯỢC chứa return ở cấp cao nhất '
            + '(Firecrawl sẽ từ chối với SyntaxError: Illegal return statement) — viết script '
            + 'dưới dạng biểu thức thuần hoặc bọc trong IIFE như (() => { ... })().',
          items: {},
        },
        execJs: {
          type: 'string',
          description: 'JS chạy trước khi trích xuất (tối đa 10000 ký tự). '
            + 'Không cho phép return ở cấp cao nhất — dùng biểu thức thuần hoặc IIFE.',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'web_search',
    description: [
      'Tìm kiếm web qua Firecrawl /search (API chính thức). Trả về tiêu đề, URL, mô tả;',
      'mặc định cũng trích xuất markdown cho từng kết quả (scrapeMarkdown=true).',
      'Dùng toán tử site: / filetype: trong query khi hữu ích. Ưu tiên cách này thay vì tự đoán URL.',
      'Sau đó dùng web_browser với URL cụ thể để trích xuất sâu/chụp màn hình.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Truy vấn tìm kiếm (hỗ trợ toán tử như site:example.com).' },
        limit: { type: 'number', description: 'Số kết quả tối đa 1–20 (mặc định 5).' },
        country: { type: 'string', description: "Quốc gia ISO, ví dụ 'US' (mặc định US trên Firecrawl)." },
        lang: { type: 'string', description: 'Mã ngôn ngữ nếu provider hỗ trợ.' },
        tbs: {
          type: 'string',
          description: 'Bộ lọc thời gian, ví dụ qdr:d (ngày), qdr:w (tuần), qdr:m (tháng), qdr:y (năm).',
        },
        scrapeMarkdown: {
          type: 'boolean',
          description: 'Nếu true (mặc định), bao gồm markdown cho từng kết quả qua scrapeOptions.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_map',
    description: [
      'Khám phá URL trên website qua Firecrawl /map (API chính thức). Tìm sitemap+link nhanh,',
      'KHÔNG tải toàn bộ nội dung trang. Dùng search để xếp hạng theo độ liên quan của đường dẫn.',
      'Sau đó dùng web_browser hoặc web_crawl với các URL đã chọn để lấy nội dung.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL site gốc cần lập bản đồ.' },
        search: { type: 'string', description: 'Path/từ khóa tùy chọn để xếp hạng kết quả (ví dụ blog).' },
        limit: { type: 'number', description: 'Số link tối đa 1–500 (mặc định 100).' },
        includeSubdomains: { type: 'boolean', description: 'Bao gồm subdomain (mặc định true).' },
        ignoreQueryParameters: { type: 'boolean', description: 'Bỏ URL có ?query (mặc định true).' },
        sitemap: {
          type: 'string',
          enum: ['skip', 'include', 'only'],
          description: 'Chế độ sitemap: skip | include (mặc định) | only.',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'web_crawl',
    description: [
      'Quét nhiều trang từ URL bắt đầu qua Firecrawl /crawl (API chính thức).',
      'Khởi chạy tác vụ và chờ (poll) tới khi hoàn tất hoặc tới maxWaitMs.',
      'Trả về markdown rút gọn cho từng trang. Giữ limit nhỏ (mặc định 10, tối đa 50).',
      'Với một trang dùng web_browser; chỉ cần danh sách URL thì dùng web_map.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL bắt đầu.' },
        limit: { type: 'number', description: 'Số trang tối đa 1–50 (mặc định 10).' },
        maxDiscoveryDepth: {
          type: 'number',
          description: 'Độ sâu khám phá tối đa 0–5 (alias maxDepth).',
        },
        maxDepth: { type: 'number', description: 'Alias của maxDiscoveryDepth.' },
        includePaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Mẫu regex pathname cần bao gồm (ví dụ blog/.*).',
        },
        excludePaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Mẫu regex pathname cần loại trừ.',
        },
        allowSubdomains: { type: 'boolean', description: 'Theo dõi subdomain (mặc định false).' },
        crawlEntireDomain: {
          type: 'boolean',
          description: 'Theo dõi link nội bộ ngang hàng/cha, không chỉ link con (mặc định false).',
        },
        maxWaitMs: {
          type: 'number',
          description: 'Thời gian chờ tối đa cho crawl job tính bằng ms (mặc định 90000, tối đa 180000).',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'web_batch_scrape',
    description: [
      'Trích xuất hàng loạt nhiều URL đã biết qua Firecrawl /batch/scrape (API v2 chính thức).',
      'Khởi chạy tác vụ và chờ (poll) tới khi hoàn tất hoặc tới maxWaitMs.',
      'Tối đa 15 URL mỗi lần gọi. formats: markdown (mặc định), summary, branding, links, html.',
      'Dùng khi đã có sẵn danh sách URL (ví dụ từ web_search hoặc web_map).',
      'Với một trang dùng web_browser; để khám phá URL từ seed dùng web_crawl hoặc web_map.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Danh sách URL trang cần trích xuất (1–15).',
        },
        formats: {
          type: 'array',
          items: { type: 'string', enum: [...FORMAT_ENUM] },
          description: "Mặc định ['markdown']. Ưu tiên markdown, summary, branding cho agent.",
        },
        onlyMainContent: { type: 'boolean', description: 'Bỏ nav/footer (mặc định true).' },
        maxWaitMs: {
          type: 'number',
          description: 'Thời gian chờ tối đa cho batch job tính bằng ms (mặc định 90000, tối đa 180000).',
        },
      },
      required: ['urls'],
    },
  },
];

export const WEB_TOOL_NAMES = new Set(WEB_TOOL_SCHEMAS.map((t) => t.name));
