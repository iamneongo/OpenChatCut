import type { AgentToolSchema } from '../../tool-schema';

export const TIMELINE_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'manage_timelines',
    description:
      'Quản lý timeline dự án (sequence): list/create/duplicate/switch/update/delete, hoặc chèn một timeline thành instance sequence lồng trong timeline đang hoạt động. Instance lồng tham chiếu timeline con mà không sao chép và từ chối tham chiếu thiếu/vòng lặp.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'create', 'duplicate', 'switch', 'update', 'delete', 'insert'], description: 'Thao tác cần thực hiện.' },
        timelineId: { type: 'string', description: 'Id timeline đích (chấp nhận tiền tố/tên). insert: timeline con cần tham chiếu; update mặc định timeline đang hoạt động.' },
        timelineIds: { type: 'array', items: { type: 'string' }, description: 'delete: nhiều id timeline (chấp nhận tiền tố).' },
        name: { type: 'string', description: 'create/duplicate: tên timeline mới; update: đổi tên.' },
        ratio: { type: 'string', enum: ['16:9', '9:16', '1:1', '4:3', '3:4'], description: 'Preset tỷ lệ canvas (create/update). Dùng ratio HOẶC width+height rõ ràng, không dùng cả hai.' },
        width: { type: 'integer', description: 'Chiều rộng canvas px rõ ràng (create/update, bỏ qua khi truyền ratio).' },
        height: { type: 'integer', description: 'Chiều cao canvas px rõ ràng (create/update, bỏ qua khi truyền ratio).' },
        fit: { type: 'string', enum: ['contain', 'cover'], description: 'update: cách clip hiện có thích ứng canvas mới — contain letterbox, cover lấp đầy+cắt.' },
        hidden: { type: 'boolean', description: 'update: ẩn (true) hoặc khôi phục (false) tab timeline; dữ liệu được giữ. Không thể ẩn timeline cuối cùng đang hiển thị.' },
        activate: { type: 'boolean', description: 'create/duplicate: false giữ timeline hiện tại hoạt động (mặc định true; create batch kích hoạt entry cuối).' },
        timelines: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, ratio: { type: 'string' }, width: { type: 'integer' }, height: { type: 'integer' } } }, description: 'create: nhiều timeline cùng lúc, mỗi timeline {name, ratio | width+height}.' },
        track: { type: 'string', description: 'insert: id/alias track video đích.' },
        startFrame: { type: 'integer', description: 'insert: frame bắt đầu instance trên timeline đang hoạt động.' },
        sourceStartFrame: { type: 'integer', description: 'insert: điểm vào source window của timeline con (mặc định 0).' },
        sourceDurationInFrames: { type: 'integer', description: 'insert: độ dài source window tính bằng frame của timeline con (mặc định phần thời lượng còn lại).' },
        playbackRate: { type: 'number', description: 'insert: tốc độ instance từ 0.1 đến 8 (mặc định 1).' },
      },
      required: ['action'],
    },
  },
];

export const TIMELINE_TOOL_NAMES = new Set(TIMELINE_TOOL_SCHEMAS.map((t) => t.name));
