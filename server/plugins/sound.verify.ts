import assert from 'node:assert/strict';
import { validateSoundRequest } from './sound.ts';

const ok = validateSoundRequest({ prompt: 'short whoosh' });
assert.equal(ok.durationSeconds, undefined);
assert.equal(ok.promptInfluence, 0.3);
assert.equal(ok.loop, false);
assert.equal(ok.outputFormat, 'mp3_44100_128');

const custom = validateSoundRequest({ prompt: 'thunder', durationSeconds: 30, promptInfluence: 0.8, loop: true, outputFormat: 'opus_48000_128' });
assert.equal(custom.durationSeconds, 30);
assert.equal(custom.loop, true);

assert.throws(() => validateSoundRequest({ prompt: '' }), /prompt là bắt buộc/);
assert.throws(() => validateSoundRequest({ prompt: 'x', durationSeconds: 0.1 }), /durationSeconds phải nằm trong khoảng/);
assert.throws(() => validateSoundRequest({ prompt: 'x', promptInfluence: 2 }), /promptInfluence phải nằm trong khoảng/);
assert.throws(() => validateSoundRequest({ prompt: 'x', outputFormat: 'wav' }), /outputFormat ElevenLabs không được hỗ trợ/);

// sonilo: SFX from the cut — video source in, no prompt, no synthesis controls
assert.equal(ok.provider, 'elevenlabs', 'provider defaults to elevenlabs');
const sonilo = validateSoundRequest({ provider: 'sonilo', sourceAssetPath: '/media/uploads/cut.mp4', sourceAssetKind: 'video' });
assert.equal(sonilo.provider, 'sonilo');
assert.equal(sonilo.sourceAssetPath, '/media/uploads/cut.mp4');
assert.equal(sonilo.prompt, '');
assert.throws(() => validateSoundRequest({ provider: 'sonilo' }), /sourceAssetId video của project/);
assert.throws(
  () => validateSoundRequest({ provider: 'sonilo', sourceAssetPath: '/media/uploads/a.mp3', sourceAssetKind: 'audio' }),
  /sourceAssetId video của project/,
);
assert.throws(
  () => validateSoundRequest({ provider: 'sonilo', sourceAssetPath: '/media/uploads/cut.mp4', sourceAssetKind: 'video', prompt: 'whoosh' }),
  /prompt không được hỗ trợ/,
);
assert.throws(
  () => validateSoundRequest({ provider: 'sonilo', sourceAssetPath: '/media/uploads/cut.mp4', sourceAssetKind: 'video', loop: true }),
  /tùy chọn sound của ElevenLabs/,
);
assert.throws(
  () => validateSoundRequest({ prompt: 'x', sourceAssetPath: '/media/uploads/cut.mp4', sourceAssetKind: 'video' }),
  /provider sonilo hỗ trợ/,
);
assert.throws(() => validateSoundRequest({ provider: 'freesound', prompt: 'x' }), /provider sound phải là elevenlabs hoặc sonilo/);

console.log('sound.check: ok (elevenlabs official sound parameters + sonilo video-to-sfx)');
