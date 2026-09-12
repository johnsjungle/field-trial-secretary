const { chromium } = require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
  await page.locator('#startupSplash').waitFor({ state: 'hidden', timeout: 10000 });

  const missingHelp = await page.locator('.form-section, .status-panel').evaluateAll(sections => sections.map(section => ({ tab: section.dataset.tab, heading: section.querySelector('h2, h3')?.textContent.trim(), hasHelp: Boolean(section.querySelector('.section-info-toggle')) })).filter(item => item.heading && !item.hasHelp));
  assert.deepEqual(missingHelp, [], 'every major menu section should have contextual help');
  const infoButtons = page.locator('.section-info-toggle');
  assert.ok(await infoButtons.count() >= 35, 'expected contextual Info buttons throughout the app');
  assert.equal(await page.locator('.section-info-panel:not([hidden])').count(), 0, 'help should start collapsed');

  const eventSection = page.locator('.form-section[data-tab="setup"]').filter({ has: page.locator('h2', { hasText: /^Event$/ }) });
  await eventSection.locator('.section-info-toggle').click();
  assert.equal(await eventSection.locator('.section-info-panel:not([hidden])').count(), 1);
  assert.match(await eventSection.locator('.section-info-panel').innerText(), /Tips & hidden features/);
  assert.match(await eventSection.locator('.section-info-panel').innerText(), /Enter event identity/);

  await page.locator('#helpFinder > summary').click();
  await page.locator('#helpSearchInput').fill('split stakes');
  const splitResult = page.locator('.help-result').filter({ hasText: 'breed or stake group looks wrong' });
  await splitResult.locator('button').click();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.tab-button.active').innerText(), 'Roll Call');
  const groupSection = page.locator('.form-section[data-tab="rollcall"]').filter({ hasText: 'Initial Breed & Stake Groups' });
  assert.equal(await groupSection.locator('.section-info-panel:not([hidden])').count(), 1);

  await page.locator('#helpSearchInput').fill('missing judge');
  const judgeResult = page.locator('.help-result').filter({ hasText: 'judge is missing' });
  await judgeResult.locator('button').click();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.tab-button.active').innerText(), 'Admin');
  assert.equal(await page.locator('#subTabs .sub-tab-button.active').innerText(), 'Judges & Workers');

  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.section-info-toggle').first().evaluate(el => getComputedStyle(el).display), 'none');
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('help browser checks passed');
})().catch(error => { console.error(error); process.exit(1); });




