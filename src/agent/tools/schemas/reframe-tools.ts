import type { AgentToolSchema } from '../../tool-schema';

export const REFRAME_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'auto_reframe',
    description:
      "Tự động reframe clip video: lấy mẫu các frame, phát hiện chủ thể/điểm trọng tâm theo từng khoảng và ghi keyframe reframe (builtin:zoom __openchatcutReframeCurve) để cửa sổ crop bám theo chủ thể khi tỷ lệ canvas khác nhau (ví dụ 16:9→9:16). Xóa keyframe reframe hiện có của clip trước rồi phát hiện lại. Chỉ chạy trên trình duyệt (cần pixel video thực); trả lỗi nếu chạy headless hoặc target không phải video có source.",
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Id clip video đích (chấp nhận tiền tố).' },
        intervalFrames: { type: 'number', description: 'Lấy mẫu video mỗi N frame (mặc định 15, tối thiểu 1). Nhỏ hơn = nhiều keyframe hơn, chậm hơn.' },
        sensitivity: { type: 'number', description: 'Độ sắc nét tiêu điểm 0..1: cao hơn sẽ bám mạnh hơn vào vùng nhiều chi tiết nhất (mặc định 0.5).' },
        smooth: { type: 'number', description: 'EMA theo thời gian 0..1 trên đường đi của tiêu điểm (mặc định 0.45). Cao hơn = crop ít rung hơn; 0 = năng lượng thô theo từng frame.' },
        maxSamples: { type: 'number', description: 'Giới hạn số lần seek mẫu cho clip dài (mặc định 60).' },
      },
      required: ['itemId'],
    },
  },
];

export const REFRAME_TOOL_NAMES = new Set(REFRAME_TOOL_SCHEMAS.map((t) => t.name));
