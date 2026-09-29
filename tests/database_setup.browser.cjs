const {chromium}=require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
 const page=await browser.newPage();let created=false;
 await page.addInitScript(()=>localStorage.setItem('fieldTrialSecretary.trials.v1',JSON.stringify([{id:'stale-browser-trial',trialName:'Must be cleared'}])));
 await page.route('**/api/database-setup-status',r=>r.fulfill({json:{ok:true,ready:created,templateAvailable:true}}));
 await page.route('**/api/database-create',r=>{created=true;return r.fulfill({json:{ok:true,ready:true,created:true}})});
 await page.route('**/api/state',r=>r.fulfill({json:{ok:true,databaseRequired:false,state:{app:'Field Trial Secretary',version:1,exportedAt:new Date().toISOString(),data:{trials:[],masterHounds:[],masterJudges:[],masterWorkers:[],formTemplateStatus:{},formAlignment:{},entryImportTemplates:[],deletedTrials:[],activeTrialId:''}}}}));
 await page.goto('http://127.0.0.1:8765/');
 await page.getByRole('heading',{name:'Choose your trial database'}).waitFor();
 await page.getByRole('button',{name:'Create New Empty Database'}).click();
 await page.locator('#startupSplash').waitFor({state:'detached'});
 assert.equal(created,true);assert.equal(await page.evaluate(()=>trials.length),0);assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('fieldTrialSecretary.trials.v1'))),[]);
 console.log('First-run database screen creates an explicit empty state and clears stale browser trial data.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
