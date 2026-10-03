// Pure plugin-package validation at the installation boundary: schema and size limits, GLSL tokens,
// CUBE dry runs, and envelope ranges. Browser-side compilation stays in install.ts; npm test runs this file through tsx.
import { parseCube } from "../gl/fx/cube.js";
import {
  ITEM_ID_RE,
  PACK_ID_RE,
  PLUGIN_FORMAT,
  PLUGIN_LIMITS,
  PROP_KEY_RE,
  type PluginNumberProp,
  type PluginPack,
} from "./types.js";

export type ValidateResult =
  { ok: true; pack: PluginPack } | { ok: false; errors: string[] };

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const bytes = (s: string): number => new TextEncoder().encode(s).length;

function checkName(errors: string[], at: string, v: unknown): void {
  if (!isStr(v) || !v.trim() || v.length > PLUGIN_LIMITS.maxNameLen) {
    errors.push(
      `${at}: name phải là chuỗi dài 1..${PLUGIN_LIMITS.maxNameLen} ký tự`,
    );
  }
}

function checkProps(
  errors: string[],
  at: string,
  v: unknown,
): PluginNumberProp[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v) || v.length > PLUGIN_LIMITS.maxProps) {
    errors.push(`${at}: props phải là mảng có không quá ${PLUGIN_LIMITS.maxProps} phần tử`);
    return undefined;
  }
  const seen = new Set<string>();
  for (const [i, p] of v.entries()) {
    const where = `${at}.props[${i}]`;
    if (!isObj(p)) {
      errors.push(`${where}: phải là một đối tượng`);
      continue;
    }
    if (!isStr(p.key) || !PROP_KEY_RE.test(p.key))
      errors.push(`${where}: key không hợp lệ (${PROP_KEY_RE})`);
    else if (seen.has(p.key)) errors.push(`${where}: key bị trùng ${p.key}`);
    else seen.add(p.key);
    if (!isStr(p.label) || !p.label.trim()) errors.push(`${where}: thiếu label`);
    if (!isNum(p.default) || !isNum(p.min) || !isNum(p.max) || p.min > p.max) {
      errors.push(`${where}: default/min/max phải là số hữu hạn và min≤max`);
    }
    if (p.step !== undefined && (!isNum(p.step) || p.step <= 0))
      errors.push(`${where}: step phải >0`);
  }
  return v as PluginNumberProp[];
}

function checkFrag(
  errors: string[],
  at: string,
  frag: unknown,
  requiredTokens: string[],
): void {
  if (!isStr(frag) || !frag.trim()) {
    errors.push(`${at}: thiếu frag`);
    return;
  }
  if (bytes(frag) > PLUGIN_LIMITS.maxFragBytes)
    errors.push(`${at}: frag vượt quá ${PLUGIN_LIMITS.maxFragBytes / 1024}KB`);
  for (const token of requiredTokens) {
    if (!frag.includes(token)) errors.push(`${at}: frag phải tham chiếu ${token}`);
  }
}

// data:image/* inline (limited length) or origin path/https; other schemes (javascript:, etc.) are rejected
function checkThumb(errors: string[], at: string, v: unknown): void {
  if (v === undefined) return;
  if (!isStr(v) || !v.trim()) {
    errors.push(`${at}: thumb phải là chuỗi không rỗng`);
    return;
  }
  if (v.startsWith("data:image/")) {
    if (bytes(v) > PLUGIN_LIMITS.maxThumbBytes)
      errors.push(`${at}: thumb vượt quá ${PLUGIN_LIMITS.maxThumbBytes / 1024}KB`);
    return;
  }
  if (
    !v.startsWith("/") &&
    !v.startsWith("https://") &&
    !v.startsWith("http://")
  ) {
    errors.push(`${at}: thumb chỉ cho phép data:image/* hoặc URL (/… | https://…)`);
  }
}

