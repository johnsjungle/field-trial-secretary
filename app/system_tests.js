(function attachSystemTests(root) {
    'use strict';

    let lastReport = null;

    function check(id, category, name, callback) {
        const started = performance.now();
        try {
            const details = callback();
            return { id, category, name, status: 'pass', details: String(details || 'Passed'), durationMs: Math.round(performance.now() - started) };
        } catch (error) {
            return { id, category, name, status: 'fail', details: error?.message || String(error), durationMs: Math.round(performance.now() - started) };
        }
    }

    function assert(condition, message) {
        if (!condition) throw new Error(message);
    }

    function same(actual, expected, message) {
        assert(JSON.stringify(actual) === JSON.stringify(expected), `${message} Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`);
    }

    function collectClientSystemChecks() {
        const results = [];
        results.push(check('browser-controls', 'Application', 'Full System Test controls are installed', () => {
            ['runFullSystemTestButton', 'systemTestSummary', 'systemTestResults', 'systemTestSearch', 'systemTestStatusFilter', 'previewTestPaperworkButton'].forEach((id) => assert(document.getElementById(id), `Missing #${id}.`));
            return 'All Admin Tools controls found';
        }));
        results.push(check('rules-associations', 'Association Rules', 'ASFA and AKC scoring profiles remain distinct', () => {
            assert(root.FTSAssociationRules.profileForAssociation('ASFA').judgeScoreMaximum === 100, 'ASFA maximum must be 100 per judge.');
            assert(root.FTSAssociationRules.profileForAssociation('AKC').judgeScoreMaximum === 50, 'AKC maximum must be 50 per judge.');
            return 'ASFA 100; AKC 50';
        }));
        results.push(check('rules-field-clerk', 'Trial Setup', 'ASFA requires a field clerk and AKC does not', () => {
            const base = { trialName: 'Test', clubName: 'Club', startsOn: '2026-01-01', endsOn: '2026-01-01' };
            assert(/field clerk/i.test(validateTrialBasics({ ...base, association: 'ASFA' })), 'ASFA trial without a field clerk was accepted.');
            assert(validateTrialBasics({ ...base, association: 'ASFA', fieldClerk: 'Clerk' }) === '', 'Valid ASFA trial was rejected.');
            assert(validateTrialBasics({ ...base, association: 'AKC' }) === '', 'AKC trial incorrectly required a field clerk.');
            return 'Required only for ASFA';
        }));
        results.push(check('rules-breed-aliases', 'Entries & Imports', 'Spelled-out and newer breed names normalize', () => {
            same([normalizeBreedCode('Ibizan Hound'), normalizeBreedCode("Cirneco dell'Etna"), normalizeBreedCode('Galgo Espanol')], ['IB', 'CE', 'GA'], 'Breed aliases did not normalize.');
            return 'Ibizan Hound → IB; Cirneco dell’Etna → CE; Galgo Español → GA';
        }));
        results.push(check('premium-judge-markdown', 'Judges & Assignments', 'Markdown judge schedules import day, names, and marks', () => {
            const parsed = parsePremiumJudgeAssignments(`| Day | Name | WH | Bo | SNG | IH | PRV | Ce |
| -- | -- | -- | -- | --- | -- | --- | -- |
| Saturday | Mary Ellen | s | s | s | s | s | s |
| Sunday | Kathy | S | | | | | S |`);
            same([...parsed.judges].sort(), ['Kathy', 'Mary Ellen'], 'Judge names were not read.');
            assert(parsed.assignmentsByDay.Saturday.WH[0].judge === 'Mary Ellen', 'Saturday Whippet assignment was lost.');
            assert(parsed.assignmentsByDay.Saturday.BZ[0].judge === 'Mary Ellen', 'Bo was not mapped to Borzoi.');
            assert(parsed.assignmentsByDay.Saturday.SINGLES[0].judge === 'Mary Ellen', 'SNG was not mapped to Singles.');
            assert(parsed.assignmentsByDay.Saturday.IB[0].judge === 'Mary Ellen', 'IH was not mapped to Ibizan Hound.');
            assert(parsed.assignmentsByDay.Saturday.PROV[0].judge === 'Mary Ellen', 'PRV was not mapped to Provisional.');
            assert(parsed.assignmentsByDay.Sunday.CE[0].judge === 'Kathy', 'Mixed-case Ce heading was not recognized.');
            return 'Markdown table, multi-word names, mixed-case marks, and premium aliases retained';
        }));
        results.push(check('draw-balanced-ten', 'Draws', 'Ten hounds make balanced courses without a single', () => {
            same(courseSizesForEntryCount(10), [3, 3, 2, 2], 'Ten-hound course plan is unbalanced.');
            return '3, 3, 2, 2';
        }));
        results.push(check('draw-balanced-four', 'Draws', 'Four hounds make two courses of two', () => {
            same(courseSizesForEntryCount(4), [2, 2], 'Four-hound course plan is unbalanced.');
            return '2, 2';
        }));
        results.push(check('draw-fields-lanes', 'Multi-field Events', 'Field and lane names are preserved', () => {
            same(eventFieldsForTrial({ eventFields: [{ id: 'north', name: 'North Field' }, { id: 'south', name: 'South Field' }] }).map((row) => row.name), ['North Field', 'South Field'], 'Field names changed.');
            same(rollCallLanesForTrial({ rollCallLanes: [{ id: 'one', name: 'Lane 1' }, { id: 'two', name: 'Lane 2' }] }).map((row) => row.name), ['Lane 1', 'Lane 2'], 'Lane names changed.');
            return 'Two fields and two roll-call lanes retained';
        }));
        results.push(check('rules-asfa-split', 'Split Stakes', 'ASFA split-stake threshold remains 20', () => {
            const rule = splitStakeRuleForGroup({ association: 'ASFA' }, { breed: 'RR', stake: 'Open', entries: Array.from({ length: 20 }, (_, index) => ({ id: String(index) })) });
            assert(rule.eligible && rule.splitCount === 2 && rule.minimumPerSplit === 10, 'ASFA 20-entry stake did not split into two flights.');
            return '20 starters → two flights of 10';
        }));
        results.push(check('rules-akc-split-override', 'Split Stakes', 'AKC split override controls the number of groups', () => {
            const trial = { association: 'AKC', locationState: 'PA', splitStakeOverrides: { 'AKC|RR': { minimumPerSplit: 6, reason: 'System test' } } };
            const rule = splitStakeRuleForGroup(trial, { breed: 'RR', stake: 'Open', entries: Array.from({ length: 18 }, (_, index) => ({ id: String(index) })) });
            assert(rule.override && rule.splitCount === 3, 'AKC override did not create three groups.');
            return '18 starters at 6 per split → three groups';
        }));
        results.push(check('bie-six-judges', 'BIF/BIE', 'BIE supports up to six judges', () => {
            const bif = { eventType: 'BIE', judge1: 'One', judge2: 'Two', judge3: 'Three', judge4: 'Four', judge5: 'Five', judge6: 'Six' };
            assert(bifJudgeSlots(bif, true).length === 6 && bifJudgeSlots(bif).length === 6, 'Six BIE judge slots are not available.');
            return 'Six judge assignments retained';
        }));
        results.push(check('bie-prequalifier', 'BIF/BIE', 'BIE pre-qualifier separates contested breeds and byes', () => {
            const plan = buildBiePreQualifierPlan([
                { entryId: 'rr1', breed: 'RR' }, { entryId: 'rr2', breed: 'RR' }, { entryId: 'rr3', breed: 'RR' }, { entryId: 'ib1', breed: 'IB' },
            ]);
            assert(plan.carryEntryIds.includes('ib1'), 'Single breed winner was not carried forward.');
            assert(plan.courses.length === 1 && plan.courses[0].hounds.length === 3, 'Contested breed did not receive one three-hound course.');
            return 'One breed winner carried; three same-breed hounds scheduled';
        }));
        results.push(check('bie-course-winner', 'BIF/BIE', 'A unique BIE high score advances', () => {
            const course = { id: 'course', hounds: [{ entryId: 'a' }, { entryId: 'b' }, { entryId: 'c' }] };
            const winner = bieCourseWinner({ outcomes: { a: { score: 80 }, b: { score: 85 }, c: { score: 81 } }, courseWinners: {} }, course);
            assert(winner === 'b', 'Unique high score did not advance.');
            return 'Highest-scoring hound selected';
        }));
        results.push(check('specialty-pairs', 'Specialty Stakes', 'Specialty pairs require different hounds of the same breed', () => {
            const entries = [
                { id: 'a', houndId: 'ha', breed: 'RR', registrationNumber: 'HP1', additionalKennel: true },
                { id: 'b', houndId: 'hb', breed: 'RR', registrationNumber: 'HP2', additionalKennel: true },
                { id: 'c', houndId: 'hc', breed: 'IB', registrationNumber: 'HP3', additionalKennel: true },
            ];
            const paired = specialtyPairEntries(entries, 'Kennel', 'a', 'b');
            assert(paired.find((row) => row.id === 'a').specialtyKennelPartnerId === 'b', 'Valid pair was not saved.');
            let rejected = false;
            try { specialtyPairEntries(entries, 'Kennel', 'a', 'c'); } catch { rejected = true; }
            assert(rejected, 'Different-breed pair was accepted.');
            return 'Valid pair accepted; different breed rejected';
        }));
        results.push(check('akc-jc-qc', 'AKC JC/QC', 'JC/QC records preserve type, result, and partner', () => {
            const row = root.AkcTests.normalize({ id: 'qc', testType: 'QC', result: 'pass', partnerName: 'Partner', registrationNumber: 'HP1' });
            assert(row.testType === 'QC' && row.result === 'pass' && row.partnerName === 'Partner', 'QC record fields were lost.');
            return 'QC pass and partner retained';
        }));
        results.push(check('imports-review-flag', 'Entries & Imports', 'Unknown non-first-time hounds are flagged for review', () => {
            assert(importedHoundNeedsReview({ selected: true, imported: false, firstTime: false, match: null, houndMatchReviewed: false }), 'Unknown hound was not flagged.');
            assert(!importedHoundNeedsReview({ selected: true, imported: false, firstTime: true, match: null, houndMatchReviewed: false }), 'First-time entry was incorrectly flagged.');
            assert(importedHoundEditDistance('HP123456', 'HP123457') === 1, 'One-character registration typo was not recognized.');
            return 'Unknown existing entry flagged; first-time entry exempt; one-character typo detected';
        }));
        results.push(check('run-plan-all-breeds', 'Judges & Assignments', 'All-breeds setup includes empty eligible breeds and preserves assignments', () => {
            const trial = {
                association: 'ASFA', trialType: 'all_breed', singlesOffered: true, lciOffered: true,
                runPlanIncludeAllBreeds: true,
                eventFields: [{ id: 'field', name: 'Field 1' }], rollCallLanes: [{ id: 'lane', name: 'Lane 1' }],
                entries: [{ id: 'entry', breed: 'RR', className: 'Open' }],
                runPlan: [{ id: 'rr', breed: 'RR', runOrder: 1, judge1: 'Judge One', fieldId: 'field', rollCallLaneId: 'lane' }],
            };
            const rows = buildRunPlanRowsForTrial(trial);
            const rr = rows.find((row) => row.breed === 'RR');
            assert(rows.length === 26, `Expected 26 ASFA running groups, received ${rows.length}.`);
            assert(rr?.entryCount === 1 && rr?.judge1 === 'Judge One', 'Entered breed count or judge assignment was lost.');
            assert(rows.some((row) => row.breed === 'WH' && row.entryCount === 0), 'Empty eligible breed was not included.');
            assert(rows.some((row) => row.breed === 'Singles') && rows.some((row) => row.breed === 'LCI Small'), 'Offered Singles or LCI groups were not included.');
            const printable = runPlanRowsForPrint({ ...trial, runPlan: rows });
            const judgeMap = judgesMapRows({ ...trial, runPlan: rows });
            assert(printable.length === 1 && printable[0].breed === 'RR', 'Empty breeds leaked onto the worker sheet.');
            assert(judgeMap.length === 1 && judgeMap[0].breed === 'RR', 'Empty breeds leaked onto the judges map.');
            return '26 setup groups; only entered RR prints; existing judge retained';
        }));
        results.push(check('roll-call-payment', 'Roll Call', 'Paid or unpaid status is an optional print column', () => {
            const control = document.getElementById('rollCallShowPayment');
            assert(control, 'Missing paid/unpaid roll-call option.');
            const previous = control.checked;
            const trial = { rollCallShowPayment: false };
            const group = { showField: false, showLane: false };
            control.checked = false;
            assert(!rollCallColumns(trial, group, 'checkIn').some((column) => column.label === 'Payment'), 'Payment column was shown while disabled.');
            control.checked = true;
            const payment = rollCallColumns(trial, group, 'checkIn').find((column) => column.label === 'Payment');
            assert(payment?.value({ paid: true }) === 'Paid' && payment?.value({ paid: false }) === 'Unpaid', 'Payment labels were incorrect.');
            control.checked = previous;
            return 'Hidden by default; Paid and Unpaid labels print when selected';
        }));
        results.push(check('finals-judges-map', 'Judges & Assignments', 'Finals map uses actual courses after hound removals', () => {
            const trial = {
                eventFields: [{ id: 'one', name: 'Field 1' }],
                runPlan: [{ breed: 'RR', runOrder: 1, fieldId: 'one', judge1: 'Judge One', judge2: 'Judge Two' }],
                preliminaryDraw: { groups: [{
                    breed: 'RR', stake: 'Open', flight: 'A',
                    finalDraw: { courses: [
                        { number: 1, hounds: [{ entryId: 'a' }, { entryId: 'b' }, { entryId: 'c', finalOutcome: 'excused' }] },
                        { number: 2, hounds: [{ entryId: 'd' }, { entryId: 'e' }] },
                    ] },
                }] },
            };
            const rows = finalsJudgesMapRows(trial);
            assert(rows.length === 1, 'Finals group was missing from the map.');
            assert(rows[0].entryCount === 4 && rows[0].courseBreakdown === '1(2) 2(2)', 'Finals map did not use the actual eligible hounds by course.');
            assert(rows[0].judges === 'Judge One / Judge Two', 'Finals judges were not retained.');
            const splitRows = judgesMapRows({
                ...trial,
                entries: Array.from({ length: 6 }, (_, index) => ({ id: String(index), breed: 'RR', className: 'Open' })),
                preliminaryDraw: { groups: [
                    { breed: 'RR', stake: 'Open', flight: 'A', courses: [{ number: 1, hounds: [{ entryId: 'a' }, { entryId: 'b' }, { entryId: 'c' }] }] },
                    { breed: 'RR', stake: 'Open', flight: 'B', courses: [{ number: 1, hounds: [{ entryId: 'd' }, { entryId: 'e' }, { entryId: 'f' }] }] },
                ] },
            });
            assert(splitRows.length === 2 && splitRows.map((row) => row.stake).join(',') === 'Open A,Open B', 'Preliminary split flights were merged on the judges map.');
            assert(document.getElementById('printFinalsJudgesMapButton'), 'Finals Judges Map print button is missing.');
            return 'Prelim split flights retained; excused final hound removed; actual courses and judges retained';
        }));
        results.push(check('owner-report-controls', 'Reports', 'Owner list supports selected trials and adjustable name matching', () => {
            const threshold = document.getElementById('ownerMatchThreshold');
            assert(document.getElementById('buildOwnerReportButton'), 'Build Owner List button is missing.');
            assert(threshold && threshold.min === '70' && threshold.max === '100' && threshold.value === '90', 'Owner matching control is missing or incorrectly configured.');
            return 'Owner report button found; similarity control spans 70% through exact 100%';
        }));
        results.push(check('admin-recovery-controls', 'Backup, Archive & Recovery', 'Backup, archive, undo, and upload controls are installed', () => {
            ['createSQLiteBackupButton', 'undoLastActionButton', 'restoreSQLiteBackupButton', 'createFinalArchiveButton', 'entryLciRegistrationFile'].forEach((id) => assert(document.getElementById(id), `Missing #${id}.`));
            return 'Backup, undo, restore, archive, and document upload controls found';
        }));        results.push(check('updates-version-order', 'Updates', 'Semantic release versions sort correctly', () => {
            assert(compareReleaseVersions('0.4.10', '0.4.9') === 1, '0.4.10 was not newer than 0.4.9.');
            return '0.4.10 is newer than 0.4.9';
        }));
        results.push(check('updates-safe-links', 'Updates', 'Update links require approved secure hosts', () => {
            assert(Boolean(safeReleaseUrl('https://github.com/johnsjungle/field-trial-secretary-updates/releases')), 'Valid GitHub URL was rejected.');
            assert(!safeReleaseUrl('http://github.com/example'), 'Insecure update URL was accepted.');
            assert(!safeReleaseUrl('https://example.com/file'), 'Unapproved update host was accepted.');
            return 'Secure GitHub accepted; unsafe links rejected';
        }));
        results.push(check('updates-duplicate-release', 'Updates', 'Duplicate release entries are rejected', () => {
            let rejected = false;
            try { validateVersionIndex({ schemaVersion: 1, versions: [
                { version: '1.0.0', status: 'available', channel: 'stable' },
                { version: '1.0.0', status: 'available', channel: 'stable' },
            ] }); } catch { rejected = true; }
            assert(rejected, 'Duplicate versions were accepted.');
            return 'Duplicate version rejected';
        }));
        return results;
    }

    function resultText(report) {
        const lines = [`HALO Full System Test`, `Run: ${report.completedAt || ''}`, `Result: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings`, ''];
        (report.results || []).forEach((row) => lines.push(`[${row.status.toUpperCase()}] ${row.category} — ${row.name}: ${row.details}`));
        return lines.join('\n');
    }

    function renderReport() {
        if (!lastReport) return;
        const search = String(document.getElementById('systemTestSearch')?.value || '').trim().toLowerCase();
        const status = document.getElementById('systemTestStatusFilter')?.value || 'all';
        const rows = (lastReport.results || []).filter((row) => {
            if (status !== 'all' && row.status !== status) return false;
            return !search || `${row.category} ${row.name} ${row.details}`.toLowerCase().includes(search);
        });
        const container = document.getElementById('systemTestResults');
        container.replaceChildren();
        const groups = new Map();
        rows.forEach((row) => {
            if (!groups.has(row.category)) groups.set(row.category, []);
            groups.get(row.category).push(row);
        });
        groups.forEach((groupRows, category) => {
            const section = document.createElement('section'); section.className = 'system-test-group';
            const title = document.createElement('h3'); title.textContent = `${category} (${groupRows.length})`; section.append(title);
            groupRows.forEach((row) => {
                const article = document.createElement('article'); article.className = `system-test-result ${row.status}`;
                const icon = document.createElement('span'); icon.className = 'system-test-icon'; icon.textContent = row.status === 'pass' ? '✓' : row.status === 'warning' ? '!' : '×';
                const body = document.createElement('div');
                const name = document.createElement('strong'); name.textContent = row.name;
                const details = document.createElement('p'); details.textContent = row.details || '';
                const time = document.createElement('small'); time.textContent = `${row.durationMs || 0} ms`;
                body.append(name, details, time); article.append(icon, body); section.append(article);
            });
            container.append(section);
        });
        if (!rows.length) { const empty = document.createElement('p'); empty.className = 'field-note'; empty.textContent = 'No checks match this filter.'; container.append(empty); }
    }

    function renderSummary(report) {
        const summary = document.getElementById('systemTestSummary');
        summary.replaceChildren(); summary.hidden = false;
        [['total', 'Checks'], ['passed', 'Passed'], ['failed', 'Failed'], ['warnings', 'Warnings']].forEach(([key, label]) => {
            const card = document.createElement('div'); card.className = `system-test-count ${key}`;
            const number = document.createElement('strong'); number.textContent = report.summary[key];
            const text = document.createElement('span'); text.textContent = label;
            card.append(number, text); summary.append(card);
        });
        document.getElementById('systemTestFilters').hidden = false;
        document.getElementById('copySystemTestReportButton').hidden = false;
        renderReport();
    }

    async function runFullSystemTest() {
        const button = document.getElementById('runFullSystemTestButton');
        const progress = document.getElementById('systemTestProgress');
        const message = document.getElementById('systemTestMessage');
        button.disabled = true; progress.hidden = false; message.textContent = '';
        try {
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const clientResults = collectClientSystemChecks();
            const response = await fetch('/api/system-test', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientResults }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.ok) {
                if ([404, 501].includes(response.status)) throw new Error('The running HALO server does not include the Full System Test yet. Exit HALO completely, restart it, and try again.');
                throw new Error(payload.error || `System test request failed (${response.status}).`);
            }
            lastReport = payload; renderSummary(payload);
            message.className = `form-message compact ${payload.healthy ? 'success' : 'warning'}`;
            message.textContent = payload.healthy
                ? `All ${payload.summary.total} checks completed without failures in ${(payload.durationMs / 1000).toFixed(1)} seconds.`
                : `${payload.summary.failed} of ${payload.summary.total} checks failed. Review the red results before using this build at a trial.`;
        } catch (error) {
            const detail = String(error?.message || error || 'Unknown error');
            const restartMessage = /failed to fetch|networkerror|load failed/i.test(detail)
                ? 'The HALO server did not respond. Exit HALO completely, restart it, and run the test again.'
                : detail;
            message.className = 'form-message compact warning';
            message.textContent = `System test could not finish: ${restartMessage}`;
        } finally {
            button.disabled = false; progress.hidden = true;
        }
    }

    async function copyReport() {
        if (!lastReport) return;
        const text = resultText(lastReport);
        try {
            await navigator.clipboard.writeText(text);
            document.getElementById('systemTestMessage').textContent = 'System test report copied.';
        } catch {
            const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
            document.body.append(area); area.select(); document.execCommand('copy'); area.remove();
            document.getElementById('systemTestMessage').textContent = 'System test report copied.';
        }
    }

    function initialize() {
        document.getElementById('runFullSystemTestButton')?.addEventListener('click', runFullSystemTest);
        document.getElementById('copySystemTestReportButton')?.addEventListener('click', copyReport);
        document.getElementById('systemTestSearch')?.addEventListener('input', renderReport);
        document.getElementById('systemTestStatusFilter')?.addEventListener('change', renderReport);
    }

    root.HaloSystemTests = { collectClientSystemChecks, runFullSystemTest };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
}(window));
