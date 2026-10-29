const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app/script.js', 'utf8');
const context = vm.createContext({
    clean: value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
    entriesForRunGroupBreed: (trial, breed) => trial.entries.filter(entry => entry.breed === breed),
    runGroupStakeForEntry: entry => entry.className,
    mixedStakeEligibilityForEntries: () => ({eligible:false}),
    mixedStakeBreedEnabled: () => false,
    courseSizesForEntryCount: count => Array(Math.ceil(count / 3)).fill(3),
});
vm.runInContext(source.slice(source.indexOf('function workerSheetStakeRuns('), source.indexOf('function renderJudgesMap(')), context);
const fixture = (association, counts) => ({ association,
    entries: Object.entries(counts).flatMap(([className, count]) => Array.from({length:count}, (_, i) => ({id:`${className}-${i}`,breed:'WH',className}))),
});
let counts = context.workerSheetStakeRuns(fixture('AKC',{Open:10,Specials:2,Veteran:2}),'WH');
assert.equal(counts.total,14);
assert.equal(counts.open,'4(10)');
assert.equal(counts.fchExc,'1(2)');
assert.equal(counts.vet,'1(2)');
for (const alias of ['Specials','Special','Field Champion','FCh','FC',' specials ']) {
    counts=context.workerSheetStakeRuns(fixture('AKC',{[alias]:5}),'WH');
    assert.equal(counts.fchExc,'2(5)',alias);
    assert.equal(counts.total,5,alias);
}
counts=context.workerSheetStakeRuns(fixture('ASFA',{Open:3,'Field Champion':4,Veteran:2}),'WH');
assert.equal(counts.open,'1(3)');
assert.equal(counts.fchExc,'2(4)');
assert.equal(counts.vet,'1(2)');
counts=context.workerSheetStakeRuns(fixture('ASFA',{Excellent:3}),'WH');
assert.equal(counts.fchExc,'1(3)');
counts=context.workerSheetStakeRuns(fixture('ASFA',{Singles:2}),'WH');
assert.equal(counts.open,'1(2)');
assert.equal(counts.fchExc,'');
assert.equal(context.workerSheetStakeRuns({entries:[]},'WH').total,0);
console.log('Worker sheet includes AKC Specials aliases and preserves ASFA, LCI Excellent, Singles and empty counts.');
