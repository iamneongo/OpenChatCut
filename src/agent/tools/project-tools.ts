export { PROJECT_TOOL_SCHEMAS, PROJECT_TOOL_NAMES } from './schemas/project-tools';
import type { AgentContext } from '../context';
import type { ProjectDoc, TimelineState } from '../../editor/types';
import { hasOperationalTranscript } from '../../transcript/types';
import {
  docFromTimeline,
  listProjects,
  loadProject,
  createProject,
  updateProjectMeta,
  duplicateProject,
  deleteProject,
  restoreProject,
} from '../../persist/projectStore';
import type { ProjectMeta } from '../../persist/projectStoreCoordinators';

// Local-first MCP project session tools:
// create/list/delete/duplicate/edit/restore/target_project + get_editor_url.
// Soft-deleted data stays in IDB, with an in-memory fallback for tests.

type Args = Record<string, unknown>;

/** Build a shareable editor URL (hash-router). */
export function buildEditorUrl(projectId: string, editorBaseUrl?: string): string {
  const base = (editorBaseUrl?.trim()
    || (typeof location !== 'undefined' && location.origin
      ? `${location.origin}${location.pathname || '/'}`
      : 'http://127.0.0.1:5200/')).replace(/\/$/, '');
  // path may already be / or /index.html — always append hash route
  return `${base}#/editor/${projectId}`;
}

function emptyState(opts: { width?: number; height?: number; fps?: number }): TimelineState {
  const width = typeof opts.width === 'number' && opts.width > 0 ? Math.round(opts.width) : 1920;
  const height = typeof opts.height === 'number' && opts.height > 0 ? Math.round(opts.height) : 1080;
  const fps = typeof opts.fps === 'number' && opts.fps > 0 ? opts.fps : 30;
  return {
    fps,
    width,
    height,
    items: [],
    selectedId: null,
    trackOrder: ['track_v1'],
    tracks: { track_v1: { kind: 'video' } },
  };
}

export function emptyProjectDoc(opts: { width?: number; height?: number; fps?: number } = {}): ProjectDoc {
  return docFromTimeline(emptyState(opts));
}

function currentProjectId(ctx: AgentContext): string | null {
  return ctx.getProjectId?.() ?? null;
}

async function resolveMeta(
  projectId: string | undefined | null,
  opts?: { includeDeleted?: boolean; allowMissing?: boolean },
): Promise<ProjectMeta | null> {
  const id = String(projectId ?? '').trim();
  if (!id) return null;
  const all = await listProjects({ includeDeleted: true });
  const exact = all.find((m) => m.id === id);
  if (exact) {
    if (!opts?.includeDeleted && exact.deletedAt) return null;
    return exact;
  }
  const matches = all.filter((m) => m.id.startsWith(id) && (opts?.includeDeleted || !m.deletedAt));
  if (matches.length === 1) return matches[0]!;
  return null;
}

function row(meta: ProjectMeta, editorBaseUrl?: string) {
  return {
    id: meta.id,
    name: meta.name,
    updatedAt: meta.updatedAt,
    description: meta.description ?? null,
    deletionState: meta.deletedAt ? 'deleted' : 'active',
    deletedAt: meta.deletedAt ?? null,
    editorUrl: buildEditorUrl(meta.id, editorBaseUrl),
  };
}

export async function execProjectTool(name: string, args: Args, ctx: AgentContext): Promise<unknown> {
  switch (name) {
    case 'list_projects':
      return execList(args);
    case 'create_project':
      return execCreate(args);
    case 'delete_project':
      return execDelete(args, ctx);
    case 'restore_project':
      return execRestore(args);
    case 'duplicate_project':
      return execDuplicate(args, ctx);
    case 'edit_project':
      return execEdit(args, ctx);
    case 'target_project':
      return execTarget(args, ctx);
    case 'get_editor_url':
      return execGetUrl(args, ctx);
    default:
      return { error: `Tool không xác định: ${name}` };
  }
}

async function execList(args: Args): Promise<unknown> {
  const includeDeleted = args.includeDeleted === true;
  const base = typeof args.editorBaseUrl === 'string' ? args.editorBaseUrl : undefined;
  const projects = await listProjects({ includeDeleted });
  return {
    ok: true,
    count: projects.length,
    projects: projects.map((m) => row(m, base)),
  };
}

async function execCreate(args: Args): Promise<unknown> {
  const name = typeof args.name === 'string' && args.name.trim()
    ? args.name.trim()
    : 'Dự án mới';
  const description = typeof args.description === 'string' ? args.description : undefined;
  const doc = emptyProjectDoc({
    width: typeof args.compositionWidth === 'number' ? args.compositionWidth : undefined,
    height: typeof args.compositionHeight === 'number' ? args.compositionHeight : undefined,
    fps: typeof args.fps === 'number' ? args.fps : undefined,
  });
  const meta = await createProject(name, doc, description ? { description } : undefined);
  const base = typeof args.editorBaseUrl === 'string' ? args.editorBaseUrl : undefined;
  return {
    ok: true,
    projectId: meta.id,
    name: meta.name,
    editorUrl: buildEditorUrl(meta.id, base),
    timelineId: doc.activeTimelineId,
    note: 'Đã tạo dự án. Gọi target_project để mở trong trình chỉnh sửa.',
  };
}

