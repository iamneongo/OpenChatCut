export { FONT_TOOL_SCHEMAS, FONT_TOOL_NAMES } from './schemas/font-tools';
import type { AgentContext } from '../context';
import type { TimelineState } from '../../editor/types';
import type { CaptionsData } from '../../captions/types';
import {
  isLoadableFontFamily,
  searchFontCatalog,
} from '../../fonts/googleFontCatalog';
import { collectReferencedFonts } from '../../fonts/projectFonts';

export { collectReferencedFonts } from '../../fonts/projectFonts';

// search_fonts plus helpers for the submit_export confirmFontFallback gate.

type Args = Record<string, unknown>;

export async function execFontTool(name: string, args: Args, _ctx: AgentContext): Promise<unknown> {
  if (name === 'search_fonts') return execSearchFonts(args);
  return { error: `công cụ không xác định: ${name}` };
}

function execSearchFonts(args: Args): unknown {
  const query = String(args.query ?? '').trim();
  if (!query) return { error: 'query là bắt buộc', results: [] };
  const results = searchFontCatalog(query, 25);
  return {
    ok: true,
    query,
    count: results.length,
    results: results.map((r) => ({
      family: r.family,
      aliases: r.aliases,
      loadable: r.loadable,
      source: r.source,
    })),
    note: results.some((r) => !r.loadable)
      ? 'Một số kết quả chỉ là alias trong catalog (loadable=false) — export có thể cần confirmFontFallback=true.'
      : undefined,
  };
}

// ── Export font gate (used by generate-tools submit_export) ─────────────────

export interface UnsupportedFontReport {
  unsupported: string[];
  referenced: string[];
}

/** Fonts that the local/headless renderer cannot load (export gate). */
export function findUnsupportedFonts(
  state: TimelineState,
  opts?: { captions?: CaptionsData | null },
): UnsupportedFontReport {
  const referenced = collectReferencedFonts(state, opts);
  const unsupported = referenced.filter((f) => !isLoadableFontFamily(f));
  return { unsupported, referenced };
}

/**
 * If unsupported fonts exist and confirmFontFallback is not true, return a
 * gate error object. Otherwise return null and proceed.
 */
export function fontFallbackGate(
  state: TimelineState,
  confirmFontFallback: unknown,
  opts?: { captions?: CaptionsData | null },
): Record<string, unknown> | null {
  const { unsupported, referenced } = findUnsupportedFonts(state, opts);
  if (!unsupported.length) return null;
  if (confirmFontFallback === true) return null;
  return {
    ok: false,
    error: 'unsupported_fonts',
    message:
      'Timeline đang tham chiếu các font mà renderer không thể tải. Hãy cho người dùng biết font nào sẽ bị fallback, rồi chỉ thử lại submit_export với confirmFontFallback=true sau khi họ chấp thuận.',
    unsupportedFonts: unsupported,
    referencedFonts: referenced,
    hint: 'Dùng search_fonts để chọn family có thể tải, hoặc truyền confirmFontFallback: true sau khi người dùng chấp thuận.',
  };
}
