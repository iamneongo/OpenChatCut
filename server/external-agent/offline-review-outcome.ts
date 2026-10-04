import type { ExternalSessionRunLedger } from '../../src/agent/external-run-ledger.ts';
import type { OfflineProjectCommitResult } from './offline-project-store.ts';
import type { ProjectEditOwnershipClaim } from './project-edit-ownership.ts';

export interface OfflineReviewFailure {
  readonly outcome: 'cancelled' | 'failed' | 'stale';
  readonly message: string;
  readonly staleProposal: boolean;
}
export type AppliedOfflineCommit = OfflineProjectCommitResult & {
  readonly status: 'applied';
  readonly revision: string;
  readonly ownership: ProjectEditOwnershipClaim;
};

export function isAppliedOfflineCommit(
  result: OfflineProjectCommitResult,
): result is AppliedOfflineCommit {
  return result.status === 'applied' && Boolean(result.revision && result.ownership);
}


export function failedOfflineCommit(disposed: boolean): OfflineReviewFailure {
  return {
    outcome: disposed ? 'cancelled' : 'failed',
    message: disposed
      ? 'Kết nối MCP đã đóng trước khi ghi nhận; checkpoint bản nháp từng phần vẫn được giữ lại.'
      : 'Ghi nhận dự án ngoại tuyến thất bại; hãy bắt đầu phiên MCP mới để tiếp tục bản nháp đã lưu.',
    staleProposal: false,
  };
}

export function rejectedOfflineCommit(input: {
  readonly result: OfflineProjectCommitResult;
  readonly disposed: boolean;
  readonly projectId: string;
  readonly editorUrl: string;
}): OfflineReviewFailure {
  const { result } = input;
  const outcome = input.disposed
    ? 'cancelled'
    : result.status === 'metadata-conflict'
      ? 'failed'
      : 'stale';
  const message = input.disposed
    ? 'Kết nối MCP đã đóng trước khi ghi nhận; checkpoint bản nháp từng phần vẫn được giữ lại.'
    : result.status === 'browser-takeover'
        ? `Dự án ${input.projectId} đã được mở trong trình duyệt trước khi ghi nhận. Hãy bắt đầu phiên MCP mới tại ${input.editorUrl}.`
      : result.status === 'stale'
        ? `Dự án đã lưu ${input.projectId} đã thay đổi trước khi ghi nhận. Hãy bắt đầu phiên MCP mới.`
        : 'Siêu dữ liệu dự án tiếp tục thay đổi; không có chỉnh sửa ngoại tuyến nào được ghi lại.';
  return { outcome, message, staleProposal: outcome === 'stale' };
}

export async function publishOfflineReviewFailure(
  run: ExternalSessionRunLedger,
  proposalId: string | undefined,
  failure: OfflineReviewFailure,
): Promise<void> {
  if (proposalId && failure.staleProposal) {
    await run.proposal(proposalId, 'stale').catch(() => undefined);
  }
  await run.finalize(
    failure.outcome === 'failed' ? 'failed' : 'aborted',
    `Offline external edit session ${failure.outcome}.`,
  ).catch(() => undefined);
}

export async function publishAppliedOfflineReview(
  run: ExternalSessionRunLedger,
  proposalId: string | undefined,
  cleanupWarning: string | undefined,
): Promise<string | undefined> {
  try {
    if (proposalId) await run.proposal(proposalId, 'applied');
    await run.finalize('completed', 'Offline external edit session applied.');
    return cleanupWarning;
  } catch {
    return cleanupWarning
      ? `${cleanupWarning} Không thể hoàn tất sổ theo dõi của lượt chạy đã áp dụng.`
      : 'Đã áp dụng chỉnh sửa nhưng không thể hoàn tất sổ theo dõi của lượt chạy.';
  }
}
