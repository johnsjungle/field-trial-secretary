const {chromium}=require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().method()==='GET'?route.continue():route.fulfill({json:{ok:true}}));
  await page.goto('http://127.0.0.1:8765/');await page.locator('#startupSplash').waitFor({state:'detached'});
  const result=await page.evaluate(async()=>{
   const specs=[['w1','WH'],['w2','WH'],['w3','WH'],['g1','GH'],['g2','GH'],['r1','RR']];
   const candidates=specs.map(([entryId,breed])=>({entryId,name:entryId,breed,stake:'Open',registrationNumber:'R-'+entryId,hound:{entryId,callName:entryId,breed}}));
   let state={id:'prequal-browser',association:'ASFA',archivedAt:'',judges:[],entries:[],scorebook:{bif:{eventType:'BIE',elimination:true,preQualifierEnabled:true,judge1:'Judge',selectedEntryIds:candidates.map(c=>c.entryId),statusByEntryId:Object.fromEntries(candidates.map(c=>[c.entryId,'running'])),bieCandidates:candidates}}};
   const old={readForm,upsertTrial,saveTrials,render,recalculateTrialResults};
   try{
    readForm=()=>structuredClone(state);upsertTrial=value=>{state=value};saveTrials=()=>{};recalculateTrialResults=()=>{};render=()=>renderBifBieCheck(state);
    render();
    const setupText=document.getElementById('bifBiePanel').textContent;
    const buttonBefore=document.getElementById('buildBifDrawButton').textContent;
    await buildBifDraw();
    const afterText=document.getElementById('bifBiePanel').textContent;
    return {
     setupText,buttonBefore,afterText,phase:state.scorebook.bif.biePhase,
     carry:state.scorebook.bif.preQualifierCarryEntryIds,
     breeds:state.scorebook.bif.draw.courses.map(course=>[...new Set(course.hounds.map(h=>h.breed))]),
     printDraw:document.getElementById('printBifDrawSheetButton').textContent,
     printJudge:document.getElementById('printBifJudgeSheetsButton').textContent,
     drawStake:bifDrawPrintTrial(state).preliminaryDraw.groups[0].stake,
    };
   }finally{readForm=old.readForm;upsertTrial=old.upsertTrial;saveTrials=old.saveTrials;render=old.render;recalculateTrialResults=old.recalculateTrialResults;}
  });
  assert(result.setupText.includes('Run breed pre-qualifiers before the main BIE elimination'));
  assert(result.buttonBefore.includes('BIE Pre-Qualifier'));
  assert.equal(result.phase,'prequalifier');
  assert.deepEqual(result.carry,['r1']);
  assert(result.breeds.every(breeds=>breeds.length===1));
  assert(result.afterText.includes('BIE pre-qualifier round 1'));
  assert(result.printDraw.includes('BIE Pre-Qualifier'));
  assert(result.printJudge.includes('BIE Pre-Qualifier'));
  assert.equal(result.drawStake,'BIE Pre-Qualifier');
  assert.deepEqual(errors,[]);
  console.log('Browser BIE pre-qualifier setup, draw integration, carry-forward, same-breed courses, and print labels passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
