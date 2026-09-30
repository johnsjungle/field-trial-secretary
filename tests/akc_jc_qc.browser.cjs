const { chromium } = require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
  await page.locator('#startupSplash').waitFor({ state: 'hidden', timeout: 10000 });

  await page.evaluate(() => {
    saveTrials = () => {};
    saveToSQLite = async () => {};
    trials = [{
      id: 'jcqc-browser-test',
      trialId: 'jcqc-browser-test',
      trialName: 'JC QC Browser Test',
      association: 'AKC',
      clubName: 'Test Club',
      startsOn: '2026-09-29',
      eventNumber: 'TEST-JCQC',
      entries: [],
      akcTests: [],
      judges: [{ name: 'Judge One', number: '12345' }],
      workers: [],
      runPlan: [],
    }];
    selectedTrialId = 'jcqc-browser-test';
    render();
  });

  const tab = page.locator('#akcTestsTabButton');
  assert.equal(await tab.isVisible(), true);
  await tab.click();
  assert.equal(await page.locator('.tab-button.active').innerText(), 'JC / QC Tests');

  await page.locator('#akcTestCallName').fill('Dash');
  await page.locator('#akcTestRegisteredName').fill('Dash Registered');
  await page.locator('#akcTestBreed').selectOption('WH');
  await page.locator('#akcTestRegistrationNumber').fill('HP123456');
  await page.locator('#akcTestType').selectOption('QC');
  assert.equal(await page.locator('#akcQcPartnerCard').isVisible(), true);
  await page.locator('#akcTestPartnerName').fill('Partner');
  await page.locator('#akcTestJudgeName').fill('Judge One');
  await page.locator('#akcTestJudgeName').dispatchEvent('change');
  assert.equal(await page.locator('#akcTestJudgeNumber').inputValue(), '12345');
  await page.locator('#saveAkcTestButton').click();

  assert.match(await page.locator('#akcTestsTable').innerText(), /Dash Registered/);
  assert.match(await page.locator('#akcTestsTable').innerText(), /QC/);
  assert.match(await page.locator('#akcTestsTable').innerText(), /Pending/);
  assert.equal(await page.locator('#akcTestsTable button', { hasText: 'Print QC Certificate' }).count(), 1);
  await page.locator('#akcTestsTable button', { hasText: 'Edit' }).click();
  await page.locator('#akcTestResult').selectOption('pass');
  await page.locator('#saveAkcTestButton').click();
  assert.match(await page.locator('#akcTestsTable').innerText(), /Pass/);

  await page.locator('.tab-button[data-tab-target="wrapup"]').click();
  await page.locator('.sub-tab-button', { hasText: 'AKC Submission Packet' }).click();
  assert.equal(await page.locator('#printAkcJudgesBookButton').isVisible(), true);

  await page.evaluate(() => {
    trials[0].association = 'ASFA';
    render();
  });
  assert.equal(await tab.isVisible(), false);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('AKC JC/QC browser workflow passed.');
})().catch(error => { console.error(error); process.exit(1); });
