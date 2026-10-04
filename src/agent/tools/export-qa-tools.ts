export { EXPORT_QA_TOOL_SCHEMAS, EXPORT_QA_TOOL_NAMES } from './schemas/export-qa-tools';
import { captionFaceQaIssues } from '../../geometry/caption-qa';
import type { AgentContext } from '../context';
import {
  captionLayoutQaIssues,
  exportQaExpectations,
  mergeExportQaIssues,
  timelineCutTimesSeconds,
  type ExportQaExpectations,
  type ExportQaReport,
} from '../../export/quality';
import { fetchRenderJob } from './export-tools';
import { maybeDescribeFramesResult } from '../vision';

type Args = Record<string, unknown>;

interface ExportQaResponse {
  ok?: boolean;
  error?: string;
  src?: string;
  report?: ExportQaReport;
  evidence?: {
    mediaType?: string;
    base64?: string;
    samples?: { cutSeconds: number; sampleSeconds: number; side: 'before' | 'after' }[];
  };
}

interface ResolvedExport {
  src: string;
  expected?: Partial<Pick<ExportQaExpectations, 'durationSeconds' | 'width' | 'height' | 'fps'>>;
  sourceStartSeconds?: number;
}

async function resolveExportSrc(args: Args): Promise<ResolvedExport | { error: string }> {
  const direct = typeof args.src === 'string' ? args.src.trim() : '';
  if (direct) return direct.startsWith('/media/uploads/')
    ? { src: direct }
    : { error: 'src phải là bản xuất đã hoàn tất trong /media/uploads/' };

  const renderId = typeof args.renderId === 'string' ? args.renderId.trim() : '';
  if (!renderId) return { error: 'cần có renderId hoặc src' };
  const job = await fetchRenderJob(renderId);
  if (!('ok' in job)) return job;
  if (job.status !== 'completed') {
    return { error: `tác vụ kết xuất ${job.renderId} đang ở trạng thái ${job.status}; hãy chờ hoàn tất trước khi kiểm tra` };
  }
  if (!job.downloadUrl) return { error: `tác vụ kết xuất ${job.renderId} không có đường dẫn đầu ra` };
  return {
    src: job.downloadUrl,
    expected: {
      ...(job.durationSeconds !== undefined ? { durationSeconds: job.durationSeconds } : {}),
      ...(job.width !== undefined ? { width: job.width } : {}),
      ...(job.height !== undefined ? { height: job.height } : {}),
      ...(job.fps !== undefined ? { fps: job.fps } : {}),
    },
    sourceStartSeconds: job.sourceStartSeconds,
  };
}

async function verifyExport(args: Args, ctx: AgentContext): Promise<unknown> {
  try {
    const resolved = await resolveExportSrc(args);
    if ('error' in resolved) return resolved;

    const state = ctx.getState();
    const expected = { ...exportQaExpectations(state), ...resolved.expected };
    const maxCuts = Math.max(1, Math.min(8, Math.round(Number(args.maxCuts) || 8)));
    const sourceStartSeconds = resolved.sourceStartSeconds ?? 0;
    const cutTimesSeconds = timelineCutTimesSeconds(state, 24)
      .map((seconds) => Number((seconds - sourceStartSeconds).toFixed(4)))
      .filter((seconds) => seconds > 0 && seconds < expected.durationSeconds)
      .slice(0, maxCuts);
    const response = await fetch('/api/export-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        src: resolved.src,
        ...expected,
        cutTimesSeconds,
        maxEvidenceCuts: maxCuts,
      }),
    });
    const result = (await response.json().catch(() => null)) as ExportQaResponse | null;
    if (!response.ok || !result?.report) {
      return { error: result?.error ?? `kiểm tra bản xuất thất bại (${response.status})` };
    }

    const report = mergeExportQaIssues(result.report, captionLayoutQaIssues(state));
    // Geometry-aware caption check: warns when a caption band covers the
    // speaker's face (visual geometry cache; first use analyzes the source).
    const faceIssues = await captionFaceQaIssues(ctx.getDoc(), state);
    const merged = faceIssues.length ? mergeExportQaIssues(report, faceIssues) : report;
    const evidence = result.evidence;
    return {
      ok: merged.ok,
      src: resolved.src,
      report: merged,
      cutCount: cutTimesSeconds.length,
      evidenceSamples: evidence?.samples ?? [],
      ...(evidence?.base64 ? { __images: [{ frame: 0, base64: evidence.base64 }] } : {}),
      note: evidence?.base64
        ? 'Minh chứng tại điểm cắt là bảng hai cột: mỗi hàng hiển thị khung hình ngay trước và sau một ranh giới chỉnh sửa.'
        : 'Không có ranh giới chỉnh sửa liền kề để tạo minh chứng hình ảnh; kiểm tra ở cấp luồng vẫn đã hoàn tất.',
      next: merged.ok && merged.summary.warnings === 0
        ? 'Bản xuất đã vượt qua kiểm tra tự động.'
        : 'Kiểm tra từng vấn đề và từng hàng minh chứng. Sửa các lỗi đã xác nhận, xuất lại rồi chạy verify_export lần nữa. Dừng sau ba lần thử và báo cáo vấn đề còn lại cho người dùng.',
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function execExportQaTool(name: string, args: Args, ctx: AgentContext): Promise<unknown> {
  if (name !== 'verify_export') return { error: `Công cụ kiểm tra bản xuất chưa được triển khai: ${name}` };
  return await maybeDescribeFramesResult(await verifyExport(args, ctx), 'qa-evidence');
}
