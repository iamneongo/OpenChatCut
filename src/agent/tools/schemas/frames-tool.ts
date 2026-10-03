import type { AgentToolSchema } from '../../tool-schema';

export const FRAMES_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'view_timeline_frames',
    description: [
      'Kết xuất frame tĩnh của một composition timeline (bao gồm cả chỉnh sửa nháp/chưa công bố).',
      'frames và seconds là tọa độ TIMELINE TUYỆT ĐỐI, không phải vị trí trong media nguồn.',
      'Dùng sau các chỉnh sửa hình ảnh (MG/text, transition, zoom, filter, tỷ lệ khung hình, phụ đề) để kiểm tra kết quả composition.',
      'Truyền tọa độ chính xác hoặc count; nếu không có, tool lấy mẫu đều (mặc định 4, tối đa 8). Nhiều frame sẽ được gộp thành contact sheet có nhãn khi có thể.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        frames: { type: 'array', items: { type: 'number' }, maxItems: 8, description: 'Số frame tuyệt đối trên timeline cần kết xuất.' },
        seconds: { type: 'array', items: { type: 'number' }, maxItems: 8, description: 'Số giây tuyệt đối trên timeline (được đổi theo fps timeline).' },
        count: { type: 'number', minimum: 1, maximum: 8, description: 'Các điểm giữa đều nhau trên timeline/vùng (mặc định 4, tối đa 8).' },
        fromSeconds: { type: 'number', description: 'Điểm đầu vùng timeline tuyệt đối (dùng cùng toSeconds).' },
        toSeconds: { type: 'number', description: 'Điểm cuối vùng timeline tuyệt đối (dùng cùng fromSeconds).' },
        timelineId: { type: 'string', description: 'ID/tiền tố timeline; bỏ qua để dùng timeline đang hoạt động trong phiên agent.' },
      },
    },
  },
  {
    name: 'view_asset_frames',
    description: [
      'Kiểm tra media NGUỒN và xem contact sheet có nhãn; các tọa độ này không bao giờ trỏ tới timeline đã composition.',
      'Truyền assetId để lấy toàn bộ nguồn trong pool, hoặc itemId để giới hạn mẫu vào vùng nguồn hiển thị của clip đã đặt (có tính srcInFrame + playbackRate).',
      'sourceTimesMs, frames, seconds và fromSeconds/toSeconds đều là tọa độ MEDIA NGUỒN. Khi có itemId, mẫu bị kẹp vào vùng nguồn hiển thị của clip.',
      'Dùng để chọn/kiểm tra chất lượng nguồn; dùng view_timeline_frames để kiểm tra composition timeline. Audio không có frame.',
      'Quét rộng mặc định = 6 điểm giữa vùng nguồn, tối đa 8. Tái sử dụng contact sheet thay vì lấy mẫu lặp lại cùng vùng. Video upload đã hoàn tất ưu tiên ffmpeg; đường dẫn blob/image/MG dùng trình duyệt hoặc Remotion.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', description: 'ID asset trong media pool (chấp nhận tiền tố).' },
        itemId: { type: 'string', description: 'ID/tiền tố clip đã đặt. Dùng đúng vùng nguồn hiển thị; thay thế cho assetId.' },
        timelineId: { type: 'string', description: 'Timeline chứa itemId; bỏ qua để dùng timeline đang hoạt động.' },
        sourceTimesMs: {
          type: 'array',
          items: { type: 'number' },
          maxItems: 8,
          description: 'Offset mili giây theo thời gian media nguồn. Nhận 1–8 giá trị.',
        },
        frames: { type: 'array', items: { type: 'number' }, maxItems: 8, description: 'Số frame media nguồn (theo timebase dự án/nguồn).' },
        seconds: { type: 'array', items: { type: 'number' }, maxItems: 8, description: 'Số giây media nguồn.' },
        count: { type: 'number', minimum: 1, maximum: 8, description: 'Các điểm giữa đều nhau của vùng nguồn (mặc định 6 cho video, tối đa 8).' },
        fromSeconds: { type: 'number', description: 'Điểm đầu vùng media nguồn; giao với vùng clip khi dùng itemId.' },
        toSeconds: { type: 'number', description: 'Điểm cuối vùng media nguồn; giao với vùng clip khi dùng itemId.' },
      },
    },
  },
];

export const FRAMES_TOOL_NAMES = new Set(FRAMES_TOOL_SCHEMAS.map((t) => t.name));