function checkItem(errors: string[], item: unknown, index: number): void {
  const at = `items[${index}]`;
  if (!isObj(item)) {
    errors.push(`${at}: phải là một đối tượng`);
    return;
  }
  if (!isStr(item.id) || !ITEM_ID_RE.test(item.id))
    errors.push(`${at}: id không hợp lệ (${ITEM_ID_RE})`);
  checkName(errors, at, item.name);
  if (
    item.desc !== undefined &&
    (!isStr(item.desc) || item.desc.length > PLUGIN_LIMITS.maxDescLen)
  ) {
    errors.push(`${at}: desc quá dài (≤${PLUGIN_LIMITS.maxDescLen})`);
  }
  checkThumb(errors, at, item.thumb);
  switch (item.type) {
    case "mg-template": {
      if (!isStr(item.code) || !item.code.trim())
        errors.push(`${at}: thiếu code`);
      else if (bytes(item.code) > PLUGIN_LIMITS.maxCodeBytes)
        errors.push(`${at}: code vượt quá ${PLUGIN_LIMITS.maxCodeBytes / 1024}KB`);
      for (const dim of ["width", "height"] as const) {
        const v = item[dim];
        if (v !== undefined && (!isNum(v) || v < 16 || v > 8192))
          errors.push(`${at}: ${dim} phải nằm trong [16, 8192]`);
      }
      const duration = item.durationInFrames;
      if (duration !== undefined && (!isNum(duration) || duration < 1 || duration > 216_000))
        errors.push(`${at}: durationInFrames phải nằm trong [1, 216000]`);
      if (item.props !== undefined && !isObj(item.props))
        errors.push(`${at}: props phải là một đối tượng`);
      if (item.propSchema !== undefined) {
        if (!Array.isArray(item.propSchema) || item.propSchema.length > 32) {
          errors.push(`${at}: propSchema phải là mảng có không quá 32 phần tử`);
        } else {
          for (const [i, s] of item.propSchema.entries()) {
            if (!isObj(s) || !isStr(s.key) || !isStr(s.type)) {
              errors.push(`${at}.propSchema[${i}]: cần chuỗi key/type`);
            }
          }
        }
      }
      return;
    }
    case "transition": {
      checkFrag(errors, at, item.frag, [
        "u_outgoing",
        "u_incoming",
        "u_progress",
      ]);
      checkProps(errors, at, item.props);
      const d = item.defaultDurationFrames;
      if (d !== undefined && (!isNum(d) || d < 2 || d > 300))
        errors.push(`${at}: defaultDurationFrames phải nằm trong [2, 300]`);
      return;
    }
    case "fx": {
      checkFrag(errors, at, item.frag, ["u_input"]);
      checkProps(errors, at, item.props);
      if (item.passes !== undefined) {
        if (
          !Array.isArray(item.passes) ||
          item.passes.length < 1 ||
          item.passes.length > 4
        ) {
          errors.push(`${at}: passes phải là mảng gồm 1..4 đoạn`);
        } else {
          for (const [i, pass] of item.passes.entries())
            checkFrag(errors, `${at}.passes[${i}]`, pass, []);
        }
      }
      return;
    }
    case "lut": {
      const hasCube = isStr(item.cube) && !!item.cube.trim();
      const hasFrag = isStr(item.frag) && !!item.frag.trim();
      if (hasCube === hasFrag) {
        errors.push(`${at}: phải cung cấp đúng một trong cube và frag`);
        return;
      }
      if (hasFrag) {
        checkFrag(errors, at, item.frag, ["u_input"]);
        checkProps(errors, at, item.props);
        return;
      }
      if (bytes(item.cube as string) > PLUGIN_LIMITS.maxCubeBytes) {
        errors.push(
          `${at}: cube vượt quá ${PLUGIN_LIMITS.maxCubeBytes / 1024 / 1024}MB`,
        );
        return;
      }
      try {
        parseCube(item.cube as string);
      } catch (e) {
        errors.push(
          `${at}: không thể phân tích cube — ${e instanceof Error ? e.message : String(e)}`,
        );
      }
      return;
    }
    case "zoom": {
      const env = item.envelope;
      const shapes = new Set([
        "hold", "punch", "slow-push", "instant", "zoom-out", "ease-in",
        "bounce", "snap", "pulse", "whip-in",
      ]);
      if (env === undefined && item.shape === undefined) {
        errors.push(`${at}: phải cung cấp envelope hoặc shape`);
      } else if (env !== undefined && (
        !Array.isArray(env)
        || env.length < PLUGIN_LIMITS.minEnvelopePoints
        || env.length > PLUGIN_LIMITS.maxEnvelopePoints
      )) {
        errors.push(
          `${at}: envelope phải có ${PLUGIN_LIMITS.minEnvelopePoints}..${PLUGIN_LIMITS.maxEnvelopePoints} điểm`,
        );
      } else if (Array.isArray(env) &&
        !env.every(
          (v) => isNum(v) && v >= 0 && v <= PLUGIN_LIMITS.maxEnvelopeValue,
        )
      ) {
        errors.push(
          `${at}: giá trị envelope phải nằm trong [0, ${PLUGIN_LIMITS.maxEnvelopeValue}]`,
        );
      }
      if (item.shape !== undefined && (!isStr(item.shape) || !shapes.has(item.shape)))
        errors.push(`${at}: shape không hợp lệ`);
      const mag = item.magnification;
      if (mag !== undefined && (!isNum(mag) || mag < 1 || mag > 16))
        errors.push(`${at}: magnification phải nằm trong [1, 16]`);
      for (const key of ["focalPointX", "focalPointY"] as const) {
        const value = item[key];
        if (value !== undefined && (!isNum(value) || value < 0 || value > 1))
          errors.push(`${at}: ${key} phải nằm trong [0, 1]`);
      }
      for (const key of ["easeInFrames", "easeOutFrames"] as const) {
        const value = item[key];
        if (value !== undefined && (!isNum(value) || value < 0 || value > 300))
          errors.push(`${at}: ${key} phải nằm trong [0, 300]`);
      }
      return;
    }
    default:
      errors.push(`${at}: type không xác định ${String(item.type)}`);
  }
}

