import type { AgentToolSchema } from '../../tool-schema';

const COLORS = ['blue', 'cyan', 'fuchsia', 'green', 'pink', 'purple', 'red', 'yellow'];

export const MARKERS_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'manage_markers',
    description: [
      'Quản lý mốc chú thích/TODO trên dòng thời gian theo contract marker-note-v2. Marker là điểm khi durationFrames=0 hoặc bỏ qua, nếu không sẽ là một khoảng.',
      'scope=project neo vào frame trên thước; scope=item neo vào một đoạn.',
      'action: list tất cả | create một mốc hoặc lô markers[] | update một mốc hoặc lô updates[] | delete.',
      'Với note dựa trên transcript, truyền transcriptSegments dùng id segment [sN] của Active Script cùng notePrefix tùy chọn thay vì tự viết note.',
      'fromFrame mặc định là đầu đoạn đầu tiên được chọn nếu không truyền rõ, còn nội dung ghi chú được sao chép từ đầu ra read_script.',
      `color phải là một trong ${COLORS.join('/')}.`,
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'create', 'update', 'delete'] },
        timelineId: { type: 'string', description: 'ID hoặc tiền tố dòng thời gian đích; bỏ qua để dùng dòng thời gian hiện tại mà không chuyển dòng thời gian.' },
        fromFrame: { type: 'number', description: 'Khung nguyên trên dòng thời gian để neo mốc (bắt buộc cho create trừ khi dùng transcriptSegments).' },
        durationFrames: { type: 'number', description: 'Độ dài khoảng; 0 hoặc bỏ qua sẽ tạo mốc điểm. Với transcriptSegments, mặc định phủ các đoạn đã chọn.' },
        note: { type: 'string', description: 'Nội dung ghi chú của mốc (bắt buộc cho create trừ khi dùng transcriptSegments).' },
        color: { type: 'string', enum: COLORS },
        scope: { type: 'string', enum: ['project', 'item'], description: 'item yêu cầu itemId; mặc định project.' },
        itemId: { type: 'string', description: 'ID đoạn cần neo khi scope=item.' },
        markerId: { type: 'string', description: 'Id mốc đích cho update/delete.' },
        transcriptSegments: { type: 'string', description: 'ID/phạm vi đoạn Active Script từ timeline.md, ví dụ "3-4"; nội dung ghi chú được sao chép từ đầu ra read_script.' },
        transcriptTrack: { type: 'string', description: 'Bộ lọc rãnh cho transcriptSegments, ví dụ V1 hoặc A1.' },
        notePrefix: { type: 'string', description: 'Tiền tố nhãn tùy chọn khi transcriptSegments tạo nội dung note.' },
        markers: {
          type: 'array',
          description: 'create lô: mỗi mục là {fromFrame?, note?, color?, durationFrames?, scope?, itemId?, transcriptSegments?, transcriptTrack?, notePrefix?}; bỏ qua fromFrame khi transcriptSegments quyết định vị trí.',
          items: { type: 'object' },
        },
        updates: {
          type: 'array',
          description: 'update lô: mỗi mục là {id, note?, color?, fromFrame?, durationFrames?}.',
          items: { type: 'object' },
        },
      },
      required: ['action'],
    },
  },
];

export const MARKERS_TOOL_NAMES = new Set(MARKERS_TOOL_SCHEMAS.map((t) => t.name));
