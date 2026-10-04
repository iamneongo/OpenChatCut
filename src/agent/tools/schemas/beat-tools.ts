import type { AgentToolSchema } from '../../tool-schema';

const DEFAULT_MARKER_CAP = 120;

export const BEAT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'detect_beats',
    description: [
      'Phát hiện nhịp và nhịp đầu ô nhịp trong âm thanh của tư liệu, ngay trên thiết bị (không mô hình, không mạng): trả về bpm,',
      'tỷ lệ tin cậy (tin kết quả từ ≥2; <1.2 sẽ không có beat — speech/ambience bị loại), beat và downbeat theo',
      'giây NGUỒN. Downbeat đánh dấu đầu ô nhịp 4/4 — cắt tại downbeat để dựng khớp nhạc; beat phù hợp nhịp montage nhanh.',
      'Hiệu quả nhất với nhạc có tốc độ ổn định; rãnh đổi tốc độ nên phân tích theo từng đoạn bằng đoạn riêng.',
      'Truyền assetId (kho tư liệu) để phân tích bản gốc, hoặc itemId (đoạn trên dòng thời gian) để NHẬN THÊM timelineFrames đã ánh xạ qua',
      'trim và speed của đoạn — sẵn sàng cho split/move/markers. Với itemId có thể đặt markers:"beats"|"downbeats" để tạo',
      'marker neo vào đoạn tại các điểm phát hiện trong một batch có thể hoàn tác (cyan=beat, tím=downbeat).',
      'Để tự đặt điểm cắt tại beat B (giây nguồn): timelineFrame = startFrame + round((B×fps − srcInFrame) / playbackRate).',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', description: 'ID tư liệu trong kho tư liệu (chấp nhận tiền tố) — phân tích nguồn gốc.' },
        itemId: { type: 'string', description: 'ID đoạn trên dòng thời gian (chấp nhận tiền tố) — thêm ánh xạ timelineFrames và bật marker.' },
        markers: { type: 'string', enum: ['none', 'beats', 'downbeats'], description: 'Chỉ itemId: cũng tạo marker neo đoạn tại các điểm này (mặc định none).' },
        markerLimit: { type: 'number', minimum: 1, maximum: 500, description: `Giới hạn số marker tạo ra (mặc định ${DEFAULT_MARKER_CAP}).` },
      },
    },
  },
];

export const BEAT_TOOL_NAMES = new Set(BEAT_TOOL_SCHEMAS.map((t) => t.name));
