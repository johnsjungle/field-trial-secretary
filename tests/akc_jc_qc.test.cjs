const assert = require('node:assert/strict');
const AkcTests = require('../app/akc_tests.js');

const entry = {
    id: 'entry-1',
    houndId: 'hound-1',
    callName: 'Dash',
    registeredName: 'Long Registered Hound Name',
    breed: 'WH',
    registrationNumber: 'HP123456',
    owner: 'Owner One',
};

let ids = 0;
const created = AkcTests.syncLinked([], entry, ['JC', 'QC'], () => 'test-' + (++ids), '2026-09-29T12:00:00Z');
assert.equal(created.length, 2);
assert.deepEqual(created.map((row) => row.testType), ['JC', 'QC']);
assert(created.every((row) => row.sourceEntryId === entry.id));
assert(created.every((row) => row.result === 'pending'));

created[0].result = 'pass';
created[0].judgeName = 'Judge One';
const updated = AkcTests.syncLinked(created, { ...entry, registeredName: 'Corrected Name' }, ['JC'], () => 'unused', '2026-09-29T13:00:00Z');
assert.equal(updated.length, 1);
assert.equal(updated[0].testType, 'JC');
assert.equal(updated[0].result, 'pass');
assert.equal(updated[0].judgeName, 'Judge One');
assert.equal(updated[0].registeredName, 'Corrected Name');

const manual = AkcTests.normalize({ id: 'manual', testType: 'QC', result: 'FAIL', runOrder: 3 });
const summary = AkcTests.counts([...updated, manual]);
assert.deepEqual(summary, { total: 2, jc: 1, qc: 1, pending: 0, pass: 1, fail: 1, scratch: 0 });
console.log('AKC JC/QC linked entry synchronization and result counts passed.');