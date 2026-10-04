import type { AgentToolSchema } from '../../tool-schema';

export const TIMELINE_IMPORT_TOOL_SCHEMAS: AgentToolSchema[] = [{
  name: 'import_timeline',
  description: [
    'Nhập dự án Final Cut Pro / DaVinci Resolve FCPXML 1.x hoặc CMX 3600 EDL vào dòng thời gian OpenChatCut mới có thể chỉnh sửa.',
    'Dòng thời gian mới chạy theo tốc độ khung hình của dự án; sequence hoặc list có tốc độ khác sẽ được chuyển đổi, làm tròn điểm cắt tới khung gần nhất.',
    'Thời gian FCPXML được chuyển sang dòng thời gian mới qua tcStart của sequence và mọi đoạn bao ngoài, gap, connected clip hoặc storyline (lane), compound clip (ref-clip), sync-clip, multicam clip (active angle) và audition (active pick), gồm cả rate conform và tốc độ retime; điểm vào nguồn được đo từ timecode bắt đầu riêng của từng tệp.',
    'Sự kiện EDL được đặt từ mốc record start của list: dùng mốc đầu giờ (ví dụ 01:00:00:00) khi record-in đầu tiên cách mốc đó chưa tới một phút, nếu không thì dùng record-in đầu tiên, hoặc startTimecode nếu được truyền. EDL không ghi tốc độ khung hình: fps mặc định theo dòng thời gian hiện tại (29.97/59.94 cho list drop-frame).',
    'Tệp được tham chiếu phải tồn tại sẵn trong kho media hiện tại; việc khớp dùng ID tư liệu, đường dẫn gốc, đường dẫn nguồn, tên tệp nguồn và tên tư liệu. Không tìm thấy hoặc không xác định rõ media sẽ khiến import dừng mà không thay đổi dự án.',
    'Tiêu đề, bộ sinh, phụ đề, chuyển cảnh, hiệu ứng, đoạn bị vô hiệu hóa và âm thanh của tệp video mà đoạn video không thể mang theo sẽ không được nhập; kết quả liệt kê mọi phần tử bị bỏ qua kèm lý do và cảnh báo các phần xấp xỉ.',
  ].join(' '),
  input_schema: {
    type: 'object',
    properties: {
      format: { type: 'string', enum: ['fcpxml', 'edl'], description: 'Định dạng trao đổi.' },
      content: { type: 'string', description: 'Toàn bộ nội dung tài liệu FCPXML UTF-8 hoặc EDL CMX 3600.' },
      name: { type: 'string', description: 'Tên dòng thời gian nhập vào, tùy chọn.' },
      activate: { type: 'boolean', description: 'Mở dòng thời gian đã nhập sau khi thành công; mặc định true.' },
      fps: {
        type: 'number',
        exclusiveMinimum: 0,
        maximum: 240,
        description: 'Chỉ EDL: tốc độ khung hình mà list được tạo, ví dụ 25 hoặc 29.97. Mặc định: fps của dòng thời gian hiện tại.',
      },
      startTimecode: {
        type: 'string',
        pattern: '^\\d{1,2}[:;]\\d{2}[:;]\\d{2}[:;.,]\\d{2}$',
        description: 'Chỉ EDL: timecode record trở thành khung 0, ví dụ "01:00:00:00" hoặc "00:59:50:00".',
      },
    },
    required: ['format', 'content'],
    additionalProperties: false,
  },
}];

export const TIMELINE_IMPORT_TOOL_NAMES = new Set(TIMELINE_IMPORT_TOOL_SCHEMAS.map((tool) => tool.name));
