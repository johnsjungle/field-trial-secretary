const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/script.js','utf8');
const ctx=vm.createContext({clean:x=>String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,''),normalizeBreedCode:x=>({W:'WH',B:'BZ'}[x]||x),rulesForTrial:t=>({association:t.association}),isQuasiBreedGroup:()=>false,isPreliminaryDrawLocked:t=>Boolean(t.locked),ownerKey:e=>e.owner,secureShuffle:x=>[...x],secureChoice:x=>x[0]});
vm.runInContext(source.slice(source.indexOf('const AKC_REGION_STATES'),source.indexOf('function renderSplitStakeEligibility')),ctx);
const group=(n,breed='WH',stake='Open')=>({key:breed+'|'+stake,breed,stake,entries:Array.from({length:n},(_,i)=>({id:String(i),owner:String(i%3)}))});
for(const [n,sizes] of [[19,[19]],[20,[10,10]],[29,[15,14]],[30,[10,10,10]],[36,[12,12,12]]]) {
 const groups=ctx.splitEligibleStakeGroups([group(n)],{association:'ASFA'});assert.equal(groups.map(g=>g.entries.length).join(','),sizes.join(','));
}
const trial={association:'AKC',locationState:'PA',preliminaryDraw:{entriesFingerprint:'old',groups:[{id:'unchanged'}]}};
assert.equal(ctx.splitStakeRuleForGroup(trial,group(24)).eligible,false);
ctx.setSplitStakeOverride(trial,'W',12,'AKC direction for this trial');
assert.equal(ctx.splitStakeRuleForGroup(trial,group(24)).splitCount,2);
assert.equal(ctx.splitStakeRuleForGroup(trial,group(24,'WH','Veteran')).minimumPerSplit,12);
assert.equal(ctx.splitStakeRuleForGroup(trial,group(24,'RR')).minimumPerSplit,8);
assert.equal(ctx.splitStakeRuleForGroup({...trial,association:'ASFA'},group(24)).minimumPerSplit,10);
assert.equal(ctx.splitStakeRuleForGroup({association:'AKC',locationState:'PA'},group(24)).eligible,false);
assert.equal(trial.preliminaryDraw.groups[0].id,'unchanged');assert.equal(trial.preliminaryDraw.entriesFingerprint,'split-settings-changed');
assert.equal(ctx.splitStakeRuleForGroup(JSON.parse(JSON.stringify(trial)),group(24)).minimumPerSplit,12);
for(const value of ['',0,1,2.5,1001,'oops'])assert.throws(()=>ctx.setSplitStakeOverride(trial,'WH',value,'reason'));
assert.throws(()=>ctx.setSplitStakeOverride(trial,'WH',12,' '));
assert.throws(()=>ctx.setSplitStakeOverride({...trial,locked:true},'WH',13,'reason'));
assert.throws(()=>ctx.setSplitStakeOverride({...trial,locked:true},'WH',null,''));
ctx.setSplitStakeOverride(trial,'WH',null,'');assert.equal(ctx.splitStakeRuleForGroup(trial,group(24)).minimumPerSplit,15);assert.equal(trial.splitStakeOverrideHistory.length,2);
const asfa={association:'ASFA'};ctx.setSplitStakeOverride(asfa,'WH',12,'Documented exception');
assert.equal(ctx.splitStakeRuleForGroup(asfa,group(23)).eligible,false);assert.equal(ctx.splitStakeRuleForGroup(asfa,group(24)).splitCount,2);
assert.equal(ctx.splitStakeRuleForGroup(asfa,group(24,'WH','Singles')).eligible,false);
const unknown={association:'AKC'};ctx.setSplitStakeOverride(unknown,'WH',15,'Verified regional schedule');assert.equal(ctx.splitStakeRuleForGroup(unknown,group(30)).splitCount,2);
console.log('ASFA boundaries, AKC/ASFA overrides, breed/trial isolation, persistence, validation, reset, history and draw locks passed.');
