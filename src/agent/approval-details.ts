import { redactTextForAgentRuntime } from './runtime-artifact';
import { getLocale } from '../i18n/locale';

function label(vi: string, zh: string): string {
  return getLocale() === 'vi' ? vi : zh;
}

export type ApprovalDetailKind =
  | 'action'
  | 'command'
  | 'url'
  | 'path'
  | 'output'
  | 'target'
  | 'parameter';

export interface ApprovalDetail {
  readonly kind: ApprovalDetailKind;
  readonly label: string;
  readonly value: string;
}

export interface ToolApprovalPresentation {
  readonly summary: string;
  readonly details: readonly ApprovalDetail[];
}

function safeText(value: unknown): string {
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  return redactTextForAgentRuntime(raw ?? String(value));
}

function add(
  details: ApprovalDetail[],
  kind: ApprovalDetailKind,
  label: string,
  value: unknown,
): void {
  if (value === undefined || value === null || value === '') return;
  details.push({ kind, label, value: safeText(value) });
}

function runCodeDetails(args: Readonly<Record<string, unknown>>): ApprovalDetail[] {
  const details: ApprovalDetail[] = [];
  add(details, 'command', label('Lệnh', '命令'), args.command);
  if (Array.isArray(args.files)) {
    for (const file of args.files) {
      if (!file || typeof file !== 'object' || Array.isArray(file)) continue;
      const input = file as Record<string, unknown>;
      add(details, 'path', label('Đường dẫn đầu vào', '输入路径'), input.path);
      add(details, 'url', label('Địa chỉ đầu vào', '输入网址'), input.url);
    }
  }
  if (Array.isArray(args.outputs)) {
    for (const output of args.outputs) {
      add(details, 'output', label('Đích đầu ra', '输出目标'), output);
    }
  }
  return details;
}

function designDetails(args: Readonly<Record<string, unknown>>): ApprovalDetail[] {
  const details: ApprovalDetail[] = [];
  add(details, 'action', label('Thao tác', '操作'), args.action);
  add(details, 'target', label('ID kiểu', '样式 ID'), args.presetId);
  add(details, 'target', label('Tên kiểu', '样式名称'), args.name ?? args.rename);
  return details;
}

const FIELD_DETAILS: ReadonlyArray<readonly [string, ApprovalDetailKind, string, string]> = [
  ['action', 'action', 'Thao tác', '操作'], ['command', 'command', 'Lệnh', '命令'],
  ['url', 'url', 'Địa chỉ', '网址'], ['urls', 'url', 'Địa chỉ', '网址'],
  ['sourceUrl', 'url', 'Địa chỉ nguồn', '源网址'], ['filePath', 'path', 'Đường dẫn tệp', '文件路径'],
  ['inputPath', 'path', 'Đường dẫn đầu vào', '输入路径'], ['targetPath', 'path', 'Đường dẫn đích', '目标路径'],
  ['destinationPath', 'output', 'Đích đầu ra', '输出目标'], ['path', 'path', 'Đường dẫn', '路径'],
  ['outputPath', 'output', 'Đích đầu ra', '输出目标'], ['outputs', 'output', 'Đích đầu ra', '输出目标'],
  ['destination', 'output', 'Đích đầu ra', '输出目标'], ['output', 'output', 'Đích đầu ra', '输出目标'],
  ['filename', 'output', 'Tên đầu ra', '输出名称'], ['outputTarget', 'output', 'Đích đầu ra', '输出目标'],
  ['name', 'output', 'Tên đầu ra', '输出名称'], ['repo', 'target', 'Kho mã', '仓库'],
  ['slug', 'target', 'Thư mục cài đặt', '安装目录'], ['provider', 'parameter', 'Nhà cung cấp', '服务商'],
  ['track', 'target', 'Rãnh', '轨道'], ['skill', 'target', 'Kỹ năng', '技能'],
  ['assetId', 'target', 'ID tư liệu', '资源 ID'], ['projectId', 'target', 'ID dự án', '工程 ID'],
  ['skillId', 'target', 'ID kỹ năng', '技能 ID'], ['templateId', 'target', 'ID mẫu', '模板 ID'],
  ['versionId', 'target', 'ID phiên bản', '版本 ID'], ['model', 'parameter', 'Mô hình', '模型'],
  ['prompt', 'parameter', 'Nội dung yêu cầu', '请求内容'], ['format', 'parameter', 'Định dạng', '格式'],
  ['codec', 'parameter', 'Mã hóa', '编码'], ['resolution', 'parameter', 'Độ phân giải', '分辨率'],
];

function genericDetails(args: Readonly<Record<string, unknown>>): ApprovalDetail[] {
  const details: ApprovalDetail[] = [];
  for (const [key, kind, viLabel, zhLabel] of FIELD_DETAILS) add(details, kind, label(viLabel, zhLabel), args[key]);
  return details;
}

export function approvalPresentationFromDetails(
  tool: string,
  details: readonly ApprovalDetail[],
): ToolApprovalPresentation {
  const suffix = details.map((detail) => `${detail.label}=${detail.value}`).join(' · ');
  return { summary: suffix ? `${tool} · ${suffix}` : tool, details };
}

export function formatToolApprovalDetails(
  tool: string,
  args: Readonly<Record<string, unknown>>,
): ToolApprovalPresentation {
  const details = tool === 'run_code'
    ? runCodeDetails(args)
    : tool === 'manage_design_style'
      ? designDetails(args)
      : genericDetails(args);
  if (tool === 'download_media') add(details, 'output', label('Thư mục đầu ra', '输出目录'), '/media/uploads/');
  return approvalPresentationFromDetails(tool, details);
}
