import assert from 'node:assert/strict';
import { validateImageRequest } from './image.ts';
import { callGrokImageProvider } from './image-provider-clients.ts';

const basic = validateImageRequest({ prompt: 'a cat' });
assert.equal(basic.model, 'gpt-image-2');
assert.equal(basic.aspectRatio, '16:9');
assert.equal(basic.count, 1);

const mm = validateImageRequest({
  model: 'image-01',
  prompt: 'matte bottle',
  count: 3,
  seed: 42,
  width: 1024,
  height: 1536,
  referencePaths: ['/media/uploads/a.jpg'],
  promptOptimizer: false,
});
assert.equal(mm.model, 'image-01');
assert.equal(mm.promptOptimizer, false);
assert.equal(mm.count, 3);
assert.equal(mm.seed, 42);
assert.equal(mm.width, 1024);
assert.equal(mm.referencePaths.length, 1);

assert.throws(
  () => validateImageRequest({ model: 'image-01', prompt: 'x'.repeat(1501) }),
  /dài tối đa 1500 ký tự/,
);
assert.throws(
  () => validateImageRequest({ model: 'image-01', prompt: 'x', count: 10 }),
  /hỗ trợ tối đa 9 ảnh/,
);
assert.throws(
  () => validateImageRequest({ model: 'image-01', prompt: 'x', width: 1025, height: 1024 }),
  /chia hết cho 8/,
);
assert.throws(
  () => validateImageRequest({ model: 'gpt-image-2', prompt: 'x', promptOptimizer: true }),
  /promptOptimizer chỉ được image-01/,
);
assert.throws(
  () => validateImageRequest({ model: 'nano-banana', prompt: 'x', referencePaths: Array.from({ length: 15 }, (_, i) => `/media/uploads/${i}.jpg`) }),
  /quá nhiều ảnh tham chiếu/,
);

const gpt = validateImageRequest({
  model: 'gpt-image-2',
  prompt: 'product shot',
  referencePaths: ['/media/uploads/source.png'],
  maskPath: '/media/uploads/mask.png',
  background: 'transparent',
  moderation: 'low',
  inputFidelity: 'high',
  outputFormat: 'webp',
  outputCompression: 82,
});
assert.equal(gpt.inputFidelity, 'high');
assert.equal(gpt.outputCompression, 82);
assert.throws(
  () => validateImageRequest({ model: 'gpt-image-2', prompt: 'x', outputCompression: 80 }),
  /outputCompression yêu cầu outputFormat là jpeg hoặc webp/,
);
assert.throws(
  () => validateImageRequest({ model: 'nano-banana', prompt: 'x', quality: 'high' }),
  /Các tùy chọn GPT Image không được/,
);

const waveSpeed = validateImageRequest({ model: 'wavespeed', prompt: 'a mountain at sunset', aspectRatio: '1:1' });
assert.equal(waveSpeed.model, 'wavespeed');
assert.equal(waveSpeed.aspectRatio, '1:1');
assert.throws(
  () => validateImageRequest({ model: 'wavespeed', prompt: 'x', quality: 'high' }),
  /Các tùy chọn GPT Image không được/,
);
assert.throws(
  () => validateImageRequest({ model: 'wavespeed', prompt: 'x', referencePaths: ['/media/uploads/a.jpg'] }),
  /quá nhiều ảnh tham chiếu/,
);

const byteplus = validateImageRequest({ model: 'byteplus', prompt: 'a neon city street', aspectRatio: '9:16' });
assert.equal(byteplus.model, 'byteplus');
assert.equal(byteplus.aspectRatio, '9:16');
assert.throws(
  () => validateImageRequest({ model: 'byteplus', prompt: 'x', referencePaths: ['/media/uploads/a.jpg'] }),
  /quá nhiều ảnh tham chiếu/,
);


const grok = validateImageRequest({ model: 'grok-imagine', prompt: 'a corgi surfing', aspectRatio: '9:16', imageSize: '2K', count: 4 });
assert.equal(grok.model, 'grok-imagine');
assert.equal(grok.aspectRatio, '9:16');
assert.equal(grok.count, 4);
assert.throws(
  () => validateImageRequest({ model: 'grok-imagine', prompt: 'x', imageSize: '4K' }),
  /imageSize của grok-imagine phải là 1K hoặc 2K/,
);
assert.throws(
  () => validateImageRequest({ model: 'grok-imagine', prompt: 'x', aspectRatio: '21:9' }),
  /không hỗ trợ aspect ratio/,
);
assert.throws(
  () => validateImageRequest({ model: 'grok-imagine', prompt: 'x', count: 5 }),
  /hỗ trợ tối đa 4 ảnh/,
);
assert.throws(
  () => validateImageRequest({ model: 'grok-imagine', prompt: 'x', referencePaths: ['/media/uploads/a.jpg'] }),
  /quá nhiều ảnh tham chiếu/,
);
assert.throws(
  () => validateImageRequest({ model: 'grok-imagine', prompt: 'x', width: 1024, height: 1024 }),
  /không hỗ trợ width\/height tùy chỉnh/,
);

const originalFetch = globalThis.fetch;
let grokRequest: Record<string, unknown> | null = null;
globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
  grokRequest = JSON.parse(String(init?.body)) as Record<string, unknown>;
  return new Response(JSON.stringify({ data: [{ b64_json: 'aGVsbG8=' }] }), {
    headers: { 'content-type': 'application/json' },
  });
}) as typeof fetch;
await callGrokImageProvider('https://api.x.ai/v1', 'test-key', 'grok-imagine-image', {
  prompt: 'portrait', count: 1, aspectRatio: '9:16', imageSize: '2K',
});
globalThis.fetch = originalFetch;
assert.equal(grokRequest?.aspect_ratio, '9:16', 'Grok receives the requested aspect ratio');
console.log('image.check: ok (provider-specific official parameters)');
