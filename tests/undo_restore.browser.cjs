const {chromium}=require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');

(async()=>{
    const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
    try {
        const page=await browser.newPage();
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.route('**/*',route=>route.request().method()==='GET'?route.continue():route.fulfill({json:{ok:true}}));
        await page.goto('http://127.0.0.1:8765/');
        await page.locator('#startupSplash').waitFor({state:'detached'});
        const result=await page.evaluate(()=>{
            const snapshot=makeBackupSnapshot();
            const originalQueue=queueSQLiteSave;
            let queued=0;
            try {
                queueSQLiteSave=()=>{queued+=1;};
                applyBackupSnapshot(snapshot,{queueServerSave:false});
                const afterServerRestore=queued;
                applyBackupSnapshot(snapshot);
                return {afterServerRestore,afterBrowserRestore:queued};
            } finally {
                queueSQLiteSave=originalQueue;
                applyBackupSnapshot(snapshot,{queueServerSave:false});
            }
        });
        assert.equal(result.afterServerRestore,0);
        assert.equal(result.afterBrowserRestore,1);
        assert.deepEqual(errors,[]);
        console.log('Browser Undo restore check passed: server state does not queue a self-save; browser restore still persists.');
    } finally {
        await browser.close();
    }
})().catch(error=>{console.error(error);process.exitCode=1;});
