const { chromium } = require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

const table = `| Day      | Name       | CH | WH | RR | IG | LCI | SD | PIO | SL | GH | AH | SA | AZ | IW | BA | Bo | SNG | SW | IH | PH | PRV | Ce |
| -------- | ---------- | -- | -- | -- | -- | --- | -- | --- | -- | -- | -- | -- | -- | -- | -- | -- | --- | -- | -- | -- | --- | -- |
| Saturday | Kathy      |    | S  | S  | S  | S   | S  | S   | S  |    |    |    |    |    |    |    |     |    |    |    |     |    |
| Saturday | Mary Ellen |    |    |    |    |     |    |     |    | s  | s  | s  | s  | s  | s  |    |     |    |    |    |     |    |
| Saturday | Paul       |    |    |    |    |     |    |     |    |    |    |    |    |    |    | s  | s   | s  | s  | s  | s   | s  |
| Sunday   | Paul       | s  |    |    |    | s   |    |     |    |    | s  | s  | s  | s  | s  |    |     |    |    |    |     |    |
| Sunday   | Mary Ellen |    | s  | s  | s  |     | s  | s   | s  |    |    |    |    |    |    |    |     | s  |    |    |     |    |
| Sunday   | Kathy      |    |    |    |    |     |    |     |    |    |    |    |    |    |    | s  | s   |    | s  | s  | s   | s  |`;

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(process.env.HALO_TEST_URL || 'http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
    await page.locator('#startupSplash').waitFor({ state: 'detached' });
    await page.locator('[data-tab-target="runplan"]').click();
    await page.getByText('Import Premium Judge Assignments', { exact: true }).click();
    await page.locator('#premiumJudgeAssignmentsText').fill(table);
    await page.locator('#readPremiumJudgesButton').click();
    await page.waitForFunction(() => /3 judges.*40 checked assignments/i.test(document.getElementById('premiumJudgeMatrixSummary')?.textContent || ''));
    assert.match(await page.locator('#premiumJudgeMatrixSummary').textContent(), /3 judges.*40 checked assignments/i);
    assert.equal(await page.locator('#premiumJudgeMatrixReview tbody tr').count(), 6);
    assert.equal(await page.locator('.premium-judge-name').evaluateAll((inputs) => inputs.filter((input) => input.value === 'Mary Ellen').length), 2);
    assert.equal(await page.locator('#importPremiumJudgesButton').isEnabled(), true);
    assert.deepEqual(errors, []);
    console.log('Premium judge browser import passed: exact Markdown schedule previews 3 judges, 6 rows, and 40 assignments and enables Save & Apply.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
