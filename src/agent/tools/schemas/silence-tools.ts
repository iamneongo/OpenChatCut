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
      'Xóa khoảng chết — đoạn yên lặng, không có lời — khỏi clip, ripple để đóng từng khoảng trên track tương ứng (MỘT batch có thể undo).',
      'Phát hiện trên thiết bị và theo tương đối: một đoạn chỉ được tính là im lặng khi mức âm thấp hơn rõ rệt mức lời nói riêng của clip',
      '(vì vậy nhạc nền và ambience lớn không bị cắt), kéo dài ít nhất minSilenceMs và giữ khoảng đệm padMs ở hai phía.',
      'Dùng để làm nhịp dựng gọn hơn (pause dài, khoảng chết giữa các take). Tool bổ sung cho chỉnh sửa cấp từ:',
      'clip đã chuyển lời mà đã có chỉnh sửa từ hoặc giới hạn gap sẽ bị bỏ qua — dùng clean_script vì tool đó cắt pause chính xác theo từ.',
      'Clip có playbackRate≠1 hoặc zoom animation sẽ bị bỏ qua (báo trong skipped[]). Ripple theo từng track: track khác không dịch chuyển.',
      'Gọi một lần KHÔNG có itemId để quét mọi clip audio/video trên timeline đang hoạt động; truyền itemId cho một clip duy nhất.',
      'Truyền dryRun:true để xem trước danh sách điểm cắt (giây) mà không chỉnh sửa.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Chỉ clip này (chấp nhận tiền tố id). Bỏ qua để xử lý mọi clip audio/video.' },
        thresholdDb: { type: 'number', minimum: -60, maximum: -6, description: `Ngưỡng silence tương đối với mức lời của clip tính bằng dB (mặc định ${SILENCE_DEFAULTS.thresholdDb}; càng âm = càng thận trọng).` },
        minSilenceMs: { type: 'number', minimum: 200, maximum: 10000, description: `Chỉ xóa pause dài ít nhất giá trị này (mặc định ${SILENCE_DEFAULTS.minSilenceMs}ms).` },
        padMs: { type: 'number', minimum: 0, maximum: 1000, description: `Khoảng đệm giữ ở mỗi phía của điểm cắt (mặc định ${SILENCE_DEFAULTS.padMs}ms).` },
        dryRun: { type: 'boolean', description: 'true = báo các điểm cắt dự kiến mà không chỉnh sửa.' },
      },
    },
  },
];

export const SILENCE_TOOL_NAMES = new Set(SILENCE_TOOL_SCHEMAS.map((t) => t.name));
