import assert from 'node:assert/strict';
import type { MediaAsset } from '../../editor/types';
import {
  BEAT_FALLBACK_TOOL,
  MISSING_MODEL_PACKS_ACTION,
  MODEL_PACK_SETTINGS_ROUTE,
  unavailableAnalysis,
} from './music-intelligence-plan';

const asset: MediaAsset = {
  id: 'asset_music_missing',
  name: 'Music',
  kind: 'audio',
  src: '/media/uploads/music.wav',
  durationInFrames: 5_400,
  sourceRevision: 'sha256:music',
} as MediaAsset;

const previousFetch = globalThis.fetch;
const catalogResponse = new Response(JSON.stringify({
  packs: [
    { id: 'rhythm-lite', status: 'absent' },
    { id: 'music-semantics-lite', status: 'absent' },
  ],
}), { status: 200, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = (async () => catalogResponse) as typeof fetch;
try {
  const result = await unavailableAnalysis(asset) as Record<string, unknown>;
  assert.ok(typeof result.error === 'string' && result.error.length > 0, 'missing packs must reject');
  assert.ok((result.error as string).includes('Cài đặt → Mô hình cục bộ → Nhịp và phân tích âm nhạc'),
    'error text must name the page with the install buttons (vi)');
  assert.ok((result.error as string).includes('Mô hình cục bộ → Beat and music analysis'),
    'error text must name the page with the install buttons (en fallback)');
  assert.equal(result.action, MISSING_MODEL_PACKS_ACTION, 'missing packs must carry the action marker');
  assert.equal(result.settingsRoute, MODEL_PACK_SETTINGS_ROUTE, 'missing packs must carry the settings route');
  assert.equal(result.fallback, BEAT_FALLBACK_TOOL, 'missing packs must name the detect_beats fallback');
  assert.ok(Array.isArray(result.modelPacks) && result.modelPacks.length === 2, 'missing pack ids must be reported');
} finally {
  globalThis.fetch = previousFetch;
}

console.log('music-missing-pack-action.verify: ok');
