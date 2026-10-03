export function localAsrModelHosts(origin: string): readonly [string] {
  const parsed = new URL(origin);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`protocol nguồn ASR cục bộ không được hỗ trợ: ${parsed.protocol}`);
  }
  return [`${parsed.origin}/api/hf-proxy`];
}

export function localAsrLoadError(reason: unknown): Error {
  const detail = reason instanceof Error ? reason.message : String(reason);
  return new Error(`tải model ASR cục bộ thất bại; đã tắt remote fallback: ${detail}`);
}
