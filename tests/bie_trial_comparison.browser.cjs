const { chromium } = require('C:/Users/johns/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
    const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('http://127.0.0.1:8765/');
        await page.locator('#startupSplash').waitFor({ state: 'detached' });
        const result = await page.evaluate(() => {
            function source(id, values) {
                const entries = Object.entries(values).map(([registrationNumber, combinedScore], index) => ({
                    id: id + '-' + index, breed: 'WH', registrationNumber, callName: registrationNumber, className: 'Open', _combinedScore: combinedScore,
                }));
                return {
                    id, association: 'ASFA', trialName: 'Trial ' + id, startsOn: '2026-09-' + (10 + Number(id)),
                    entries,
                    preliminaryDraw: { groups: [{ finalDraw: { courses: [{ number: 1, hounds: entries.map(entry => ({ entryId: entry.id, combinedScore: entry._combinedScore, finalBlanketColor: 'YELLOW' })) }] } }] },
                };
            }
            const sources = [
                source('1', { Alpha: 300, Bravo: 290, Charlie: 280, Delta: 270 }),
                source('2', { Alpha: 295, Bravo: 299, Charlie: 300, Delta: 250 }),
            ];
            let added = null;
            const view = renderBieTrialComparison({ id: 'bie', archivedAt: '' }, sources, incoming => { added = incoming[0]; });
            document.body.appendChild(view);
            const checks = [...view.querySelectorAll('input[type=checkbox]')];
            checks[0].click(); checks[1].click();
            const third = view.querySelector('.bie-third-highest');
            if (!third) throw new Error(view.outerHTML);
            third.querySelector('button').click();
            const readiness = bieRecordSheetsReady({ scorebook: { bif: { eventType: 'BIE', elimination: true, finalWinner: 'a', draw: { courses: [{ hounds: [{ entryId: 'a' }] }] }, outcomes: { a: { score: '95' } } } } });
            return {
                rowCount: view.querySelectorAll('tbody tr').length,
                thirdText: third.textContent,
                added: { registrationNumber: added.registrationNumber, total: added.aggregateTotalScore, reason: added.selectionReason },
                readiness,
            };
        });
        assert.equal(result.rowCount, 4);
        assert(result.thirdText.includes('Charlie'));
        assert.deepEqual(result.added, { registrationNumber: 'Charlie', total: 580, reason: 'third-highest multi-trial total' });
        assert(result.readiness);
        assert.deepEqual(errors, []);
        console.log('Browser BIE trial selection, ranked table, third-hound action, and record readiness passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });



