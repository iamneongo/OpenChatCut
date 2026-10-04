import type { AgentToolSchema } from '../../tool-schema';

export const RUN_CODE_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'run_code',
    description:
      'Chạy lệnh shell trong hộp cát Linux cô lập (e2b) — dùng cho script đi kèm kỹ năng, dò/chuyển mã tư liệu bằng ffmpeg/ffprobe hoặc node/python. Có thể ghi tệp đầu vào trước (files[]) và đọc tệp đầu ra sau (outputs[]). Hộp cát không thể tác động dòng thời gian của trình biên tập; áp dụng kết quả bằng các công cụ biên tập. Gọi khi kỹ năng đã tải yêu cầu chạy script hoặc lệnh. '
      + 'Không dùng cho flex crop, tác vụ chỉ giữ một vùng hoặc đo mép đoạn (dùng edit_item transform.crop). Người dùng không cần cấm công cụ này trong prompt. Nếu hộp cát không nằm trong capabilities đã cấu hình, không gọi công cụ.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        command: { type: 'string', description: 'Lệnh shell cần chạy, ví dụ "ffmpeg -version" hoặc "node process-media.mjs in.mp4".' },
        files: {
          type: 'array',
          description: 'Tệp đầu vào ghi vào sandbox trước khi chạy. Mỗi mục có đường dẫn đích và nội dung inline HOẶC URL để tải: URL kho tư liệu/tư liệu cục bộ như "/media/uploads/x.mp4" (ứng dụng phục vụ) hoặc URL công khai "https://…". Dùng để đưa tư liệu thật vào ffprobe/ffmpeg. (URL công khai cũng có thể được probe trực tiếp bằng cách truyền vào ffprobe mà không cần files.)',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              path: { type: 'string' },
              content: { type: 'string' },
              url: { type: 'string' },
            },
            required: ['path'],
          },
        },
        outputs: { type: 'array', description: 'Đường dẫn các tệp cần đọc lại sau khi chạy.', items: { type: 'string' } },
      },
      required: ['command'],
    },
  },
];

export const RUN_CODE_TOOL_NAMES = new Set(RUN_CODE_TOOL_SCHEMAS.map((t) => t.name));
