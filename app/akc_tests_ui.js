(function () {
function selectedAkcTestTypes() {
    const result = [];
    if (document.getElementById('entryAkcJc')?.checked) result.push('JC');
    if (document.getElementById('entryAkcQc')?.checked) result.push('QC');
    return result;
}

function syncSelectedAkcTestsForTrials(targetTrialIds, hound, selectedRegistration, className, editedEntryId = '') {
    const types = selectedAkcTestTypes();
    const targetSet = new Set([selectedTrialId, ...(targetTrialIds || [])].filter(Boolean));
    trials = trials.map((trial) => {
        if (!targetSet.has(trial.id) || rulesForTrial(trial).association !== 'AKC') return trial;
        const entry = editedEntryId && trial.id === selectedTrialId
            ? (trial.entries || []).find((row) => row.id === editedEntryId)
            : (trial.entries || []).find((row) => isSameEntry(row, hound, selectedRegistration, className));
        if (!entry) return trial;
        return {
            ...trial,
            akcTests: window.AkcTests.syncLinked(trial.akcTests, entry, types, () => crypto.randomUUID()),
            updatedAt: new Date().toISOString(),
        };
    });
}

function akcTestHoundLabel(hound) {
    return [hound.callName, hound.registeredName, hound.registrationNumber].filter(Boolean).join(' | ');
}

function akcTestCandidateHounds(trial) {
    const found = new Map();
    [...(trial.entries || []), ...masterHounds].forEach((hound) => {
        const key = hound.houndId || hound.id || clean(hound.registrationNumber) || akcTestHoundLabel(hound);
        if (key && !found.has(key)) found.set(key, hound);
    });
    return [...found.values()];
}

function populateAkcTestBreedSelect() {
    const select = document.getElementById('akcTestBreed');
    if (!select || select.options.length) return;
    breedOptions.forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
    });
}

function renderAkcTests(trial) {
    const isAkc = rulesForTrial(trial || {}).association === 'AKC';
    const tabButton = document.getElementById('akcTestsTabButton');
    const entryChoices = document.getElementById('entryAkcTestChoices');
    if (tabButton) tabButton.hidden = !isAkc;
    if (entryChoices) entryChoices.hidden = !isAkc;
    if (!isAkc) return;

    populateAkcTestBreedSelect();
    const houndOptions = document.getElementById('akcTestHoundOptions');
    if (houndOptions) {
        houndOptions.replaceChildren();
        akcTestCandidateHounds(trial).forEach((hound) => {
            const option = document.createElement('option');
            option.value = akcTestHoundLabel(hound);
            houndOptions.appendChild(option);
        });
    }
    const judgeOptions = document.getElementById('akcTestJudgeOptions');
    if (judgeOptions) {
        judgeOptions.replaceChildren();
        const seen = new Set();
        [...(trial.judges || []), ...masterJudges].forEach((judge) => {
            if (!judge.name || seen.has(clean(judge.name))) return;
            seen.add(clean(judge.name));
            const option = document.createElement('option');
            option.value = judge.name;
            option.label = judge.number || '';
            judgeOptions.appendChild(option);
        });
    }

    const records = window.AkcTests.sorted(trial.akcTests || []);
    const summary = window.AkcTests.counts(records);
    const summaryElement = document.getElementById('akcTestSummary');
    if (summaryElement) {
        summaryElement.replaceChildren();
        [['JC entries', summary.jc], ['QC entries', summary.qc], ['Pending', summary.pending], ['Passed', summary.pass], ['Failed', summary.fail]].forEach(([label, value]) => {
            const card = document.createElement('div');
            card.className = 'summary-card';
            const strong = document.createElement('strong');
            strong.textContent = String(value);
            const span = document.createElement('span');
            span.textContent = label;
            card.append(strong, span);
            summaryElement.appendChild(card);
        });
    }

    const tbody = document.getElementById('akcTestsTable');
    if (tbody) {
        tbody.replaceChildren();
        if (!records.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 9;
            cell.textContent = 'No JC or QC test entries yet.';
            row.appendChild(cell);
            tbody.appendChild(row);
        }
        records.forEach((record, index) => {
            const row = document.createElement('tr');
            const values = [
                record.runOrder,
                record.testType,
                [record.callName, record.registeredName].filter(Boolean).join('\n'),
                displayBreedCode(record.breed),
                record.registrationNumber,
                [record.judgeName, record.judgeNumber].filter(Boolean).join(' #'),
                record.testType === 'QC' ? [record.partnerName, record.partnerBreed].filter(Boolean).join(' | ') : '',
                record.result.charAt(0).toUpperCase() + record.result.slice(1),
            ];
            values.forEach((value) => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });
            const actions = document.createElement('td');
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'secondary small';
            edit.textContent = 'Edit';
            edit.disabled = Boolean(trial.archivedAt);
            edit.addEventListener('click', () => editAkcTest(record.id));
            const up = document.createElement('button');
            up.type = 'button';
            up.className = 'secondary small';
            up.textContent = 'Up';
            up.disabled = index === 0 || Boolean(trial.archivedAt);
            up.addEventListener('click', () => moveAkcTest(record.id, -1));
            const down = document.createElement('button');
            down.type = 'button';
            down.className = 'secondary small';
            down.textContent = 'Down';
            down.disabled = index === records.length - 1 || Boolean(trial.archivedAt);
            down.addEventListener('click', () => moveAkcTest(record.id, 1));
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'danger small';
            remove.textContent = 'Remove';
            remove.disabled = Boolean(trial.archivedAt);
            remove.addEventListener('click', () => removeAkcTest(record.id));
            actions.append(edit);
            if (record.testType === 'QC' && !['fail', 'scratch'].includes(record.result)) {
                const certificate = document.createElement('button');
                certificate.type = 'button';
                certificate.className = 'secondary small';
                certificate.textContent = 'Print QC Certificate';
                certificate.addEventListener('click', () => printAkcQcCertificate(record.id));
                actions.appendChild(certificate);
            }
            actions.append(up, down, remove);
            row.appendChild(actions);
            tbody.appendChild(row);
        });
    }
    const printButton = document.getElementById('printAkcTestSheetButton');
    if (printButton) printButton.disabled = !records.length;
    toggleAkcQcFields();
}

