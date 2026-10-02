import assert from 'node:assert/strict';
import { ALL_FX, LUT_EFFECTS } from '../../../gl/fx/effects';
import { VI } from './index';

const definitions = Object.values({ ...ALL_FX, ...LUT_EFFECTS });
const keys = [...new Set(definitions.flatMap((definition) => [
  definition.name,
  definition.desc,
  ...definition.props.map((property) => property.label),
]))];

for (const key of keys) {
  assert.ok(VI[key], `missing Vietnamese effect translation: ${key}`);
}

console.log(`vi effectsCoverage.verify: ${keys.length} effect strings covered`);
