// `occ` — OpenChatCut command line. Runs against the local project library with
// no app, no browser and no MCP session in the loop; writes still go through the
// same offline edit-session contract the app and external agents use.
import { flagText, parseCommandLine } from './args.ts';
import { CliError, EXIT_FAILURE, EXIT_OK, EXIT_USAGE, UsageError } from './errors.ts';
import { writeStderr, writeStdout } from './output.ts';
import { applyGlobalOptions } from './profile.ts';

const USAGE = `occ — dòng lệnh OpenChatCut

Cách dùng
  occ project list [--all] [--json]
  occ project show [<project>] [--doc] [--json]
  occ project new <name> [--size 1920x1080] [--fps 30] [--json]
  occ timeline show [<project>] [--json]
  occ timeline items [<project>] [--track <track id>] [--timeline <id>] [--json]
  occ media ls [<project>] [--json]
  occ render [<project>] --out <file> [--resolution 1080p] [--fps 30] [--codec h264] [--from <frame|4s>] [--to <frame|4s>] [--dry-run] [--quiet]
  occ export jianying [<project>] [--draft-name <name>] [--out-dir <dir>] [--json]
  occ item move <clip> [--track <track>] [--start <frame|4s>] [--apply]
  occ item trim <clip> [--start <frame>] [--duration <frames|4s>] [--fade-in <s>] [--fade-out <s>] [--ripple] [--apply]
  occ item split <clip> --at <frame|4s> [--apply]
  occ item rm <clip> [--ripple] [--apply]
  occ item dup <clip> [--apply]
  occ tools ls [--all] [--json]
  occ tools call <tool> [--args '<json>' | --args @file.json] [--apply] [--json]
  occ edit --ops '[{"tool":"set_aspect_ratio","args":{"ratio":"9:16"}}]' [--apply] [--json]
  occ where [--json]

Cờ dùng chung
  --project <id|prefix|name>   dự án cần thao tác (mặc định: dự án cập nhật gần nhất)
  --data-dir <path>            dùng thư viện OpenChatCut cụ thể thay cho hồ sơ đang hoạt động
  --json                       xuất dữ liệu dành cho máy trên stdout
  --help                       hiển thị nội dung này

Ghi dữ liệu
  Chỉ \`occ tools call --apply\` mới ghi dữ liệu. Lệnh mở một phiên chỉnh sửa ngoại tuyến,
  commit nguyên tử qua cùng cơ chế kiểm tra phiên bản với ứng dụng và lưu ảnh chụp trước
  khi sửa, để mọi lệnh đã commit đều có thể hoàn tác từ lịch sử phiên bản của ứng dụng.
  Nếu không có --apply, bản nháp sẽ bị hủy và dự án không thay đổi.

Dự án
  <project> chấp nhận mã đầy đủ, tiền tố mã duy nhất hoặc tên duy nhất.`;

function reportError(error: unknown): number {
  if (error instanceof UsageError) {
    writeStderr(error.message);
    writeStderr('Chạy `occ --help` để xem cách dùng.');
    return EXIT_USAGE;
  }
  if (error instanceof CliError) {
    writeStderr(error.message);
    return EXIT_FAILURE;
  }
  if (error instanceof Error && error.name === 'ExternalEditorCallError') {
    writeStderr(error.message);
    return EXIT_FAILURE;
  }
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  writeStderr(`unexpected failure: ${message}`);
  return EXIT_FAILURE;
}

export async function run(argv: readonly string[]): Promise<number> {
  let commandLine;
  try {
    commandLine = parseCommandLine(argv);
  } catch (error) {
    return reportError(error);
  }

  if (commandLine.flags.has('help')) {
    writeStdout(USAGE);
    return EXIT_OK;
  }
  if (commandLine.positionals.length === 0) {
    writeStdout(USAGE);
    return EXIT_USAGE;
  }

  try {
    applyGlobalOptions({ dataDir: flagText(commandLine, 'data-dir') });
  } catch (error) {
    return reportError(error);
  }

  try {
    // Dynamic on purpose: static import would load server/runtime-profile.ts (and
    // therefore freeze the profile) before --data-dir was applied above.
    const { runCommand } = await import('./router.ts');
    await runCommand(commandLine);
    return EXIT_OK;
  } catch (error) {
    return reportError(error);
  }
}

process.exitCode = await run(process.argv.slice(2));
