import { saveExternalProposal } from '../persist/externalProposalStore';
import { saveProject } from '../persist/projectStore';
import { saveAutomaticVersion } from '../persist/versionStore';
import type { ExternalBridgePersistence } from './external-proposal-apply';

export const DEFAULT_EXTERNAL_BRIDGE_PERSISTENCE: ExternalBridgePersistence = {
  saveProject,
  saveAutomaticVersion,
  saveExternalProposal,
};

export const EXTERNAL_PROJECT_INDEX_WARNING =
  'Đã áp dụng chỉnh sửa nhưng không thể cập nhật thời điểm của danh sách dự án.';
