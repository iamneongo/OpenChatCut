import assert from 'node:assert/strict';
import { NativeInferenceBudget } from './native-inference-budget.ts';

const budget = new NativeInferenceBudget();
for (let index = 0; index < 50_000; index += 1) {
  const requestId = `request-${String(index).padStart(8, '0')}`;
  budget.claim(1, requestId, 1024);
  budget.release(requestId);
}
assert.equal(budget.activeCount, 0, 'high-frequency request churn must not leak leases');

for (let index = 0; index < 4; index += 1) budget.claim(7, `parallel-${index}`, 1024);
assert.equal(budget.activeCount, 4);
assert.deepEqual(budget.requestIds(7), ['parallel-0', 'parallel-1', 'parallel-2', 'parallel-3']);
assert.throws(() => budget.claim(7, 'parallel-4', 1024), /quá nhiều request/);
assert.throws(() => budget.claim(8, 'foreign-owner', 1024), /quá nhiều request|renderer khác/);
for (const requestId of budget.requestIds(7)) budget.release(requestId);

budget.claim(7, 'duplicate-id', 0);
assert.throws(() => budget.claim(7, 'duplicate-id', 0), /request id .* bị trùng/);
budget.release('duplicate-id');
budget.release('duplicate-id');

budget.claim(7, 'full-input-budget', 128 * 1024 * 1024);
assert.throws(() => budget.claim(7, 'over-input-budget', 1), /vượt giới hạn đầu vào/);
budget.release('full-input-budget');
assert.equal(budget.activeCount, 0);

console.log('native-inference-budget.verify: high-frequency leases and aggregate caps OK');
