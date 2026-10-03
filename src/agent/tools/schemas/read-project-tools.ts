import type { AgentToolSchema } from '../../tool-schema';

export const READ_PROJECT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'read_project',
    description: [
      'Đọc dự án hiện đang được session agent nhắm tới, gồm cả trạng thái draft hiển thị trong context tool hiện tại.',
      'Mặc định = tổng quan đầy đủ. Thu hẹp bằng view:"timeline"|"assets", timelineId, track, fromFrame/toFrame, itemId hoặc assetId; projectId không thể chuyển target của lần gọi này.',
      'Tham chiếu timeline/track không tồn tại sẽ trả lỗi. itemId/assetId là bộ lọc nên tiền tố không khớp trả mảng item/asset rỗng thay vì lỗi.',
      'Truyền code:true cùng assetId để bao gồm source code MG. Đọc lúc bắt đầu session hoặc sau thay đổi bên ngoài; giữa các chỉnh sửa của chính mình, dùng delta mutation trừ khi note yêu cầu đọc lại.',
      'Item timeline gồm liên kết media chuẩn (sourceAssetId, resolvedSourceAssetId, linkStatus), source window chính xác (srcInFrame, sourceStartFrame, sourceDurationInFrames, sourceEndFrameExclusive) và trạng thái chỉnh sửa được (keyframes, transform, filters, volume, fadeInFrames, fadeOutFrames).',
      'timeline.selectedId / selectedIds / selected là lựa chọn trong inspector. Nếu người dùng nói "clip đã chọn" hoặc "clip này", dùng id đó — không chọn track kế bên. Alias video đi từ dưới lên: V1 là track video dưới cùng, không phải lane trên cùng.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        view: {
          type: 'string',
          enum: ['timeline', 'assets'],
          description: "'timeline' gồm track+item+marker; 'assets' chỉ thư viện. Bỏ qua để xem tổng quan đầy đủ.",
        },
        timelineId: { type: 'string', description: 'Kiểm tra timeline không hoạt động theo id/tiền tố mà không chuyển timeline.' },
        track: { type: 'string', description: 'Lọc theo alias track (ví dụ C1, V1, A1).' },
        fromFrame: { type: 'number', description: 'Item chồng lên frame này hoặc phía sau (nửa mở với toFrame).' },
        toFrame: { type: 'number', description: 'Giới hạn frame trên, không bao gồm.' },
        itemId: { type: 'string', description: 'Id item hoặc tiền tố, phân tách bằng dấu phẩy.' },
        assetId: { type: 'string', description: 'Id asset hoặc tiền tố, phân tách bằng dấu phẩy.' },
        code: { type: 'boolean', description: 'Bao gồm code MG khi đã đặt assetId.' },
        projectId: { type: 'string', description: 'Bỏ qua. Gọi target_project trước; tool này đọc dự án mà session hiện tại đang nhắm tới.' },
      },
      additionalProperties: false,
    },
  },
];

export const READ_PROJECT_TOOL_NAMES = new Set(READ_PROJECT_TOOL_SCHEMAS.map((t) => t.name));
