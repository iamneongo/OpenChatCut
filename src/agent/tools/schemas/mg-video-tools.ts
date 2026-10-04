import type { AgentToolSchema } from '../../tool-schema';

export const MG_VIDEO_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'convert_motion_graphic_to_video',
    description:
      'Nướng motion graphic (hoặc bất kỳ đoạn nào không phải audio) trên dòng thời gian thành tư liệu video thật trong kho tư liệu để có thể tái sử dụng hoặc xuất như footage. Kết xuất đoạn đủ thời lượng bằng bộ kết xuất headless. Đoạn MG/text/svg trong suốt được nướng thành WebM VP9 alpha (giữ độ trong suốt, qua sandbox) để ghép trên đoạn khác; nếu sandbox không khả dụng sẽ dự phòng sang h264 đục. Đoạn raster (video/image/gif) được nướng thành h264 đục. Truyền opaque:true để buộc làm phẳng, replace:true để đồng thời thay đoạn nguồn tại chỗ. Xác định đoạn bằng itemId (ưu tiên) hoặc assetId.',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Id đoạn trên dòng thời gian (chấp nhận tiền tố) cần chuyển đổi. Ưu tiên.' },
        assetId: { type: 'string', description: 'Dự phòng: chuyển đoạn đầu tiên đã đặt có tham chiếu tới ID tư liệu/mẫu này.' },
        replace: { type: 'boolean', description: 'Cũng thay đoạn nguồn tại chỗ bằng video đã nướng (mặc định false = chỉ thêm vào kho tư liệu).' },
        opaque: { type: 'boolean', description: 'Buộc nướng h264 đục ngay cả với MG/text/svg (bỏ qua đường WebM VP9 trong suốt).' },
      },
    },
  },
  {
    name: 'register_converted_video',
    description:
      'Nhập bản kết xuất MG→video đã hoàn tất thành tư liệu video trong kho tư liệu — bước 2 của quy trình chuyển MG→video. Sau khi track_export báo kết xuất hoàn tất, gọi với renderId (ưu tiên) để đưa output kết xuất vào kho tư liệu thành tư liệu video thật; backend cục bộ tự phân giải output, không cần URL tải. outputUrl chỉ là phương án dự phòng khi không có renderId. Trả về ID tư liệu video (chạy lại sẽ dùng lại cùng tư liệu). Sau đó đặt video bằng edit_item (thêm đoạn video tham chiếu videoAssetId trả về).',
    input_schema: {
      type: 'object',
      properties: {
        mgAssetId: { type: 'string', description: 'ID tư liệu motion graphic nguồn (mgAssetId của đoạn đã chuyển đổi).' },
        renderId: { type: 'string', description: 'Id kết xuất của thao tác chuyển đổi (ưu tiên; truyền sau khi track_export báo kết xuất hoàn tất).' },
        outputUrl: { type: 'string', description: 'URL đầu ra kết xuất thô — chỉ dùng dự phòng khi không có renderId.' },
        name: { type: 'string', description: 'Tên hiển thị tư liệu trong kho tư liệu (mặc định "<MG name> (video)").' },
        durationInFrames: { type: 'number', description: 'Thời lượng tính bằng khung (mặc định theo độ dài MG nguồn nếu bỏ qua).' },
      },
      required: ['mgAssetId'],
    },
  },
  {
    name: 'export_motion_graphic_prores',
    description:
      'Xuất đoạn motion graphic thành tệp .mov ProRes 4444 trong suốt (giữ alpha) — định dạng bàn giao cho NLE, tải xuống trong trình duyệt. Dùng trước khi xuất XML để dòng thời gian tham chiếu media MG đã kết xuất. Xác định bằng itemId(s) (ưu tiên) hoặc assetId(s); lô sẽ xuất từng đoạn. Khác convert_motion_graphic_to_video (h264 đục vào kho), công cụ này giữ alpha và tải tệp .mov.',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'ID đoạn MG trên dòng thời gian (chấp nhận tiền tố). Ưu tiên.' },
        itemIds: { type: 'array', items: { type: 'string' }, description: 'Lô: nhiều ID/tiền tố đoạn MG.' },
        assetId: { type: 'string', description: 'ID/tiền tố tư liệu MG — xuất instance đầu tiên đã đặt trên dòng thời gian.' },
        assetIds: { type: 'array', items: { type: 'string' }, description: 'Lô: nhiều ID/tiền tố tư liệu MG.' },
        filenameMode: {
          type: 'string',
          enum: ['asset', 'xml'],
          description: 'asset = .mov theo tên tư liệu dễ đọc; xml = mg-<renderKey>.mov để tương thích XML submit_export. Mặc định asset.',
        },
        name: { type: 'string', description: 'Tên tệp cơ sở tùy chọn (xuất đơn); sẽ thêm ".mov".' },
        preferTimelineInstance: {
          type: 'boolean',
          description: 'Khi dùng assetId, xuất đoạn đầu tiên trên dòng thời gian và props đã chỉnh nếu có. Mặc định true. Đặt false để kết xuất giá trị mặc định của media-pool/template.',
        },
        timelineId: { type: 'string', description: 'Id/tiền tố dòng thời gian tùy chọn để phân giải instance item hoặc asset mà không chuyển dòng thời gian.' },
      },
    },
  },
];

export const MG_VIDEO_TOOL_NAMES = new Set(MG_VIDEO_TOOL_SCHEMAS.map((t) => t.name));