async function execDelete(args: Args, ctx: AgentContext): Promise<unknown> {
  const projectId = String(args.projectId ?? '').trim();
  if (!projectId) return { error: 'Cần có projectId (không tự mặc định về dự án hiện tại)' };
  const meta = await resolveMeta(projectId, { includeDeleted: true });
  if (!meta) return { error: `Không tìm thấy dự án: ${projectId}` };
  if (meta.deletedAt) return { ok: true, projectId: meta.id, alreadyDeleted: true };
  await deleteProject(meta.id);
  const current = currentProjectId(ctx);
  return {
    ok: true,
    projectId: meta.id,
    softDeleted: true,
    wasCurrent: current === meta.id,
    note: current === meta.id
      ? 'Dự án hiện tại đã được xóa mềm; hãy về trang chủ hoặc chọn dự án khác.'
      : 'Đã xóa mềm. restore_project sẽ hoàn tác thao tác này.',
  };
}

async function execRestore(args: Args): Promise<unknown> {
  const projectId = String(args.projectId ?? '').trim();
  if (!projectId) return { error: 'Cần có projectId' };
  const meta = await resolveMeta(projectId, { includeDeleted: true });
  if (!meta) return { error: `Không tìm thấy dự án: ${projectId}` };
  const restored = await restoreProject(meta.id);
  if (!restored) return { error: 'Khôi phục thất bại' };
  const base = typeof args.editorBaseUrl === 'string' ? args.editorBaseUrl : undefined;
  return {
    ok: true,
    projectId: restored.id,
    name: restored.name,
    editorUrl: buildEditorUrl(restored.id, base),
  };
}

async function execDuplicate(args: Args, ctx: AgentContext): Promise<unknown> {
  const srcId = String(args.projectId ?? currentProjectId(ctx) ?? '').trim();
  if (!srcId) return { error: 'Cần có projectId (hoặc hãy mở một dự án trước)' };
  const src = await resolveMeta(srcId, { includeDeleted: true });
  if (!src) return { error: `Không tìm thấy dự án: ${srcId}` };
  const name = typeof args.name === 'string' ? args.name : undefined;
  const copy = await duplicateProject(src.id, name);
  if (!copy) return { error: 'Nhân bản thất bại (có thể thiếu tài liệu dự án?)' };
  const activate = args.activate !== false;
  const base = typeof args.editorBaseUrl === 'string' ? args.editorBaseUrl : undefined;
  let opened = false;
  if (activate && ctx.openProject) {
    const r = await ctx.openProject(copy.id);
    opened = r?.ok !== false;
  }
  return {
    ok: true,
    sourceProjectId: src.id,
    newProjectId: copy.id,
    name: copy.name,
    editorUrl: buildEditorUrl(copy.id, base),
    activated: opened,
    note: opened
      ? 'Đã mở bản sao trong trình chỉnh sửa.'
      : activate
        ? 'Đã tạo bản sao; hãy mở editorUrl hoặc gọi target_project để chuyển sang đó.'
        : 'Đã tạo bản sao; phiên hiện vẫn ở dự án nguồn.',
  };
}

/** speaker-update: project-wide speaker rename/merge. This build has no speaker ROSTER —
 *  speakers are per-word diarization labels (A/B/…) — so "update the speaker list" = relabel
 *  every word speaker===from → to across all transcribed clips in the open project:
 *  only word.speaker changes; timings/durations/word count untouched). Drafted like any edit. */
function execSpeakerUpdate(args: Args, ctx: AgentContext): unknown {
  const projectId = String(args.projectId ?? '').trim();
  const open = currentProjectId(ctx);
  if (projectId && open && projectId !== open) {
    return { error: 'speaker-update đổi nhãn transcript của dự án ĐANG MỞ; hãy gọi target_project trước (hoặc bỏ qua projectId).' };
  }
  let json: Record<string, unknown> = {};
  if (typeof args.json === 'string' && args.json.trim()) {
    try { const o = JSON.parse(args.json); if (o && typeof o === 'object') json = o as Record<string, unknown>; } catch { /* ignore, fall back to top-level args */ }
  } else if (args.json && typeof args.json === 'object') json = args.json as Record<string, unknown>;

  // Top-level `id` is the speaker locator, equivalent to json.id.
  const from = String(args.from ?? args.id ?? json.from ?? json.speaker ?? json.id ?? '').trim();
  const to = String(args.to ?? json.to ?? json.name ?? json.newName ?? '').trim();
  if (!from || !to) return { error: 'speaker-update cần {from:"A", to:"Tên mới"} — from = nhãn người nói hiện tại, to = tên mới' };
  const items = ctx.getState().items.filter((it) => hasOperationalTranscript(it) && it.transcript.some((w) => w.speaker === from));
  if (!items.length) return { error: `Không có từ nào mang nhãn người nói "${from}" trong dự án`, hint: 'read_captions {words:true} / read_script sẽ hiển thị nhãn người nói' };
  let wordsChanged = 0;
  for (const it of items) {
    wordsChanged += it.transcript!.filter((w) => w.speaker === from).length;
    ctx.commands.renameSpeaker(it.id, from, to);
  }
  return { ok: true, action: 'speaker-update', from, to, itemsChanged: items.length, wordsChanged, note: 'Đã đổi nhãn trên toàn dự án; chỉ word.speaker được thay đổi.' };
}

