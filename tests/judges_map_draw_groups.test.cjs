const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('app/script.js', 'utf8');
const start = source.indexOf('function judgesMapRows');
const end = source.indexOf('function displayJudgeMapStake', start);
assert(start >= 0 && end > start, 'Judges-map functions were not found.');

const context = vm.createContext({
    clean: value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
    eventFieldsForTrial: trial => trial.eventFields,
    sortedRunPlanRows: rows => [...rows].sort((a, b) => a.runOrder - b.runOrder),
    entriesForRunGroupBreed: (trial, breed) => trial.entries.filter(entry => entry.breed === breed),
    operationalGroupName: (groups, id, fallback) => groups.find(group => group.id === id)?.name || fallback,
    displayBreedCode: value => value,
    displayJudgeMapStake: value => value === 'Field Champion' ? 'FCh' : value,
    mixedStakeEligibilityForEntries: () => ({ eligible: false }),
    mixedStakeBreedEnabled: () => false,
    runGroupStakeForEntry: entry => entry.className,
    isQuasiBreedClass: () => false,
    formatJudgeMapCourseBreakdown: () => '',
});
vm.runInContext(source.slice(start, end), context);

const hounds = count => Array.from({ length: count }, (_, index) => ({ entryId: String(index) }));
const trial = {
    eventFields: [{ id: 'main', name: 'Main Field' }],
    runPlan: [{ breed: 'RR', runOrder: 1, fieldId: 'main', judge1: 'Judge One', judge2: 'Judge Two' }],
    entries: Array.from({ length: 54 }, (_, index) => ({ id: String(index), breed: 'RR', className: 'Open' })),
    preliminaryDraw: { groups: [
        { breed: 'RR', stake: 'Veteran', flight: '', courses: [{ number: 1, hounds: hounds(3) }, { number: 2, hounds: hounds(3) }, { number: 3, hounds: hounds(2) }, { number: 4, hounds: hounds(2) }] },
        { breed: 'RR', stake: 'Field Champion', flight: 'B', courses: [{ number: 1, hounds: hounds(3) }, { number: 2, hounds: hounds(3) }, { number: 3, hounds: hounds(3) }, { number: 4, hounds: hounds(2) }] },
        { breed: 'RR', stake: 'Open', flight: 'B', courses: [{ number: 1, hounds: hounds(3) }, { number: 2, hounds: hounds(3) }, { number: 3, hounds: hounds(3) }, { number: 4, hounds: hounds(2) }] },
        { breed: 'RR', stake: 'Field Champion', flight: 'A', courses: [{ number: 1, hounds: hounds(3) }, { number: 2, hounds: hounds(3) }, { number: 3, hounds: hounds(3) }, { number: 4, hounds: hounds(2) }] },
        { breed: 'RR', stake: 'Open', flight: 'A', courses: [{ number: 1, hounds: hounds(3) }, { number: 2, hounds: hounds(3) }, { number: 3, hounds: hounds(3) }, { number: 4, hounds: hounds(2) }] },
    ] },
};

const rows = Array.from(context.judgesMapRows(trial));
assert.equal(rows.map(row => row.stake).join(','), 'Open A,Open B,FCh A,FCh B,Veteran');
assert.equal(rows.map(row => row.entryCount).join(','), '11,11,11,11,10');
assert.equal(rows.map(row => row.runCount).join(','), '4,4,4,4,4');
assert.equal(rows[0].courseBreakdown, '1(3) 2(3) 3(3) 4(2)');
assert.equal(rows[4].courseBreakdown, '1(3) 2(3) 3(2) 4(2)');
assert(rows.every(row => row.judges === 'Judge One / Judge Two'));

console.log('Preliminary judges map follows saved split-flight draw groups, actual courses, and stake order.');
