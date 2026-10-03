// Shared storage-migration UI helpers (components must stay component-only).
import { fetchWithEditorSession } from '../../persist/projectStoreTransport';

export interface MigrationStatus {
  enabled: boolean;
  phase: 'legacy' | 'migrating' | 'complete' | 'failed';
  receipt: { count: number; importedAt: string } | null;
  jsonKeyCount: number;
  sqliteKeyCount: number;
  error?: string;
}

export interface MigrateResponse {
  summary?: { imported: number; skipped: number; quarantined: number };
  status?: MigrationStatus;
  error?: string;
}

export const STORAGE_BANNER_DISMISS_KEY = 'cc.storageMigrationBannerDismissed';

/** Dispatched after a successful migration so the banner can re-check. */
export const STORAGE_MIGRATED_EVENT = 'cc:storage-migrated';

async function readStorageMigrationJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();
  if (!contentType.toLowerCase().includes('json')) {
    const preview = text.trim().replace(/\s+/g, ' ').slice(0, 120);
    if (preview.toLowerCase().startsWith('<!doctype') || preview.toLowerCase().startsWith('<html')) {
      throw new Error(`endpoint di chuyển dữ liệu trả về HTML thay vì JSON (HTTP ${response.status})`);
    }
    throw new Error(`endpoint di chuyển dữ liệu không khả dụng (HTTP ${response.status})${preview ? `: ${preview}` : ''}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`endpoint di chuyển dữ liệu trả về JSON không hợp lệ (HTTP ${response.status}): ${message}`);
  }
}

/** Delete the migrated legacy JSON files. Requires explicit user consent. */
export async function cleanupLegacyJson(): Promise<{ removed: number; jsonKeyCount: number }> {
  const response = await fetchWithEditorSession('/api/project-store/migrate-cleanup', {
    method: 'POST',
  });
  const body = await readStorageMigrationJson<{ removed?: number; jsonKeyCount?: number; error?: string }>(response);
  if (!response.ok || typeof body.removed !== 'number') {
    throw new Error(body.error ?? 'dọn dẹp dữ liệu cũ thất bại');
  }
  return { removed: body.removed, jsonKeyCount: body.jsonKeyCount ?? 0 };
}

export async function loadMigrationStatus(): Promise<MigrationStatus> {
  const response = await fetchWithEditorSession('/api/project-store/migrate-status', { method: 'GET' });
  const body = await readStorageMigrationJson<MigrationStatus>(response);
  if (!response.ok) throw new Error(body.error ?? `không đọc được trạng thái di chuyển dữ liệu (HTTP ${response.status})`);
  return body;
}

export async function runStorageMigrationRequest(): Promise<MigrateResponse> {
  const response = await fetchWithEditorSession('/api/project-store/migrate', { method: 'POST' });
  const body = await readStorageMigrationJson<MigrateResponse>(response);
  if (!response.ok) {
    throw new Error(body.error ?? 'di chuyển dữ liệu thất bại');
  }
  return body;
}
