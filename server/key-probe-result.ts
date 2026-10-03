export interface ProbeResult {
  ok: boolean;
  message: string;
  status?: number;
  latencyMs?: number;
  models?: string[];
}

import { localized } from './ui-locale.ts';

export function parseModelCatalog(bodyText: string): string[] {
  try {
    const body = JSON.parse(bodyText) as {
      data?: Array<{ id?: unknown; name?: unknown }>;
      models?: Array<{ id?: unknown; name?: unknown }>;
    };
    const rows = Array.isArray(body.data) ? body.data : Array.isArray(body.models) ? body.models : [];
    return [...new Set(rows
      .map((row) => typeof row.id === 'string' ? row.id : typeof row.name === 'string' ? row.name : '')
      .map((id) => id.trim())
      .filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

/** Cheaper Inference also lists image/video models; chat keeps text and untyped rows. */
export function parseTextModelCatalog(bodyText: string): string[] {
  try {
    const body = JSON.parse(bodyText) as { data?: Array<{ type?: unknown } | null> };
    if (!Array.isArray(body.data)) return parseModelCatalog(bodyText);
    const data = body.data.filter((row) => row != null && (row.type === undefined || row.type === 'text'));
    return parseModelCatalog(JSON.stringify({ data }));
  } catch {
    return [];
  }
}

export function sanitizeProbeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 140);
}

/** Convert a provider response into a user-facing connectivity conclusion. */
export function classifyStatus(status: number, bodyText: string): ProbeResult {
  if (status === 401 || status === 403) {
    return { ok: false, status, message: localized({ zh: `鉴权失败（HTTP ${status}）· Key 无效、过期或无此接口权限`, en: `Authentication failed (HTTP ${status}) · the key is invalid, expired, or lacks permission for this API`, vi: `Xác thực thất bại (HTTP ${status}) · key không hợp lệ, đã hết hạn hoặc không có quyền dùng API này` }) };
  }
  if (status === 404) {
    return { ok: false, status, message: localized({ zh: '探测端点 404 · Base URL 可能填错（或该服务不认此探测路径）', en: 'Probe endpoint returned 404 · the Base URL may be incorrect or this service does not support this probe path', vi: 'Endpoint kiểm tra trả về 404 · Base URL có thể sai hoặc dịch vụ không hỗ trợ đường dẫn kiểm tra này' }) };
  }
  if (status === 429) {
    return { ok: true, status, message: localized({ zh: '鉴权通过（HTTP 429 限流，说明 Key 有效）', en: 'Authentication passed (HTTP 429 rate limit indicates that the key is valid)', vi: 'Xác thực thành công (HTTP 429 bị giới hạn tốc độ, cho thấy key hợp lệ)' }) };
  }
  const detail = sanitizeProbeText(bodyText);
  return { ok: false, status, message: `HTTP ${status}${detail ? ` · ${detail}` : ''}` };
}

/** Distinguish transport failures from rejected credentials. */
export function networkMessage(error: unknown): string {
  const raw = error instanceof Error
    ? `${error.name}: ${error.message}${error.cause instanceof Error ? `（${error.cause.message}）` : ''}`
    : String(error);
  if (/timeout|abort/i.test(raw)) {
    return localized({ zh: '连接超时 · 服务不可达或网络受限（可能需代理），不代表 Key 错误', en: 'Connection timed out · the service is unreachable or the network is restricted (a proxy may be required); this does not mean the key is wrong', vi: 'Kết nối hết thời gian · không thể truy cập dịch vụ hoặc mạng bị hạn chế (có thể cần proxy); điều này không có nghĩa key sai' });
  }
  return localized({ zh: `网络不可达 · ${sanitizeProbeText(raw)} · 本机连不上该服务（可能需代理），不代表 Key 错误`, en: `Network unreachable · ${sanitizeProbeText(raw)} · this computer cannot reach the service (a proxy may be required); this does not mean the key is wrong`, vi: `Không thể truy cập mạng · ${sanitizeProbeText(raw)} · máy tính này không kết nối được tới dịch vụ (có thể cần proxy); điều này không có nghĩa key sai` });
}
