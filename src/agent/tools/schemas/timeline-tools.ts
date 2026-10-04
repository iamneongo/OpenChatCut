import type { AgentToolSchema } from '../../tool-schema';

export const TIMELINE_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'manage_timelines',
    description:
      'Quản lý dòng thời gian dự án (sequence): list/create/duplicate/switch/update/delete, hoặc chèn một dòng thời gian thành phiên bản sequence lồng trong dòng thời gian đang hoạt động. Phiên bản lồng tham chiếu dòng thời gian con mà không sao chép và từ chối tham chiếu thiếu/vòng lặp.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'create', 'duplicate', 'switch', 'update', 'delete', 'insert'], description: 'Thao tác cần thực hiện.' },
        timelineId: { type: 'string', description: 'ID dòng thời gian đích (chấp nhận tiền tố/tên). insert: dòng thời gian con cần tham chiếu; update mặc định dòng thời gian đang hoạt động.' },
        timelineIds: { type: 'array', items: { type: 'string' }, description: 'delete: nhiều id dòng thời gian (chấp nhận tiền tố).' },
        name: { type: 'string', description: 'create/duplicate: tên dòng thời gian mới; update: đổi tên.' },
        ratio: { type: 'string', enum: ['16:9', '9:16', '1:1', '4:3', '3:4'], description: 'Preset tỷ lệ canvas (create/update). Dùng ratio HOẶC width+height rõ ràng, không dùng cả hai.' },
        width: { type: 'integer', description: 'Chiều rộng canvas px rõ ràng (create/update, bỏ qua khi truyền ratio).' },
        height: { type: 'integer', description: 'Chiều cao canvas px rõ ràng (create/update, bỏ qua khi truyền ratio).' },
        fit: { type: 'string', enum: ['contain', 'cover'], description: 'update: cách đoạn hiện có thích ứng canvas mới — contain letterbox, cover lấp đầy+cắt.' },
        hidden: { type: 'boolean', description: 'update: ẩn (true) hoặc khôi phục (false) tab dòng thời gian; dữ liệu được giữ. Không thể ẩn dòng thời gian cuối cùng đang hiển thị.' },
        activate: { type: 'boolean', description: 'create/duplicate: false giữ dòng thời gian hiện tại hoạt động (mặc định true; create batch kích hoạt mục cuối).' },
        timelines: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, ratio: { type: 'string' }, width: { type: 'integer' }, height: { type: 'integer' } } }, description: 'create: nhiều dòng thời gian cùng lúc, mỗi dòng thời gian {name, ratio | width+height}.' },
        track: { type: 'string', description: 'insert: ID/bí danh rãnh video đích.' },
        startFrame: { type: 'integer', description: 'insert: frame bắt đầu instance trên dòng thời gian đang hoạt động.' },
        sourceStartFrame: { type: 'integer', description: 'insert: điểm vào cửa sổ nguồn của dòng thời gian con (mặc định 0).' },
        sourceDurationInFrames: { type: 'integer', description: 'insert: độ dài cửa sổ nguồn tính bằng frame của dòng thời gian con (mặc định phần thời lượng còn lại).' },
        playbackRate: { type: 'number', description: 'insert: tốc độ phiên bản từ 0.1 đến 8 (mặc định 1).' },
      },
      required: ['action'],
    },
  },
];

export const TIMELINE_TOOL_NAMES = new Set(TIMELINE_TOOL_SCHEMAS.map((t) => t.name));
