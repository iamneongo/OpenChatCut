import { ProxyAgent } from 'undici';
import { environmentProxyUrl } from './outbound-proxy.ts';
import { getKey } from './keystore.ts';
import { checkDataDir, readDataDirPointer } from './data-dir.ts';
import { DATA_DIR_ENV, defaultRootDir, runtimeProfile } from './runtime-profile.ts';
import { networkMessage, type ProbeResult } from './key-probe-result.ts';
import { localized, uiLocale } from './ui-locale.ts';

export const PROBE_TIMEOUT_MS = 12_000;
const PROXY_PROBE_URL = 'https://www.gstatic.com/generate_204';

function proxyProbeUrl(overrides: Record<string, unknown>): string {
  if (Object.hasOwn(overrides, 'PROXY_URL')) return String(overrides.PROXY_URL ?? '').trim();
  return getKey('PROXY_URL').trim() || environmentProxyUrl();
}

/** Storage-root writability check: a local disk probe, never a network request. */
export async function runDataDirProbe(overrides: Record<string, unknown>): Promise<ProbeResult> {
  const profile = runtimeProfile();
  if (process.env[DATA_DIR_ENV]?.trim()) {
    return { ok: false, message: localized({ zh: `目录由 ${DATA_DIR_ENV} 固定，无法在设置中修改`, en: `The directory is fixed by ${DATA_DIR_ENV} and cannot be changed in settings`, vi: `Thư mục được cố định bởi ${DATA_DIR_ENV}, không thể thay đổi trong phần cài đặt` }) };
  }
  const raw = Object.hasOwn(overrides, DATA_DIR_ENV)
    ? String(overrides[DATA_DIR_ENV] ?? '')
    : readDataDirPointer() ?? '';
  const started = Date.now();
  const body = await checkDataDir(raw, defaultRootDir(profile), uiLocale());
  const latencyMs = Date.now() - started;
  return body.ok
    ? { ok: true, latencyMs, message: body.note ?? localized({ zh: '目录可写', en: 'Directory is writable', vi: 'Thư mục có thể ghi' }) }
    : { ok: false, latencyMs, message: body.error ?? localized({ zh: '目录检查失败', en: 'Directory check failed', vi: 'Kiểm tra thư mục thất bại' }) };
}

/** Test the saved proxy or the unsaved value currently shown in the settings field. */
export async function runProxyProbe(overrides: Record<string, unknown>): Promise<ProbeResult> {
  const proxyUrl = proxyProbeUrl(overrides);
  if (!proxyUrl) return { ok: false, message: localized({ zh: '尚未填写代理地址，且未检测到系统代理环境变量', en: 'No proxy address has been entered and no system proxy environment variable was detected', vi: 'Chưa nhập địa chỉ proxy và không phát hiện biến môi trường proxy của hệ thống' }) };
  let dispatcher: ProxyAgent;
  try {
    dispatcher = new ProxyAgent(proxyUrl);
  } catch {
    return { ok: false, message: localized({ zh: '代理地址格式无效，请填写 http://host:port 或 https://host:port', en: 'Invalid proxy address; enter http://host:port or https://host:port', vi: 'Địa chỉ proxy không hợp lệ; hãy nhập http://host:port hoặc https://host:port' }) };
  }
  const started = Date.now();
  try {
    const response = await fetch(PROXY_PROBE_URL, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS), dispatcher,
    } as RequestInit);
    const latencyMs = Date.now() - started;
    if (!response.ok) return { ok: false, status: response.status, latencyMs, message: localized({ zh: `代理已连接，但外网探测返回 HTTP ${response.status}`, en: `Proxy connected, but the external probe returned HTTP ${response.status}`, vi: `Proxy đã kết nối nhưng kiểm tra mạng ngoài trả về HTTP ${response.status}` }) };
    return { ok: true, status: response.status, latencyMs, message: localized({ zh: `代理连接成功 · 外网可达 · ${latencyMs}ms`, en: `Proxy connected · external network reachable · ${latencyMs}ms`, vi: `Proxy kết nối thành công · truy cập được mạng ngoài · ${latencyMs}ms` }) };
  } catch (error) {
    return { ok: false, latencyMs: Date.now() - started, message: proxyNetworkMessage(error) };
  } finally {
    await dispatcher.close();
  }
}

function proxyNetworkMessage(error: unknown): string {
  const message = networkMessage(error).replace(/，不代表 Key 错误$/, '');
  return localized({ zh: `代理连接失败 · ${message}`, en: `Proxy connection failed · ${message}`, vi: `Proxy kết nối thất bại · ${message}` });
}