function selectedAkcTestHound() {
    const trial = getSelectedTrial() || {};
    const value = document.getElementById('akcTestHoundSearch')?.value.trim() || '';
    return akcTestCandidateHounds(trial).find((hound) => akcTestHoundLabel(hound) === value) || null;
}

function useSelectedAkcTestHound() {
    const hound = selectedAkcTestHound();
    if (!hound) {
        showMessage(document.getElementById('akcTestMessage'), 'Choose a hound from the suggestions first.', 'warning');
        return;
    }
    document.getElementById('akcTestCallName').value = hound.callName || '';
    document.getElementById('akcTestRegisteredName').value = hound.registeredName || '';
    document.getElementById('akcTestBreed').value = hound.breed || '';
    document.getElementById('akcTestRegistrationNumber').value = hound.registrationNumber || '';
    document.getElementById('akcTestOwner').value = hound.owner || '';
    document.getElementById('akcTestHandler').value = hound.handler || hound.owner || '';
    document.getElementById('akcTestDob').value = hound.dateOfBirth || hound.dob || '';
    document.getElementById('akcTestSex').value = hound.sex || '';
}

function toggleAkcQcFields() {
    const isQc = document.getElementById('akcTestType')?.value === 'QC';
    const card = document.getElementById('akcQcPartnerCard');
    if (card) {
        card.hidden = !isQc;
        if (isQc && editingAkcTestId) card.open = true;
    }
}

function clearAkcTestForm() {
    editingAkcTestId = '';
    ['akcTestHoundSearch', 'akcTestCallName', 'akcTestRegisteredName', 'akcTestRegistrationNumber', 'akcTestJudgeName', 'akcTestJudgeNumber', 'akcTestOwner', 'akcTestHandler', 'akcTestDob', 'akcTestPartnerName', 'akcTestPartnerBreed', 'akcTestPartnerRegistrationNumber', 'akcTestNotes'].forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    if (document.getElementById('akcTestBreed')) document.getElementById('akcTestBreed').value = '';
    if (document.getElementById('akcTestSex')) document.getElementById('akcTestSex').value = '';
    if (document.getElementById('akcTestType')) document.getElementById('akcTestType').value = 'JC';
    if (document.getElementById('akcTestResult')) document.getElementById('akcTestResult').value = 'pending';
    document.getElementById('saveAkcTestButton').textContent = 'Add Test Entry';
    document.getElementById('cancelAkcTestEditButton').hidden = true;
    toggleAkcQcFields();
}

