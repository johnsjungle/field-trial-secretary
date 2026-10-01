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
    const splashDetailsLocator = page.locator('.splash-halo-details');
    const splashDetails = await splashDetailsLocator.textContent();
    const splashTrackBox = await page.locator('.splash-track').boundingBox();
    const splashDetailsBox = await splashDetailsLocator.boundingBox();
    assert.ok(splashDetailsBox.y >= splashTrackBox.y + splashTrackBox.height);
    assert.match(splashDetails, /Hound entries and records/);
    assert.match(splashDetails, /Administration of trials, workers, and judges/);
    assert.match(splashDetails, /Lure coursing events/);
    assert.match(splashDetails, /Operations from roll call through final paperwork/);
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
    const identityBox = await page.locator('.halo-identity-copy').boundingBox();
    const updateDetailsBox = await page.locator('.halo-update-details').boundingBox();
    assert.ok(updateDetailsBox.x > identityBox.x);
    assert.match(cardText, /Hound Administration & Lure Operations/);
    assert.match(cardText, /In remembrance of .Halo./);
    assert.match(cardText, /MBIF FC Kamars God Speed MC LCX2 TKN LCM3 HOF/);
    assert.match(cardText, /Hound entries and records/);
    assert.match(cardText, /Administration of trials, workers, and judges/);
    assert.match(cardText, /Lure coursing events/);
    assert.match(cardText, /Operations from roll call through final paperwork/);
    const aboutText = await page.locator('.halo-about-grid').textContent();
    assert.match(aboutText, /offline field trial management program/);
    assert.match(aboutText, /Admin .* Hound DB .* Import Hound Database/);
    assert.match(aboutText, /create realistic test trials/);
    assert.equal(
      await page.getByRole('link', { name: 'HALO Releases page' }).getAttribute('href'),
      'https://github.com/johnsjungle/field-trial-secretary-updates/releases'
    );
    assert.deepEqual(pageErrors, []);
    await page.screenshot({ path: '.tmp/halo-updates-page.png', fullPage: true });
    console.log('HALO branding verified: loading details below photos and four-part meaning to the right on Updates.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
