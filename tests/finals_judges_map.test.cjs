const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('app/script.js', 'utf8');
const start = source.indexOf('function finalsJudgesMapRows');
const end = source.indexOf('function displayJudgeMapStake', start);
assert(start >= 0 && end > start, 'Finals judges-map functions were not found.');

const context = vm.createContext({
    clean: value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
    eventFieldsForTrial: trial => trial.eventFields,
    sortedRunPlanRows: rows => [...rows].sort((a, b) => a.runOrder - b.runOrder),
    operationalGroupName: (groups, id, fallback) => groups.find(group => group.id === id)?.name || fallback,
    displayBreedCode: value => value,
    displayJudgeMapStake: value => value,
});
vm.runInContext(source.slice(start, end), context);

const trial = {
    eventFields: [{ id: 'north', name: 'North Field' }, { id: 'south', name: 'South Field' }],
    runPlan: [
        { breed: 'RR', runOrder: 2, fieldId: 'north', judge1: 'Judge One', judge2: 'Judge Two' },
        { breed: 'WH', runOrder: 1, fieldId: 'south', judge1: 'Judge Three' },
    ],
    preliminaryDraw: {
        groups: [
            {
                breed: 'RR', stake: 'Open', flight: 'A',
                finalDraw: { courses: [
                    { number: 1, hounds: [{ entryId: 'a' }, { entryId: 'b' }, { entryId: 'c', finalOutcome: 'excused' }] },
                    { number: 2, hounds: [{ entryId: 'd' }, { entryId: 'e' }] },
                ] },
            },
            {
                breed: 'RR', stake: 'Veteran', flight: '',
                finalDraw: { courses: [{ number: 1, hounds: [{ entryId: 'h' }, { entryId: 'i' }] }] },
            },
            {
                breed: 'WH', stake: 'Veteran', flight: '',
                finalDraw: { courses: [{ number: 1, hounds: [{ entryId: 'f' }, { entryId: 'g', postPrelimOutcome: 'lame' }] }] },
            },
            { breed: 'IB', stake: 'Open', finalDraw: { courses: [] } },
        ],
    },
};

const allRows = context.finalsJudgesMapRows(trial);
assert.equal(allRows.length, 3);
assert.equal(allRows[0].breed, 'WH');
assert.equal(allRows[0].entryCount, 1);
assert.equal(allRows[0].courseBreakdown, '1(1)');
assert.equal(allRows[1].breed, 'RR');
assert.equal(allRows[1].stake, 'Open A');
assert.equal(allRows[1].entryCount, 4);
assert.equal(allRows[1].runCount, 2);
assert.equal(allRows[1].courseBreakdown, '1(2) 2(2)');
assert.equal(allRows[1].judges, 'Judge One / Judge Two');
assert.equal(allRows[2].stake, 'Veteran');
assert.equal(Array.from(context.finalsJudgesMapRows(trial, 'north'), row => row.stake).join(','), 'Open A,Veteran');

console.log('Finals judges map uses actual courses, excludes outcomes, preserves field filtering, and prints assigned judges.');
