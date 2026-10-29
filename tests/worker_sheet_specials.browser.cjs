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
        const result = await page.evaluate(() => {
            const definitions = [
                ['BZ',{Open:2}], ['WH',{Open:10,Specials:2,Veteran:2}],
                ['BA',{Open:1,Specials:5,Veteran:3}], ['Singles',{Singles:9}],
                ['GH',{Specials:4,Veteran:1}], ['SA',{Specials:1}],
                ['IB',{Open:2,Specials:3}], ['RR',{Open:4,Specials:2,Veteran:1}],
            ];
            const trial = {
                association:'AKC', trialName:'AKC Halloween Trial', startsOn:'2026-10-31',clubName:'MGA',
                eventFields:[{id:'field-1',name:'Field 1'}], rollCallLanes:[{id:'lane-1',name:'Lane 1'}],
                entries:definitions.flatMap(([breed,counts]) => Object.entries(counts).flatMap(([className,count]) => Array.from({length:count},(_,i)=>({id:`${breed}-${className}-${i}`,breed:breed==='Singles'?'WH':breed,className})))),
                runPlan:definitions.map(([breed],i)=>({id:`row-${i}`,breed,runOrder:i+1,fieldId:'field-1',judge1:'Judge One',lureOperator:'Operator One',huntmaster:'Huntmaster One'})),
            };
            trial.runPlan.push({id:'empty',breed:'AH',runOrder:99,fieldId:'field-1'});
            const before=JSON.stringify(trial);
            const oldReadForm=readForm;
            try {
                readForm=()=>trial;
                renderWorkerSheet(trial);
                const headers=Array.from(document.querySelectorAll('#workerSheetHead th'),el=>el.textContent);
                const rows=Array.from(document.querySelectorAll('#workerSheetTable tr'),tr=>Array.from(tr.cells,td=>td.textContent));
                const total=document.getElementById('workerSheetFoot').textContent;
                const specialMapRows=judgesMapRows(trial).filter(row=>/Special/i.test(row.stake)).length;
                const unchanged=before===JSON.stringify(trial);
                const asfa={...trial,association:'ASFA',entries:[
                    {id:'fch',breed:'RR',className:'Field Champion'},
                    {id:'lci',breed:'LCI Small',className:'Excellent'},
                ],runPlan:[{id:'rr',breed:'RR',runOrder:1,fieldId:'field-1'},{id:'lci',breed:'LCI Small',runOrder:2,fieldId:'field-1'}]};
                readForm=()=>asfa;
                renderWorkerSheet(asfa);
                return {headers,rows,total,specialMapRows,unchanged,
                    asfaHeaders:Array.from(document.querySelectorAll('#workerSheetHead th'),el=>el.textContent),
                    asfaRows:Array.from(document.querySelectorAll('#workerSheetTable tr'),tr=>Array.from(tr.cells,td=>td.textContent)),
                };
            } finally {readForm=oldReadForm;}
        });
        assert.deepEqual(result.headers.slice(0,5),['Order','Entries','Open','Specials','Vet']);
        assert.equal(result.rows.length,8,'empty preassigned breeds remain omitted');
        assert.deepEqual(result.rows[1].slice(2,5),['4(10)','1(2)','1(2)']);
        assert.deepEqual(result.rows[2].slice(2,5),['1(1)','2(5)','1(3)']);
        assert.deepEqual(result.rows[4].slice(2,5),['','2(4)','1(1)']);
        assert.deepEqual(result.rows[5].slice(2,5),['','1(1)','']);
        assert.deepEqual(result.rows[6].slice(2,5),['1(2)','1(3)','']);
        assert.deepEqual(result.rows[7].slice(2,5),['2(4)','1(2)','1(1)']);
        assert.match(result.total,/52/);
        assert.equal(result.specialMapRows,6);
        assert.equal(result.unchanged,true,'printing must not mutate the trial');
        assert.equal(result.asfaHeaders[3],'Fch/Exc');
        assert.ok(result.asfaRows.every(row=>row[3]==='1(1)'));
        const builtIn = await page.evaluate(() => window.HaloSystemTests.collectClientSystemChecks().find(row => row.id === 'worker-akc-specials'));
        assert.equal(builtIn?.status, 'pass', JSON.stringify(builtIn));
        const orderCheck = await page.evaluate(() => window.HaloSystemTests.collectClientSystemChecks().find(row => row.id === 'akc-specials-draw-order'));
        assert.equal(orderCheck?.status, 'pass', JSON.stringify(orderCheck));
        const paths = await page.evaluate(async () => {
            const entries = ['Veteran', 'Specials', 'Open'].map((className,index) => ({
                id:`audit-${index}`, breed:'RR',className,callName:`${className}Hound`,
                registrationNumber:`HP-AUDIT-${index}`,rollCallStatus:'present',owner:`Owner ${index}`,
            }));
            let trial = {
                id:'specials-audit',association:'AKC',trialName:'Specials Audit',startsOn:'2026-10-31',
                eventFields:[{id:'field-1',name:'Field 1'}],entries,
                runPlan:[{breed:'RR',runOrder:1,fieldId:'field-1',judge1:'Judge One',judge2:'Judge Two'}],
                preliminaryDraw:{groups:entries.map(entry=>({
                    id:`group-${entry.id}`,breed:'RR',stake:entry.className,
                    courses:[{number:1,hounds:[{...entry,entryId:entry.id,stake:entry.className,blanketColor:'Yellow',drawPosition:1,prelimJudge1Score:'35',prelimJudge2Score:'36',prelimScore:'71'}]}],
                }))},
                scorebook:{},
            };
            const original={readForm,getSelectedTrial,upsertTrial,saveTrials,render};
            const associationControl=document.getElementById('association');
            const originalAssociation=associationControl.value;
            try {
                associationControl.value='AKC';
                readForm=()=>structuredClone(trial);
                getSelectedTrial=()=>trial;
                upsertTrial=value=>{trial=value;};
                saveTrials=()=>{};render=()=>{};
                const imported=normalizeImportedClass('Specials');
                const eligibility=asfaEntryEligibilityProblem({breed:'RR'},imported,'AKC');
                const initial=groupEntriesByBreedAndStake(entries,[],trial).map(group=>group.stake);
                const runPlan=buildRunPlanRowsForTrial(trial);
                const prelimMap=judgesMapRows(trial).map(row=>row.stake);
                await buildFinalsDrawForBreed('RR');
                trial.preliminaryDraw.groups.forEach(group=>group.finalDraw.courses.forEach(course=>course.hounds.forEach(hound=>{
                    hound.finalJudge1Score='36';hound.finalJudge2Score='37';hound.finalScore='73';
                })));
                normalizeFinalPlacementState(trial);
                const group=trial.preliminaryDraw.groups.find(group=>group.stake==='Specials');
                const details=finalDetailsForEntryAcrossDraw(trial,group,group.finalDraw.courses[0].hounds[0].entryId);
                const finalsMap=finalsJudgesMapRows(trial).map(row=>row.stake);
                const printed=sortDrawGroupsForPrint(trial.preliminaryDraw.groups,trial).map(group=>group.stake);
                const finalsHuntmaster=sortDrawGroupsForPrint(finalsHuntmasterPrintTrial(trial).preliminaryDraw.groups,trial).map(group=>group.stake);
                const ribbonGroups=sortRibbonReportGroups(ribbonReportGroupsForPrint(trial.preliminaryDraw.groups),trial,'runningOrder');
                renderMainResultsBook(trial);
                renderRibbonReportPrint(trial,ribbonGroups);
                return {imported,eligibility,initial,runPlan:runPlan.map(row=>({breed:row.breed,count:row.entryCount})),prelimMap,finalsMap,printed,finalsHuntmaster,
                    details,results:document.getElementById('mainResultsBook').textContent,ribbons:document.getElementById('scoreReportGroups').textContent};
            } finally {Object.assign(window,original);associationControl.value=originalAssociation;}
        });
        assert.equal(paths.imported,'Specials');
        assert.equal(paths.eligibility,'');
        assert.deepEqual(paths.initial,['Open','Specials','Veteran']);
        assert.deepEqual(paths.runPlan,[{breed:'RR',count:3}]);
        for(const key of ['prelimMap','finalsMap','printed','finalsHuntmaster']) assert.deepEqual(paths[key],['Open','Specials','Veteran'],key);
        assert.equal(paths.details.combinedScore,'144');
        assert.equal(paths.details.placement,'1');
        assert.match(paths.results,/SpecialsHound/);
        assert.match(paths.ribbons,/SpecialsHound/);
        assert.deepEqual(errors,[]);
        console.log('AKC Specials browser audit passed: worker counts, import, running order, prelim/finals maps and draws, huntmaster, totals, placements, results, ribbons, and ASFA/LCI checks.');
    } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
