const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('app/script.js', 'utf8');
assert.match(source, /Finals Status/);
assert.match(source, /postPrelimOutcome/);
assert.equal(
    (source.match(/hasScoreValue\(row\.score\) && !row\.outcome && !row\.hound\.postPrelimOutcome/g) || []).length,
    2,
    'both stake and breed finals builders must exclude post-prelim withdrawals',
);

const start = source.indexOf('function removeHoundFromFinalDraw(');
const end = source.indexOf('function updatePrelimScore(', start);
assert.ok(start >= 0 && end > start, 'post-prelim finals status helpers should exist');

let savedTrial = null;
let message = null;
const trial = {
    preliminaryDraw: {
        groups: [{
            id: 'rr-open',
            breed: 'RR',
            courses: [{ number: 1, hounds: [{ entryId: 'lame', prelimScore: '75', prelimJudge1Score: '75' }] }],
            finalDraw: {
                courses: [{
                    id: 'course-1',
                    number: 1,
                    hounds: [
                        { entryId: 'a', finalScore: '150' },
                        { entryId: 'lame', finalScore: '' },
                        { entryId: 'c', finalScore: '148' },
                    ],
                }],
            },
        }],
    },
    bobRunoffs: [],
    bobRunoffOutcomes: {},
    scorebook: {},
};
const context = vm.createContext({
    normalizeDrawHoundsForType: (hounds) => hounds.map((hound) => ({ ...hound })),
    auditDrawChange: (draw) => draw,
    readForm: () => structuredClone(trial),
    recomputeFinalPlacements: (group) => group,
    clean: (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, ''),
    runoffRows: () => [],
    bifState: () => ({}),
    upsertTrial: (value) => { savedTrial = value; },
    saveTrials: () => {},
    showMessage: (_element, text, tone) => { message = { text, tone }; },
    document: { getElementById: () => ({}) },
    render: () => {},
    finalsRowsForGroup: (group) => ((group.finalDraw || {}).courses || []).flatMap((course) => (course.hounds || []).map((hound) => ({ course, hound }))),
    hasScoreValue: (value) => String(value || '').trim() !== '',
    scoreOutcomeLabel: (value) => ({ lame: 'LAME' }[value] || value),
    structuredClone,
});
vm.runInContext(source.slice(start, end), context);

const original = {
    courses: [{
        id: 'course-1',
        number: 1,
        hounds: [
            { entryId: 'a', finalScore: '150' },
            { entryId: 'lame', finalScore: '' },
            { entryId: 'c', finalScore: '148' },
        ],
    }],
};
const result = context.removeHoundFromFinalDraw(original, 'lame');

assert.equal(result.removed, true);
assert.deepEqual(Array.from(result.draw.courses[0].hounds, (hound) => hound.entryId), ['a', 'c']);
assert.equal(result.draw.courses[0].hounds[0].finalScore, '150');
assert.equal(original.courses[0].hounds.length, 3, 'removal must not mutate the saved source draw in place');

context.updatePostPrelimOutcome('rr-open', 'lame', 'lame');
const savedGroup = savedTrial.preliminaryDraw.groups[0];
assert.equal(savedGroup.courses[0].hounds[0].prelimScore, '75', 'the preliminary score must be preserved');
assert.equal(savedGroup.courses[0].hounds[0].postPrelimOutcome, 'lame');
assert.deepEqual(Array.from(savedGroup.finalDraw.courses[0].hounds, (hound) => hound.entryId), ['a', 'c']);
assert.match(message.text, /preliminary score was preserved/);

trial.preliminaryDraw.groups[0].finalDraw.courses[0].hounds.find((hound) => hound.entryId === 'lame').finalScore = '149';
savedTrial = null;
context.updatePostPrelimOutcome('rr-open', 'lame', 'lame');
assert.equal(savedTrial, null, 'a Finals Status change must not silently discard an existing finals score');
assert.match(message.text, /Clear that result first/);

const completionStart = source.indexOf('function finalsDrawComplete(');
const completionEnd = source.indexOf('function runoffNeedsExist(', completionStart);
const completionContext = vm.createContext({
    groupHasPrelimHounds: () => true,
    groupNeedsFinalDraw: () => false,
    groupHasFinalHounds: () => false,
    finalsScoreRows: () => [],
    hasScoreValue: (value) => String(value || '').trim() !== '',
});
vm.runInContext(source.slice(completionStart, completionEnd), completionContext);
const allWithdrawnTrial = { preliminaryDraw: { groups: [{ courses: [{ hounds: [{ entryId: 'lame' }] }] }] } };
assert.equal(completionContext.finalsDrawComplete(allWithdrawnTrial), true, 'an all-withdrawn stake should not require an empty finals draw');
assert.equal(completionContext.finalsScoringComplete(allWithdrawnTrial), true, 'an all-withdrawn stake should not block trial completion');
console.log('Post-preliminary finals status preserves scores and removes unavailable hounds from finals draws.');
