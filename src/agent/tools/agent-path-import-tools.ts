// Agent-initiated local-path media import (issue #84 Feature B). Desktop-only:
// the Electron main process scans the requested path, imports files through the
// same fingerprint/reference/probe chain as watched folders, and returns pool-ready
// assets. Browsers have no local filesystem bridge and get a clear error.
import type { AgentContext } from '../context';
import type { AgentToolSchema } from '../tool-schema';
import { directoryFileToAsset } from '../../media/directoryImportAsset';
import type { AgentPathImportResult } from '../../../shared/directory-import';
import { isAgentLocalMediaRequest, type AgentLocalMediaRequest, type AgentLocalMediaResult } from '../../../shared/agent-local-media';

export const AGENT_PATH_IMPORT_SCHEMAS: AgentToolSchema[] = [
  {
    name: 'browse_local_media',
    description: [
      'Duyệt thư mục cục bộ hoặc tìm tên tệp tư liệu cục bộ trước khi nhập vào kho tư liệu.',
      'Chỉ dùng trên máy tính. Mặc định bắt đầu từ thư mục chính; đường dẫn tuyệt đối có thể trỏ đến ổ đĩa ngoài.',
      'Quyền truy cập cục bộ được bật mặc định; thiết lập AGENT_IMPORT_ROOTS sẽ giới hạn phạm vi truy cập.',
      'Trả về thư mục, đường dẫn tư liệu được hỗ trợ, kích thước và thời điểm sửa đổi mà không nhập tệp.',
      'Dùng recursive cùng query/kind để tìm ứng viên, sau đó dùng import_assets cho các tệp đã chọn.',
      'Dùng nextOffset để lấy thêm kết quả. Nếu kết quả bị cắt, hãy duyệt các thư mục con hẹp hơn; không theo liên kết tượng trưng.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Đường dẫn tuyệt đối đến thư mục; bỏ qua nghĩa là dùng thư mục home của người dùng.' },
        query: { type: 'string', maxLength: 256, description: 'Chuỗi con không phân biệt hoa thường trong đường dẫn tệp hoặc thư mục tương đối.' },
        kind: { type: 'string', enum: ['video', 'audio', 'image', 'gif', 'svg'] },
        recursive: { type: 'boolean', description: 'Tìm trong thư mục con, tối đa 12 cấp và 10000 mục. Mặc định là false.' },
        offset: { type: 'integer', minimum: 0, maximum: 10000 },
        limit: { type: 'integer', minimum: 1, maximum: 200, description: 'Số mục mỗi trang; mặc định là 100.' },
      },
    },
  },
  {
    name: 'import_assets',
    description: 'Nhập một lô đường dẫn tư liệu cục bộ đã chọn vào kho tư liệu. Chỉ dùng trên máy tính. Quyền truy cập cục bộ được bật mặc định; AGENT_IMPORT_ROOTS sẽ giới hạn phạm vi. Dùng lại quy trình phân tích tư liệu thông thường và bỏ qua nội dung trùng lặp. Hãy dùng browse_local_media để tìm đường dẫn trước.',
    input_schema: {
      type: 'object',
      properties: {
        paths: { type: 'array', minItems: 1, maxItems: 100, items: { type: 'string', minLength: 1 }, description: 'Đường dẫn tuyệt đối của các tệp tư liệu đã chọn.' },
      },
      required: ['paths'],
    },
  },
  {
    name: 'import_asset',
    description: [
      'Nhập MỘT tệp tư liệu cục bộ (video/âm thanh/hình ảnh) vào kho tư liệu bằng đường dẫn tuyệt đối trên ổ đĩa.',
      'Chỉ dùng trong ứng dụng máy tính; quyền truy cập cục bộ được bật mặc định. AGENT_IMPORT_ROOTS sẽ giới hạn phạm vi.',
      'Trả về tư liệu đã nhập vào kho; các bản trùng đã có trong kho sẽ được bỏ qua.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Đường dẫn tuyệt đối đến tệp tư liệu.' },
      },
      required: ['path'],
    },
  },
  {
    name: 'import_folder',
    description: [
      'Nhập mọi tệp tư liệu được hỗ trợ trong một thư mục cục bộ (đệ quy, có giới hạn) vào kho tư liệu.',
      'Chỉ dùng trong ứng dụng máy tính; quyền truy cập cục bộ được bật mặc định. AGENT_IMPORT_ROOTS sẽ giới hạn phạm vi.',
      'Trả về tư liệu đã nhập, số lượng bản trùng, tên tệp không được hỗ trợ và lỗi theo từng tệp.',
      'Tài liệu (txt/md/docx/pdf) sẽ được báo là không hỗ trợ ở đây; hãy đính kèm chúng vào cuộc trò chuyện.',
    ].join(' '),
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Đường dẫn tuyệt đối đến thư mục tư liệu.' },
      },
      required: ['path'],
    },
  },
];

export const AGENT_PATH_IMPORT_TOOL_NAMES = new Set(
  AGENT_PATH_IMPORT_SCHEMAS.map((schema) => schema.name),
);

interface DesktopPathImportApi {
  browseLocalMedia?(request: AgentLocalMediaRequest): Promise<AgentLocalMediaResult>;
  importAgentPaths(request: {
    paths: readonly string[];
    projectId: string;
    knownHashes: readonly string[];
  }): Promise<AgentPathImportResult>;
}

