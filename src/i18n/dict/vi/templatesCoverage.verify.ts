import assert from 'node:assert/strict';
import EN_TEMPLATES from '../en/templates-data';
import VI_TEMPLATES from './templates-data';

for (const key of Object.keys(EN_TEMPLATES)) {
  assert.ok(VI_TEMPLATES[key], `missing Vietnamese template translation: ${key}`);
  assert.notEqual(VI_TEMPLATES[key], EN_TEMPLATES[key], `template translation falls back to English: ${key}`);
}

console.log(`vi templatesCoverage.verify: ${Object.keys(EN_TEMPLATES).length} template labels covered`);
