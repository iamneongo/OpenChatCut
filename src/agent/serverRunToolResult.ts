import {
  agentArtifactRefOf,
  artifactPlaceholder,
  projectToolResultForPersistence,
} from './runtime-artifact';

const MAX_SERVER_RUN_TOOL_RESULT_BYTES = 768 * 1024;
const encoder = new TextEncoder();
function omitProjectedImages(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || !Object.hasOwn(value, '__images')) return value;
  const { __images: _images, ...rest } = value as Record<string, unknown>;
  return {
    ...rest,
    imagesOmitted: true,
    note: typeof rest.note === 'string'
      ? `${rest.note} Đã lược bỏ dữ liệu ảnh vì vượt quá giới hạn truyền tải.`
      : 'Đã lược bỏ dữ liệu ảnh vì vượt quá giới hạn truyền tải.',
  };
}


/**
 * Project a browser tool result into a bounded, JSON-safe provider payload.
 * The complete value remains available in UI state and the runtime artifact store.
 */
export function projectServerRunToolResult(value: unknown): unknown {
  try {
    const original = JSON.stringify(value);
    if (encoder.encode(original).byteLength <= MAX_SERVER_RUN_TOOL_RESULT_BYTES) return value;
  } catch {
    // Fall through to the fail-closed persistence projection.
  }
  const projected = omitProjectedImages(projectToolResultForPersistence(value));
  const encoded = JSON.stringify(projected);
  if (encoder.encode(encoded).byteLength <= MAX_SERVER_RUN_TOOL_RESULT_BYTES) return projected;
  const artifact = agentArtifactRefOf(value);
  if (artifact) return artifactPlaceholder(artifact);
  return {
    omitted: true,
    note: 'Kết quả tool vượt quá giới hạn truyền tải từ trình duyệt đến máy chủ. Hãy yêu cầu kết quả thu hẹp hơn.',
  };
}
