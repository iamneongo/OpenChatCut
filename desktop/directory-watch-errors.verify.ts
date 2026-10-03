import assert from 'node:assert/strict';
import {
  invokeDirectoryWatch,
  reportDirectoryWatchError,
} from './directory-watch-errors.ts';

const secretPath = '/Users/private/never-expose/watched-media';
const warnings: string[] = [];
reportDirectoryWatchError(new Error(`ENOENT: ${secretPath}`), {
  emitWarning(message, options) {
    warnings.push(`${options.code}:${message}`);
  },
});
assert.deepEqual(warnings, [
  'OPENCHATCUT_DIRECTORY_WATCH:thao tác theo dõi thư mục thất bại',
]);
assert.equal(warnings.join('\n').includes(secretPath), false);

let reported = '';
await assert.rejects(
  invokeDirectoryWatch(
    'start',
    async () => { throw new Error(`failed to scan ${secretPath}`); },
    (error) => { reported = error instanceof Error ? error.message : String(error); },
  ),
  (error: unknown) => error instanceof Error
    && error.message === 'không thể khởi động theo dõi thư mục'
    && !error.message.includes(secretPath),
);
assert.equal(reported.includes(secretPath), true, 'internal reporting may receive the original error');
assert.equal(warnings.join('\n').includes(secretPath), false, 'warning output must remain sanitized');

await assert.rejects(
  invokeDirectoryWatch(
    'start',
    async () => { throw new Error('đích media không được chồng lấn với thư mục nhập'); },
    () => undefined,
  ),
  /thư mục đã chọn chồng lấn với thư mục lưu media/,
);

await assert.rejects(
  invokeDirectoryWatch(
    'start',
    async () => { throw Object.assign(new Error(`EACCES: permission denied, scandir '${secretPath}'`), { code: 'EACCES' }); },
    () => undefined,
  ),
  (error: unknown) => error instanceof Error
    && error.message === 'không thể đọc thư mục đã chọn'
    && !error.message.includes(secretPath),
);

process.stdout.write('directory-watch-errors.verify: warning and public error redaction passed\n');
