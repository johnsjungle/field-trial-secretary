const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let trial;
function sizes(n){if(n<=3)return[n];const result=[];while(n>0){if(n===4){result.push(2,2);break;}const size=Math.min(3,n);result.push(size);n-=size;}return result;}
const colors=['YELLOW','PINK','BLUE'];
const ctx=vm.createContext({
    crypto:require('node:crypto').webcrypto,structuredClone,secureShuffle:x=>[...x],
    normalizeBreedCode:x=>x,courseSizesForEntryCount:sizes,
    bifState:t=>t.scorebook.bif,readForm:()=>structuredClone(trial),
    selectedBifEntryIds:b=>new Set(b.selectedEntryIds),
    bifCandidateHoundsForTrial:t=>t.scorebook.bif.bieCandidates,
    upsertTrial:t=>{trial=t},saveTrials:()=>{},render:()=>{},showMessage:()=>{},bifMessage:{},manualDrawEditKey:'',
    normalizeBifDrawColors:d=>({...d,courses:d.courses.map(c=>({...c,hounds:c.hounds.map((h,i)=>({...h,bifBlanketColor:colors[i],blanketColor:colors[i],drawPosition:i+1}))}))}),
});
vm.runInContext(fs.readFileSync('app/bie.js','utf8')+'\n'+fs.readFileSync('app/bie_rounds.js','utf8'),ctx);

const specs=[['w1','WH'],['w2','WH'],['w3','WH'],['w4','WH'],['g1','GH'],['g2','GH'],['r1','RR']];
const candidates=specs.map(([entryId,breed])=>({entryId,name:entryId,breed,hound:{entryId,callName:entryId,breed}}));
const hounds=candidates.map(candidate=>({...candidate.hound}));
const plan=ctx.buildBiePreQualifierPlan(hounds);
assert.equal(plan.carryEntryIds.join(','),'r1');
assert.equal(plan.courses.length,3);
assert.deepEqual(JSON.parse(JSON.stringify(plan.courses.map(course=>course.hounds.map(h=>h.breed)))),[['WH','WH'],['WH','WH'],['GH','GH']]);

trial={scorebook:{bif:{eventType:'BIE',elimination:true,preQualifierEnabled:true,biePhase:'prequalifier',dogsPerCourse:3,judge1:'Judge',
    selectedEntryIds:candidates.map(c=>c.entryId),statusByEntryId:Object.fromEntries(candidates.map(c=>[c.entryId,'running'])),bieCandidates:candidates,
    preQualifierCarryEntryIds:plan.carryEntryIds,preQualifierHistory:[],roundHistory:[],draw:ctx.normalizeBifDrawColors({courses:plan.courses}),outcomes:{},courseWinners:{}}}};
function scoreCurrent(){const outcomes={};for(const course of trial.scorebook.bif.draw.courses)course.hounds.forEach((hound,index)=>outcomes[hound.entryId]={score:String(95-index)});trial.scorebook.bif.outcomes=outcomes;}
scoreCurrent();ctx.advanceBieRound();
assert.equal(trial.scorebook.bif.biePhase,'prequalifier');
assert.equal(trial.scorebook.bif.preQualifierHistory.length,1);
assert.equal(trial.scorebook.bif.draw.courses.length,1);
assert(trial.scorebook.bif.draw.courses[0].hounds.every(h=>h.breed==='WH'));
assert.equal(trial.scorebook.bif.preQualifierCarryEntryIds.length,2);

scoreCurrent();ctx.advanceBieRound();
assert.equal(trial.scorebook.bif.biePhase,'main');
assert.equal(trial.scorebook.bif.preQualifierHistory.length,2);
assert.equal(trial.scorebook.bif.selectedEntryIds.length,3);
assert.equal(trial.scorebook.bif.draw.courses.length,1);
assert.equal(trial.scorebook.bif.draw.courses[0].hounds.length,3);
assert.deepEqual([...new Set(trial.scorebook.bif.draw.courses[0].hounds.map(h=>h.breed))].sort(),['GH','RR','WH']);
assert.equal(Object.values(trial.scorebook.bif.statusByEntryId).filter(value=>value==='running').length,3);
console.log('BIE pre-qualifier passed: same-breed playoffs, multi-round breed reduction, carry-forward, and three-dog main elimination.');
