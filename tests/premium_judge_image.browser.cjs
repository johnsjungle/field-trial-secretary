const { chromium } = require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

const imagePath = path.resolve('tests/fixtures/premium-judge-two-day-grid.png');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(process.env.HALO_TEST_URL || 'http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
    await page.locator('#startupSplash').waitFor({ state: 'detached' });
    await page.locator('#startsOn').fill('2026-10-17');
    await page.locator('#endsOn').fill('2026-10-18');
    await page.locator('[data-tab-target="runplan"]').click();
    await page.getByText('Import Premium Judge Assignments', { exact: true }).click();
    await page.locator('#premiumJudgeGridImage').setInputFiles(imagePath);
    await page.locator('#readPremiumJudgesButton').click();
    await page.waitForFunction(
      () => !document.getElementById('readPremiumJudgesButton')?.disabled,
      null,
      { timeout: 120000 }
    );
    assert.match(await page.locator('#premiumJudgeMatrixSummary').textContent(), /3 judges.*40 checked assignments/i);
    assert.equal(await page.locator('#premiumJudgeMatrixReview tbody tr').count(), 6);
    assert.equal(await page.locator('.premium-judge-name').evaluateAll((inputs) => inputs.filter((input) => input.value === 'Mary Ellen').length), 2);
    assert.deepEqual(
      await page.locator('.premium-day-select').evaluateAll((selects) => [...new Set(selects.map((select) => select.value))].sort()),
      ['Saturday', 'Sunday']
    );
    assert.equal(await page.locator('#importPremiumJudgesButton').isEnabled(), true);
    assert.deepEqual(errors, []);
    console.log('Premium judge image import passed: stacked grids preview 3 judges, 6 day rows, and 40 assignments.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
