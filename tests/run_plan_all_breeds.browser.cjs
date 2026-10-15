const { chromium } = require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/version') return route.fulfill({ json: { ok: true, appVersion: { version: 'test' } } });
    if (path === '/api/database-setup-status') return route.fulfill({ json: { ok: true, ready: true } });
    if (path === '/api/state') return route.fulfill({ json: { ok: true, state: null } });
    if (path === '/api/status') return route.fulfill({ json: { ok: true, runtime: {} } });
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
  await page.locator('#startupSplash').waitFor({ state: 'hidden', timeout: 10000 });

  const result = await page.evaluate(() => {
    const base = {
      association: 'ASFA',
      trialType: 'all_breed',
      singlesOffered: true,
      lciOffered: true,
      eventFields: [{ id: 'field-1', name: 'Field 1' }],
      rollCallLanes: [{ id: 'lane-1', name: 'Lane 1' }],
      entries: [{ id: 'entry-1', breed: 'RR', className: 'Open', callName: 'Halo' }],
      runPlan: [{ id: 'rr-row', breed: 'RR', entryCount: 0, runOrder: 1, judge1: 'Judge One', huntmaster: 'Worker One', fieldId: 'field-1', rollCallLaneId: 'lane-1' }],
    };
    const enteredOnly = buildRunPlanRowsForTrial({ ...base, runPlanIncludeAllBreeds: false });
    const allAsfa = buildRunPlanRowsForTrial({ ...base, runPlanIncludeAllBreeds: true });
    const noEntries = buildRunPlanRowsForTrial({ ...base, entries: [], runPlanIncludeAllBreeds: true });
    const akc = buildRunPlanRowsForTrial({ ...base, association: 'AKC', entries: [], runPlan: [], runPlanIncludeAllBreeds: true });
    const specialty = buildRunPlanRowsForTrial({ ...base, trialType: 'specialty', specialtyBreed: 'RR', entries: [], runPlan: [], runPlanIncludeAllBreeds: true });
    return {
      enteredOnly: enteredOnly.map(row => row.breed),
      asfaBreeds: allAsfa.map(row => row.breed),
      asfaCount: allAsfa.length,
      rr: allAsfa.find(row => row.breed === 'RR'),
      noEntryCounts: noEntries.map(row => row.entryCount),
      akcBreeds: akc.map(row => row.breed),
      specialtyBreeds: specialty.map(row => row.breed),
      printableBreeds: runPlanRowsForPrint({ ...base, runPlanIncludeAllBreeds: true, runPlan: allAsfa }).map(row => row.breed),
      judgeMapBreeds: judgesMapRows({ ...base, runPlanIncludeAllBreeds: true, runPlan: allAsfa }).map(row => row.breed),
      testPaperworkButton: Boolean(document.getElementById('previewTestPaperworkButton')),
    };
  });

  assert.deepEqual(result.enteredOnly, ['RR']);
  assert.equal(result.asfaCount, 26);
  assert.ok(result.asfaBreeds.includes('Singles'));
  assert.ok(result.asfaBreeds.includes('LCI Small'));
  assert.ok(result.asfaBreeds.includes('LCI Large'));
  assert.ok(result.asfaBreeds.includes('LCI Sighthound Mix'));
  assert.equal(result.rr.entryCount, 1);
  assert.equal(result.rr.judge1, 'Judge One');
  assert.equal(result.rr.huntmaster, 'Worker One');
  assert.ok(result.noEntryCounts.every(count => count === 0));
  assert.ok(result.akcBreeds.includes('Singles'));
  assert.ok(!result.akcBreeds.some(breed => breed.startsWith('LCI')));
  assert.ok(result.akcBreeds.includes('NBS'));
  assert.deepEqual(result.specialtyBreeds.sort(), ['LCI Large', 'LCI Sighthound Mix', 'LCI Small', 'RR', 'Singles'].sort());
  assert.deepEqual(result.printableBreeds, ['RR']);
  assert.deepEqual(result.judgeMapBreeds, ['RR']);
  assert.equal(result.testPaperworkButton, true);
  assert.deepEqual(errors, []);

  await browser.close();
  console.log('all-breeds running-plan checks passed');
})().catch(error => { console.error(error); process.exit(1); });
