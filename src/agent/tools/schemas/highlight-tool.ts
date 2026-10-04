import type { AgentToolSchema } from '../../tool-schema';

export const HIGHLIGHT_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'find_highlights',
    description:
      'Tạo đoạn nổi bật dạng ngắn từ nội dung dài: đọc transcript cấp từ của một đoạn trên dòng thời gian, dùng LLM chọn các khoảnh khắc độc lập nổi bật nhất, nhân bản mỗi khoảnh khắc thành chuỗi dọc (mặc định 9:16) và cắt theo phạm vi frame đã chọn. Đoạn phải được chuyển lời trước bằng transcribe_track. Trả về id sequence, title và phạm vi frame của từng kết quả. Nếu LLM chọn thất bại, dự phòng bằng phương pháp ước lượng theo mật độ thông tin.',
    input_schema: {
      type: 'object',
      properties: {
        count: { type: 'integer', description: 'Số video ngắn cần tạo; mặc định 3.' },
        ratio: { type: 'string', enum: ['9:16', '16:9', '1:1', '4:3', '3:4'], description: 'Tỷ lệ canvas video ngắn; mặc định 9:16.' },
        topic: { type: 'string', description: 'Tùy chọn: chỉ chọn highlight liên quan tới chủ đề này.' },
        instruction: { type: 'string', description: 'Ưu tiên chọn tùy chọn, như xung đột cảm xúc mạnh nhất hoặc khoảnh khắc có số liệu.' },
        itemId: { type: 'string', description: 'Đoạn video/audio đã chuyển lời, tùy chọn; mặc định đoạn có nhiều từ nhất.' },
        minSeconds: { type: 'number', description: 'Thời lượng tối thiểu mỗi highlight; mặc định 3 giây.' },
        maxSeconds: { type: 'number', description: 'Thời lượng tối đa mỗi highlight; mặc định 60 giây.' },
      },
    },
  },
];

export const HIGHLIGHT_TOOL_NAMES = new Set(HIGHLIGHT_TOOL_SCHEMAS.map((t) => t.name));
