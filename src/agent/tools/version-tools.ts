export { VERSION_TOOL_SCHEMAS, VERSION_TOOL_NAMES } from './schemas/version-tools';
import type { AgentContext } from '../context';
import {
  deleteVersion,
  listVersions,
  saveVersion,
  type ProjectVersion,
} from '../../persist/versionStore';

type Args = Record<string, unknown>;

function slimVersion(v: ProjectVersion) {
  return {
    id: v.id,
    name: v.name,
    createdAt: v.createdAt,
    automatic: v.automatic === true,
    timelines: v.doc.timelines.length,
    activeTimelineId: v.doc.activeTimelineId,
  };
}

function findVersion(versions: ProjectVersion[], ref: string): ProjectVersion | null {
  const q = ref.trim();
  if (!q) return null;
  const exact = versions.find((v) => v.id === q);
  if (exact) return exact;
  const hits = versions.filter((v) => v.id.startsWith(q) || v.name === q);
  return hits.length === 1 ? hits[0]! : null;
}

export async function execVersionTool(name: string, args: Args, ctx: AgentContext): Promise<unknown> {
  if (name !== 'manage_versions') return { error: `Công cụ không xác định: ${name}` };
  const projectId = ctx.getProjectId?.();
  if (!projectId) return { error: 'manage_versions cần project id đã lưu và đang mở' };

  const action = String(args.action ?? '');
  switch (action) {
    case 'list': {
      const versions = await listVersions(projectId);
      return {
        ok: true,
        count: versions.length,
        versions: versions.map(slimVersion),
        note: 'Dùng versionId trong danh sách này với restore hoặc delete. Không liệt kê toàn bộ nội dung dự án.',
      };
    }
    case 'save': {
      const name = String(args.name ?? '').trim();
      if (!name) return { error: 'save cần name (nhãn checkpoint)' };
      const version = await saveVersion(projectId, name, ctx.getDoc());
      return { ok: true, saved: slimVersion(version) };
    }
    case 'restore': {
      const ref = String(args.versionId ?? '').trim();
      if (!ref) return { error: 'restore cần versionId lấy từ list' };
      const versions = await listVersions(projectId);
      const version = findVersion(versions, ref);
      if (!version) {
        const ambiguous = versions.filter((v) => v.id.startsWith(ref) || v.name === ref);
        if (ambiguous.length > 1) {
          return { error: `versionId ${ref} không đủ rõ ràng`, candidates: ambiguous.slice(0, 6).map(slimVersion) };
        }
        return { error: `Không tìm thấy version: ${ref}`, available: versions.slice(0, 12).map(slimVersion) };
      }
      if (args.confirm !== true) {
        return {
          needsConfirm: true,
          version: slimVersion(version),
          note: 'Khôi phục sẽ thay thế toàn bộ dự án đang mở bằng snapshot này. Gửi lại với confirm:true để áp dụng.',
        };
      }
      const before = ctx.getDoc();
      ctx.commands.applyDoc(version.doc);
      return {
        ok: true,
        restored: slimVersion(version),
        note: before.activeTimelineId !== version.doc.activeTimelineId
          ? 'Dòng thời gian đang hoạt động đã chuyển sang sequence đang hoạt động trong snapshot.'
          : 'Tài liệu dự án đã được thay bằng version được chọn.',
      };
    }
    case 'delete': {
      const ref = String(args.versionId ?? '').trim();
      if (!ref) return { error: 'delete cần versionId lấy từ list' };
      const versions = await listVersions(projectId);
      const version = findVersion(versions, ref);
      if (!version) return { error: `Không tìm thấy version: ${ref}` };
      await deleteVersion(projectId, version.id);
      return { ok: true, deleted: slimVersion(version) };
    }
    default:
      return { error: `Action không xác định: ${action}; dùng list/save/restore/delete` };
  }
}
