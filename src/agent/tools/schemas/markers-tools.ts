import type { AgentToolSchema } from '../../tool-schema';

const COLORS = ['blue', 'cyan', 'fuchsia', 'green', 'pink', 'purple', 'red', 'yellow'];

export const MARKERS_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'manage_markers',
    description: [
      'Quản lý anchor chú thích/TODO trên timeline theo contract marker-note-v2. Marker là point khi durationFrames=0 hoặc bỏ qua, nếu không sẽ là một range.',
      'scope=project neo vào frame trên thước; scope=item neo vào một clip.',
      'action: list tất cả | create một marker hoặc batch markers[] | update một marker hoặc batch updates[] | delete.',
      'Với note dựa trên transcript, truyền transcriptSegments dùng id segment [sN] của Active Script cùng notePrefix tùy chọn thay vì tự viết note.',
      'fromFrame mặc định là đầu segment đầu tiên được chọn nếu không truyền rõ, còn nội dung note được sao chép từ output read_script.',
      `color phải là một trong ${COLORS.join('/')}.`,
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'create', 'update', 'delete'] },
        timelineId: { type: 'string', description: 'Id hoặc tiền tố timeline đích; bỏ qua để dùng timeline hiện tại mà không chuyển timeline.' },
        fromFrame: { type: 'number', description: 'Frame timeline nguyên để neo marker (bắt buộc cho create trừ khi dùng transcriptSegments).' },
        durationFrames: { type: 'number', description: 'Độ dài range; 0 hoặc bỏ qua sẽ tạo point marker. Với transcriptSegments, mặc định phủ các segment đã chọn.' },
        note: { type: 'string', description: 'Nội dung note của marker (bắt buộc cho create trừ khi dùng transcriptSegments).' },
        color: { type: 'string', enum: COLORS },
        scope: { type: 'string', enum: ['project', 'item'], description: 'item yêu cầu itemId; mặc định project.' },
        itemId: { type: 'string', description: 'Id clip cần neo khi scope=item.' },
        markerId: { type: 'string', description: 'Id marker đích cho update/delete.' },
        transcriptSegments: { type: 'string', description: 'Id/range segment Active Script từ timeline.md, ví dụ "3-4"; nội dung note được sao chép từ output read_script.' },
        transcriptTrack: { type: 'string', description: 'Bộ lọc track cho transcriptSegments, ví dụ V1 hoặc A1.' },
        notePrefix: { type: 'string', description: 'Tiền tố nhãn tùy chọn khi transcriptSegments tạo nội dung note.' },
        markers: {
          type: 'array',
          description: 'create batch: mỗi entry là {fromFrame?, note?, color?, durationFrames?, scope?, itemId?, transcriptSegments?, transcriptTrack?, notePrefix?}; bỏ qua fromFrame khi transcriptSegments quyết định vị trí.',
          items: { type: 'object' },
        },
        updates: {
          type: 'array',
          description: 'update batch: mỗi entry là {id, note?, color?, fromFrame?, durationFrames?}.',
          items: { type: 'object' },
        },
      },
      required: ['action'],
    },
  },
];

export const MARKERS_TOOL_NAMES = new Set(MARKERS_TOOL_SCHEMAS.map((t) => t.name));
