import type { AgentContext } from '../context';
import type { CaptionAnchor, CaptionLayoutPolicy, CaptionPerSource, CaptionSlot, CaptionsData, CaptionSourceEntry } from '../../captions/types';
import { mapCaptionStyle } from '../../captions/styleMap';
import { captionStyleFor } from '../../captions/styles';
import { findVariantByLang } from '../../transcript/variants';
import { resolveTrackId, type TimelineState } from '../../editor/types';
import { moveCaptionSourceEntry, normalizeCaptionSourceEntries } from '../../captions/sourceOrder';
import { hasOperationalTranscript } from '../../transcript/types';
import { isStableIdentity } from '../../transcript/identity';
import { t } from '../../i18n/locale';

// edit_captions Multi-lane tool set:
// - positions puts multiple sources into place in one call (same anchor point = stacked in the same block)
// - layout_policy single-lane / auto-stack / manual-slots + perSource overrides
// - source_update changes the visibility/anchor/slot/style/variation of a single source by selector
// Data falls into CaptionsData.sourceEntries / layoutPolicy / perSource(captions/types.ts),
// Rendering is consumed by the captions/lanes.ts engine.

type Result = Record<string, unknown>;
type Json = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

const ANCHORS = new Set<string>([
  'top', 'center', 'bottom',
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]);

