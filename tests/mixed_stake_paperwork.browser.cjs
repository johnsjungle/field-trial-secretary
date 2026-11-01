const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve('app');
const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const filename = path.resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const type = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'}[path.extname(filename)] || 'application/octet-stream';
    fs.readFile(filename, (error, data) => {
        if (error) { res.writeHead(404).end(); return; }
        res.writeHead(200, {'Content-Type':type}).end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(String(error)));
        await page.route('**/api/**', route => {
            const name = new URL(route.request().url()).pathname;
            if (name === '/api/version') return route.fulfill({json:{ok:true,appVersion:{version:'test'}}});
            if (name === '/api/state') return route.fulfill({json:{ok:true,state:null}});
            if (name === '/api/database-setup-status') return route.fulfill({json:{ok:true,ready:true}});
            return route.fulfill({json:{ok:true}});
        });
        await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil:'networkidle'});
        await page.locator('#startupSplash').waitFor({state:'hidden',timeout:15000});

        const result = await page.evaluate(async () => {
            const entry = (id,className) => ({id,breed:'IG',className,rollCallStatus:'present',callName:id,owner:id});
            const entries = [entry('open','Open'),entry('vet','Veteran')];
            const makeGroup = e => ({id:e.id,breed:'IG',stake:e.className,courses:[{id:`pre-${e.id}`,number:1,hounds:[{entryId:e.id,breed:'IG',stake:e.className,callName:e.callName,blanketColor:'Yellow',drawPosition:1}]}]});
            let trial = {id:'mixed-audit',association:'AKC',entries,preliminaryDraw:{groups:entries.map(makeGroup)},runPlan:[{breed:'IG',judge1:'Judge One'}],scorebook:{}};
            const original={readForm,getSelectedTrial,upsertTrial,saveTrials,render,showTrialConfirm};
            document.getElementById('association').value='AKC';
            try {
                readForm=()=>structuredClone(trial);getSelectedTrial=()=>trial;
                upsertTrial=t=>{trial=t;};saveTrials=()=>{};render=()=>{};showTrialConfirm=async()=>true;
                const other={id:'rr',breed:'RR',stake:'Open',courses:[]};trial.preliminaryDraw.groups.push(other);
                updateDrawGroupManualFields('open',{mixedStake:true});
                const combined=structuredClone(trial.preliminaryDraw.groups.find(g=>g.breed==='IG'));
                redrawPreliminaryDrawGroup(combined.id);
                const redrawnCount=trial.preliminaryDraw.groups.find(g=>g.breed==='IG').courses[0].hounds.length;
                updateDrawGroupManualFields(combined.id,{mixedStake:false});
                const separated=trial.preliminaryDraw.groups.filter(g=>g.breed==='IG').map(g=>g.stake).sort();
                updateDrawGroupManualFields(trial.preliminaryDraw.groups.find(g=>g.breed==='IG').id,{mixedStake:true});
                trial.preliminaryDraw.groups.filter(g=>g.breed==='IG').forEach(g=>g.courses.forEach(c=>c.hounds.forEach(h=>{h.prelimJudge1Score='75';h.prelimScore='75';})));
                const beforeLocked=JSON.stringify(trial);
                updateDrawGroupManualFields(trial.preliminaryDraw.groups.find(g=>g.breed==='IG').id,{mixedStake:false});
                const lockedPreserved=JSON.stringify(trial)===beforeLocked;
                await buildFinalsDrawForGroup(trial.preliminaryDraw.groups.find(g=>g.breed==='IG').id);
                const stakeFinalsCount=trial.preliminaryDraw.groups.find(g=>g.breed==='IG').finalDraw.courses[0].hounds.length;
                await buildFinalsDrawForBreed('IG');
                let mixed=trial.preliminaryDraw.groups.find(g=>g.breed==='IG');
                const finalsCount=mixed.finalDraw.courses[0].hounds.length;
                mixed.finalDraw.courses.forEach(c=>c.hounds.forEach(h=>{h.finalScore='76';h.finalJudge1Score='76';}));
                mixed=recomputeFinalPlacements(mixed,trial);
                const placements=finalsRowsForGroup(mixed).map(r=>r.hound.placement);
                const otherPreserved=JSON.stringify(trial.preliminaryDraw.groups.find(g=>g.id==='rr'))===JSON.stringify(other);
                // Older trials may have the mixed checkbox only on one separate stake.
                trial.preliminaryDraw.groups=entries.map(makeGroup);
                trial.preliminaryDraw.groups[0].mixedStake=true;
                trial.preliminaryDraw.groups.forEach(g=>g.courses[0].hounds.forEach(h=>{h.prelimScore='75';h.prelimJudge1Score='75';}));
                const prelimBefore=JSON.stringify(trial.preliminaryDraw.groups.map(g=>g.courses));
                await buildFinalsDrawForBreed('IG');
                const legacyFinals=trial.preliminaryDraw.groups.filter(g=>g.finalDraw);
                const legacyPrelimsPreserved=JSON.stringify(trial.preliminaryDraw.groups.filter(g=>!g.finalsOnly).map(g=>g.courses))===prelimBefore;
                const corrected=trial.preliminaryDraw.groups.find(g=>g.finalDraw);
                corrected.runoffs=[{key:'tie',courses:[{hounds:[{entryId:'open',tieBreakScore:'80'}]}]}];
                const first=updatedRunoffRecordGroupIds(trial);
                trial.printStatusFingerprints={runoffRecordSheets:Object.fromEntries(runoffRecordSheetSnapshots(trial))};
                const unchanged=updatedRunoffRecordGroupIds(trial);
                corrected.runoffs[0].courses[0].hounds[0].tieBreakScore='81';
                const changed=updatedRunoffRecordGroupIds(trial);
                return {combinedCount:combined.courses[0].hounds.length,combinedStake:combined.stake,redrawnCount,separated,lockedPreserved,stakeFinalsCount,finalsCount,placements,otherPreserved,legacyFinals:legacyFinals.map(g=>({stake:g.stake,mixed:g.mixedStake,count:g.finalDraw.courses[0].hounds.length})),legacyPrelimsPreserved,first,unchanged,changed,button:!!document.getElementById('printUpdatedRecordSheetsButton')};
            } finally {Object.assign(window,original);}
        });
        assert.equal(result.combinedCount,2);
        assert.equal(result.combinedStake,'Mixed');
        assert.equal(result.redrawnCount,2);
        assert.deepEqual(result.separated,['Open','Veteran']);
        assert.equal(result.lockedPreserved,true);
        assert.equal(result.finalsCount,2);
        assert.equal(result.stakeFinalsCount,2);
        assert.deepEqual(result.placements,['1','1']);
        assert.equal(result.otherPreserved,true);
        assert.deepEqual(result.legacyFinals,[{stake:'Mixed',mixed:true,count:2}]);
        assert.equal(result.legacyPrelimsPreserved,true);
        assert.equal(result.first.length,1);
        assert.deepEqual(result.unchanged,[]);
        assert.deepEqual(result.changed,result.first);
        assert.equal(result.button,true);
        assert.deepEqual(errors,[]);
        console.log('Mixed prelim combine/separate/redraw, locked-score preservation, mixed finals, separate placements, legacy mixed finals, and changed-sheet-only selection passed.');
    } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
