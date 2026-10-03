import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { localized } from '../ui-locale.ts';

export const MCP_CONTROL_TOOLS: Tool[] = [
  {
    name: 'openchatcut_status',
    description: 'Show connected OpenChatCut editors, this transport session binding, and capability status.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'list_projects',
    description: 'List OpenChatCut projects, newest first.',
    inputSchema: {
      type: 'object',
      properties: {
        includeDeleted: { type: 'boolean' },
        editorBaseUrl: { type: 'string' },
      },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'create_project',
    description: 'Create an empty OpenChatCut project with one active timeline and one video track.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        compositionWidth: { type: 'number' },
        compositionHeight: { type: 'number' },
        fps: { type: 'number' },
        editorBaseUrl: { type: 'string' },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: 'target_project',
    description: 'Permanently bind this MCP transport to a live browser editor, or to an existing stored project through the offline fallback.',
    inputSchema: {
      type: 'object',
      properties: { projectId: { type: 'string' }, editorBaseUrl: { type: 'string' } },
      required: ['projectId'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'get_editor_url',
    description: 'Return the OpenChatCut editor URL for this session project or an explicitly named project.',
    inputSchema: {
      type: 'object',
      properties: { projectId: { type: 'string' }, editorBaseUrl: { type: 'string' } },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
];

export const MCP_CONTROL_TOOL_NAMES: Record<string, true> = Object.fromEntries(
  MCP_CONTROL_TOOLS.map((tool) => [tool.name, true]),
);

const MCP_CONTROL_TOOL_DESCRIPTIONS: Record<string, { zh: string; en: string; vi: string }> = {
  openchatcut_status: {
    zh: '显示已连接的 OpenChatCut 编辑器、此传输会话的绑定和能力状态。',
    en: 'Show connected OpenChatCut editors, this transport session binding, and capability status.',
    vi: 'Hiển thị các trình chỉnh sửa OpenChatCut đang kết nối, liên kết của phiên truyền này và trạng thái khả năng.',
  },
  list_projects: {
    zh: '按最新顺序列出 OpenChatCut 项目。',
    en: 'List OpenChatCut projects, newest first.',
    vi: 'Liệt kê các dự án OpenChatCut, dự án mới nhất trước.',
  },
  create_project: {
    zh: '创建一个空的 OpenChatCut 项目，其中包含一个活动时间线和一个视频轨道。',
    en: 'Create an empty OpenChatCut project with one active timeline and one video track.',
    vi: 'Tạo dự án OpenChatCut trống với một dòng thời gian đang hoạt động và một rãnh video.',
  },
  target_project: {
    zh: '将此 MCP 传输永久绑定到正在运行的浏览器编辑器，或通过离线回退绑定到已有项目。',
    en: 'Permanently bind this MCP transport to a live browser editor, or to an existing stored project through the offline fallback.',
    vi: 'Liên kết vĩnh viễn phiên truyền MCP này với trình chỉnh sửa trong trình duyệt đang chạy hoặc với dự án đã lưu qua chế độ dự phòng ngoại tuyến.',
  },
  get_editor_url: {
    zh: '返回此会话项目或明确指定项目的 OpenChatCut 编辑器 URL。',
    en: 'Return the OpenChatCut editor URL for this session project or an explicitly named project.',
    vi: 'Trả về URL trình chỉnh sửa OpenChatCut cho dự án của phiên này hoặc dự án được chỉ định rõ ràng.',
  },
};

export function mcpControlTools(): Tool[] {
  return MCP_CONTROL_TOOLS.map((tool) => {
    const variants = MCP_CONTROL_TOOL_DESCRIPTIONS[tool.name];
    return variants ? { ...tool, description: localized(variants) } : tool;
  });
}
