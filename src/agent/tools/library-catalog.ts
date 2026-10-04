// Library catalog for browse_library — categories:
// motion-graphics | luts | zoom | fx | audio-fx | sound-effects | transitions
// audio-fx: open-box isolate_voice (ffmpeg), applied via isolate_voice tool / Inspector.

import { SOUND_EFFECTS } from '../../audio/soundLibrary';
import {
  TRANSITION_LABELS,
  TRANSITION_ORDER,
  ZOOM_SHAPE_LABELS,
  ZOOM_SHAPE_ORDER,
  type TransitionType,
  type ZoomShape,
} from '../../editor/types';
import { CUSTOM_FX, FX_EFFECTS, FX_IDS, LUT_EFFECTS, LUT_IDS } from '../../gl/fx/effects';
import { listCustomTransitions } from '../../gl/customTransitions';
import { listCustomZooms } from '../../editor/customZooms';
import type { Tpl } from '../../types';
import { localizedCatalogText } from '../../i18n/locale';
import {
  AUDIO_FX_ISOLATE_DEFAULT,
  AUDIO_FX_ISOLATE_LIGHT,
  AUDIO_FX_ISOLATE_STRONG,
} from '../../audio/isolateVoice';

export const LIBRARY_CATEGORIES = [
  'motion-graphics',
  'luts',
  'zoom',
  'fx',
  'audio-fx',
  'sound-effects',
  'transitions',
] as const;

export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

export interface LibraryItem {
  id: string;
  name: string;
  category: LibraryCategory;
  description: string;
  group?: string;
  /** Placement guidance for edit_item. */
  usage?: string;
}

/** Map TransitionType → builtin:tr-* asset id. */
export function transitionAssetId(type: TransitionType): string {
  return `builtin:tr-${type}`;
}

/** parse builtin:tr-* or bare TransitionType */
export function parseTransitionAssetId(assetId: string): TransitionType | null {
  const raw = assetId.replace(/^builtin:tr-/, '');
  if ((TRANSITION_ORDER as readonly string[]).includes(raw)) return raw as TransitionType;
  return null;
}

/** Zoom library id: library:zoom:<shape>. */
export function zoomLibraryId(shape: ZoomShape): string {
  return `library:zoom:${shape}`;
}

export function parseZoomLibraryId(assetId: string): ZoomShape | null {
  if (assetId === 'builtin:zoom') return 'hold'; // default shape when bare
  const m = /^library:zoom:(.+)$/.exec(assetId);
  if (!m) return null;
  const shape = m[1] as ZoomShape;
  return (ZOOM_SHAPE_ORDER as readonly string[]).includes(shape) ? shape : null;
}

const ZOOM_DESC: Record<ZoomShape, string> = {
  punch: 'Zoom đấm nhanh — nhấn mạnh điểm cần chú ý',
  instant: 'Bật ngay đến khung hình phóng đại — không có hoạt ảnh',
  'slow-push': 'Zoom dần trong toàn bộ đoạn clip',
  hold: 'Tăng tốc mượt, giữ ở đỉnh rồi giảm mượt',
  'zoom-out': 'Bắt đầu cận cảnh, kéo lùi về 1×',
  'ease-in': 'Đẩy về đỉnh bằng đường cong cubic ease-in',
  bounce: 'Vượt đỉnh rồi ổn định lại (đàn hồi)',
  snap: 'Bật rất nhanh vào mức phóng đại tối đa',
  pulse: 'Nhịp phóng đại như nhịp tim rồi giảm lại',
  'whip-in': 'Lao mạnh từ đầu vào vùng zoom',
};

