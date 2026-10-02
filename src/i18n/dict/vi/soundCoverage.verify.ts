import assert from 'node:assert/strict';
import { SOUND_EFFECTS } from '../../../audio/soundLibrary';
import VI_SOUNDS from './sounds';

const keys = [...new Set(SOUND_EFFECTS.flatMap((sound) => [sound.name, sound.desc]))];
for (const key of keys) {
  assert.ok(VI_SOUNDS[key], `missing Vietnamese sound translation: ${key}`);
}

console.log(`vi soundCoverage.verify: ${keys.length} sound strings covered`);
