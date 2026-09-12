const { chromium } = require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
  await page.locator('#startupSplash').waitFor({ state: 'hidden', timeout: 10000 });
  await page.locator('.tab-button[data-tab-target="runplan"]').click();

  const result = await page.evaluate(() => {
    const trial = {
      trialName: 'Major Event Test', clubName: 'Test Club', startsOn: '2026-09-12', endsOn: '2026-09-12',
      eventFields: [{ id: 'field-1', name: 'North Field' }, { id: 'field-2', name: 'South Field' }],
      rollCallLanes: [{ id: 'lane-1', name: 'Front Lane' }, { id: 'lane-2', name: 'Back Lane' }],
      runPlan: [
        { breed: 'RR', fieldId: 'field-1', rollCallLaneId: 'lane-1', runOrder: 1 },
        { breed: 'WH', fieldId: 'field-2', rollCallLaneId: 'lane-1', runOrder: 1 },
        { breed: 'IB', fieldId: 'field-2', rollCallLaneId: 'lane-2', runOrder: 2 },
      ],
      entries: [
        { id: '1', callName: 'Axel', registeredName: 'Alpha Hound', registrationNumber: 'R1', owner: 'Owner A', breed: 'RR', className: 'Open', entryNumber: '1' },
        { id: '2', callName: 'Bella', registeredName: 'Beta Hound', registrationNumber: 'W1', owner: 'Owner B', breed: 'WH', className: 'Veteran', entryNumber: '2' },
        { id: '3', callName: 'Cedar', registeredName: 'Cedar Hound', registrationNumber: 'I1', owner: 'Owner C', breed: 'IB', className: 'Open', entryNumber: '3' },
      ],
    };
    const original = JSON.stringify(trial);
    renderPrintFieldControl(trial);
    const grouping = document.getElementById('rollCallGrouping');
    const format = document.getElementById('rollCallFormat');
    const sort = document.getElementById('rollCallSort');
    grouping.value = 'lane'; format.value = 'checkIn'; sort.value = 'runningOrder'; renderRollCallSheet(trial);
    const lane = [...document.querySelectorAll('.roll-call-sheet-group')].map(section => ({ title: section.querySelector('h3').textContent, text: section.textContent, headers: [...section.querySelectorAll('th')].map(th => th.textContent) }));
    grouping.value = 'field'; renderRollCallSheet(trial);
    const fieldTitles = [...document.querySelectorAll('.roll-call-sheet-group h3')].map(h => h.textContent);
    grouping.value = 'fieldLane'; renderRollCallSheet(trial);
    const fieldLaneTitles = [...document.querySelectorAll('.roll-call-sheet-group h3')].map(h => h.textContent);
    grouping.value = 'all'; format.value = 'detailed'; renderRollCallSheet(trial);
    const detailedHeaders = [...document.querySelectorAll('.roll-call-sheet-group th')].map(th => th.textContent);
    format.value = 'quick'; renderRollCallSheet(trial);
    const quickHeaders = [...document.querySelectorAll('.roll-call-sheet-group th')].map(th => th.textContent);
    grouping.value = 'selectedField'; document.getElementById('printFieldSelect').value = 'field-2'; format.value = 'checkIn'; renderRollCallSheet(trial);
    const selectedText = document.querySelector('.roll-call-sheet-group').textContent;
    const drawFieldTitle = groupTitleWithField(trial, { breed: 'RR', stake: 'Open' });
    const singleFieldTitle = groupTitleWithField({ ...trial, eventFields: [{ id: 'field-1', name: 'North Field' }] }, { breed: 'RR', stake: 'Open' });
    return { lane, fieldTitles, fieldLaneTitles, detailedHeaders, quickHeaders, selectedText, drawFieldTitle, singleFieldTitle, unchanged: JSON.stringify(trial) === original };
  });

  assert.equal(result.lane.length, 2);
  assert.match(result.lane[0].title, /Front Lane — All Fields/);
  assert.match(result.lane[0].text, /Axel/);
  assert.match(result.lane[0].text, /Bella/);
  assert.ok(result.lane[0].headers.includes('Field'));
  assert.ok(!result.lane[0].headers.includes('Lane'));
  assert.deepEqual(result.fieldTitles, ['Roll Call — North Field', 'Roll Call — South Field']);
  assert.equal(result.fieldLaneTitles.length, 3);
  assert.ok(result.detailedHeaders.includes('Registered Name'));
  assert.ok(result.detailedHeaders.includes('Registration No.'));
  assert.ok(result.detailedHeaders.includes('Owner / Handler'));
  assert.ok(!result.quickHeaders.includes('Class'));
  assert.doesNotMatch(result.selectedText, /Axel/);
  assert.match(result.selectedText, /Bella/);
  assert.match(result.selectedText, /Cedar/);
  assert.match(result.drawFieldTitle, /Field: North Field/);
  assert.doesNotMatch(result.singleFieldTitle, /Field:/);
  assert.equal(result.unchanged, true, 'rendering must not mutate trial data');
  assert.deepEqual(errors, []);

  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => { document.getElementById('rollCallGrouping').value = 'lane'; renderRollCallSheet({ trialName:'Print', eventFields:[{id:'f1',name:'F1'},{id:'f2',name:'F2'}], rollCallLanes:[{id:'l1',name:'L1'},{id:'l2',name:'L2'}], runPlan:[{breed:'RR',fieldId:'f1',rollCallLaneId:'l1'},{breed:'WH',fieldId:'f2',rollCallLaneId:'l2'}], entries:[{callName:'A',breed:'RR',className:'Open'},{callName:'B',breed:'WH',className:'Open'}] }); document.body.dataset.printSection='rollCallPrint'; });
  const second = page.locator('.roll-call-sheet-group').nth(1);
  assert.ok(['page', 'always'].includes(await second.evaluate(el => getComputedStyle(el).breakBefore || getComputedStyle(el).pageBreakBefore)));
  await browser.close();
  console.log('roll call print variation checks passed');
})().catch(error => { console.error(error); process.exit(1); });

