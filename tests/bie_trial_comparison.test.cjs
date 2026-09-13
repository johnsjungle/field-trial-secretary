const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const active = { id: 'active' };
const context = vm.createContext({
    console,
    clean: value => String(value || '').trim().toUpperCase(),
    normalizeBreedCode: value => String(value || '').toUpperCase(),
    standardBifCandidates: () => [],
    finalsRowsForGroup: group => group.finalRows || [],
    readForm: () => active,
});
vm.runInContext(fs.readFileSync('app/bie.js', 'utf8'), context);

function trial(id, scores) {
    const entries = Object.entries(scores).map(([registrationNumber, score], index) => ({
        id: id + '-' + index,
        breed: 'WH',
        registrationNumber,
        callName: registrationNumber,
        className: 'Open',
        score,
    }));
    return {
        id,
        trialName: 'Trial ' + id,
        startsOn: '2026-09-' + (10 + Number(id.replace(/\D/g, '') || 0)),
        entries,
        preliminaryDraw: {
            groups: [{
                finalRows: entries.map(entry => ({ hound: { entryId: entry.id, combinedScore: entry.score } })),
            }],
        },
    };
}

const rows = context.bieAggregateTrialScores([
    trial('1', { A: 300, B: 290, C: 280, D: 270 }),
    trial('2', { A: 295, B: 299, C: 300, D: 250 }),
    trial('3', { A: 290, B: 285, C: 299, D: 260 }),
]);
assert.deepEqual(JSON.parse(JSON.stringify(rows.map(row => [row.candidate.registrationNumber, row.totalScore, row.position]))), [
    ['A', 885, 1],
    ['C', 879, 2],
    ['B', 874, 3],
    ['D', 780, 4],
]);
assert.equal(rows[2].eventScores.length, 3);
const candidate = context.bieAggregateCandidate(rows[2]);
assert.equal(candidate.aggregateTotalScore, 874);
assert.equal(candidate.selectionReason, 'third-highest multi-trial total');
assert.equal(context.bieTrialLabel({ id: 'x', trialName: 'Named Trial', startsOn: '2026-09-13' }), 'Named Trial — 2026-09-13');
console.log('BIE multi-trial totals, ranking, third-place selection metadata, and trial labels passed.');

