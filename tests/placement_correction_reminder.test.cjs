const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app/script.js', 'utf8');
let message;
const context = vm.createContext({
    finalsRowsForGroup: group => ((group.finalDraw || {}).courses || []).flatMap(course => course.hounds.map(hound => ({hound}))),
    groupTitle: group => group.stake,
    showMessage: (_, text, tone) => { message = {text, tone}; },
    document: {getElementById: () => ({})},
});
vm.runInContext(source.slice(source.indexOf('function placementReminderGroups('), source.indexOf('async function updateFinalResult(')), context);
const group = {id:'champions',stake:'Field Champion',finalDraw:{courses:[{hounds:[
    {entryId:'favor',placement:''}, {entryId:'other',placement:'4-NBQ Tie'},
]}]},runoffs:[{courses:[{hounds:[{entryId:'other',tieBreakScore:'145',tieBreakOutcome:'forfeit'}]}]}]};
const trial = {preliminaryDraw:{groups:[
    {id:'open',courses:[{hounds:[{entryId:'favor'}]}]},group,
]}};
const original = JSON.stringify(trial);
const before = {prelimScore:'131',prelimJudge1Score:'67',finalScore:'146',finalJudge1Score:'69'};
let groups = context.placementReminderGroups(trial,'favor',before,{...before,prelimScore:'141'},'prelim');
assert.deepEqual(Array.from(groups,g=>g.id),['champions'],'prelim corrections find the destination finals stake');
context.showPlacementCorrectionReminder(groups);
assert.equal(message.tone,'warning');
assert.match(message.text,/Reset Placements/);
assert.match(message.text,/clears.*tie runoff scores/);
assert.equal(context.placementReminderGroups(trial,'favor',before,{...before,finalScore:'156'},'final').length,1);
assert.equal(context.placementReminderGroups(trial,'favor',before,{...before,finalOutcome:'lame'},'final').length,1);
assert.equal(context.placementReminderGroups(trial,'favor',before,{...before,prelimScoreNotes:'note'},'prelim').length,0);
assert.equal(context.placementReminderGroups(trial,'favor',before,{...before},'final').length,0);
assert.equal(context.placementReminderGroups(trial,'missing',before,{finalScore:'156'},'final').length,0);
assert.equal(JSON.stringify(trial),original,'reminder must preserve all draws, scores, placements and runoff decisions');
const fresh = {preliminaryDraw:{groups:[{finalDraw:{courses:[{hounds:[{entryId:'favor'}]}]}}]}};
assert.equal(context.placementReminderGroups(fresh,'favor',{}, {finalScore:'146'},'final').length,0,'routine first scoring needs no reset reminder');
console.log('Placement correction reminder checks passed.');