export function buildLibraryItems(templates: Tpl[]): LibraryItem[] {
  const items: LibraryItem[] = [];

  for (const t of templates) {
    items.push({
      id: `library:motion-graphic:${t.id}`,
      name: t.name,
      category: 'motion-graphics',
      description: t.category,
      group: t.category,
      usage: `edit_item adds:[{type:"motion-graphic",assetId:"library:motion-graphic:${t.id}",track:"V1",startFrame?}]`,
    });
  }

  for (const id of LUT_IDS) {
    const d = LUT_EFFECTS[id];
    if (!d) continue;
    items.push({
      id: d.id,
      name: d.name,
      category: 'luts',
      description: d.desc,
      usage: `edit_item adds:[{type:"effect",targetItemId:"<clip>",assetId:"${d.id}",propertyOverrides:{intensity:1}}]`,
    });
  }

  for (const shape of ZOOM_SHAPE_ORDER) {
    items.push({
      id: zoomLibraryId(shape),
      name: ZOOM_SHAPE_LABELS[shape],
      category: 'zoom',
      description: ZOOM_DESC[shape] ?? shape,
      usage: `edit_item adds:[{type:"effect",targetItemId:"<clip>",assetId:"${zoomLibraryId(shape)}"}] — expands to builtin:zoom shape=${shape}`,
    });
  }

  for (const id of FX_IDS) {
    const d = FX_EFFECTS[id];
    if (!d) continue;
    items.push({
      id: d.id,
      name: d.name,
      category: 'fx',
      description: d.desc,
      usage: `edit_item adds:[{type:"effect",targetItemId:"<clip>",assetId:"${d.id}",propertyOverrides:{...}}]`,
    });
  }

  // Open-box AI Voice Isolation implemented with local ffmpeg.
  items.push({
    id: AUDIO_FX_ISOLATE_DEFAULT,
    name: localizedCatalogText('Voice Isolation', '人声隔离', undefined, 'Tách giọng nói'),
    category: 'audio-fx',
    description: 'Khử ồn giọng nói mã nguồn mở (khử ồn phổ bằng ffmpeg). Gắn denoisedSrc; src của đoạn gốc không thay đổi.',
    group: 'voice',
    usage: 'isolate_voice itemId=<clip> action=apply strength?=70 — không dùng edit_item (khử ồn theo từng đoạn, không phải mục để đặt trong thư viện). action=clear để xóa. Giao diện thư viện: Thư viện → Hiệu ứng âm thanh.',
  });
  items.push({
    id: AUDIO_FX_ISOLATE_LIGHT,
    name: localizedCatalogText('Voice Isolation (Light)', '人声隔离（轻）', undefined, 'Tách giọng nói (nhẹ)'),
    category: 'audio-fx',
    description: 'Mức khử ồn nhẹ (strength≈35) cho micro vốn đã khá sạch.',
    group: 'voice',
    usage: 'isolate_voice itemId=<clip> action=apply strength=35',
  });
  items.push({
    id: AUDIO_FX_ISOLATE_STRONG,
    name: localizedCatalogText('Voice Isolation (Strong)', '人声隔离（强）', undefined, 'Tách giọng nói (mạnh)'),
    category: 'audio-fx',
    description: 'Khử ồn mạnh (strength≈90) cho phòng ồn hoặc lời thoại ngoài đường.',
    group: 'voice',
    usage: 'isolate_voice itemId=<clip> action=apply strength=90',
  });

  for (const s of SOUND_EFFECTS) {
    // Keep the group id (transition-emphasis, etc.) for browse_library filters.
    items.push({
      id: `library:sound:${s.id}`,
      name: s.name,
      category: 'sound-effects',
      description: s.desc,
      group: s.group,
      usage: `edit_item adds:[{type:"audio",assetId:"library:sound:${s.id}",fromFrame:<anchor>}]`,
    });
  }

  for (const type of TRANSITION_ORDER) {
    const id = transitionAssetId(type);
    items.push({
      id,
      name: TRANSITION_LABELS[type],
      category: 'transitions',
      description: `Chuyển cảnh video: ${type}`,
      group: 'transitions',
      usage: `edit_item adds:[{type:"transition",assetId:"${id}",incomingItemId:"<clip>"}] — đặt chuyển cảnh bắc qua điểm cắt của đoạn này; có thể thêm durationInFrames`,
    });
  }

  // Only the custom/plugin content registered at runtime (submit_shader product + installed plugin) can be seen and touched by the agent.
  for (const d of Object.values(CUSTOM_FX)) {
    items.push({
      id: d.id,
      name: d.name,
      category: d.cube ? 'luts' : 'fx',
      description: d.desc,
      usage: `edit_item adds:[{type:"effect",targetItemId:"<clip>",assetId:"${d.id}",propertyOverrides:{...}}]`,
    });
  }
  for (const t of listCustomTransitions()) {
    items.push({
      id: t.id,
      name: t.label,
      category: 'transitions',
      description: 'Chuyển cảnh GLSL tùy chỉnh/plugin',
      group: 'transitions',
      usage: `edit_item adds:[{type:"transition",assetId:"${t.id}",incomingItemId:"<clip>"}]`,
    });
  }
  for (const z of listCustomZooms()) {
    items.push({
      id: z.id,
      name: z.label,
      category: 'zoom',
      description: 'Đường cong zoom (envelope) từ plugin',
      usage: `edit_item adds:[{type:"effect",targetItemId:"<clip>",assetId:"${z.id}"}]`,
    });
  }

  return items;
}

export function libraryOverview(items: LibraryItem[]) {
  const groups = new Map<string, { id: string; name: string; count: number }>();
  for (const it of items) {
    const key = it.group ?? it.category;
    const cur = groups.get(key) ?? { id: key, name: key, count: 0 };
    cur.count++;
    groups.set(key, cur);
  }
  return {
    mode: 'overview' as const,
    total: items.length,
    groups: [...groups.values()].sort((a, b) => b.count - a.count),
    usage: {
      category: 'Category trả về tổng quan tab Thư viện cùng số lượng theo nhóm.',
      categoryGroup: 'Category + group trả về danh sách trong một nhóm.',
      id: 'ID trả về chi tiết một mục cùng hướng dẫn dùng với edit_item.',
      query: 'Query trả về danh sách trong hoặc giữa các category.',
    },
  };
}
