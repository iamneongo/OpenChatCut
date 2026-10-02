import assert from 'node:assert/strict';
import EN_TEMPLATES from '../en/templates-data';
import VI_TEMPLATES from './templates-data';

const translations = VI_TEMPLATES as Record<string, string>;
const english = EN_TEMPLATES as Record<string, string>;
for (const key of Object.keys(english)) {
  assert.ok(translations[key], `missing Vietnamese template translation: ${key}`);
  assert.notEqual(translations[key], english[key], `template translation falls back to English: ${key}`);
}

console.log(`vi templatesCoverage.verify: ${Object.keys(EN_TEMPLATES).length} template labels covered`);
