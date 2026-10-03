import type { AgentToolSchema } from '../../tool-schema';

const DEFAULT_MARKER_CAP = 120;

export const BEAT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'detect_beats',
    description: [
      'Phát hiện beat và downbeat nhạc trong audio của asset media, ngay trên thiết bị (không model, không mạng): trả về bpm,',
      'tỷ lệ tin cậy (tin kết quả từ ≥2; <1.2 sẽ không có beat — speech/ambience bị loại), beat và downbeat theo',
      'giây NGUỒN. Downbeat đánh dấu đầu ô nhịp 4/4 — cắt tại downbeat để dựng khớp nhạc; beat phù hợp nhịp montage nhanh.',
      'Hiệu quả nhất với nhạc tempo ổn định; track đổi tempo nên phân tích theo từng đoạn bằng clip riêng.',
      'Truyền assetId (media pool) để phân tích raw, hoặc itemId (clip timeline) để NHẬN THÊM timelineFrames đã mapping qua',
      'trim và speed của clip — sẵn sàng cho split/move/markers. Với itemId có thể đặt markers:"beats"|"downbeats" để tạo',
      'marker neo vào clip tại các điểm phát hiện trong một batch có thể undo (cyan=beat, purple=downbeat).',
      'Để tự đặt điểm cắt tại beat B (giây nguồn): timelineFrame = startFrame + round((B×fps − srcInFrame) / playbackRate).',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', description: 'Id asset trong media pool (chấp nhận tiền tố) — phân tích source raw.' },
        itemId: { type: 'string', description: 'Id clip timeline (chấp nhận tiền tố) — thêm mapping timelineFrames và bật marker.' },
        markers: { type: 'string', enum: ['none', 'beats', 'downbeats'], description: 'Chỉ itemId: cũng tạo marker neo clip tại các điểm này (mặc định none).' },
        markerLimit: { type: 'number', minimum: 1, maximum: 500, description: `Giới hạn số marker tạo ra (mặc định ${DEFAULT_MARKER_CAP}).` },
      },
    },
  },
];

export const BEAT_TOOL_NAMES = new Set(BEAT_TOOL_SCHEMAS.map((t) => t.name));
