import type { AgentToolSchema } from '../../tool-schema';

const SILENCE_DEFAULTS = {
  thresholdDb: -26,
  minSilenceMs: 600,
  padMs: 150,
} as const;

export const SILENCE_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'remove_silence',
    description: [
      'Xóa khoảng chết — đoạn yên lặng, không có lời — khỏi đoạn, ripple để đóng từng khoảng trên rãnh tương ứng (MỘT batch có thể hoàn tác).',
      'Phát hiện trên thiết bị và theo tương đối: một đoạn chỉ được tính là im lặng khi mức âm thấp hơn rõ rệt mức lời nói riêng của clip',
      '(vì vậy nhạc nền và ambience lớn không bị cắt), kéo dài ít nhất minSilenceMs và giữ khoảng đệm padMs ở hai phía.',
      'Dùng để làm nhịp dựng gọn hơn (pause dài, khoảng chết giữa các take). Công cụ bổ sung cho chỉnh sửa cấp từ:',
      'đoạn đã chép lời mà đã có chỉnh sửa từ hoặc giới hạn gap sẽ bị bỏ qua — dùng clean_script vì công cụ đó cắt pause chính xác theo từ.',
      'Đoạn có playbackRate≠1 hoặc hoạt ảnh zoom sẽ bị bỏ qua (báo trong skipped[]). Ripple theo từng rãnh: rãnh khác không dịch chuyển.',
      'Gọi một lần KHÔNG có itemId để quét mọi đoạn âm thanh/video trên dòng thời gian đang hoạt động; truyền itemId cho một đoạn duy nhất.',
      'Truyền dryRun:true để xem trước danh sách điểm cắt (giây) mà không chỉnh sửa.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Chỉ đoạn này (chấp nhận tiền tố ID). Bỏ qua để xử lý mọi đoạn âm thanh/video.' },
        thresholdDb: { type: 'number', minimum: -60, maximum: -6, description: `Ngưỡng silence tương đối với mức lời của clip tính bằng dB (mặc định ${SILENCE_DEFAULTS.thresholdDb}; càng âm = càng thận trọng).` },
        minSilenceMs: { type: 'number', minimum: 200, maximum: 10000, description: `Chỉ xóa pause dài ít nhất giá trị này (mặc định ${SILENCE_DEFAULTS.minSilenceMs}ms).` },
        padMs: { type: 'number', minimum: 0, maximum: 1000, description: `Khoảng đệm giữ ở mỗi phía của điểm cắt (mặc định ${SILENCE_DEFAULTS.padMs}ms).` },
        dryRun: { type: 'boolean', description: 'true = báo các điểm cắt dự kiến mà không chỉnh sửa.' },
      },
    },
  },
];

export const SILENCE_TOOL_NAMES = new Set(SILENCE_TOOL_SCHEMAS.map((t) => t.name));
