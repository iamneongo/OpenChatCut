// search_content tool: cross-project full-text search over chats, captions
// and transcripts. The index lives server-side (SQLite FTS5); reads need no
// write credential (loopback same-origin read path).
type Args = Record<string, unknown>;

interface SearchHit {
  kind: 'chat' | 'caption' | 'transcript';
  projectId: string;
  ref: string;
  score: number;
}

function describeHit(hit: SearchHit): string {
  if (hit.kind === 'chat') {
    const index = hit.ref.lastIndexOf(':');
    const messageIndex = index >= 0 ? Number(hit.ref.slice(index + 1)) : NaN;
    return `Tin nhắn số ${Number.isFinite(messageIndex) ? messageIndex + 1 : '?'} trong project ${hit.projectId}`;
  }
  if (hit.kind === 'caption') return `Phụ đề trong project ${hit.projectId}`;
  return `Transcript trong project ${hit.projectId}`;
}

export async function execSearchTool(name: string, args: Args): Promise<unknown> {
  if (name !== 'search_content') return { error: `Tool không xác định: ${name}` };
  const query = String(args.query ?? '').trim();
  if (!query) return { error: 'Cần có query' };
  const projectId = typeof args.projectId === 'string' && args.projectId.trim()
    ? args.projectId.trim()
    : undefined;
  const limit = Math.min(50, Math.max(1, Math.round(Number(args.limit) || 20)));

  const url = `/api/project-store/search?q=${encodeURIComponent(query)}&limit=${limit}`
    + (projectId ? `&project=${encodeURIComponent(projectId)}` : '');
  try {
    const response = await fetch(url, {
      headers: { 'sec-fetch-site': 'same-origin' },
      cache: 'no-store',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      return { error: body?.error ?? `Tìm kiếm thất bại: ${response.status}` };
    }
    const body = await response.json() as { hits: SearchHit[] };
    const hits = body.hits.map((hit) => ({
      ...hit,
      score: Math.round(hit.score * 100) / 100,
      where: describeHit(hit),
    }));
    return {
      query,
      count: hits.length,
      note: hits.length
        ? 'Kết quả được sắp xếp theo độ liên quan giảm dần; truyền projectId để thu hẹp phạm vi.'
        : 'Không có kết quả. Hãy thử từ khóa khác hoặc cụm từ dài ít nhất 3 ký tự.',
      hits,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
