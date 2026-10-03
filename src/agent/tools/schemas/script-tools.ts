import type { AgentToolSchema } from '../../tool-schema';

export const SCRIPT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'read_script',
    description:
      'Kết xuất timeline hiện tại thành timeline.md (Markdown có mã segment-id). Phần track (## V1/A1…), vùng nguồn (### file), các dòng: câu transcript [sN] / clip [cN] Nf / khoảng trống [gap Nf]. Thứ tự nội dung = thứ tự phát. Đọc tool này trước apply_script; chỉnh phần TEXT rồi gửi lại. Giữ nguyên comment <!-- script-stamp -->.',
    input_schema: {
      type: 'object',
      properties: {
        track: { type: 'string', description: 'Alias/id track timeline tùy chọn. Bỏ qua để giữ hành vi hiện tại trên toàn timeline.' },
        showSilence: { type: 'boolean', description: 'Bao gồm marker [silence=Ns] có thể chỉnh sửa. Mặc định false.' },
      },
    },
  },
  {
    name: 'apply_script',
    description:
      'Ghi timeline.md đã chỉnh sửa trở lại timeline (nguyên tử; chỉ cần một dòng không hợp lệ là toàn bộ script bị từ chối). Cú pháp chỉnh sửa: gạch từ trong dòng [sN] bằng ~~word~~ (xóa text = xóa video); gạch hoặc xóa cả dòng để loại bỏ; sắp xếp lại dòng để đổi thứ tự clip (frame được tính lại từ thứ tự nội dung — không bao giờ tự ghi số frame); xóa dòng [gap Nf] để đóng khoảng trống. Thêm lại từ đã xóa sẽ khôi phục chúng. KHÔNG thay đổi lời nói. preview=true chỉ kiểm tra và báo diff mà không thay đổi gì.',
    input_schema: {
      type: 'object',
      properties: {
        timelineMd: { type: 'string', description: 'Toàn bộ nội dung timeline.md đã chỉnh sửa (lấy từ read_script, kèm thay đổi của bạn).' },
        preview: { type: 'boolean', description: 'true = kiểm tra + báo diff mà không áp dụng.' },
        track: { type: 'string', description: 'Alias/id track timeline tùy chọn. Dùng cùng phạm vi với read_script.' },
      },
      required: ['timelineMd'],
    },
  },
];

export const SCRIPT_TOOL_NAMES = new Set(SCRIPT_TOOL_SCHEMAS.map((t) => t.name));
