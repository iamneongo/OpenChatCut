export type DirectoryWatchOperation = 'start' | 'activate' | 'acknowledge' | 'stop';

const PUBLIC_MESSAGES: Record<DirectoryWatchOperation, string> = {
  start: 'không thể khởi động theo dõi thư mục',
  activate: 'không thể kích hoạt theo dõi thư mục',
  acknowledge: 'không thể xác nhận nhập thư mục',
  stop: 'không thể dừng theo dõi thư mục',
};

function publicStartMessage(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  if (code === 'ENOENT' || code === 'ENOTDIR') {
    return 'không tìm thấy thư mục đã chọn';
  }
  if (code === 'EACCES' || code === 'EPERM') {
    return 'không thể đọc thư mục đã chọn';
  }
  if (code === 'UNKNOWN' && error instanceof Error && /\bwatch\b/i.test(error.message)) {
    return 'file watcher native không thể theo dõi thư mục đã chọn';
  }
  if (error instanceof Error) {
    if (error.message === 'đích media không được chồng lấn với thư mục nhập') {
      return 'thư mục đã chọn chồng lấn với thư mục lưu media; hãy chọn thư mục nguồn riêng';
    }
    if (error.name === 'DirectoryScanLimitError') {
      return 'thư mục đã chọn có quá nhiều tệp hoặc quá nhiều thư mục lồng nhau';
    }
  }
  return PUBLIC_MESSAGES.start;
}

function publicMessage(operationName: DirectoryWatchOperation, error: unknown): string {
  return operationName === 'start' ? publicStartMessage(error) : PUBLIC_MESSAGES[operationName];
}

export interface DirectoryWatchWarningEmitter {
  emitWarning(message: string, options: { code: string }): void;
}

export function reportDirectoryWatchError(
  _error: unknown,
  emitter: DirectoryWatchWarningEmitter = process,
): void {
  emitter.emitWarning('thao tác theo dõi thư mục thất bại', {
    code: 'OPENCHATCUT_DIRECTORY_WATCH',
  });
}

export async function invokeDirectoryWatch<T>(
  operationName: DirectoryWatchOperation,
  operation: () => Promise<T>,
  reporter: (error: unknown) => void = reportDirectoryWatchError,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    reporter(error);
    throw new Error(publicMessage(operationName, error));
  }
}
