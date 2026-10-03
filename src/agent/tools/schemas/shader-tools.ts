import type { AgentToolSchema } from '../../tool-schema';

export const SHADER_TOOL_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'submit_shader',
    description:
      'Sinh fragment shader WebGL tùy chỉnh từ prompt ngôn ngữ tự nhiên. type=effect: hiệu ứng theo clip (một input u_input) → trả về effectId; áp dụng bằng edit_item adds:[{type:"effect",targetItemId,assetId:<effectId>}]. type=transition: transition giữa hai clip (hai input u_outgoing/u_incoming + u_progress) → trả về transitionId (custom:tr-*); áp dụng bằng edit_item adds:[{type:"transition",assetId:<transitionId>,incomingItemId:<clip phía sau tại điểm cắt>}]. Trong cả hai trường hợp GLSL được kiểm tra tĩnh + compile-check rồi đăng ký; lần gọi này chỉ submit/đăng ký — áp dụng là lần gọi riêng mà agent thực hiện sau khi người dùng yêu cầu rõ. referenceAssetIds cho phép generator học từ asset dự án: asset image được xem như cảm hứng hình ảnh; MỘT asset effect/transition (kind khớp với type) cung cấp shader code làm tham chiếu phong cách. Dùng cho look/transition tùy chỉnh một lần chưa có trong browse_library.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['effect', 'transition'], description: 'Shader là hiệu ứng theo clip (màu, blur, mask, grade kiểu LUT, distortion) hay transition giữa clip (crossfade, wipe, slide, cube 3D).' },
        prompt: { type: 'string', minLength: 1, description: 'Mô tả shader bằng ngôn ngữ tự nhiên. Diễn đạt lại ý người dùng trong một câu cụ thể — ví dụ "Chromatic aberration with RGB split", "Cinematic teal-orange color grade", "Smooth crossfade with soft edge".' },
        name: { type: 'string', description: 'Tên asset hiển thị trong thư viện. Mặc định được tạo từ prompt.' },
        referenceAssetIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Id asset dự án để generator học theo. Id asset image → model XEM asset như cảm hứng hình ảnh (ví dụ ảnh tĩnh để khớp LUT, screenshot để bắt chước hiệu ứng glitch). Id asset effect hoặc transition → shader code được dùng lại làm tham chiếu phong cách. Mỗi lần submit tối đa một tham chiếu effect/transition và kind phải khớp `type`. Truyền id đầy đủ hoặc tiền tố id ngắn.',
        },
        properties: {
          type: 'array',
          description: 'Uniform số có thể điều chỉnh, hiển thị thành slider, tùy chọn; mỗi uniform trở thành float uniform u_<key> trong shader. Bỏ qua nếu muốn hiệu ứng cố định.',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Identifier GLSL; trở thành u_<key>.' },
              label: { type: 'string', description: 'Nhãn UI tiếng Việt.' },
              default: { type: 'number' },
              min: { type: 'number' },
              max: { type: 'number' },
              step: { type: 'number' },
            },
            required: ['key'],
          },
        },
      },
      required: ['type', 'prompt'], // `description` remains a legacy runtime alias for prompt.
    },
  },
];

export const SHADER_TOOL_NAMES = new Set(SHADER_TOOL_SCHEMAS.map((t) => t.name));
