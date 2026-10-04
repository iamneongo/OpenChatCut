// `occ project ...` — the project library commands.
import { flagBoolean, flagText, rejectUnknownFlags, type CommandLine } from '../args.ts';
import { UsageError } from '../errors.ts';
import { formatTimestamp, printJson, renderTable, writeStdout } from '../output.ts';
import { createProject, listProjects, readProjectDoc, resolveProject } from '../store.ts';
import { timelineRows } from '../summary.ts';
import {
  GLOBAL_FLAGS,
  parseSize,
  positiveInteger,
  projectReference,
  requirePositional,
  subLine,
} from './common.ts';

const FLAGS = [
  ...GLOBAL_FLAGS,
  'all',
  'doc',
  'description',
  'fps',
  'width',
  'height',
  'size',
] as const;

export async function runProjectCommand(
  positionals: readonly string[],
  commandLine: CommandLine,
  json: boolean,
): Promise<void> {
  rejectUnknownFlags(commandLine, FLAGS);
  const [subcommand, ...rest] = positionals;
  const line = subLine(commandLine, rest);
  switch (subcommand) {
    case 'list':
      return listCommand(commandLine, json);
    case 'show':
      return showCommand(line, commandLine, json);
    case 'new':
      return newCommand(line, commandLine, json);
    case undefined:
      throw new UsageError('project cần một lệnh con: list | show | new');
    default:
      throw new UsageError(`lệnh con của project không xác định "${subcommand}"`);
  }
}

async function listCommand(commandLine: CommandLine, json: boolean): Promise<void> {
  const includeDeleted = flagBoolean(commandLine, 'all');
  const projects = await listProjects(includeDeleted);
  if (json) {
    printJson(projects);
    return;
  }
  if (projects.length === 0) {
    writeStdout('Chưa có dự án. Tạo dự án bằng: occ project new "Tên dự án"');
    return;
  }
  writeStdout(renderTable(
    ['MÃ', 'TÊN', 'CẬP NHẬT', 'TRẠNG THÁI'],
    projects.map((project) => [
      project.id,
      project.name,
      formatTimestamp(project.updatedAt),
      project.deletedAt ? 'đã xóa' : 'đang hoạt động',
    ]),
  ));
}

async function showCommand(line: CommandLine, commandLine: CommandLine, json: boolean): Promise<void> {
  const project = await resolveProject(projectReference(line));
  const doc = await readProjectDoc(project.id);
  const timelines = timelineRows(doc);
  if (json) {
    printJson({ project, timelines, ...(flagBoolean(commandLine, 'doc') ? { doc } : {}) });
    return;
  }
  if (flagBoolean(commandLine, 'doc')) {
    printJson(doc);
    return;
  }
  writeStdout(`${project.name}  (${project.id})`);
  writeStdout(`cập nhật ${formatTimestamp(project.updatedAt)}  |  phiên bản ${doc.version}  |  tài nguyên ${doc.assets.length}`);
  writeStdout('');
  writeStdout(renderTable(
    ['DÒNG THỜI GIAN', 'TÊN', 'FPS', 'KÍCH THƯỚC', 'ĐOẠN', 'THỜI LƯỢNG', 'RÃNH'],
    timelines.map((timeline) => [
      `${timeline.id}${timeline.active ? ' *' : ''}`,
      timeline.name,
      String(timeline.fps),
      `${timeline.width}x${timeline.height}`,
      String(timeline.itemCount),
      timeline.duration,
      timeline.trackSummary,
    ]),
  ));
}

async function newCommand(line: CommandLine, commandLine: CommandLine, json: boolean): Promise<void> {
  const name = requirePositional(line, 0, 'project name');
  const sizeFlag = flagText(commandLine, 'size');
  const widthFlag = flagText(commandLine, 'width');
  const heightFlag = flagText(commandLine, 'height');
  if ((widthFlag === undefined) !== (heightFlag === undefined)) {
    throw new UsageError('--width và --height phải đi cùng nhau; trường hợp thông dụng hãy dùng --size 1920x1080');
  }
  const [width, height] = sizeFlag
    ? parseSize(sizeFlag)
    : [widthFlag ? positiveInteger(widthFlag, 'width') : undefined, heightFlag ? positiveInteger(heightFlag, 'height') : undefined];
  const fpsFlag = flagText(commandLine, 'fps');
  const description = flagText(commandLine, 'description');
  const project = await createProject({
    name,
    ...(fpsFlag ? { fps: positiveInteger(fpsFlag, 'fps') } : {}),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(description ? { description } : {}),
  });
  if (json) {
    printJson(project);
    return;
  }
  writeStdout(`đã tạo ${project.id}  ${project.name}`);
}
