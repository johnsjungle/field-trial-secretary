const { chromium } = require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(String(error)));
        // Isolate this check from the user's live trials and block all API writes.
        await page.route('**/api/**', route => {
            const path = new URL(route.request().url()).pathname;
            if (path === '/api/version') return route.fulfill({ json: { ok: true, appVersion: { version: 'test' } } });
            if (path === '/api/database-setup-status') return route.fulfill({ json: { ok: true, ready: true } });
            if (path === '/api/state') return route.fulfill({ json: { ok: true, state: null } });
            return route.fulfill({ json: { ok: true } });
        });
        await page.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
        await page.locator('#startupSplash').waitFor({ state: 'hidden', timeout: 10000 });
        const details = await page.evaluate(() => {
            const trial = {
                id: 'entry-sync-test', association: 'ASFA', entries: [{ id: 'halo', callName: 'Halo', breed: 'IB', className: 'FCh', rollCallStatus: 'present' }],
                preliminaryDraw: { groups: [{ id: 'ib-open', breed: 'IB', stake: 'Open', courses: [{ number: 1, hounds: [{ entryId: 'halo', stake: 'Open' }] }] }] },
            };
            renderTrialGuide(trial);
            const card = document.getElementById('trialGuideCard');
            const warning = trialGuideSteps(trial)[0];
            return {
                summary: document.getElementById('trialGuideSummary').textContent,
                pink: getComputedStyle(card.querySelector('summary')).backgroundColor,
                detail: document.getElementById('trialGuideNext').textContent,
                firstStep: warning.id,
                issue: trialEntrySyncIssues(trial)[0],
            };
        });
        assert.match(details.summary, /Warning: entries need review/);
        assert.equal(details.pink, 'rgb(255, 224, 239)');
        assert.match(details.detail, /Halo: entry is IB FCh, but the draw is IB Open/);
        assert.equal(details.firstStep, 'entry-draw-sync');
        await page.evaluate(() => {
            const originalReadForm = readForm;
            readForm = () => ({
                id: 'popup-test', association: 'ASFA', runPlanEntriesFingerprint: 'outdated',
                entries: [{ id: 'halo', callName: 'Halo', breed: 'IB', className: 'FCh', rollCallStatus: 'present' }],
                preliminaryDraw: { groups: [{ breed: 'IB', stake: 'Open', courses: [{ hounds: [{ entryId: 'halo', stake: 'Open' }] }] }] },
            });
            window.entrySyncPopupCheck = buildPreliminaryDraw().finally(() => { readForm = originalReadForm; });
        });
        const modal = page.locator('.trial-action-modal');
        await modal.waitFor({ state: 'visible' });
        assert.match(await modal.innerText(), /Halo: entry is IB FCh, but the draw is IB Open/);
        assert.equal(await modal.getByRole('button', { name: 'Review Hound Entries', exact: true }).count(), 1);
        await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
        await page.evaluate(() => window.entrySyncPopupCheck);
        assert.equal(await page.locator('.trial-action-modal').count(), 0);
        await page.evaluate(() => renderTrialGuide(null));
        assert.equal(await page.locator('#trialGuideCard.entry-sync-warning').count(), 0);
        assert.deepEqual(errors, []);
        console.log('Pink guide warning, preliminary draw popup, safe cancellation, and trial-change reset passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
