import type { AgentToolSchema } from '../../tool-schema';

export const PROBE_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'probe_media',
    description:
      'Phân tích tệp tư liệu bằng ffprobe được đóng gói trong ứng dụng (không cần hộp cát hoặc khóa API). Trả về thời lượng, kích thước, fps trung bình, sự hiện diện/bộ mã hóa của luồng cùng qualityRisks rõ ràng (độ phân giải thấp, mono, quá ngắn, tốc độ khung hình biến thiên/thấp). Nhận assetId/tiền tố trong kho tư liệu, đường dẫn cục bộ /media/… hoặc URL https công khai. Dùng trước finalize_uploaded_asset để truyền hasAudioTrack và fps/thời lượng đã đo. Kết quả download_media/push_asset đã chứa cùng phép đo như `probe`, nên không phân tích lại tệp vừa nhập. Công cụ chỉ lỗi khi không đọc được nguồn; sau đó finalize vẫn có thể dùng giá trị mặc định lúc nhập.',
    input_schema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'AssetId/tiền tố trong kho tư liệu, đường dẫn cục bộ /media/… hoặc URL https:// công khai.' },
      },
      required: ['source'],
    },
  },
];

export const PROBE_TOOL_NAMES = new Set(PROBE_TOOL_SCHEMAS.map((t) => t.name));
