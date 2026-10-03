export { EDIT_ASSET_TOOL_SCHEMAS, EDIT_ASSET_TOOL_NAMES } from './schemas/edit-asset-tools';
import type { AgentContext } from '../context';
import type { MediaAsset, TimelineItem } from '../../editor/types';
import { isSourceClockMetadata } from '../../editor/timecode';
import { prepareTemplate } from '../../template-host';

// edit_asset: Change/delete "library assets" (assets in the media pool, non-timeline clips).
// - update: rename / change props / change the source code of the code class asset (MG) - changing the code must first go through the MG sandbox.
// If it fails, it will not be dropped into the library. MediaAsset does not store thumbnails (MG preview is rendered according to code), no need to invalidate.
// - delete: Remove from the pool. confirmImpact: If a fragment refers to it (MG presses templateId, media presses src),
// Report the count first and delete after confirm:true (the fragment itself has copied the code/holds src, and deleting the pool entries will not destroy them).
// manage_media_pool.rename_asset also supports rename; edit_asset retains the same capability.

type Args = Record<string, unknown>;

const strArg = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/** count timeline clips that reference this asset (MG by templateId, media by src). */
function referencingItems(items: TimelineItem[], asset: MediaAsset): number {
  return items.filter((it) =>
    (asset.kind === 'motion-graphic' && it.templateId === asset.id) || (!!asset.src && it.src === asset.src),
  ).length;
}

async function update(asset: MediaAsset, args: Args, ctx: AgentContext): Promise<unknown> {
  const patch: Partial<Pick<MediaAsset, 'name' | 'code' | 'props' | 'favorite' | 'sourceTimecode' | 'captureClock'>> = {};
  const name = strArg(args.name);
  if (name) patch.name = name;
  if (typeof args.favorite === 'boolean') patch.favorite = args.favorite;
  if (args.props && typeof args.props === 'object') patch.props = { ...asset.props, ...(args.props as Record<string, unknown>) };
  if (args.sourceTimecode !== undefined) {
    if (!isSourceClockMetadata(args.sourceTimecode)) {
      return { error: 'sourceTimecode phải dùng frameCount số nguyên, frameRate hữu tỉ dương và dropFrame boolean' };
    }
    patch.sourceTimecode = args.sourceTimecode;
  }
  if (args.captureClock !== undefined) {
    if (!isSourceClockMetadata(args.captureClock)) {
      return { error: 'captureClock phải dùng frameCount số nguyên, frameRate hữu tỉ dương và dropFrame boolean' };
    }
    patch.captureClock = args.captureClock;
  }
  if (args.clearSourceTimecode === true) patch.sourceTimecode = undefined;
  if (args.clearCaptureClock === true) patch.captureClock = undefined;

  const code = strArg(args.code);
  if (code) {
    if (asset.kind !== 'motion-graphic') return { error: `tư liệu "${asset.name}" là ${asset.kind}, không phải mã tư liệu (motion-graphic) — không thể đặt mã` };
    try {
      await prepareTemplate(code); // Sandbox validation and restricted-scope compilation must complete before persistence.
    } catch (e) {
      return { error: `Sandbox từ chối code mới: ${e instanceof Error ? e.message : String(e)}`, code };
    }
    patch.code = code;
  }

  if (Object.keys(patch).length === 0) return { error: 'Không có gì để cập nhật; hãy truyền name / code / props / favorite / sourceTimecode / captureClock' };
  ctx.commands.editMediaAsset(asset.id, patch);
  return { ok: true, updated: Object.keys(patch), assetId: asset.id };
}

function remove(asset: MediaAsset, args: Args, ctx: AgentContext): unknown {
  const refs = referencingItems(ctx.getState().items, asset);
  if (refs > 0 && args.confirm !== true) {
    return { needsConfirm: true, referencedBy: refs, note: `${refs} clip trên timeline đang tham chiếu “${asset.name}”. Xóa chỉ loại mục khỏi kho media, không ảnh hưởng clip đã đặt. Để xác nhận, hãy gửi lại với confirm:true.` };
  }
  ctx.commands.removeMediaAsset(asset.id);
  return { ok: true, deleted: asset.id, name: asset.name, wasReferencedBy: refs };
}

export async function execEditAssetTool(name: string, args: Args, ctx: AgentContext): Promise<unknown> {
  if (name !== 'edit_asset') return { error: `Công cụ không xác định: ${name}` };
  const id = strArg(args.assetId);
  if (!id) return { error: 'edit_asset cần có mã tư liệu (assetId)' };
  const asset = ctx.getDoc().assets.find((a) => a.id === id || a.id.startsWith(id));
  if (!asset) return { error: `Không tìm thấy tư liệu ${id}` };

  const action = String(args.action ?? '');
  if (action === 'update') return update(asset, args, ctx);
  if (action === 'delete') return remove(asset, args, ctx);
  return { error: `Action không xác định "${action}"; dùng update|delete` };
}
