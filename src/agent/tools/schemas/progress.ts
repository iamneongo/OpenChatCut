import type { AgentToolSchema } from '../../tool-schema';

/** Immutably extend track_progress without importing any progress executors. */
export function withProgressTargets(schemas: AgentToolSchema[]): AgentToolSchema[] {
  return schemas.map((tool) => {
    if (tool.name !== 'track_progress') return tool;
    const properties = (tool.input_schema.properties ?? {}) as Record<string, unknown>;
    return {
      ...tool,
      description: `${tool.description} Với target=transcription, kiểm tra độ sẵn sàng ASR tự động lúc ingest bằng assetIds thay vì jobIds; asset thành công sẽ mang transcript cấp từ mà clip kế thừa. target=upload kiểm tra file media của từng asset có thể truy cập hay không (blob placeholder báo running cho tới khi được liên kết lại với /media/uploads); target=visual-analysis theo dõi job làm nóng contact sheet / sẵn sàng frame (được xếp hàng khi ingest; dùng view_asset_frames / view_timeline_frames để xem hình ảnh thực tế).`,
      input_schema: {
        ...tool.input_schema,
        properties: {
          ...properties,
          target: { type: 'string', enum: ['generation', 'transcription', 'upload', 'visual-analysis'], description: 'Loại tác vụ bất đồng bộ cần kiểm tra: generation (mặc định), transcription, upload hoặc visual-analysis.' },
          assetIds: { type: 'string', description: 'Các ID/tiền tố tư liệu phân tách bằng dấu phẩy, dùng cho target=transcription / upload / visual-analysis.' },
        },
        required: ['action'],
      },
    };
  });
}