function saveAkcTest() {
    const trial = getSelectedTrial();
    const message = document.getElementById('akcTestMessage');
    if (!trial || rulesForTrial(trial).association !== 'AKC') return showMessage(message, 'Select an AKC trial first.', 'warning');
    if (trial.archivedAt) return showMessage(message, 'Archived trials are read-only.', 'warning');
    const registeredName = document.getElementById('akcTestRegisteredName').value.trim();
    const registrationNumber = document.getElementById('akcTestRegistrationNumber').value.trim();
    const breed = document.getElementById('akcTestBreed').value;
    if (!registeredName || !registrationNumber || !breed) {
        return showMessage(message, 'Registered name, breed, and AKC registration number are required.', 'warning');
    }
    const hound = selectedAkcTestHound();
    const existing = (trial.akcTests || []).find((record) => record.id === editingAkcTestId);
    const now = new Date().toISOString();
    const record = window.AkcTests.normalize({
        ...(existing || {}),
        id: existing?.id || crypto.randomUUID(),
        sourceEntryId: existing?.sourceEntryId || '',
        houndId: hound?.houndId || hound?.id || existing?.houndId || '',
        callName: document.getElementById('akcTestCallName').value,
        registeredName,
        breed,
        registrationNumber,
        registry: 'AKC',
        owner: document.getElementById('akcTestOwner').value,
        handler: document.getElementById('akcTestHandler').value,
        dateOfBirth: document.getElementById('akcTestDob').value,
        sex: document.getElementById('akcTestSex').value,
        testType: document.getElementById('akcTestType').value,
        result: document.getElementById('akcTestResult').value,
        judgeName: document.getElementById('akcTestJudgeName').value,
        judgeNumber: document.getElementById('akcTestJudgeNumber').value,
        partnerName: document.getElementById('akcTestPartnerName').value,
        partnerBreed: document.getElementById('akcTestPartnerBreed').value,
        partnerRegistrationNumber: document.getElementById('akcTestPartnerRegistrationNumber').value,
        notes: document.getElementById('akcTestNotes').value,
        runOrder: existing?.runOrder || (trial.akcTests || []).length + 1,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
    });
    const records = existing
        ? (trial.akcTests || []).map((item) => item.id === existing.id ? record : item)
        : [...(trial.akcTests || []), record];
    trials = trials.map((item) => item.id === trial.id ? { ...item, akcTests: window.AkcTests.sorted(records), updatedAt: now } : item);
    saveTrials();
    clearAkcTestForm();
    showMessage(message, existing ? 'JC/QC test entry updated.' : 'JC/QC test entry added.', 'success');
    render();
}

function editAkcTest(id) {
    const trial = getSelectedTrial();
    const record = (trial?.akcTests || []).find((item) => item.id === id);
    if (!record) return;
    editingAkcTestId = id;
    document.getElementById('akcTestHoundSearch').value = akcTestHoundLabel(record);
    document.getElementById('akcTestCallName').value = record.callName || '';
    document.getElementById('akcTestRegisteredName').value = record.registeredName || '';
    document.getElementById('akcTestBreed').value = record.breed || '';
    document.getElementById('akcTestRegistrationNumber').value = record.registrationNumber || '';
    document.getElementById('akcTestOwner').value = record.owner || '';
    document.getElementById('akcTestHandler').value = record.handler || '';
    document.getElementById('akcTestDob').value = record.dateOfBirth || '';
    document.getElementById('akcTestSex').value = record.sex || '';
    document.getElementById('akcTestType').value = record.testType || 'JC';
    document.getElementById('akcTestResult').value = record.result || 'pending';
    document.getElementById('akcTestJudgeName').value = record.judgeName || '';
    document.getElementById('akcTestJudgeNumber').value = record.judgeNumber || '';
    document.getElementById('akcTestPartnerName').value = record.partnerName || '';
    document.getElementById('akcTestPartnerBreed').value = record.partnerBreed || '';
    document.getElementById('akcTestPartnerRegistrationNumber').value = record.partnerRegistrationNumber || '';
    document.getElementById('akcTestNotes').value = record.notes || '';
    document.getElementById('saveAkcTestButton').textContent = 'Update Test Entry';
    document.getElementById('cancelAkcTestEditButton').hidden = false;
    toggleAkcQcFields();
    document.getElementById('akcTestsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function removeAkcTest(id) {
    const trial = getSelectedTrial();
    if (!trial || trial.archivedAt) return;
    const record = (trial.akcTests || []).find((item) => item.id === id);
    if (!record) return;
    const confirmed = await showTrialConfirm({
        title: 'Remove JC/QC Test Entry',
        eyebrow: record.testType,
        message: 'Remove ' + (record.registeredName || record.callName) + ' from the ' + record.testType + ' test list?',
        primaryText: 'Remove Test Entry',
    });
    if (!confirmed) return;
    const records = window.AkcTests.sorted((trial.akcTests || []).filter((item) => item.id !== id))
        .map((item, index) => ({ ...item, runOrder: index + 1 }));
    trials = trials.map((item) => item.id === trial.id ? { ...item, akcTests: records, updatedAt: new Date().toISOString() } : item);
    saveTrials();
    if (editingAkcTestId === id) clearAkcTestForm();
    showMessage(document.getElementById('akcTestMessage'), 'JC/QC test entry removed.', 'success');
    render();
}

function moveAkcTest(id, direction) {
    const trial = getSelectedTrial();
    if (!trial || trial.archivedAt) return;
    const records = window.AkcTests.sorted(trial.akcTests || []);
    const index = records.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= records.length) return;
    [records[index], records[target]] = [records[target], records[index]];
    const reordered = records.map((item, position) => ({ ...item, runOrder: position + 1, updatedAt: new Date().toISOString() }));
    trials = trials.map((item) => item.id === trial.id ? { ...item, akcTests: reordered, updatedAt: new Date().toISOString() } : item);
    saveTrials();
    render();
}

