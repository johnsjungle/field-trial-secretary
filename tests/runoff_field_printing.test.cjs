const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('app/script.js', 'utf8');
const start = source.indexOf('function runoffPrintTrial(');
const end = source.indexOf('function judgesForRunoffItem(', start);
assert.ok(start >= 0 && end > start, 'runoffPrintTrial source block should exist');

const northRunoff = {
    courses: [{
        number: 1,
        hounds: [
            { entryId: 'rr-open', callName: 'Open', tieBreakBlanketColor: 'Yellow', tieBreakCode: '1Y' },
            { entryId: 'rr-forfeit', callName: 'Forfeit', tieBreakBlanketColor: 'Pink', tieBreakCode: '1P', tieBreakOutcome: 'forfeit' },
            { entryId: 'rr-vet', callName: 'Vet', tieBreakBlanketColor: 'Blue', tieBreakCode: '1B', manuallyMoved: true },
        ],
    }],
};
const southRunoff = {
    courses: [{
        number: 1,
        hounds: [
            { entryId: 'wh-one', callName: 'One', tieBreakBlanketColor: 'Yellow', tieBreakCode: '1Y' },
            { entryId: 'wh-two', callName: 'Two', tieBreakBlanketColor: 'Pink', tieBreakCode: '1P' },
        ],
    }],
};
const items = [
    {
        id: 'north-runoff',
        type: 'tie',
        breed: 'RR',
        group: { breed: 'RR', stake: 'Open', flight: 'A' },
        tie: { label: '1-2 Tie' },
        title: 'RR runoff',
        subtitle: '',
        runoff: northRunoff,
    },
    {
        id: 'south-runoff',
        type: 'tie',
        breed: 'WH',
        group: { breed: 'WH', stake: 'Open', flight: 'A' },
        tie: { label: '1-2 Tie' },
        title: 'WH runoff',
        subtitle: '',
        runoff: southRunoff,
    },
];

const context = vm.createContext({
    console,
    Date,
    clean: (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, ''),
    collectRunoffItems: () => items,
    drawnRunoffForItem: (_trial, item) => item.runoff,
    groupTitle: (group) => group.breed + ' ' + group.stake,
    judgesForRunoffItem: () => [],
});
vm.runInContext(source.slice(start, end), context);

const result = context.runoffPrintTrial({
    id: 'trial-1',
    trialName: 'Major Event',
    eventFields: [
        { id: 'north', name: 'North Field' },
        { id: 'south', name: 'South Field' },
    ],
    runPlan: [
        { breed: 'RR', fieldId: 'north' },
        { breed: 'WH', fieldId: 'south' },
    ],
});

assert.deepEqual(
    Array.from(result.runPlan, (row) => row.fieldId),
    ['north', 'south'],
    'synthetic runoff run plan should retain each breed field assignment',
);
assert.equal(result.preliminaryDraw.groups.length, 2);
const northHounds = result.preliminaryDraw.groups[0].courses[0].hounds;
assert.deepEqual(Array.from(northHounds, (hound) => hound.entryId), ['rr-open', 'rr-vet']);
assert.equal(northHounds[1].blanketColor, 'Blue', 'manual runoff blanket changes must reach printed paperwork');
assert.ok(!northHounds.some((hound) => hound.entryId === 'rr-forfeit'), 'forfeited hounds must not reach printed runoff paperwork');
console.log('Runoff print trial retains field assignments and current manual draw while excluding non-running hounds.');
