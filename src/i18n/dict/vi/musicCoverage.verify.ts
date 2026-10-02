import assert from 'node:assert/strict';
import { AUDIO_ASSETS } from '../../../audio/library';
import VI_MUSIC from './music';

const names = AUDIO_ASSETS.filter((item) => item.category === 'music').map((item) => item.name);
const translations = VI_MUSIC as Record<string, string>;
for (const name of names) assert.ok(translations[name], `missing Vietnamese music translation: ${name}`);

console.log(`vi musicCoverage.verify: ${names.length} built-in music names covered`);
