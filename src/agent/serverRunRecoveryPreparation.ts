import { loadAgentRuntimeSidecar } from '../persist/agentRuntimeStore';
import {
  loadServerRunMetadata,
  restoreServerRunToolActivation,
  type ServerRunMetadata,
} from './serverRunProtocol';
import type { StoredServerRun } from './serverRunSessionStorage';
import type { ToolActivation } from './tool-activation';
import {
  permanentServerRunRecoveryError,
  recoveredRunAwaitsProposal,
} from './serverRunRecovery';
import {
  acquireServerRunOwnership,
  releaseServerRunOwnership,
} from './serverRunOwnership';

export type ServerRunRecoveryPreparation =
  | { readonly kind: 'inactive' }
  | { readonly kind: 'owned_elsewhere' }
  | { readonly kind: 'local_terminal' }
  | { readonly kind: 'proposal' }
  | {
    readonly kind: 'active';
    readonly capability: string;
    readonly activation: ToolActivation;
    readonly cursor: number;
    readonly metadata: ServerRunMetadata;
  };

function validateCursor(metadata: ServerRunMetadata, cursor: number): void {
  if (typeof metadata.firstEventId === 'number' && cursor < metadata.firstEventId - 1) {
    throw permanentServerRunRecoveryError('Sự kiện của tác vụ máy chủ đã vượt quá khoảng thời gian có thể khôi phục.');
  }
}

async function claimRecorder(projectId: string, runId: string): Promise<boolean> {
  // The server owns the sidecar; the browser only fences its own recovery
  // with a local lock so a second tab does not replay the same run.
  return acquireServerRunOwnership(projectId, runId);
}

export async function prepareServerRunRecovery(
  projectId: string,
  stored: StoredServerRun,
  active: () => boolean,
): Promise<ServerRunRecoveryPreparation> {
  const capability = stored.capability;
  if (!capability) {
    throw permanentServerRunRecoveryError('Quyền truy cập lượt chạy máy chủ đã lưu không khả dụng.');
  }
  const activation = restoreServerRunToolActivation(stored.askOnly === true, stored.activeToolNames);
  if (!activation) {
    throw permanentServerRunRecoveryError('Lượt chạy máy chủ đã lưu có bộ tool đang hoạt động không hợp lệ.');
  }
  const metadata = await loadServerRunMetadata(projectId, stored.runId, capability);
  if (!active()) return { kind: 'inactive' };
  const cursor = stored.cursor ?? 0;
  validateCursor(metadata, cursor);
  const sidecar = await loadAgentRuntimeSidecar(projectId);
  const run = sidecar.runs.find((candidate) => candidate.runId === stored.runId);
  if (!run) {
    throw permanentServerRunRecoveryError(
      'Trạng thái ghi lượt chạy máy chủ không khả dụng cho thế hệ phiên hiện tại.',
    );
  }
  if (['completed', 'failed', 'aborted', 'interrupted'].includes(run.status)) {
    return { kind: 'local_terminal' };
  }
  if (!await claimRecorder(projectId, stored.runId)) return { kind: 'owned_elsewhere' };
  if (recoveredRunAwaitsProposal(run)) {
    releaseServerRunOwnership(projectId, stored.runId);
    return { kind: 'proposal' };
  }
  return { kind: 'active', activation, capability, cursor, metadata };
}
