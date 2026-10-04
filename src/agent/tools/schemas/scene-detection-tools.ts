import type { AgentToolSchema } from '../../tool-schema';

export const SCENE_DETECTION_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'detect_scenes',
  description: [
    'Phát hiện thay đổi cảnh hình ảnh trong một video nguồn bằng tăng tốc FFmpeg cục bộ.',
    'Truyền itemId để kiểm tra đoạn trên dòng thời gian (trim và speed được ánh xạ chính xác), hoặc assetId để chỉ tạo báo cáo kho tư liệu.',
    'apply=markers tạo marker dòng thời gian theo mục; apply=split cắt đoạn tại mọi ranh giới cảnh được chấp nhận trong một chỉnh sửa có thể hoàn tác.',
    'Mặc định apply=report. Dùng threshold 0.2 để phát hiện nhạy, 0.3 cân bằng, 0.45 thận trọng.',
  ].join(' '),
  input_schema: {
    type: 'object',
    properties: {
      itemId: { type: 'string', description: 'ID đoạn video/gif trên dòng thời gian (chấp nhận tiền tố). Bắt buộc cho markers/split.' },
      assetId: { type: 'string', description: 'ID tư liệu video/gif trong kho tư liệu (chấp nhận tiền tố). Chỉ báo cáo trừ khi đồng thời truyền itemId.' },
      threshold: { type: 'number', description: 'Ngưỡng độ nhạy cảnh 0.05–0.95; thấp hơn sẽ tìm nhiều thay đổi hơn. Mặc định 0.3.' },
      minSceneSeconds: { type: 'number', description: 'Khoảng cách tối thiểu giữa các điểm cắt. Mặc định 0.75s.' },
      maxScenes: { type: 'number', description: 'Số ranh giới tối đa trả về/áp dụng. Mặc định 200, tối đa 500.' },
      apply: { type: 'string', enum: ['report', 'markers', 'split'], description: 'report (mặc định), markers hoặc split.' },
    },
  },
}];

export const SCENE_DETECTION_TOOL_NAMES = new Set(SCENE_DETECTION_TOOL_SCHEMAS.map((tool) => tool.name));
