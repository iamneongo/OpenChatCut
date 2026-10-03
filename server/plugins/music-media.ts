import { proxyDispatcher } from '../outbound-proxy.ts';
import { createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';

import { isSafeUploadName, resolveUploadFile, uploadDir } from '../media-dir.ts';
import type { MusicAudioFormat } from './music-types.ts';
// Proxy-aware fetch: attaches the configured outbound proxy (keystore
// PROXY_URL or HTTPS_PROXY/HTTP_PROXY env) via undici dispatcher.
type FetchInit = Parameters<typeof fetch>[1] & { dispatcher?: unknown };
const fetchWithProxy = (url: RequestInfo | URL, init?: FetchInit): Promise<Response> =>
  fetch(url, { ...init, dispatcher: proxyDispatcher() } as RequestInit);


export async function musicProviderError(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const data = JSON.parse(text) as { message?: string; detail?: string; error?: { message?: string } };
    return data.error?.message ?? data.message ?? data.detail ?? `provider music thất bại (${response.status})`;
  } catch {
    return text.slice(0, 300) || `provider music thất bại (${response.status})`;
  }
}

function probeDuration(file: string): Promise<number> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]);
    let output = '';
    child.stdout.on('data', (data) => { output += String(data); });
    child.on('error', reject);
    child.on('close', (code) => {
      const duration = Number(output.trim());
      if (code === 0 && Number.isFinite(duration) && duration > 0) resolvePromise(duration);
      else reject(new Error('không thể kiểm tra nhạc đã tạo'));
    });
  });
}

export async function saveAudioResponse(
  response: Response,
  format: MusicAudioFormat,
  rawSampleRate = 44_100,
): Promise<{ path: string; durationSeconds: number }> {
  if (!response.ok) throw new Error(await musicProviderError(response));
  if (!response.body) throw new Error('provider music trả về audio rỗng');
  const ext = ['wav', 'pcm', 'flac'].includes(format) ? format : 'mp3';
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const file = join(dir, filename);
  const partial = join(dir, `.${filename}.part`);
  try {
    await pipeline(
      Readable.fromWeb(response.body as WebReadableStream),
      createWriteStream(partial, { flags: 'wx' }),
    );
    const bytes = (await stat(partial)).size;
    if (!bytes) throw new Error('provider music trả về audio rỗng');
    const durationSeconds = ext === 'pcm' ? bytes / (rawSampleRate * 2) : await probeDuration(partial);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error('không thể xác định thời lượng nhạc đã tạo');
    await rename(partial, file);
    return { path: `/media/uploads/${filename}`, durationSeconds };
  } catch (error) {
    await rm(partial, { force: true }).catch(() => undefined);
    throw error;
  }
}

function localUpload(uploadPath: string): { file: string; name: string } {
  const clean = uploadPath.split(/[?#]/, 1)[0];
  if (!clean.startsWith('/media/uploads/')) throw new Error('media tham chiếu music phải là upload của project');
  const name = clean.slice('/media/uploads/'.length);
  if (!isSafeUploadName(name)) throw new Error('đường dẫn media tham chiếu music không hợp lệ');
  const file = resolveUploadFile(name);
  if (!file) throw new Error(`không tìm thấy media tham chiếu music: ${uploadPath}`);
  return { file, name };
}

export async function referenceAudioBase64(uploadPath: string): Promise<string> {
  const { file } = localUpload(uploadPath);
  const bytes = await readFile(file);
  if (bytes.length > 50 * 1024 * 1024) throw new Error('audio tham chiếu dài tối đa 50MB');
  if (!bytes.length) throw new Error('audio tham chiếu rỗng');
  return bytes.toString('base64');
}

function mimeFor(file: string): string {
  const ext = extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.m4a') return 'audio/mp4';
  return ext === '.mp3' ? 'audio/mpeg' : 'application/octet-stream';
}

export async function uploadMurekaFile(
  baseUrl: string,
  apiKey: string,
  uploadPath: string,
  purpose: 'audio' | 'soundtrack',
): Promise<string> {
  const { file, name } = localUpload(uploadPath);
  const bytes = await readFile(file);
  const maxBytes = purpose === 'soundtrack' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
  if (bytes.length > maxBytes) throw new Error(`upload ${purpose} của Mureka vượt quá ${maxBytes / 1024 / 1024}MB`);
  const form = new FormData();
  form.append('purpose', purpose);
  form.append('file', new Blob([bytes], { type: mimeFor(file) }), name);
  const response = await fetchWithProxy(`${baseUrl}/v1/files/upload`, {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form,
  });
  if (!response.ok) throw new Error(await musicProviderError(response));
  const result = await response.json() as { id?: string };
  if (!result.id) throw new Error('upload tệp Mureka không trả về id');
  return result.id;
}