/** Verify a plugin package JSON (untrusted input). Returns ok only after all pass. */
export function validatePack(v: unknown): ValidateResult {
  const errors: string[] = [];
  if (!isObj(v)) return { ok: false, errors: ['Gói plugin phải là một đối tượng JSON'] };
  if (v.format !== PLUGIN_FORMAT) {
    errors.push(
      `format phải là "${PLUGIN_FORMAT}" (hiện chỉ hỗ trợ phiên bản này; format không xác định sẽ bị từ chối)`,
    );
  }
  if (!isStr(v.id) || !PACK_ID_RE.test(v.id))
    errors.push(`id gói không hợp lệ (${PACK_ID_RE})`);
  checkName(errors, "pack", v.name);
  if (!isStr(v.version) || !/^\d+\.\d+\.\d+$/.test(v.version))
    errors.push('version phải có dạng x.y.z');
  if (
    v.author !== undefined &&
    (!isStr(v.author) || v.author.length > PLUGIN_LIMITS.maxNameLen)
  )
    errors.push('author quá dài');
  if (
    v.description !== undefined &&
    (!isStr(v.description) || v.description.length > PLUGIN_LIMITS.maxDescLen)
  )
    errors.push('description quá dài');
  if (
    !Array.isArray(v.items) ||
    v.items.length < 1 ||
    v.items.length > PLUGIN_LIMITS.maxItems
  ) {
    errors.push(`items phải gồm 1..${PLUGIN_LIMITS.maxItems} phần tử`);
  } else {
    const ids = new Set<string>();
    for (const [i, item] of v.items.entries()) {
      checkItem(errors, item, i);
      const id = isObj(item) && isStr(item.id) ? item.id : null;
      if (id) {
        if (ids.has(id)) errors.push(`items[${i}]: id bị trùng ${id}`);
        ids.add(id);
      }
    }
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    pack: { ...v, format: PLUGIN_FORMAT } as unknown as PluginPack,
  };
}

/** Verification of a single piece of content (for use by "Export as plugin"/editor built-in stream)*/
export function validateItem(item: unknown): string[] {
  const errors: string[] = [];
  checkItem(errors, item, 0);
  return errors;
}
