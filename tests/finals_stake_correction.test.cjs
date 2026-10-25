const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('app/script.js', 'utf8');
assert.match(source, /Finals Stake/);
assert.match(source, /buckets\.get\(key\)\.hounds\.push/);
assert.doesNotMatch(source, /isLciBreed\(/, 'finals stake controls must use HALO\'s existing LCI helper');

const stakeStart = source.indexOf('function finalsStakeForHound(');
const stakeEnd = source.indexOf('function finalsStakeOptionsForHound(', stakeStart);
const stakeContext = vm.createContext({});
vm.runInContext(source.slice(stakeStart, stakeEnd), stakeContext);
assert.equal(
    stakeContext.finalsStakeForHound({ stake: 'Open' }, { stake: 'Open' }, { className: 'Veteran' }),
    'Veteran',
    'an entry corrected before the explicit finalsStake marker existed should use its current stake',
);
assert.equal(
    stakeContext.finalsStakeForHound({ stake: 'Open' }, { stake: 'Open', finalsStake: 'Specials' }, { className: 'Veteran' }),
    'Specials',
    'an explicit finals stake correction should remain authoritative',
);

const resultsStart = source.indexOf('function resultsGroupsWithCorrectedStakes(');
const resultsEnd = source.indexOf('function renderMainResultsBook(', resultsStart);
const resultsContext = vm.createContext({
    structuredClone,
    clean: (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, ''),
    finalsStakeForHound: (group, hound, entry = {}) => hound.finalsStake || entry.className || hound.stake || group.stake || '',
});
vm.runInContext(source.slice(resultsStart, resultsEnd), resultsContext);
const correctedResults = resultsContext.resultsGroupsWithCorrectedStakes({
    entries: [{ id: 'roger', className: 'Veteran' }],
}, [{
    id: 'ah-open', breed: 'AH', stake: 'Open',
    courses: [{ number: 1, hounds: [{ entryId: 'roger', prelimScore: '152' }, { entryId: 'juju', prelimScore: '145' }] }],
}, {
    id: 'ah-veteran', breed: 'AH', stake: 'Veteran', courses: [],
    finalDraw: { courses: [{ number: 4, hounds: [{ entryId: 'roger', finalScore: '148' }] }] },
}]);
const correctedOpen = correctedResults.find((group) => group.id === 'ah-open');
const correctedVeteran = correctedResults.find((group) => group.id === 'ah-veteran');
assert.deepEqual(Array.from(correctedOpen.courses[0].hounds, (hound) => hound.entryId), ['juju']);
assert.deepEqual(Array.from(correctedVeteran.courses[0].hounds, (hound) => hound.entryId), ['roger']);
assert.equal(correctedVeteran.courses[0].hounds[0].prelimScore, '152');
assert.equal(correctedVeteran.finalDraw.courses[0].hounds[0].finalScore, '148');

const placementStart = source.indexOf('function recomputeFinalPlacements(');
const placementEnd = source.indexOf('function finalPlacementPartitions(', placementStart);
const placementContext = vm.createContext({
    readForm: () => ({}),
    finalsRowsForGroup: (group) => (group.finalDraw.courses || []).flatMap((course) => (
        (course.hounds || []).map((hound) => ({ course, hound }))
    )),
    groupScoreRows: (group) => (group.courses || []).flatMap((course) => (
        (course.hounds || []).map((hound) => ({ course, hound, score: hound.prelimScore, outcome: hound.prelimOutcome }))
    )),
    hasScoreValue: (value) => String(value ?? '').trim() !== '',
    finalPlacementPartitions: (rows) => [rows],
    placementQualifyingMinimum: () => 0,
    judgeCountForGroup: () => 2,
    assignFinalPlacementLabels: (rows, placements) => rows.forEach((row, index) => placements.set(row.entryId, String(index + 1))),
    resolveCompletedTieBreaks: () => {},
});
vm.runInContext(source.slice(placementStart, placementEnd), placementContext);
const placementTrial = {
    preliminaryDraw: { groups: [{
        id: 'ah-open', stake: 'Open',
        courses: [{ number: 1, hounds: [{ entryId: 'roger', prelimScore: '152', finalsStake: 'Veteran' }] }],
    }, {
        id: 'ah-veteran', stake: 'Veteran',
        courses: [{ number: 1, hounds: [{ entryId: 'flower', prelimScore: '155' }] }],
    }] },
};
const placementGroup = {
    id: 'ah-veteran', stake: 'Veteran', courses: placementTrial.preliminaryDraw.groups[1].courses,
    finalDraw: { courses: [{ number: 1, hounds: [
        { entryId: 'roger', finalScore: '148' },
        { entryId: 'flower', finalScore: '151' },
    ] }] },
};
const recomputed = placementContext.recomputeFinalPlacements(placementGroup, placementTrial);
const recomputedById = new Map(recomputed.finalDraw.courses[0].hounds.map((hound) => [hound.entryId, hound]));
assert.equal(recomputedById.get('roger').combinedScore, '300');
assert.equal(recomputedById.get('roger').placement, '2');
assert.equal(recomputedById.get('flower').combinedScore, '306');
assert.equal(recomputedById.get('flower').placement, '1');

const start = source.indexOf('async function updateFinalsStake(');
const end = source.indexOf('function updatePrelimScore(', start);
assert.ok(start >= 0 && end > start, 'finals stake correction helper should exist');

const trial = {
    entries: [{ id: 'moved', className: 'Open' }],
    preliminaryDraw: {
        groups: [{
            id: 'rr-open',
            breed: 'RR',
            stake: 'Open',
            courses: [{ number: 2, hounds: [{
                entryId: 'moved',
                stake: 'Open',
                blanketColor: 'Pink',
                prelimJudge1Score: '74',
                prelimJudge2Score: '75',
                prelimScore: '149',
            }] }],
            finalDraw: { courses: [{ number: 1, hounds: [{ entryId: 'moved' }] }] },
        }],
    },
    scorebook: {},
    bobRunoffs: [],
};
let savedTrial = null;
let message = '';
const context = vm.createContext({
    readForm: () => structuredClone(trial),
    finalsRowsForGroup: (group) => ((group.finalDraw || {}).courses || []).flatMap((course) => (course.hounds || []).map((hound) => ({ course, hound }))),
    hasScoreValue: (value) => String(value || '').trim() !== '',
    buildTrialResultState: () => ({}),
    clean: (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, ''),
    upsertTrial: (value) => { savedTrial = value; },
    saveTrials: () => {},
    showMessage: (_element, value) => { message = value; },
    document: { getElementById: () => ({}) },
    render: () => {},
    structuredClone,
});
vm.runInContext(source.slice(start, end), context);

(async () => {
    await context.updateFinalsStake('rr-open', 'moved', 'Specials');
    const group = savedTrial.preliminaryDraw.groups[0];
    const hound = group.courses[0].hounds[0];
    assert.equal(savedTrial.entries[0].className, 'Specials');
    assert.equal(hound.finalsStake, 'Specials');
    assert.equal(hound.prelimScore, '149');
    assert.equal(hound.blanketColor, 'Pink');
    assert.equal(group.courses[0].number, 2);
    assert.equal(group.finalDraw, null);
    assert.match(message, /Preliminary course, blanket color, and scores were preserved/);

    const buildStart = source.indexOf('async function buildFinalsDrawForBreed(');
    const buildEnd = source.indexOf('function buildFinalDrawFromHounds(', buildStart);
    const drawTrial = {
        entries: [{ id: 'stay-open', className: 'Open' }, { id: 'moved', className: 'Specials' }, { id: 'stay-specials', className: 'Specials' }],
        preliminaryDraw: { groups: [{
            id: 'rr-open', breed: 'RR', stake: 'Open',
            courses: [{ number: 1, hounds: [
                { entryId: 'stay-open', stake: 'Open', prelimScore: '145' },
                { entryId: 'moved', stake: 'Open', finalsStake: 'Specials', prelimScore: '149' },
            ] }],
        }, {
            id: 'rr-specials', breed: 'RR', stake: 'Specials',
            courses: [{ number: 1, hounds: [{ entryId: 'stay-specials', stake: 'Specials', prelimScore: '151' }] }],
        }] },
        scorebook: {},
    };
    let drawnTrial = null;
    const drawContext = vm.createContext({
        readForm: () => structuredClone(drawTrial),
        clean: (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, ''),
        document: { getElementById: () => ({}) },
        showMessage: () => {}, render: () => {}, saveTrials: () => {},
        prelimScoreRequirementsForGroup: () => [],
        showTrialConfirm: async () => true,
        groupScoreRows: (group) => (group.courses || []).flatMap((course) => (course.hounds || []).map((hound) => ({ group, course, hound, score: hound.prelimScore, outcome: hound.prelimOutcome }))),
        hasScoreValue: (value) => String(value || '').trim() !== '',
        finalsStakeForHound: (sourceGroup, sourceHound) => sourceHound.finalsStake || sourceHound.stake || sourceGroup.stake,
        isQuasiBreedGroup: () => false,
        buildFinalDrawFromHounds: (hounds) => ({ courses: [{ number: 1, hounds: hounds.map((hound) => ({ ...hound })) }] }),
        upsertTrial: (value) => { drawnTrial = value; },
        crypto: { randomUUID: () => 'new-group' },
        structuredClone,
    });
    vm.runInContext(source.slice(buildStart, buildEnd), drawContext);
    await drawContext.buildFinalsDrawForBreed('RR');
    const openFinalists = drawnTrial.preliminaryDraw.groups.find((item) => item.id === 'rr-open').finalDraw.courses[0].hounds;
    const specialsFinalists = drawnTrial.preliminaryDraw.groups.find((item) => item.id === 'rr-specials').finalDraw.courses[0].hounds;
    assert.deepEqual(Array.from(openFinalists, (hound) => hound.entryId), ['stay-open']);
    assert.deepEqual(Array.from(specialsFinalists, (hound) => hound.entryId), ['moved', 'stay-specials']);
    assert.equal(drawTrial.preliminaryDraw.groups[0].courses[0].hounds[1].prelimScore, '149');
    console.log('Finals stake correction preserves completed preliminary scoring.');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