let seq = 0;
const laneId = (): string => `src_${(++seq).toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

/** Now scope is upgraded to sourceEntries (copy if existing; old sources[]/sourceItemId/timeline will be upgraded in one go).*/
export function ensureEntries(c: CaptionsData, s: TimelineState): CaptionSourceEntry[] {
  if (c.sourceEntries?.length) {
    return normalizeCaptionSourceEntries(c.sourceEntries).filter((entry) =>
      entry.words !== undefined || hasOperationalTranscript(s.items.find((item) => item.id === entry.itemId)));
  }
  const transcribed = (id: string) => s.items.some((it) => it.id === id && hasOperationalTranscript(it));
  if (c.sources?.length) return c.sources.filter(transcribed).map((itemId) => ({ id: laneId(), itemId }));
  if (c.sourceMode === 'timeline') {
    return s.items
      .filter((it) => hasOperationalTranscript(it))
      .sort((a, b) => a.startFrame - b.startFrame || a.id.localeCompare(b.id))
      .map((it) => ({ id: laneId(), itemId: it.id }));
  }
  if (c.sourceItemId && transcribed(c.sourceItemId)) return [{ id: laneId(), itemId: c.sourceItemId }];
  return [];
}

/** Selector → Hit entry subscript (selector family: index/id/sourceId/itemId/trackId/assetId/label/variant/slotId).*/
export function matchEntries(entries: CaptionSourceEntry[], sel: Json, s: TimelineState): number[] | { error: string } {
  const id = str(sel.sourceId) || str(sel.id);
  if (id) {
    const hits = entries.flatMap((entry, index) => (entry.id === id ? [index] : []));
    return hits.length === 1
      ? hits
      : { error: hits.length ? `sourceId "${id}" không duy nhất` : `Không có source với id "${id}" (dùng source_list để tra sourceId)` };
  }
  const idx = num(sel.index);
  if (idx !== undefined) {
    if (idx < 0 || idx >= entries.length) return { error: `index ${idx} nằm ngoài phạm vi (0..${entries.length - 1})` };
    return isStableIdentity(entries[idx]?.id)
      ? { error: `index ${idx} chỉ dành cho dữ liệu cũ; hãy dùng sourceId "${entries[idx]!.id}"` }
      : [idx];
  }
  if (str(sel.speakerId)) return { error: 'Không hỗ trợ selector speakerId: không có lane riêng cho từng người nói; hãy chọn theo track hoặc item' };
  const slotId = str(sel.slotId);
  if (slotId) {
    const hits = entries.flatMap((e, i) => (e.slotId === slotId ? [i] : []));
    return hits.length ? hits : { error: `Không có source nào được ghim vào slot "${slotId}"` };
  }
  const label = str(sel.label);
  if (label) {
    const hits = entries.flatMap((e, i) => (e.label === label ? [i] : []));
    return hits.length ? hits : { error: `Không có source nào mang nhãn "${label}"` };
  }
  const variant = sel.variant && typeof sel.variant === 'object' ? (sel.variant as Json) : undefined;
  if (variant) {
    const lang = str(variant.languageCode);
    const hits = entries.flatMap((e, i) => (e.variant && (!lang || e.variant.languageCode === lang) ? [i] : []));
    return hits.length ? hits : { error: `Không có source biến thể bản dịch${lang ? ` cho "${lang}"` : ''}` };
  }
  const itemId = str(sel.itemId);
  if (itemId) {
    const hits = entries.flatMap((e, i) => (e.itemId === itemId || e.itemId.startsWith(itemId) ? [i] : []));
    return hits.length ? hits : { error: `Không có source trên item "${itemId}"` };
  }
  const assetId = str(sel.assetId);
  if (assetId) {
    const item = s.items.find((it) => it.src === assetId || it.templateId === assetId);
    const hits = item ? entries.flatMap((e, i) => (e.itemId === item.id ? [i] : [])) : [];
    return hits.length ? hits : { error: `Không có source cho asset "${assetId}"` };
  }
  const track = str(sel.trackId) || str(sel.track);
  if (track) {
    const tid = resolveTrackId(s, track) ?? track;
    const onTrack = new Set(s.items.filter((it) => it.track === tid).map((it) => it.id));
    const hits = entries.flatMap((e, i) => (onTrack.has(e.itemId) ? [i] : []));
    return hits.length ? hits : { error: `Không có source trên track "${track}"` };
  }
  return { error: 'Thiếu selector: mỗi mục cần một trong index / sourceId / trackId / itemId / label / variant để định vị lane; ví dụ {"index":0}, {"trackId":"A2"} hoặc {"variant":{"languageCode":"en"}}; dùng source_list để tra sourceId' };
}

const entrySummary = (e: CaptionSourceEntry, i: number) => ({
  index: i, trackOrder: e.trackOrder ?? i, sourceId: e.id, itemId: e.itemId,
  ...(e.variant ? { variant: e.variant } : {}), ...(e.label ? { label: e.label } : {}),
  ...(e.anchor ? { anchor: e.anchor, offsetXRatio: e.offsetXRatio, offsetYRatio: e.offsetYRatio } : {}),
  ...(e.slotId ? { slotId: e.slotId } : {}), ...(e.visible === false ? { visible: false } : {}),
});

/** action=layout_policy — multi-source split-screen strategy (can only be overridden with perSource). */
export function execLayoutPolicy(json: Json, c: CaptionsData, ctx: AgentContext): Result {
  if (json.layoutPolicy === null) {
    ctx.commands.updateCaptions({ layoutPolicy: null });
    return { ok: true, layoutPolicy: null, note: 'Đã xóa — quay về auto-stack mặc định' };
  }
  const patch: Partial<CaptionsData> = {};
  const mode = str(json.mode);
  if (mode) {
    if (mode === 'single-lane' || mode === 'auto-stack') {
      const cap = num(json.maxVisibleSources);
      patch.layoutPolicy = { mode, ...(cap !== undefined ? { maxVisibleSources: Math.max(1, Math.floor(cap)) } : {}) } as CaptionLayoutPolicy;
    } else if (mode === 'manual-slots') {
      const raw = Array.isArray(json.slots) ? json.slots : null;
      if (!raw?.length) return { error: 'manual-slots cần bảng slot, ví dụ {"mode":"manual-slots","slots":[{"id":"top","anchor":"top-center","offsetYRatio":0.08},{"id":"bottom","anchor":"bottom-center","offsetYRatio":-0.08}]}; sau đó dùng source_update để gán slotId cho lane' };
      const slots: CaptionSlot[] = [];
      for (const sl of raw) {
        const o = (sl ?? {}) as Json;
        const sid = str(o.id);
        const anchor = str(o.anchor);
        if (!sid || !ANCHORS.has(anchor)) return { error: `Slot không hợp lệ: ${JSON.stringify(sl)} (cần id + anchor 3×3)` };
        slots.push({ id: sid, anchor: anchor as CaptionAnchor, offsetXRatio: num(o.offsetXRatio), offsetYRatio: num(o.offsetYRatio), widthRatio: num(o.widthRatio), heightRatio: num(o.heightRatio) });
      }
      patch.layoutPolicy = { mode, slots };
    } else {
      return { error: `Mode layout_policy không xác định: "${mode}" (single-lane|auto-stack|manual-slots)` };
    }
  }
  if (json.perSource && typeof json.perSource === 'object') {
    const per: Record<string, CaptionPerSource> = { ...(c.perSource ?? {}) };
    for (const [sid, v] of Object.entries(json.perSource as Record<string, Json>)) {
      const ml = num((v ?? {}).maxLines);
      if (ml !== undefined) per[sid] = { ...per[sid], maxLines: Math.max(1, Math.floor(ml)) };
    }
    patch.perSource = per;
  }
  if (!('layoutPolicy' in patch) && !('perSource' in patch)) return { error: 'Ví dụ layout_policy: {"mode":"auto-stack","maxVisibleSources":2} (xếp dọc) / {"mode":"single-lane"} (chỉ hiện một lane tại vị trí) / {"mode":"manual-slots","slots":[…]} / {"perSource":{"<sourceId>":{"maxLines":2}}} / {"layoutPolicy":null} để xóa' };
  ctx.commands.updateCaptions(patch);
  return { ok: true, layoutPolicy: patch.layoutPolicy ?? c.layoutPolicy ?? { mode: 'auto-stack' }, ...(patch.perSource ? { perSource: patch.perSource } : {}), note: 'perSource.maxLines được ước tính theo maxLines × số từ mỗi trang của template (phân trang theo số từ)' };
}

/** action=positions — call multiple sources in one call (same anchor point = same block stack).*/
export function execPositions(json: Json, c: CaptionsData, ctx: AgentContext, s: TimelineState): Result {
  const raw = Array.isArray(json.positions) ? json.positions : null;
  if (!raw?.length) return { error: 'Ví dụ positions (có thể sao chép rồi sửa số): {"positions":[{"index":0,"anchor":"top-center","offsetYRatio":0.08},{"index":1,"anchor":"bottom-center","offsetYRatio":-0.08}]} — mỗi mục = selector (index/sourceId/trackId/variant…)+ anchor (3×3); các source cùng anchor sẽ xếp chồng thành một khối' };
  const entries = ensureEntries(c, s);
  if (!entries.length) return { error: 'Hiện chưa có source phụ đề: hãy gọi edit_captions action=enable (hoặc source_set để chỉ định sources) trước khi định vị' };
  const placed: Result[] = [];
  for (const p of raw) {
    const o = (p ?? {}) as Json;
    const anchor = str(o.anchor);
    if (!ANCHORS.has(anchor)) return { error: `Anchor không hợp lệ: "${anchor}". Dùng anchor 3×3: top/middle/bottom × left/center/right, ví dụ top-center / bottom-center / middle-left` };
    const m = matchEntries(entries, o, s);
    if ('error' in (m as object)) return m as Result;
    for (const i of m as number[]) {
      entries[i] = { ...entries[i], anchor: anchor as CaptionAnchor, offsetXRatio: num(o.offsetXRatio), offsetYRatio: num(o.offsetYRatio) };
      placed.push(entrySummary(entries[i], i));
    }
  }
  ctx.commands.updateCaptions({ sourceEntries: entries, sources: undefined, sourceMode: 'item' });
  return { ok: true, placed, note: 'Nhiều source cùng anchor sẽ xếp chồng thành một khối phụ đề tại anchor đó; muốn đặt left/top theo pixel cho cả khối, dùng action=layout' };
}

/** action=source_update — Change the presentation of single/multiple sources according to the selector (without moving the caption track/item).*/
export function execSourceUpdate(json: Json, c: CaptionsData, ctx: AgentContext, s: TimelineState): Result {
  const raw = Array.isArray(json.updates) ? json.updates : (json.update ? [json.update] : null);
  if (!raw?.length) return { error: 'Ví dụ source_update (có thể sao chép rồi sửa số): {"updates":[{"index":0,"anchor":"bottom-center","offsetYRatio":-0.08},{"trackId":"A2","visible":false},{"index":1,"style":{"sizePx":54,"color":"#fff"}}]} — mỗi mục = selector + trường cần sửa (visible/anchor/offsetXRatio/offsetYRatio/slotId/style/preset/variant); dùng source_list để tra sourceId' };
  let entries = ensureEntries(c, s);
  if (!entries.length) return { error: 'Hiện chưa có source phụ đề: hãy gọi edit_captions action=enable (hoặc source_set để chỉ định sources)' };
  const updated: Result[] = [];
  const notes: string[] = [];
  for (const u of raw) {
    const o = (u ?? {}) as Json;
    const m = matchEntries(entries, o, s);
    if ('error' in (m as object)) return m as Result;
    const matchedIds = (m as number[]).map((i) => entries[i]?.id).filter((id): id is string => !!id);
    const requestedOrder = num(o.trackOrder);
    for (const sourceId of matchedIds) {
      const i = entries.findIndex((entry) => entry.id === sourceId);
      if (i < 0) continue;
      let e = { ...entries[i] };
      if (typeof o.visible === 'boolean') e.visible = o.visible;
      if (str(o.label)) e.label = str(o.label);
      const pr = num(o.priority);
      if (pr !== undefined) e.priority = pr;
      if (str(o.slotId)) e.slotId = str(o.slotId);
      const anchor = str(o.anchor);
      if (anchor) {
        if (!ANCHORS.has(anchor)) return { error: `Anchor không hợp lệ: "${anchor}". Dùng anchor 3×3, ví dụ top-center / bottom-center / middle-left` };
        e.anchor = anchor as CaptionAnchor;
      }
      for (const k of ['offsetXRatio', 'offsetYRatio', 'widthRatio', 'heightRatio'] as const) {
        const v = num(o[k]);
        if (v !== undefined) e[k] = v;
      }
      // Variant switching: variant object or variantKind+languageCode abbreviation; requires translation to already exist (source: first translation_ensure)
      const variantObj = o.variant && typeof o.variant === 'object' ? (o.variant as Json) : undefined;
      const vKind = str(variantObj?.variantKind ?? o.variantKind);
      const vLang = str(variantObj?.languageCode ?? o.languageCode);
      if (vKind || vLang) {
        if (vKind && vKind !== 'translation') return { error: `Không hỗ trợ variantKind "${vKind}" (chỉ hỗ trợ translation)` };
        if (!vLang) return { error: 'Chuyển variant cần ngôn ngữ đích, ví dụ {"variant":{"variantKind":"translation","languageCode":"en"}} hoặc dạng rút gọn {"languageCode":"en"}' };
        const item = s.items.find((it) => it.id === e.itemId);
        const v = item ? findVariantByLang(item.variants ?? [], vLang, 'translation') : undefined;
        if (!v) return { error: `Item ${e.itemId.slice(0, 8)} chưa có biến thể bản dịch "${vLang}" — hãy chạy manage_transcript translation_ensure trước` };
        e.variant = { variantKind: 'translation', languageCode: vLang };
      }
      if (o.variant === null) e = { ...e, variant: undefined };
      // per-source style: preset (template id → complete set of styles) and/or style explicit field
      const presetId = str(o.preset) || str(o.templatePreset);
      if (presetId) {
        const tpl = captionStyleFor(presetId);
        if (!tpl) return { error: `Preset không xác định: "${presetId}"` };
        const { id: _i, label: _l, labelZh: _z, hint: _h, ...styleOnly } = tpl;
        e.style = { ...styleOnly };
      }
      if (o.style && typeof o.style === 'object') {
        const mapped = mapCaptionStyle(o.style as Json, s.height);
        e.style = { ...e.style, ...mapped.styleOverride };
        if (mapped.ignored.length) notes.push(`${t('style 忽略字段')}: ${mapped.ignored.join(',')}`);
      }
      entries[i] = e;
      updated.push(entrySummary(e, i));
    }
    if (requestedOrder !== undefined) {
      matchedIds.forEach((sourceId, offset) => {
        entries = moveCaptionSourceEntry(entries, sourceId, requestedOrder + offset);
      });
    }
  }
  entries = normalizeCaptionSourceEntries(entries);
  ctx.commands.updateCaptions({ sourceEntries: entries, sources: undefined, sourceMode: 'item' });
  return { ok: true, updated: entries.map(entrySummary), ...(notes.length ? { notes } : {}) };
}
