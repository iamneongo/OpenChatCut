import type { AgentToolSchema } from './tool-schema.js';
import {
  isExternalGlobalReadTool,
  isExternalReadTool,
  isExternalRealTool,
} from './external-tool-policy.js';

interface ExternalToolAnnotation {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ExternalRegisteredTool extends AgentToolSchema {
  annotations?: ExternalToolAnnotation;
}

const SESSION_ID_PROPERTY = {
  type: 'string',
  description: 'ID phiên do begin_edit_session trả về. Mọi tool chỉnh sửa sẽ chạy trên bản nháp này.',
};

export const EXTERNAL_SESSION_TOOLS: readonly ExternalRegisteredTool[] = [
  {
    name: 'list_edit_sessions',
    description: 'Liệt kê các phiên chỉnh sửa của dự án đã liên kết, bao gồm metadata khôi phục cho các bản nháp bị chủ MCP ngắt kết nối.',
    input_schema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'recover_edit_session',
    description: 'Tiếp tục hoặc loại bỏ một phiên chỉnh sửa mồ côi. Chỉ được tiếp tục khi checkpoint vẫn khớp với revision hiện tại của dự án.',
    input_schema: {
      type: 'object',
      properties: {
        editSessionId: SESSION_ID_PROPERTY,
        action: { type: 'string', enum: ['resume', 'discard'] },
      },
      required: ['editSessionId', 'action'],
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'begin_edit_session',
    description: 'Bắt đầu một bản nháp chỉnh sửa OpenChatCut tách biệt. Chế độ manual chờ duyệt đề xuất; chế độ auto chỉ áp dụng đề xuất đã xếp tại review_edit_session. Tool tác động dự án thật luôn cần xác nhận riêng.',
    input_schema: {
      type: 'object',
      properties: {
        clientName: { type: 'string', description: 'Tên hiển thị trên thẻ review, ví dụ Codex hoặc Claude.' },
        approvalMode: {
          type: 'string',
          enum: ['manual', 'auto'],
          description: 'manual (mặc định) yêu cầu duyệt đề xuất trong OpenChatCut; auto chỉ áp dụng bản nháp đã review và không bao giờ bỏ qua xác nhận tool thật.',
        },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  },
  {
    name: 'get_edit_session',
    description: 'Đọc trạng thái phiên: drafting/awaiting_review hoặc trạng thái kết thúc applied/rejected/cancelled/stale/failed.',
    input_schema: {
      type: 'object',
      properties: { editSessionId: SESSION_ID_PROPERTY },
      required: ['editSessionId'],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'review_edit_session',
    description: 'Kết thúc việc soạn bản nháp. Phiên manual hiển thị thẻ review; phiên auto lập tức áp dụng mọi chỉnh sửa đề xuất đã xếp. Thao tác này không duyệt tool tác động dự án thật.',
    input_schema: {
      type: 'object',
      properties: {
        editSessionId: SESSION_ID_PROPERTY,
        summary: { type: 'string', description: 'Tóm tắt ngắn, dễ đọc của chỉnh sửa đã xếp.' },
      },
      required: ['editSessionId'],
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  },
  {
    name: 'discard_edit_session',
    description: 'Hủy bản nháp hoặc lượt review đang chờ mà không thay đổi dự án OpenChatCut đang hoạt động.',
    input_schema: {
      type: 'object',
      properties: { editSessionId: SESSION_ID_PROPERTY },
      required: ['editSessionId'],
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
];

function withSession(tool: AgentToolSchema, description: string): ExternalRegisteredTool {
  return {
    ...tool,
    description,
    input_schema: {
      ...tool.input_schema,
      properties: { ...tool.input_schema.properties, editSessionId: SESSION_ID_PROPERTY },
      required: [...new Set([...(tool.input_schema.required ?? []), 'editSessionId'])],
    },
  };
}

export function externalGlobalReadSchemas(tools: readonly AgentToolSchema[]): ExternalRegisteredTool[] {
  return tools.filter((tool) => isExternalGlobalReadTool(tool.name)).map((tool) => ({
    ...tool,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }));
}

export function externalDraftSchemas(tools: readonly AgentToolSchema[]): ExternalRegisteredTool[] {
  return tools.map((tool) => {
    const readOnly = isExternalReadTool(tool.name);
    const multiplexesPersistentActions = tool.name === 'manage_design_style';
    const scopeDescription = multiplexesPersistentActions
      ? 'Read and ProjectDoc actions use the edit-session draft; owned-library writes act on live local data and require one-shot OpenChatCut confirmation. Pass editSessionId.'
      : `${readOnly ? 'Reads' : 'Edits'} the edit-session draft; pass editSessionId.`;
    return {
      ...withSession(
        tool,
        `${tool.description ?? tool.name} ${scopeDescription}`,
      ),
      annotations: {
        readOnlyHint: readOnly,
        destructiveHint: multiplexesPersistentActions,
        idempotentHint: readOnly,
        openWorldHint: multiplexesPersistentActions,
      },
    };
  });
}

export function externalRealSchemas(tools: readonly AgentToolSchema[]): ExternalRegisteredTool[] {
  return tools.filter((tool) => isExternalRealTool(tool.name)).map((tool) => ({
    ...withSession(
      tool,
      `${tool.description ?? tool.name} Acts on the live project. Every invocation needs a one-shot OpenChatCut confirmation bound to this session/run, tool, and exact argument digest; changed arguments require a new confirmation. Pass editSessionId.`,
    ),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }));
}
