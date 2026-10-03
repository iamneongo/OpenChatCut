import {
  EXTERNAL_SESSION_TOOLS,
  externalDraftSchemas,
  type ExternalRegisteredTool,
} from '../../src/agent/external-tool-shape.js';
import { isExternalServerDirectTool } from '../../src/agent/external-tool-policy.js';
import { AGENT_RUNTIME_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/agent-runtime-tools.js';
import { AGENT_PATH_IMPORT_SCHEMAS } from '../../src/agent/tools/agent-path-import-tools.js';
import { CORE_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/core-tools.js';
import { CAPTIONS_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/captions-tools.js';
import { EDIT_ITEM_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/edit-item-tools.js';
import { EFFECT_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/effect-tools.js';
import { LIBRARY_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/library-tools.js';
import { MARKERS_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/markers-tools.js';
import { READ_PROJECT_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/read-project-tools.js';
import { SCRIPT_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/script-tools.js';
import { TIMELINE_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/timeline-tools.js';
import { TRACK_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/track-tools.js';
import { TRANSCRIPT_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/transcript-tools.js';
import { WATERMARK_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/watermark-tools.js';
import { TIMELINE_IMPORT_TOOL_SCHEMAS } from '../../src/agent/tools/schemas/timeline-import-tools.js';
import { localized } from '../ui-locale.ts';

const OFFLINE_TOOL_DESCRIPTIONS: Record<string, { zh: string; en: string; vi: string }> = {
  begin_edit_session: {
    zh: '开始离线服务器草稿。approvalMode 必须为 auto；如需手动确认，请打开编辑器 URL。',
    en: 'Start an offline server draft. approvalMode must be auto; open the editor URL for manual approval.',
    vi: 'Bắt đầu bản nháp ngoại tuyến trên máy chủ. approvalMode phải là auto; hãy mở URL trình chỉnh sửa nếu cần phê duyệt thủ công.',
  },
  review_edit_session: {
    zh: '原子化提交完整的离线草稿并返回终态 applied，否则不写入任何内容。',
    en: 'Atomically commit the complete offline draft and return terminal status applied, or write nothing.',
    vi: 'Ghi nhận toàn bộ bản nháp ngoại tuyến theo cách nguyên tử và trả về trạng thái cuối là applied; nếu không thì không ghi gì.',
  },
  edit_captions: {
    zh: '编辑内置字幕模板、样式、布局、文字、来源和语言数据。preset_* 操作要求使用浏览器编辑器。',
    en: 'Edit built-in caption template, style, layout, text, source, and language data. preset_* actions require the browser editor.',
    vi: 'Chỉnh sửa mẫu phụ đề tích hợp, kiểu, bố cục, văn bản, nguồn và dữ liệu ngôn ngữ. Các thao tác preset_* yêu cầu trình chỉnh sửa trong trình duyệt.',
  },
};

const OFFLINE_SESSION_TOOL_NAMES = new Set([
  'begin_edit_session',
  'get_edit_session',
  'review_edit_session',
  'discard_edit_session',
]);

const OFFLINE_SCHEMA_GROUPS = [
  AGENT_RUNTIME_TOOL_SCHEMAS,
  AGENT_PATH_IMPORT_SCHEMAS,
  CORE_TOOL_SCHEMAS,
  EDIT_ITEM_TOOL_SCHEMAS,
  EFFECT_TOOL_SCHEMAS,
  LIBRARY_TOOL_SCHEMAS,
  TIMELINE_TOOL_SCHEMAS,
  TRACK_TOOL_SCHEMAS,
  SCRIPT_TOOL_SCHEMAS,
  CAPTIONS_TOOL_SCHEMAS,
  WATERMARK_TOOL_SCHEMAS,
  MARKERS_TOOL_SCHEMAS,
  READ_PROJECT_TOOL_SCHEMAS,
  TRANSCRIPT_TOOL_SCHEMAS,
  TIMELINE_IMPORT_TOOL_SCHEMAS,
] as const;

function serverDirectSchemas(): ExternalRegisteredTool[] {
  const byName = new Map(
    OFFLINE_SCHEMA_GROUPS
      .flat()
      .filter((tool) => isExternalServerDirectTool(tool.name))
      .map((tool) => [tool.name, tool]),
  );
  return externalDraftSchemas([...byName.values()]);
}

/** Lifecycle controls plus the reviewed, dependency-closed pure-data editor subset. */
export function offlineExternalToolSchemas(): ExternalRegisteredTool[] {
  const sessionTools = EXTERNAL_SESSION_TOOLS.filter((tool) => OFFLINE_SESSION_TOOL_NAMES.has(tool.name));
  return [...sessionTools, ...serverDirectSchemas()].map((tool) => (
    OFFLINE_TOOL_DESCRIPTIONS[tool.name]
      ? { ...tool, description: localized(OFFLINE_TOOL_DESCRIPTIONS[tool.name]) }
      : tool
  ));
}