async function execEdit(args: Args, ctx: AgentContext): Promise<unknown> {
  const action = String(args.action ?? '');
  if (action === 'speaker-update') return execSpeakerUpdate(args, ctx);
  if (action === 'speaker-create' || action === 'speaker-delete') {
    return {
      unsupported: true,
      action,
      note: 'Bản này không có danh sách người nói cấp dự án — người nói là nhãn diarization trên từng từ (A/B/…), không phải danh sách quản lý riêng. Không thể tạo người nói chưa có từ; xóa cũng sẽ là thao tác đổi nhãn phá hủy và không rõ ràng. Dùng speaker-update {from,to} để đổi/gộp người nói trên toàn dự án, hoặc manage_transcript action=fix {from,to} cho một clip.',
    };
  }
  if (action.startsWith('speaker-')) return { error: `Action người nói không xác định: ${action}`, supported: ['speaker-update'] };
  if (action !== 'update') return { error: `Action không xác định: ${action}` };

  const projectId = String(args.projectId ?? currentProjectId(ctx) ?? '').trim();
  if (!projectId) return { error: 'Cần có projectId (hoặc hãy mở một dự án trước)' };
  const meta = await resolveMeta(projectId, { includeDeleted: true });
  if (!meta) return { error: `Không tìm thấy dự án: ${projectId}` };
  if (meta.deletedAt) return { error: 'Dự án đã bị xóa mềm; hãy restore_project trước' };

  let patch: { name?: string; description?: string | null } = {};
  if (typeof args.json === 'string' && args.json.trim()) {
    try {
      const parsed = JSON.parse(args.json) as Record<string, unknown>;
      if (typeof parsed.name === 'string') patch.name = parsed.name;
      if (parsed.description === null) patch.description = null;
      else if (typeof parsed.description === 'string') patch.description = parsed.description;
    } catch {
      return { error: 'json phải là đối tượng JSON hợp lệ' };
    }
  }
  // also accept top-level name for convenience
  if (typeof args.name === 'string') patch.name = args.name;
  if (!patch.name && patch.description === undefined) {
    return { error: 'update cần json {name?, description?} hoặc name' };
  }

  const next = await updateProjectMeta(meta.id, patch);
  if (!next) return { error: 'Cập nhật thất bại' };
  // Notify live editor title if this is the open project
  if (currentProjectId(ctx) === next.id && patch.name && ctx.onProjectRenamed) {
    ctx.onProjectRenamed(patch.name);
  }
  return { ok: true, projectId: next.id, name: next.name, description: next.description ?? null };
}

async function execTarget(args: Args, ctx: AgentContext): Promise<unknown> {
  const q = String(args.projectId ?? '').trim();
  if (!q) return { error: 'Cần có projectId' };
  const meta = await resolveMeta(q);
  if (!meta) return { error: `Không tìm thấy dự án hoặc dự án đã bị xóa: ${q}` };
  const doc = await loadProject(meta.id);
  if (!doc) return { error: 'Thiếu tài liệu dự án' };
  const base = typeof args.editorBaseUrl === 'string' ? args.editorBaseUrl : undefined;
  let opened = false;
  if (ctx.openProject) {
    const r = await ctx.openProject(meta.id);
    opened = r?.ok !== false;
  }
  return {
    ok: true,
    projectId: meta.id,
    name: meta.name,
    timelineId: doc.activeTimelineId,
    editorUrl: buildEditorUrl(meta.id, base),
    opened,
    note: opened
      ? 'Trình chỉnh sửa đang chuyển đến dự án (chat sẽ nạp lại theo dự án đó).'
      : 'Đã ghi nhận project đích qua editorUrl; host nên mở URL nếu không thể điều hướng.',
  };
}

async function execGetUrl(args: Args, ctx: AgentContext): Promise<unknown> {
  const q = String(args.projectId ?? currentProjectId(ctx) ?? '').trim();
  if (!q) {
    return {
      error: 'Chưa chọn dự án — hãy truyền projectId hoặc gọi list_projects / create_project trước',
    };
  }
  const meta = await resolveMeta(q, { includeDeleted: true });
  if (!meta) return { error: `Không tìm thấy dự án: ${q}` };
  const base = typeof args.editorBaseUrl === 'string' ? args.editorBaseUrl : undefined;
  return {
    ok: true,
    projectId: meta.id,
    name: meta.name,
    editorUrl: buildEditorUrl(meta.id, base),
    openPricing: args.openPricing === true ? 'ignored' : undefined,
  };
}
