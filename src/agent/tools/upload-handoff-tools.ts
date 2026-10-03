import type { MediaAsset } from '../../editor/types';
import { safeSourceFilename } from '../../media/sourceFilename';
import { externalUploadMediaType } from '../../media/uploadMediaType';
import type { AgentContext } from '../context';
import { mintUploadHandoff } from './upload-handoff';

type Args = Record<string, unknown>;
const ASSET_TYPES = ['audio', 'gif', 'image', 'svg', 'video'] as const;
type SourceAssetType = (typeof ASSET_TYPES)[number];

interface UploadHandoffError {
  error: string;
}

interface UploadHandoffResult extends Record<string, unknown> {
  assetId: string;
  filename: string;
  uploadUrl: string;
  expiresAt: number;
  expiresInSeconds: number;
}

const newId = (): string =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `a_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;

export function mapUploadKind(type: string): MediaAsset['kind'] | null {
  switch (type) {
    case 'video':
    case 'audio':
    case 'image':
      return type;
    case 'gif':
    case 'svg':
      return 'image';
    default:
      return null;
  }
}

export function isUploadSourceType(value: unknown): value is SourceAssetType {
  return typeof value === 'string' && (ASSET_TYPES as readonly string[]).includes(value);
}

export function findUploadAsset(ctx: AgentContext, query: string): MediaAsset | null {
  const assets = ctx.getDoc().assets ?? ctx.getState().assets ?? [];
  const exact = assets.find((asset) => asset.id === query);
  if (exact) return exact;
  const hits = assets.filter((asset) => asset.id.startsWith(query));
  return hits.length === 1 ? hits[0]! : null;
}

async function requestUploadSlot(
  args: Args,
  ctx: AgentContext,
  sessionId: string,
): Promise<UploadHandoffResult | UploadHandoffError> {
  if (!isUploadSourceType(args.assetType)) {
    return { error: 'assetType phải là audio|gif|image|svg|video' };
  }
  const contentType = String(args.contentType ?? '').trim();
  const filename = safeSourceFilename(args.filename);
  const mediaType = externalUploadMediaType(args.assetType, contentType);
  const size = Number(args.size);
  if (!mediaType) return { error: 'assetType và contentType phải là cặp media được hỗ trợ' };
  if (!filename) return { error: 'filename phải là tên cơ sở an toàn' };
  if (!Number.isSafeInteger(size) || size <= 0) {
    return { error: 'size phải là số nguyên dương tính theo byte' };
  }
  const projectId = ctx.getProjectId?.();
  if (!projectId) return { error: 'cần project đã lưu để chuyển giao upload bên ngoài' };
  const requestedAssetId = typeof args.assetId === 'string' ? args.assetId.trim() : '';
  const existing = requestedAssetId ? findUploadAsset(ctx, requestedAssetId) : null;
  if (requestedAssetId && !existing) return { error: `không tìm thấy asset: ${requestedAssetId}` };
  const kind = mapUploadKind(args.assetType);
  if (existing && kind !== existing.kind) {
    return { error: `asset ${existing.id} là ${existing.kind}, không phải ${kind}` };
  }
  const assetId = existing?.id ?? newId();
  const uploadName = `${assetId}.${sessionId}${mediaType.extension}`;
  const fileKey = `uploads/${uploadName}`;
  const readUrl = `/media/${fileKey}`;
  const handoff = await mintUploadHandoff(
    sessionId,
    assetId,
    args.assetType,
    filename,
    projectId,
    contentType,
    size,
  );
  return {
    ok: true,
    slotId: assetId,
    assetId,
    existingAsset: Boolean(existing),
    fileKey,
    readUrl,
    uploadUrl: handoff.uploadUrl,
    method: 'POST',
    allowedMethods: handoff.allowedMethods,
    expiresAt: handoff.expiresAt,
    expiresInSeconds: handoff.expiresInSeconds,
    headers: { 'Content-Type': contentType, 'Content-Length': String(size) },
    contentType,
    filename,
    size,
    assetType: args.assetType,
    state: 'awaiting_upload',
  };
}

async function createSession(args: Args, ctx: AgentContext): Promise<unknown> {
  const sessionId = `sess_${newId().replace(/^a_/, '')}`;
  const slot = await requestUploadSlot(args, ctx, sessionId);
  if ('error' in slot) return slot;
  return {
    ok: true,
    action: 'create_session',
    sessionId,
    projectId: ctx.getProjectId?.() ?? null,
    state: 'awaiting_upload',
    slots: [slot],
    next: [
      'Upload một lần vào đúng slot uploadUrl trước khi hết hạn, với các header đã khai báo.',
      'Truyền receipt opaque và assetType được phản hồi vào finalize_uploaded_asset; audio/video/gif cũng cần durationInSeconds.',
      'Asset chỉ có thể sử dụng sau khi finalize thành công; hãy gọi riêng transcribe_track nếu cần transcription.',
    ],
    note: 'Đã tạo session import với một slot đã xác minh, giới hạn theo filename, thời gian ngắn và chỉ dùng một lần.',
  };
}

export async function execImportMediaHandoff(args: Args, ctx: AgentContext): Promise<unknown> {
  if (args.action !== 'create_session') {
    return { error: 'action import_media phải là create_session' };
  }
  return createSession(args, ctx);
}
