const { chromium } = require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(process.env.HALO_TEST_URL || 'http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
    await page.locator('#startupSplash').waitFor({ state: 'detached' });

    await page.locator('[data-tab-target="admin"]').click();
    await page.getByRole('button', { name: 'Tools', exact: true }).click();
    const client = await page.evaluate(() => window.HaloSystemTests.collectClientSystemChecks());
    assert(client.length >= 15, 'Expected a broad browser regression catalog.');
    assert.deepEqual(client.filter((row) => row.status !== 'pass'), [], JSON.stringify(client, null, 2));

    await page.evaluate(() => document.getElementById('runFullSystemTestButton').click());
    await page.waitForFunction(() => !document.getElementById('systemTestProgress').hidden === false && !document.getElementById('systemTestSummary').hidden, null, { timeout: 30000 });
    const report = await page.evaluate(() => ({
      message: document.getElementById('systemTestMessage').textContent,
      counts: [...document.querySelectorAll('.system-test-count strong')].map((node) => Number(node.textContent)),
      failures: document.querySelectorAll('.system-test-result.fail').length,
      results: document.querySelectorAll('.system-test-result').length,
      copyVisible: !document.getElementById('copySystemTestReportButton').hidden,
    }));
    assert(report.results >= 45, `Expected at least 45 combined checks, received ${report.results}.`);
    assert.equal(report.failures, 0, report.message);
    assert.equal(report.counts[2], 0, report.message);
    assert(report.copyVisible);

    await page.locator('#systemTestStatusFilter').selectOption('fail');
    assert.equal(await page.locator('.system-test-result').count(), 0);
    await page.locator('#systemTestStatusFilter').selectOption('all');
    await page.locator('#systemTestSearch').fill('BIE');
    assert((await page.locator('.system-test-result').count()) >= 1);

    await page.route('**/api/system-test', (route) => route.abort('failed'));
    await page.locator('#runFullSystemTestButton').click();
    await page.waitForFunction(() => /restart it/i.test(document.getElementById('systemTestMessage').textContent));
    assert.match(await page.locator('#systemTestMessage').textContent(), /Exit HALO completely, restart it/i);
    assert.deepEqual(pageErrors, []);
    console.log(`Full System Test browser workflow passed: ${report.results} checks, searchable report, no failures.`);
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
