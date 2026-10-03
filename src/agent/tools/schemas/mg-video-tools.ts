import type { AgentToolSchema } from '../../tool-schema';

export const MG_VIDEO_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'convert_motion_graphic_to_video',
    description:
      'Nướng motion graphic (hoặc bất kỳ clip không phải audio nào) trên timeline thành asset video thật trong media pool để có thể tái sử dụng/export như footage. Render clip đủ thời lượng bằng headless renderer. Clip MG/text/svg trong suốt được nướng thành WebM VP9 alpha (giữ transparency, qua sandbox) để composite trên clip khác; nếu sandbox không khả dụng sẽ fallback sang h264 opaque. Clip raster (video/image/gif) được nướng thành h264 opaque. Truyền opaque:true để buộc flatten, replace:true để đồng thời thay clip nguồn tại chỗ. Xác định clip bằng itemId (ưu tiên) hoặc assetId.',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Id clip timeline (chấp nhận tiền tố) cần chuyển đổi. Ưu tiên.' },
        assetId: { type: 'string', description: 'Fallback: chuyển clip đã đặt đầu tiên tham chiếu tới id asset/template này.' },
        replace: { type: 'boolean', description: 'Cũng thay clip nguồn tại chỗ bằng video đã nướng (mặc định false = chỉ thêm vào media pool).' },
        opaque: { type: 'boolean', description: 'Buộc nướng h264 opaque ngay cả với MG/text/svg (bỏ qua đường WebM VP9 trong suốt).' },
      },
    },
  },
  {
    name: 'register_converted_video',
    description:
      'Import render MG→video đã hoàn tất thành asset video trong media pool — bước 2 của quy trình chuyển MG→video. Sau khi track_export báo render hoàn tất, gọi với renderId (ưu tiên) để đưa output render vào media pool thành asset video thật; backend cục bộ tự phân giải output, không cần URL tải. outputUrl chỉ là fallback khi không có renderId. Trả về id asset video (chạy lại sẽ dedupe về cùng asset). Sau đó đặt video bằng edit_item (thêm video item tham chiếu videoAssetId trả về).',
    input_schema: {
      type: 'object',
      properties: {
        mgAssetId: { type: 'string', description: 'Id asset motion graphic nguồn (mgAssetId của clip đã chuyển đổi).' },
        renderId: { type: 'string', description: 'Id render của thao tác chuyển đổi (ưu tiên; truyền sau khi track_export báo render hoàn tất).' },
        outputUrl: { type: 'string', description: 'URL output render raw — chỉ fallback khi không có renderId.' },
        name: { type: 'string', description: 'Tên hiển thị asset trong media pool (mặc định "<MG name> (video)").' },
        durationInFrames: { type: 'number', description: 'Thời lượng tính bằng frame (mặc định theo độ dài MG nguồn nếu bỏ qua).' },
      },
      required: ['mgAssetId'],
    },
  },
  {
    name: 'export_motion_graphic_prores',
    description:
      'Export clip motion graphic thành file .mov ProRes 4444 trong suốt (giữ alpha) — định dạng bàn giao cho NLE, tải xuống trong trình duyệt. Dùng trước khi export XML để timeline tham chiếu media MG đã render. Xác định bằng itemId(s) (ưu tiên) hoặc assetId(s); batch sẽ export từng mục. Khác convert_motion_graphic_to_video (h264 opaque vào pool), tool này giữ alpha và tải file .mov.',
    input_schema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Id item MG trên timeline (chấp nhận tiền tố). Ưu tiên.' },
        itemIds: { type: 'array', items: { type: 'string' }, description: 'Batch: nhiều id/tiền tố item MG.' },
        assetId: { type: 'string', description: 'Id/tiền tố asset MG — export instance timeline đầu tiên đã đặt.' },
        assetIds: { type: 'array', items: { type: 'string' }, description: 'Batch: nhiều id/tiền tố asset MG.' },
        filenameMode: {
          type: 'string',
          enum: ['asset', 'xml'],
          description: 'asset = .mov theo tên asset thân thiện; xml = mg-<renderKey>.mov để tương thích XML submit_export. Mặc định asset.',
        },
        name: { type: 'string', description: 'Tên file cơ sở tùy chọn (export đơn); sẽ thêm ".mov".' },
        preferTimelineInstance: {
          type: 'boolean',
          description: 'Khi dùng assetId, export instance timeline đầu tiên và props đã chỉnh nếu có. Mặc định true. Đặt false để render giá trị mặc định media-pool/template.',
        },
        timelineId: { type: 'string', description: 'Id/tiền tố timeline tùy chọn để phân giải instance item hoặc asset mà không chuyển timeline.' },
      },
    },
  },
];

export const MG_VIDEO_TOOL_NAMES = new Set(MG_VIDEO_TOOL_SCHEMAS.map((t) => t.name));
