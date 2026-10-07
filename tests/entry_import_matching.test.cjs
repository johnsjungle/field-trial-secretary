const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('app/script.js', 'utf8');
const start = source.indexOf('function importedHoundNeedsReview(');
const end = source.indexOf('function createHoundFromImportedEntry(', start);

assert.ok(start >= 0, 'import review helpers should exist');
assert.ok(end > start, 'import matching function block should be extractable');

const context = vm.createContext({
    clean(value) {
        return String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '');
    },
    normalizeImportedLciParts() {
        return null;
    },
    masterHounds: [
        {
            id: 'halo',
            callName: 'Halo',
            registeredName: 'Kamars God Speed',
            breed: 'IB',
            registrationNumber: 'HP123456/07',
            alternateRegistrationNumber: 'ASFA999',
        },
        {
            id: 'comet',
            callName: 'Comet',
            registeredName: 'Fast Comet Rising',
            breed: 'RR',
            registrationNumber: 'HP765432/01',
            alternateRegistrationNumber: '',
        },
    ],
});

vm.runInContext(source.slice(start, end), context);

const exactRegistration = context.matchImportedHound({ registrationNumber: 'HP 123456-07' });
assert.equal(exactRegistration.hound.id, 'halo');
assert.equal(exactRegistration.type, 'registration');

const wrongDigit = { registrationNumber: 'HP123456/08', registeredName: '', callName: '', breed: 'IB' };
assert.equal(context.matchImportedHound(wrongDigit).hound, null, 'a registration typo must not silently auto-match');
assert.equal(context.importedHoundPossibleMatches(wrongDigit)[0].id, 'halo', 'a one-character registration typo should be suggested');

const transposedDigits = { registrationNumber: 'HP123465/07', registeredName: '', callName: '', breed: 'IB' };
assert.equal(context.matchImportedHound(transposedDigits).hound, null, 'transposed digits must require review');
assert.equal(context.importedHoundPossibleMatches(transposedDigits)[0].id, 'halo', 'transposed digits should suggest the existing hound');

const exactName = context.matchImportedHound({
    registrationNumber: 'HP000000/00',
    registeredName: "Kamar's God Speed",
    callName: '',
    breed: 'IB',
});
assert.equal(exactName.hound.id, 'halo');
assert.equal(exactName.type, 'registered name');

const nameTypo = { registrationNumber: '', registeredName: 'Kamars God Spead', callName: '', breed: 'IB' };
assert.equal(context.matchImportedHound(nameTypo).hound, null, 'a near name must not silently auto-match');
assert.equal(context.importedHoundPossibleMatches(nameTypo)[0].id, 'halo', 'a near registered name should be suggested');

const exactCallAndBreed = context.matchImportedHound({ callName: 'HALO', breed: 'IB' });
assert.equal(exactCallAndBreed.hound.id, 'halo');
assert.equal(exactCallAndBreed.type, 'call name + breed');

assert.equal(context.importedHoundNeedsReview({ selected: true, firstTime: false, match: null }), true);
assert.equal(context.importedHoundNeedsReview({ selected: true, firstTime: true, match: null }), false);
assert.equal(context.importedHoundNeedsReview({ selected: true, firstTime: false, match: null, houndMatchReviewed: true }), false);
assert.equal(context.importedHoundNeedsReview({ selected: false, firstTime: false, match: null }), false);
assert.equal(context.importedHoundNeedsReview({ selected: true, firstTime: false, match: context.masterHounds[0] }), false);

console.log('Entry import hound matching checks passed.');
