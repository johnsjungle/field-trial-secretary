const {chromium}=require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try {
 const p=await browser.newPage({viewport:{width:1100,height:850}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.setContent('<link rel="stylesheet" href="about:blank"><main id="test"></main>');await p.addStyleTag({content:fs.readFileSync('app/styles.css','utf8')});
 await p.evaluate(()=>{
  window.clean=x=>String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,'');window.normalizeBreedCode=x=>x;window.rulesForTrial=t=>({association:t.association});window.isQuasiBreedGroup=()=>false;window.isPreliminaryDrawLocked=t=>Boolean(t.locked);window.runGroupBreedForEntry=e=>e.breed;window.runGroupStakeForEntry=e=>e.stake;window.groupTitle=g=>g.breed+' '+g.stake;
  window.trial={association:'AKC',locationState:'PA',entries:Array.from({length:24},(_,i)=>({id:String(i),breed:'WH',stake:'Open'}))};
  window.readForm=()=>JSON.parse(JSON.stringify(trial));window.upsertTrial=t=>window.trial=t;
  window.saveTrials=()=>{window.saved=JSON.stringify(trial)};window.showMessage=()=>{};window.rollCallMessage=null;window.render=()=>{document.querySelector('#test').replaceChildren();renderSplitStakeEligibility(document.querySelector('#test'),trial,trial.entries)};
 });
 const source=fs.readFileSync('app/script.js','utf8');await p.addScriptTag({content:source.slice(source.indexOf('const AKC_REGION_STATES'),source.indexOf('function groupEntriesByBreedAndStake'))});await p.evaluate(()=>render());
 await p.locator('summary').click();assert.match(await p.locator('#test').textContent(),/split at 30/);
 await p.getByLabel('Dogs for a five-point major (override)').fill('12');await p.getByRole('button',{name:'Save Override'}).click();assert.match(await p.locator('[role=status]').textContent(),/Enter the reason/);
 await p.getByLabel('Reason / association direction').fill('Verified trial direction');await p.getByRole('button',{name:'Save Override'}).click();await p.locator('summary').click();assert.match(await p.locator('#test').textContent(),/OVERRIDE: minimum 12, split at 24/);assert.match(await p.locator('#test').textContent(),/Sizes: 12 \/ 12/);
 await p.evaluate(()=>{trial=JSON.parse(saved);render()});await p.locator('summary').click();assert.equal(await p.getByLabel('Reason / association direction').inputValue(),'Verified trial direction');
 await p.getByRole('button',{name:'Reset to Automatic'}).click();await p.locator('summary').click();assert.match(await p.locator('#test').textContent(),/Using automatic rules/);
 await p.evaluate(()=>{trial.association='ASFA';render()});await p.locator('summary').click();assert.match(await p.locator('#test').textContent(),/minimum 10, split at 20/);await p.getByLabel('Minimum dogs per flight (override)').fill('13');await p.getByLabel('Reason / association direction').fill('Trial exception');await p.getByRole('button',{name:'Save Override'}).click();await p.locator('summary').click();assert.match(await p.locator('#test').textContent(),/split at 26/);
 await p.screenshot({path:'.tmp/split-overrides-asfa.png',fullPage:true});
 await p.evaluate(()=>{trial.locked=true;render()});await p.locator('summary').click();assert(await p.getByRole('button',{name:'Save Override'}).isDisabled());assert(await p.getByRole('button',{name:'Reset to Automatic'}).isDisabled());assert.deepEqual(errors,[]);
 console.log('Browser controls passed: below-threshold access, required reason, save/reload, split preview, reset, ASFA override and scoring lock.');
} finally {await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
