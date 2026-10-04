// `occ media ...` — the project's media pool. Read-only for now: import paths are
// deliberately not wired here yet. A headless import needs the upload receipt +
// normalize-media chain the browser owns (see src/agent/tools/upload-finalize.ts),
// and half-wiring it would create a second ingest path.
import { rejectUnknownFlags, type CommandLine } from '../args.ts';
import { printJson, renderTable, writeStdout } from '../output.ts';
import { readProjectDoc, resolveProject } from '../store.ts';
import { GLOBAL_FLAGS, projectReference, subLine } from './common.ts';

const FLAGS = [...GLOBAL_FLAGS, 'kind'] as const;

export async function runMediaCommand(
  positionals: readonly string[],
  commandLine: CommandLine,
  json: boolean,
): Promise<void> {
  rejectUnknownFlags(commandLine, FLAGS);
  const [subcommand, ...rest] = positionals;
  const line = subLine(commandLine, rest);
  switch (subcommand) {
    case 'ls':
    case 'list':
      return listCommand(line, json);
    case undefined:
      throw new Error('media cần một lệnh con: ls');
    default:
      return importHint(subcommand);
  }
}

/** Import lives in the app (upload UI) or the desktop agent tools; say so plainly. */
function importHint(subcommand: string): Promise<void> {
  return Promise.reject(new Error(
    `media ${subcommand} hiện chưa khả dụng: nhập không cần trình duyệt cần biên nhận tải lên và `
    + 'chuỗi normalize-media do trình duyệt quản lý. Hãy dùng kho phương tiện của ứng dụng hoặc '
    + 'các công cụ tác tử trên máy tính import_asset / import_folder.',
  ));
}

async function listCommand(line: CommandLine, json: boolean): Promise<void> {
  const project = await resolveProject(projectReference(line));
  const doc = await readProjectDoc(project.id);
  const assets = doc.assets.map((asset) => ({
    id: asset.id,
    kind: asset.kind,
    name: asset.name,
    src: asset.src,
    durationInFrames: asset.durationInFrames,
    width: asset.width ?? null,
    height: asset.height ?? null,
    folderId: asset.folderId ?? null,
    sourceFilename: asset.sourceFilename ?? null,
  }));
  if (json) {
    printJson({ projectId: project.id, assets });
    return;
  }
  if (assets.length === 0) {
    writeStdout(`Chưa có phương tiện trong ${project.name}. Nhập tệp từ kho phương tiện của ứng dụng.`);
    return;
  }
  writeStdout(renderTable(
    ['TÀI NGUYÊN', 'LOẠI', 'TÊN', 'THỜI LƯỢNG', 'KÍCH THƯỚC', 'NGUỒN'],
    assets.map((asset) => [
      asset.id,
      asset.kind,
      asset.name,
      `${asset.durationInFrames}f`,
      asset.width && asset.height ? `${asset.width}x${asset.height}` : '-',
      asset.src.split('/').pop() ?? asset.src,
    ]),
  ));
}
