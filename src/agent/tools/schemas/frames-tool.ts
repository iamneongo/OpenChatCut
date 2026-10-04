import type { AgentToolSchema } from '../../tool-schema';

export const FRAMES_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'view_timeline_frames',
    description: [
      'Kết xuất frame tĩnh của một bản dựng dòng thời gian (bao gồm cả chỉnh sửa nháp/chưa công bố).',
      'frames và seconds là tọa độ DÒNG THỜI GIAN TUYỆT ĐỐI, không phải vị trí trong tư liệu nguồn.',
      'Dùng sau các chỉnh sửa hình ảnh (MG/text, transition, zoom, filter, tỷ lệ khung hình, phụ đề) để kiểm tra kết quả bản dựng.',
      'Truyền tọa độ chính xác hoặc count; nếu không có, công cụ lấy mẫu đều (mặc định 4, tối đa 8). Nhiều frame sẽ được gộp thành bảng liên hệ có nhãn khi có thể.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        frames: { type: 'array', items: { type: 'number' }, maxItems: 8, description: 'Số frame tuyệt đối trên dòng thời gian cần kết xuất.' },
        seconds: { type: 'array', items: { type: 'number' }, maxItems: 8, description: 'Số giây tuyệt đối trên dòng thời gian (được đổi theo fps dòng thời gian).' },
        count: { type: 'number', minimum: 1, maximum: 8, description: 'Các điểm giữa đều nhau trên dòng thời gian/vùng (mặc định 4, tối đa 8).' },
        fromSeconds: { type: 'number', description: 'Điểm đầu vùng dòng thời gian tuyệt đối (dùng cùng toSeconds).' },
        toSeconds: { type: 'number', description: 'Điểm cuối vùng dòng thời gian tuyệt đối (dùng cùng fromSeconds).' },
        timelineId: { type: 'string', description: 'ID/tiền tố timeline; bỏ qua để dùng timeline đang hoạt động trong phiên agent.' },
      },
    },
  },
  {
    name: 'view_asset_frames',
    description: [
      'Kiểm tra tư liệu NGUỒN và xem bảng liên hệ có nhãn; các tọa độ này không bao giờ trỏ tới dòng thời gian đã dựng.',
      'Truyền assetId để lấy toàn bộ nguồn trong kho, hoặc itemId để giới hạn mẫu vào vùng nguồn hiển thị của đoạn đã đặt (có tính srcInFrame + playbackRate).',
      'sourceTimesMs, frames, seconds và fromSeconds/toSeconds đều là tọa độ TƯ LIỆU NGUỒN. Khi có itemId, mẫu bị kẹp vào vùng nguồn hiển thị của đoạn.',
      'Dùng để chọn/kiểm tra chất lượng nguồn; dùng view_timeline_frames để kiểm tra bản dựng dòng thời gian. Âm thanh không có frame.',
      'Quét rộng mặc định = 6 điểm giữa vùng nguồn, tối đa 8. Tái sử dụng bảng liên hệ thay vì lấy mẫu lặp lại cùng vùng. Video tải lên đã hoàn tất ưu tiên ffmpeg; đường dẫn blob/image/MG dùng trình duyệt hoặc Remotion.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', description: 'ID tư liệu trong kho tư liệu (chấp nhận tiền tố).' },
        itemId: { type: 'string', description: 'ID/tiền tố đoạn đã đặt. Dùng đúng vùng nguồn hiển thị; thay thế cho assetId.' },
        timelineId: { type: 'string', description: 'Timeline chứa itemId; bỏ qua để dùng timeline đang hoạt động.' },
        sourceTimesMs: {
          type: 'array',
          items: { type: 'number' },
          maxItems: 8,
          description: 'Độ lệch mili giây theo thời gian tư liệu nguồn. Nhận 1–8 giá trị.',
        },
        frames: { type: 'array', items: { type: 'number' }, maxItems: 8, description: 'Số frame tư liệu nguồn (theo timebase dự án/nguồn).' },
        seconds: { type: 'array', items: { type: 'number' }, maxItems: 8, description: 'Số giây tư liệu nguồn.' },
        count: { type: 'number', minimum: 1, maximum: 8, description: 'Các điểm giữa đều nhau của vùng nguồn (mặc định 6 cho video, tối đa 8).' },
        fromSeconds: { type: 'number', description: 'Điểm đầu vùng tư liệu nguồn; giao với vùng đoạn khi dùng itemId.' },
        toSeconds: { type: 'number', description: 'Điểm cuối vùng tư liệu nguồn; giao với vùng đoạn khi dùng itemId.' },
      },
    },
  },
];

export const FRAMES_TOOL_NAMES = new Set(FRAMES_TOOL_SCHEMAS.map((t) => t.name));
