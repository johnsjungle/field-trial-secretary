const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app/script.js', 'utf8');
const clean = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const context = vm.createContext({
    clean,
    runGroupBreedForEntry: entry => entry.className === 'Singles' ? 'Singles' : entry.breed,
    runGroupStakeForEntry: entry => entry.className,
    entriesChangedAfterRunPlan: trial => Boolean(trial?.staleRunPlan),
    isPreliminaryDrawLocked: trial => Boolean(trial?.scored),
});
vm.runInContext(source.slice(source.indexOf('function trialEntrySyncIssues('), source.indexOf('function entriesChangedAfterPrinted(')), context);
const fixture = () => ({ entries: [{ id: 'one', callName: 'Halo', breed: 'IB', className: 'Open', rollCallStatus: 'present' }],
    preliminaryDraw: { groups: [{ id: 'open', breed: 'IB', stake: 'Open', courses: [{ number: 1, hounds: [{ entryId: 'one', stake: 'Open' }] }] }] } });
let trial = fixture();
assert.equal(context.trialEntrySyncWarning(trial), null);
trial.entries[0].className = 'FCh';
assert.match(context.trialEntrySyncIssues(trial)[0], /Halo: entry is IB FCh, but the draw is IB Open/);
assert.equal(context.trialEntrySyncWarning(trial).entrySyncWarning, true);
trial.scored = true;
assert.match(context.trialEntrySyncWarning(trial).detail, /Do not rebuild prelims/);
trial.preliminaryDraw.groups[0].courses[0].hounds[0].finalsStake = 'FCh';
assert.equal(context.trialEntrySyncWarning(trial), null, 'explicit safe finals correction resolves original prelim stake mismatch');
trial.preliminaryDraw.groups.push({ breed: 'IB', stake: 'FCh', courses: [], finalDraw: { courses: [{ hounds: [{ entryId: 'one', stake: 'FCh' }] }] } });
assert.equal(context.trialEntrySyncWarning(trial), null);
trial.preliminaryDraw.groups[1].finalDraw.courses[0].hounds[0].stake = 'Open';
assert.match(context.trialEntrySyncIssues(trial)[0], /draw is IB Open/, 'existing finals in the wrong stake still warn');
trial = fixture();
trial.entries.push({ id: 'late', callName: 'Late Arrival', breed: 'IB', className: 'Open', rollCallStatus: 'not_checked' });
assert.match(context.trialEntrySyncIssues(trial)[0], /Late Arrival: missing.*finish roll call/);
trial.entries[1].rollCallStatus = 'absent';
assert.equal(context.trialEntrySyncIssues(trial).length, 0, 'absent hounds need no draw');
trial.entries[1].rollCallStatus = 'lame';
assert.equal(context.trialEntrySyncIssues(trial).length, 0);
trial.archivedAt = '2026-10-25';
assert.equal(context.trialEntrySyncIssues(trial).length, 0);
trial = fixture();
trial.preliminaryDraw.groups[0].mixedStake = true;
trial.preliminaryDraw.groups[0].stake = 'Mixed';
assert.equal(context.trialEntrySyncIssues(trial).length, 0, 'mixed groups compare the individual hound stake');
trial.entries[0].className = 'Specials';
trial.preliminaryDraw.groups[0].courses[0].hounds[0].stake = 'FCh';
assert.equal(context.trialEntrySyncIssues(trial).length, 0, 'champion aliases are equivalent');

const buildStart = source.indexOf('async function buildPreliminaryDraw(');
const buildEnd = source.indexOf('const AKC_REGION_STATES', buildStart);
let confirmations = 0, destinations = [], builds = 0;
let answer = true;
Object.assign(context, {
    readForm: () => trial,
    showTrialConfirm: async () => { confirmations++; return answer; },
    goToWorkflowStep: step => destinations.push(step.tab),
    showPreliminaryDrawLockedMessage: () => { throw Error('unexpected locked draw path'); },
    render: () => {},
    enrichEntryForRollCall: entry => entry,
    groupEntriesByBreedAndStake: () => [],
    buildDrawGroup: value => value,
    entryDrawFingerprint: () => 'new fingerprint',
    upsertTrial: () => { builds++; }, saveTrials: () => {}, showMessage: () => {},
    rollCallMessage: {}, crypto: { randomUUID: () => 'new-draw' },
});
vm.runInContext(source.slice(buildStart, buildEnd), context);
(async () => {
    trial = fixture(); trial.staleRunPlan = true;
    await context.buildPreliminaryDraw();
    assert.equal(confirmations, 1);
    assert.equal(builds, 0, 'outdated run plan cannot silently draw');
    assert.deepEqual(destinations, ['runplan']);
    trial.staleRunPlan = false;
    trial.entries[0].className = 'FCh';
    answer = false;
    await context.buildPreliminaryDraw();
    assert.equal(builds, 0, 'cancel preserves existing draw');
    answer = true;
    await context.buildPreliminaryDraw();
    assert.equal(builds, 1, 'reviewed current entries can rebuild an unscored draw');
    trial = fixture(); trial.scored = true; trial.entries[0].className = 'FCh';
    await context.buildPreliminaryDraw();
    assert.equal(builds, 1, 'scored prelims remain intact');
    assert.equal(destinations.at(-1), 'scoring');
    console.log('Entry/draw mismatch warnings and preliminary draw popup checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
