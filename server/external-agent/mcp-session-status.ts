export interface McpSessionStatusInput {
  connectedProjectIds: string[];
  editors: unknown[];
  binding: unknown;
  bindingMode: 'browser' | 'offline' | null;
  toolCount: number;
  exposure: Record<string, unknown>;
}

export function mcpSessionStatus(input: McpSessionStatusInput): Record<string, unknown> {
  const serverDirect = input.bindingMode === 'offline'
    || (!input.bindingMode && !input.connectedProjectIds.length);
  return {
    connectedProjectIds: input.connectedProjectIds,
    editors: input.editors,
    sessionBinding: input.binding,
    bindingMode: input.bindingMode,
    availableToolTier: serverDirect ? 'server-direct' : 'browser',
    offlineFallback: 'Chọn một dự án đã lưu chưa có trình duyệt sở hữu, rồi bắt đầu với approvalMode="auto".',
    browserRequiredFor: [
      'kiểm tra hình ảnh/khung vẽ',
      'tạo nội dung',
      'tải lên',
      'mạng',
      'preset',
      'kết xuất',
      'xuất tệp',
      'phê duyệt thủ công',
    ],
    toolCount: input.toolCount,
    ...input.exposure,
  };
}
