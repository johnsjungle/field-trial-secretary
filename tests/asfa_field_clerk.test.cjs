const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('app/script.js', 'utf8');
const validation = source.slice(
    source.indexOf('function validateTrialBasics('),
    source.indexOf('function upsertTrial('),
);
const validationContext = vm.createContext({});
vm.runInContext(validation, validationContext);

const validTrial = {
    trialName: 'Sunday Trial',
    clubName: 'Example Club',
    startsOn: '2026-09-13',
    endsOn: '2026-09-13',
    trialType: 'all_breed',
};

assert.equal(
    validationContext.validateTrialBasics({ ...validTrial, association: 'ASFA', fieldClerk: '' }),
    'Field clerk is required for ASFA trials.',
);
assert.equal(
    validationContext.validateTrialBasics({ ...validTrial, association: 'asfa', fieldClerk: '   ' }),
    'Field clerk is required for ASFA trials.',
);
assert.equal(validationContext.validateTrialBasics({ ...validTrial, association: 'ASFA', fieldClerk: 'Jamie Clerk' }), '');
assert.equal(validationContext.validateTrialBasics({ ...validTrial, association: 'AKC', fieldClerk: '' }), '');

const elements = {
    association: { disabled: false },
    lciOffered: { checked: true, disabled: false },
    fieldClerk: {
        required: false,
        setAttribute(name, value) { this[name] = value; },
    },
    fieldClerkRequirement: { hidden: true },
};
const controlContext = vm.createContext({
    document: { getElementById: (id) => elements[id] || null },
    associationHasStarted: () => false,
    rulesForTrial: (trial) => ({ association: trial.association, lciAllowed: true }),
    populateEntryBreedSelect: () => {},
    renderClassOptions: () => {},
    getSelectedTrial: () => null,
});
const controlSource = source.slice(
    source.indexOf('function applyAssociationControlState('),
    source.indexOf('const adminPageTabs'),
);
vm.runInContext(controlSource, controlContext);

controlContext.applyAssociationControlState({ association: 'ASFA' });
assert.equal(elements.fieldClerk.required, true);
assert.equal(elements.fieldClerk['aria-required'], 'true');
assert.equal(elements.fieldClerkRequirement.hidden, false);

controlContext.applyAssociationControlState({ association: 'AKC' });
assert.equal(elements.fieldClerk.required, false);
assert.equal(elements.fieldClerk['aria-required'], 'false');
assert.equal(elements.fieldClerkRequirement.hidden, true);

console.log('ASFA trial setup requires a field clerk while AKC setup remains optional.');