async function printAkcTestSheet() {
    const trial = getSelectedTrial();
    if (!trial || !(trial.akcTests || []).length) {
        showMessage(document.getElementById('akcTestMessage'), 'Add at least one JC or QC entry first.', 'warning');
        return;
    }
    await openTrialPdf(
        '/api/akc-test-record-sheet',
        { trial },
        document.getElementById('akcTestMessage'),
        'JC/QC record sheet opened.',
        'Could not create the JC/QC record sheet.'
    );
}

function trialWithJudgeContacts(trial) {
    if (!trial) return trial;
    return {
        ...trial,
        judges: (trial.judges || []).map((judge) => {
            const directory = masterJudges.find((item) =>
                (judge.judgeId && item.id === judge.judgeId)
                || (judge.number && clean(item.number) === clean(judge.number))
                || clean(item.name) === clean(judge.name)
            );
            return directory ? { ...directory, ...judge } : judge;
        }),
    };
}

async function printAkcQcCertificate(testId) {
    const trial = getSelectedTrial();
    const message = document.getElementById('akcTestMessage');
    if (!trial) return;
    await openTrialPdf(
        '/api/akc-qc-certificate',
        { trial, testId },
        message,
        'QC certificate opened. Have the owner or agent and certifying judge sign it after the hound passes.',
        'Could not create the QC certificate.'
    );
}

async function printAkcJudgesBook() {
    const trial = readForm();
    const message = document.getElementById('wrapUpMessage');
    if (rulesForTrial(trial).association !== 'AKC') {
        showMessage(message, 'The AKC Judges’ Book is available only for AKC events.', 'warning');
        return;
    }
    await openTrialPdf(
        '/api/akc-judges-book',
        { trial: trialWithJudgeContacts(trial) },
        message,
        'AKC Judges’ Book cover opened.',
        'Could not create the AKC Judges’ Book cover.'
    );
}

function bindAkcTestControls() {
    document.getElementById('useAkcTestHoundButton')?.addEventListener('click', useSelectedAkcTestHound);
    document.getElementById('saveAkcTestButton')?.addEventListener('click', saveAkcTest);
    document.getElementById('cancelAkcTestEditButton')?.addEventListener('click', clearAkcTestForm);
    document.getElementById('printAkcTestSheetButton')?.addEventListener('click', printAkcTestSheet);
    document.getElementById('akcTestType')?.addEventListener('change', toggleAkcQcFields);
    document.getElementById('printAkcJudgesBookButton')?.addEventListener('click', printAkcJudgesBook);
    document.getElementById('akcTestJudgeName')?.addEventListener('change', (event) => {
        const judge = [...(getSelectedTrial()?.judges || []), ...masterJudges].find((item) => clean(item.name) === clean(event.target.value));
        if (judge) document.getElementById('akcTestJudgeNumber').value = judge.number || '';
    });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindAkcTestControls, { once: true });
else bindAkcTestControls();

window.renderAkcTests = renderAkcTests;
window.syncSelectedAkcTestsForTrials = syncSelectedAkcTestsForTrials;
window.trialWithJudgeContacts = trialWithJudgeContacts;
})();