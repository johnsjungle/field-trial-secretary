const { chromium } = require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.route('**/*', route =>
      route.request().method() === 'GET'
        ? route.continue()
        : route.fulfill({ json: { ok: true } })
    );
    await page.goto('http://127.0.0.1:8765/');
    await page.locator('#startupSplash').waitFor({ state: 'detached' });

    assert.equal(await page.title(), 'HALO');
    const brand = page.locator('.brand-logo');
    await brand.waitFor({ state: 'visible' });
    assert.match(await brand.getAttribute('src'), /halo-logo-primary\.png$/);

    const iconResponse = await page.request.get('http://127.0.0.1:8765/assets/halo-icon.png');
    assert.equal(iconResponse.status(), 200);

    await page.evaluate(() => {
      currentAdminPage = 'Updates & Versions';
      switchTab('admin');
      render();
    });
    const card = page.locator('.halo-identity-card');
    await card.waitFor({ state: 'visible' });
    const cardText = await card.textContent();
    assert.match(cardText, /Hound Administration & Lure Operations/);
    assert.match(cardText, /In remembrance of .Halo./);
    assert.match(cardText, /MBIF FC Kamars God Speed MC LCX2 TKN LCM3 HOF/);
    assert.deepEqual(pageErrors, []);
    await page.screenshot({ path: '.tmp/halo-updates-page.png', fullPage: true });
    console.log('HALO branding verified: title, header logo, icon, acronym, remembrance, and honor line.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
