import type { TimelineItem, TimelineState } from '../../editor/types';
import { rejectUnknownFields } from './edit-item-fields';

type OpResult = Record<string, unknown>;

const finiteNum = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

const MEDIA_OP_UPDATE_KEYS: Record<string, true> = {
  type: true,
  itemId: true,
  id: true,
  operation: true,
  src: true,
  name: true,
  durationInFrames: true,
  width: true,
  height: true,
  sourceFilename: true,
};

function findItem(items: TimelineItem[], id: unknown): TimelineItem | null {
  const q = String(id ?? '');
  if (!q) return null;
  return items.find((it) => it.id === q || it.id.startsWith(q)) ?? null;
}

/** Clip-level replace_media (bake shell) or relink_media (file-backed only). */
export function validateMediaSourceUpdate(state: TimelineState, entry: Record<string, unknown>): OpResult {
  const op = String(entry.operation ?? '');
  if (op !== 'replace_media' && op !== 'relink_media') {
    return {
      ok: false,
      error: `Không hỗ trợ operation update: ${op}`,
      code: 'unknown-operation',
      supported: ['slip', 'replace_media', 'relink_media'],
    };
  }
  const unknown = rejectUnknownFields(entry, MEDIA_OP_UPDATE_KEYS);
  if (unknown) return { error: unknown, code: 'unknown-field' };
  const itemRef = entry.itemId ?? entry.id;
  const item = findItem(state.items, itemRef);
  if (!item) {
    return { ok: false, error: `Không tìm thấy item: ${String(itemRef ?? '')}`, code: 'unknown-item' };
  }
  const src = String(entry.src ?? '').trim();
  if (!src) return { error: `${op} cần có src (đường dẫn hoặc URL media thay thế)` };
  if (src.startsWith('blob:') || src.startsWith('file:')) {
    return { error: 'src phải là đường dẫn media của dự án hoặc URL https, không phải URL blob:/file:' };
  }
  if (op === 'replace_media') {
    return {
      ok: true,
      plan: 'replaceMedia',
      kind: item.kind,
      itemId: item.id,
      src,
      note: 'Thay clip bằng vỏ video trên cùng track/start/duration (đường kết xuất MG/text); effects/transform sẽ bị loại bỏ.',
    };
  }
  if (item.kind === 'motion-graphic' || item.kind === 'text' || item.kind === 'solid') {
    return { error: 'relink_media dành cho clip có file (video/audio/image/gif/svg); dùng replace_media để kết xuất MG/text thành video' };
  }
  const name = typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : undefined;
  const sourceFilename = typeof entry.sourceFilename === 'string' && entry.sourceFilename.trim()
    ? entry.sourceFilename.trim()
    : undefined;
  const durationInFrames = finiteNum(entry.durationInFrames);
  const width = finiteNum(entry.width);
  const height = finiteNum(entry.height);
  return {
    ok: true,
    plan: 'relinkMedia',
    kind: item.kind,
    itemId: item.id,
    src,
    ...(name ? { name } : {}),
    ...(sourceFilename ? { sourceFilename } : {}),
    ...(durationInFrames !== undefined && durationInFrames > 0 ? { durationInFrames: Math.round(durationInFrames) } : {}),
    ...(width !== undefined && width > 0 ? { width: Math.round(width) } : {}),
    ...(height !== undefined && height > 0 ? { height: Math.round(height) } : {}),
    note: 'Relink chỉ ở cấp clip: tách khỏi asset gốc trong kho (đã xóa sourceAssetId). Nên dùng manage_media_pool relink_asset để cập nhật kho và mọi clip liên kết.',
  };
}
