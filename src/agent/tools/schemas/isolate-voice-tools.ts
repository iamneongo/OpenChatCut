import type { AgentToolSchema } from '../../tool-schema';

export const ISOLATE_VOICE_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'isolate_voice',
    description:
      'Tách giọng nói bằng AI: giảm nhiễu nền trên clip video/audio để lời nói rõ hơn. ' +
      'action=apply (mặc định) tạo artifact tách giọng ffmpeg full-wet bất biến và gắn vào denoisedSrc; strength điều khiển playback dry/wet không phá hủy trong khi src master giữ nguyên. ' +
      'action=attach trỏ clip tới asset audio hiện có sau khi kiểm tra denoisedAssetId và sourceAssetId. ' +
      'action=clear xóa tách giọng và khôi phục audio gốc. ' +
      'strength 0..100 (mặc định 70). Yêu cầu source /media/uploads (upload/finalize trước).',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Id clip video/audio đích (chấp nhận tiền tố).' },
        action: {
          type: 'string',
          enum: ['apply', 'attach', 'clear'],
          description: 'apply = chạy tách giọng; attach = dùng asset audio đã tách hiện có; clear = tháo liên kết.',
        },
        sourceAssetId: {
          type: 'string',
          description: 'attach: id hoặc tiền tố duy nhất của asset audio/video nguồn. Phải khớp source của clip đích.',
        },
        denoisedAssetId: {
          type: 'string',
          description: 'attach: id hoặc tiền tố duy nhất của asset audio hiện có chứa audio full-source đã tách.',
        },
        strength: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Mix tách giọng dry/wet 0..100 (mặc định 70). 0 giữ master dry; 100 dùng artifact đã tách.',
        },
        force: {
          type: 'boolean',
          description: 'apply: tạo artifact bất biến mới ngay cả khi artifact cùng revision/engine/strength đã tồn tại.',
        },
      },
      required: ['itemId'],
    },
  },
];

export const ISOLATE_VOICE_TOOL_NAMES = new Set(ISOLATE_VOICE_TOOL_SCHEMAS.map((t) => t.name));