/** The subset the import path needs, so a non-Electron host can supply it too. */
export type PathImportApi = Pick<DesktopPathImportApi, 'importAgentPaths'>;

function desktopApi(): DesktopPathImportApi | null {
  const bridge = (typeof window === 'undefined' ? undefined : window) as unknown as {
    openChatCutDesktop?: DesktopPathImportApi;
  };
  return bridge?.openChatCutDesktop ?? null;
}

/** The subset the browse path needs, so a non-Electron host can supply it too. */
export type LocalMediaBrowseApi = Pick<DesktopPathImportApi, 'browseLocalMedia'>;

/**
 * Browse local media directories. The host supplies the browser — the desktop
 * ships it over IPC, the server (offline MCP / occ CLI) calls the same core
 * in-process — so argument validation and the response envelope are shared.
 */
export async function browseLocalMediaResult(
  name: string,
  args: Record<string, unknown>,
  api: LocalMediaBrowseApi,
): Promise<Record<string, unknown>> {
  if (name !== 'browse_local_media') return { error: `Công cụ không xác định: ${name}` };
  if (!isAgentLocalMediaRequest(args)) return { error: 'Yêu cầu duyệt tư liệu cục bộ không hợp lệ' };
  if (!api.browseLocalMedia) return { error: 'browse_local_media chỉ khả dụng trong ứng dụng máy tính' };
  try {
    return { ok: true, ...await api.browseLocalMedia(args) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function execAgentPathImportTool(
  name: string,
  args: Record<string, unknown>,
  ctx: AgentContext,
): Promise<Record<string, unknown>> {
  if (!AGENT_PATH_IMPORT_TOOL_NAMES.has(name)) return { error: `Công cụ không xác định: ${name}` };
  if (name === 'browse_local_media') {
    return browseLocalMediaResult(name, args, desktopApi() ?? {});
  }
  const api = desktopApi();
  if (!api?.importAgentPaths) {
    return {
      error: 'Nhập tư liệu cục bộ chỉ khả dụng trong ứng dụng máy tính; '
        + 'hãy dùng giao diện tải lên của kho tư liệu hoặc thư mục theo dõi trong trình duyệt',
    };
  }
  return importLocalPaths(name, args, ctx, api);
}

/**
 * Import local paths into the project. The host supplies the importer — the
 * desktop ships it over IPC, the server (offline MCP / occ CLI) calls the same
 * core in-process — so validation, conversion and pool landing are one
 * implementation for every host.
 */
export async function importLocalPaths(
  name: string,
  args: Record<string, unknown>,
  ctx: AgentContext,
  api: PathImportApi,
): Promise<Record<string, unknown>> {
  if (!AGENT_PATH_IMPORT_TOOL_NAMES.has(name)) return { error: `Công cụ không xác định: ${name}` };
  const rawPath = typeof args.path === 'string' ? args.path.trim() : '';
  const paths = name === 'import_assets' ? args.paths : [rawPath];
  if (!Array.isArray(paths) || paths.length === 0 || paths.length > 100
    || !paths.every((path): path is string => typeof path === 'string' && path.trim().length > 0)) {
    return { error: 'Cần có path; hãy cung cấp một đường dẫn không rỗng hoặc 1–100 đường dẫn cho import_assets' };
  }
  return importPathsIntoProject(paths, api, ctx);
}

async function importPathsIntoProject(
  paths: string[],
  api: PathImportApi,
  ctx: AgentContext,
): Promise<Record<string, unknown>> {
  const projectId = ctx.getProjectId?.();
  if (!projectId) return { error: 'Chưa mở dự án; hãy mở dự án trước khi nhập đường dẫn cục bộ' };
  const state = ctx.getState();
  const knownHashes = ctx.getDoc().assets
    .map((asset) => asset.sourceContentHash)
    .filter((hash): hash is string => typeof hash === 'string' && hash.length > 0);
  let result;
  try {
    result = await api.importAgentPaths({ paths, projectId, knownHashes });
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  if (!result.imported.length && result.errors.length) {
    const first = result.errors[0]!;
    return {
      error: first.error,
      ...(first.code ? { code: first.code } : {}),
      errors: result.errors.slice(0, 20),
    };
  }
  const assets = await Promise.all(result.imported.map((file) => directoryFileToAsset(
    { ...file, importId: crypto.randomUUID() },
    state.fps,
  )));
  if (ctx.getProjectId?.() !== projectId) {
    return { error: 'Dự án đang hoạt động đã thay đổi trong lúc nhập; hãy thử lại trong đúng dự án' };
  }
  for (const asset of assets) ctx.commands.addAsset(asset);
  return {
    ok: true,
    imported: assets.map((asset) => ({ id: asset.id, name: asset.name, kind: asset.kind, src: asset.src })),
    duplicateCount: result.duplicateCount,
    skippedDuplicates: result.duplicateCount > 0
      && !assets.length && !result.errors.length && !result.unsupportedFiles.length,
    ...(result.unsupportedFiles.length ? { unsupportedFiles: result.unsupportedFiles.slice(0, 50) } : {}),
    ...(result.errors.length ? { errors: result.errors.slice(0, 20) } : {}),
  };
}
