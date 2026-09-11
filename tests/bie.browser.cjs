const {chromium}=require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const assert=require('assert');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{const p=await b.newPage({viewport:{width:1440,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>r.request().method()==='GET'?r.continue():r.fulfill({json:{ok:true}}));await p.goto('http://127.0.0.1:8765/');await p.locator('#startupSplash').waitFor({state:'detached'});
const result=await p.evaluate(()=>{
 const base=structuredClone(readForm()); const before=JSON.stringify(base);
 const first={...base,id:'day1',startsOn:'2026-09-09',entries:[{id:'same-id',breed:'SD',callName:'Yesterday',registeredName:'Registered One',registrationNumber:'R1',className:'Open'}],preliminaryDraw:{groups:[]},resultState:{bifEligibleEntryIds:['same-id']},scorebook:{}};
 const second={...first,id:'day2',entries:[{...first.entries[0],breed:'DH'},{id:'extra',breed:'WH',callName:'Third points',registrationNumber:'R2',className:'Open'}]};
 const a=bieSourceCandidates(first,true), all=bieSourceCandidates(second,false);
 const merged=mergeBieCandidates(a,all);
 const event={...base,scorebook:{bif:{eventType:'BIE',bieCandidates:merged,selectedEntryIds:merged.map(c=>c.entryId),statusByEntryId:Object.fromEntries(merged.map(c=>[c.entryId,'running']))}},resultState:{bifEligibleEntryIds:[]}};
 reconcileBifStateWithBobWinners(event);
 renderBifBieCheck(event);
 return {count:merged.length,source:a[0].sourceLabel,keys:merged.map(c=>c.entryId),eligible:bifCandidateHoundsForTrial(event).length,selected:event.scorebook.bif.selectedEntryIds.length,unchanged:before===JSON.stringify(base),ui:document.getElementById('bifBiePanel').textContent};
});assert.equal(result.count,2);assert.equal(result.eligible,2);assert.equal(result.selected,2);assert(result.source.includes('2026-09-09'));assert(result.unchanged);assert(result.ui.includes('Running BIE'));assert(result.ui.includes('Add Selected Hound'));assert(result.ui.includes('2 — elimination pairs'));assert(result.ui.includes('Keep like breeds together'));assert.notEqual(result.keys[0],result.keys[1]);const drawCheck=await p.evaluate(async()=>{
 const originalRead=readForm, originalUpsert=upsertTrial, originalSave=saveTrials, originalRender=render, originalRecalculate=recalculateTrialResults, originalRunning=currentBifRunningEntryIds, originalConfirm=showTrialConfirm;
 let t={id:'bie-test',entries:[],scorebook:{bif:{eventType:'BIE',judge1:'Test Judge',bieCandidates:[{entryId:'bie:day1:a',name:'Visitor',breed:'DH',stake:'Open',hound:{entryId:'bie:day1:a',callName:'Visitor',breed:'DH',registrationNumber:'R1'}}],selectedEntryIds:['bie:day1:a'],statusByEntryId:{'bie:day1:a':'running'}}}};
 let writes=0;
 try {readForm=()=>structuredClone(t);upsertTrial=x=>{t=x;writes++};saveTrials=()=>{};render=()=>{};recalculateTrialResults=()=>{};currentBifRunningEntryIds=x=>new Set(x.selectedEntryIds);showTrialConfirm=async()=>false;
 await buildBifDraw();const created=!!t.scorebook.bif.draw;const print=bifDrawPrintTrial(t);const before=JSON.stringify(t);await buildBifDraw();const canceled=before===JSON.stringify(t);await updateBifStatus('bie:day1:a','not_running');return {created,canceled,statusCanceled:before===JSON.stringify(t),writes,phase:print.preliminaryDraw.groups[0].phase};
 } finally {readForm=originalRead;upsertTrial=originalUpsert;saveTrials=originalSave;render=originalRender;recalculateTrialResults=originalRecalculate;currentBifRunningEntryIds=originalRunning;showTrialConfirm=originalConfirm;}
});assert(drawCheck.created);assert(drawCheck.canceled);assert(drawCheck.statusCanceled);assert.equal(drawCheck.writes,1);assert.equal(drawCheck.phase,'bie');assert.deepEqual(errors,[]);console.log('BIE browser checks passed: multi-day BOB import, manual entrants, SD/DH deduplication, source dates, reconciliation, BIE UI, no source mutation.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
