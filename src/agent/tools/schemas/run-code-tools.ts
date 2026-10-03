import type { AgentToolSchema } from '../../tool-schema';

export const RUN_CODE_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'run_code',
    description:
      'Chạy lệnh shell trong sandbox Linux cô lập (e2b) — dùng cho script đi kèm skill, dò/chuyển mã media bằng ffmpeg/ffprobe hoặc node/python. Có thể ghi file input trước (files[]) và đọc file output sau (outputs[]). Sandbox không thể tác động timeline editor; áp dụng kết quả bằng các editor tool. Gọi khi skill đã tải yêu cầu chạy script hoặc command. '
      + 'Không dùng cho flex crop, job chỉ giữ một vùng hoặc đo mép clip (dùng edit_item transform.crop). Người dùng không cần cấm tool này trong prompt. Nếu sandbox không nằm trong capabilities đã cấu hình, không gọi tool.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        command: { type: 'string', description: 'Lệnh shell cần chạy, ví dụ "ffmpeg -version" hoặc "node process-media.mjs in.mp4".' },
        files: {
          type: 'array',
          description: 'File input ghi vào sandbox trước khi chạy. Mỗi item có path đích và content inline HOẶC url để tải: URL media pool/asset cục bộ như "/media/uploads/x.mp4" (app phục vụ) hoặc URL công khai "https://…". Dùng để đưa media thật vào ffprobe/ffmpeg. (URL công khai cũng có thể được probe trực tiếp bằng cách truyền vào ffprobe mà không cần files.)',
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
        outputs: { type: 'array', description: 'Path các file cần đọc lại sau khi chạy.', items: { type: 'string' } },
      },
      required: ['command'],
    },
  },
];

export const RUN_CODE_TOOL_NAMES = new Set(RUN_CODE_TOOL_SCHEMAS.map((t) => t.name));
