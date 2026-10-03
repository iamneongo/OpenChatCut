import type { AgentToolSchema } from '../../tool-schema';

export const UNDO_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'undo_last_change',
    description: [
      'Đưa dự án về trạng thái trước thay đổi gần nhất đã áp dụng — dùng khi người dùng yêu cầu undo,',
      'quay lại hoặc hủy chỉnh sửa cuối. Tool được đề xuất như mọi chỉnh sửa khác nên người dùng vẫn xác nhận,',
      'và thao tác hoàn tác này vẫn có thể undo tiếp. Tool chỉ tác động đến thay đổi đã APPLIED:',
      'chỉnh sửa còn chờ trong proposal hiện tại sẽ bị loại bằng cách từ chối proposal đó, không dùng tool này.',
      'Gọi một lần cho mỗi bước undo; muốn undo nhiều bước, hãy yêu cầu người dùng xác nhận từng bước.',
    ].join(' '),
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'redo_last_change',
    description: [
      'Áp dụng lại trạng thái dự án đã bị undo bởi thao tác undo gần nhất — dùng khi người dùng yêu cầu redo',
      'hoặc khôi phục thay đổi họ vừa undo. Cùng luồng proposal với undo_last_change: người dùng xác nhận, và',
      'thao tác redo trở thành một bước lịch sử bình thường. Chỉ hoạt động khi có mục tiêu redo (sau một undo, trước khi',
      'chỉnh sửa mới xóa redo stack). Gọi một lần cho mỗi bước redo.',
    ].join(' '),
    input_schema: { type: 'object', properties: {}, required: [] },
  },
];

export const UNDO_TOOL_NAMES = new Set(UNDO_TOOL_SCHEMAS.map((t) => t.name));
