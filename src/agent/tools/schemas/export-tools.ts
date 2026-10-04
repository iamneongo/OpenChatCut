import type { AgentToolSchema } from '../../tool-schema';

const MAX_WAIT_SECONDS = 3600;

export const EXPORT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'submit_render_job',
    description:
      'Kết xuất dòng thời gian hiện tại BẤT ĐỒNG BỘ thành video MP4/WebM hoặc âm thanh MP3/WAV. Trả về ngay với renderId; tác vụ cũng xuất hiện trong hàng đợi xuất ở góc trên bên phải trình biên tập kèm tiến độ và nút hủy. Gọi track_export để xem trạng thái/tiến độ và URL tải xuống. Với dòng thời gian dài, nên dùng công cụ này thay cho submit_export đồng bộ. Biên frame tùy chọn dùng khoảng nửa mở [startFrame, endFrameExclusive).',
    input_schema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['video', 'audio'], description: 'Mặc định là video.' },
        codec: { type: 'string', enum: ['h264', 'vp8', 'mp3', 'wav'], description: 'Video: h264 (mặc định) hoặc vp8. Audio: mp3 (mặc định) hoặc wav.' },
        resolution: { type: 'string', enum: ['480p', '720p', '1080p'], description: 'Chỉ dành cho video. Tỷ lệ theo cạnh ngắn; bỏ qua để dùng kích thước dòng thời gian.' },
        fps: { type: 'integer', description: 'Chỉ dành cho video. Tốc độ khung hình đích: 24/25/30/50/60; bỏ qua để dùng fps của dòng thời gian.' },
        videoBitrate: { type: 'integer', minimum: 1_000_000, maximum: 80_000_000, description: 'Chỉ dành cho video. Tốc độ bit đầu ra chính xác theo bit/giây; bỏ qua để dùng mặc định bộ kết xuất.' },
        name: { type: 'string', description: 'Tên tệp tải xuống.' },
        startFrame: { type: 'integer', minimum: 0 },
        endFrameExclusive: { type: 'integer', minimum: 1 },
        startSeconds: { type: 'number', minimum: 0, description: 'Cũ; ưu tiên startFrame.' },
        endSeconds: { type: 'number', minimum: 0, description: 'Cũ; ưu tiên endFrameExclusive.' },
        saveToMediaPool: {
          type: 'boolean',
          description: 'Nếu true, giữ tệp hoàn tất trong Tư liệu của tôi và lưu chuỗi nguồn cùng các vùng tư liệu nguồn. Mặc định false.',
        },
      },
    },
  },
  {
    name: 'track_export',
    description:
      'Kiểm tra tác vụ kết xuất/xuất do submit_render_job tạo. action=status: trả về trạng thái hiện tại. action=wait: chờ tới khi kết thúc hoặc hết timeoutSeconds. Chỉ chờ một lần có giới hạn; nếu waitExpired=true, báo trạng thái nền rồi kết thúc lượt thay vì gọi wait lại hoặc tạo lượt xuất khác. Truyền renderIds nếu có. Nếu bỏ qua, latest mặc định true. Trả về trạng thái, tiến độ và khi hoàn tất là downloadUrl cùng mediaPoolStatus nếu đã yêu cầu saveToMediaPool.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['status', 'wait'], description: 'status hoặc wait' },
        renderIds: { type: 'string', description: 'ID hoặc tiền tố ID tác vụ kết xuất, phân tách bằng dấu phẩy, do submit_render_job trả về.' },
        latest: { type: 'boolean', description: 'Nếu true, đọc tác vụ kết xuất mới nhất khớp điều kiện. Mặc định true khi bỏ qua renderIds.' },
        onlyActive: { type: 'boolean', description: 'Khi latest=true, chỉ trả về tác vụ đang kết xuất. Dùng false/bỏ qua để gồm cả tác vụ vừa hoàn tất hoặc thất bại.' },
        timelineId: { type: 'string', description: 'ID hoặc tiền tố dòng thời gian tùy chọn để thu hẹp tìm kiếm mới nhất.' },
        timeoutSeconds: { type: 'number', minimum: 0, maximum: MAX_WAIT_SECONDS, description: 'Với action=wait, số giây tối đa trước khi trả về trạng thái chưa kết thúc hiện tại. Mặc định 20. Chỉ dùng 0 khi bên gọi có thời hạn công cụ đủ dài.' },
      },
      required: ['action'],
    },
  },
  {
    name: 'read_export_history',
    description:
      'Liệt kê các bản xuất đã hoàn tất gần đây (mới nhất trước): tên tệp, định dạng, codec, kích thước, vùng frame và thời gian. Dùng để nhắc người dùng những gì đã xuất trong lượt này hoặc trước đó. Chỉ đọc; không thực hiện xuất.',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 100, description: 'Số bản ghi tối đa; mặc định 20.' },
      },
    },
  },
];

export const EXPORT_TOOL_NAMES = new Set(EXPORT_TOOL_SCHEMAS.map((t) => t.name));
