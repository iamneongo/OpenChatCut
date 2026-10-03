export { PROBE_TOOL_SCHEMAS, PROBE_TOOL_NAMES } from './schemas/probe-tools';
// probe_media runs the app's own ffprobe through POST /api/probe-media (server/plugins/
// probe-media.ts) — no sandbox, no API key. It reads stream and format metadata to
// determine audio, fps, duration, dimensions, and codec information. The agent probes
// before finalize_uploaded_asset so it can pass measured hasAudioTrack/fps/duration
// metadata; transcription remains a separate explicit transcribe_track call.
import type { AgentContext } from '../context';
import type { MediaAsset } from '../../editor/types';

type Args = Record<string, unknown>;

export { parseProbe, type ProbeResult } from '../../../shared/media-probe';
import { parseProbe } from '../../../shared/media-probe';

type ResolvedSource = { url: string } | { error: string };

// Resolve the tool `source` to what the server route accepts: a public http(s) URL or a
// local /media path (the route reads uploads and product assets in place and pulls a URL
// through the SSRF-safe fetch itself).
function resolveSource(ctx: AgentContext, raw: string): ResolvedSource {
  const s = raw.trim();
  if (!s) return { error: 'source là bắt buộc' };
  if (/^https?:\/\//.test(s) || s.startsWith('/media/')) return { url: s };
  const assets: MediaAsset[] = ctx.getDoc().assets ?? ctx.getState().assets ?? [];
  const exact = assets.find((a) => a.id === s);
  const hits = exact ? [exact] : assets.filter((a) => a.id.startsWith(s));
  if (hits.length !== 1) return { error: `không có tư liệu / đường dẫn / URL duy nhất cho "${s}"` };
  const src = hits[0]!.src;
  if (!src) return { error: `tư liệu ${hits[0]!.id} không có tệp media (ví dụ motion graphic chưa có video kết xuất)` };
  return { url: src };
}

export async function execProbeTool(name: string, args: Args, ctx: AgentContext): Promise<unknown> {
  if (name !== 'probe_media') return { error: `công cụ không xác định: ${name}` };
  const resolved = resolveSource(ctx, String(args.source ?? ''));
  if ('error' in resolved) return resolved;

  let data: Record<string, unknown>;
  try {
    const res = await fetch('/api/probe-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: resolved.url }),
    });
    data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return {
        error: typeof data.error === 'string' ? data.error : `probe thất bại (${res.status})`,
        hint: 'finalize_uploaded_asset vẫn có thể ghi nhận bản tải lên với giá trị mặc định; chỉ là sẽ không bắt đầu chép lời.',
      };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  const probeJson = data.probe;
  if (!probeJson || typeof probeJson !== 'object') return { error: 'ffprobe không trả về JSON' };
  const probe = parseProbe(probeJson);
  return {
    ok: true,
    source: resolved.url,
    ...probe,
    next: probe.hasAudioTrack
      ? `Có track âm thanh → gọi finalize_uploaded_asset với assetType, durationInSeconds và hasAudioTrack=true từ phản hồi tải lên${probe.fps ? `, fps=${probe.fps}` : ''}; sau đó gọi transcribe_track nếu cần chép lời.`
      : 'Không có track âm thanh → gọi finalize_uploaded_asset với assetType, durationInSeconds và hasAudioTrack=false từ phản hồi tải lên; sẽ không bắt đầu chép lời.',
  };
}
