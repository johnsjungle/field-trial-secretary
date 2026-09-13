function bifJudgeSlots(bif, includeEmpty = false) {
    const maximum = bif?.eventType === 'BIE' ? 6 : 2;
    const slots = Array.from({ length: maximum }, (_, index) => {
        const number = index + 1, key = `judge${number}`;
        return { number, key, name: String(bif?.[key] || '').trim() };
    });
    return includeEmpty ? slots : slots.filter(slot => slot.name);
}

function bieIdentity(candidate) {
    const h = candidate.hound || {};
    const reg = clean(candidate.registrationNumber || h.registrationNumber).replace(/[^A-Z0-9]/g, '');
    return `${normalizeBreedCode(candidate.breed)}:${reg || clean(h.registeredName) || `${candidate.sourceTrialId}:${candidate.sourceEntryId}`}`;
}

function mergeBieCandidates(existing, incoming) {
    const result = [...existing];
    const identities = new Set(result.map(bieIdentity));
    incoming.forEach((candidate) => {
        if (!identities.has(bieIdentity(candidate))) {
            identities.add(bieIdentity(candidate));
            result.push(candidate);
        }
    });
    return result;
}

async function approveBifChange(trial, manualMove = false) {
    if (trial.archivedAt) { showMessage(bifMessage, 'Archived trials cannot be changed.', 'warning'); return false; }
    const bif = bifState(trial);
    if (!bif.draw || (bif.draw.manualDraft && !bif.draw.courses.some(c => c.hounds.length))) return true;
    const before = JSON.stringify(trial.scorebook);
    const accepted = await showTrialConfirm({
        title: manualMove ? 'Move Hound in Posted Draw?' : 'Replace Existing Event Draw?',
        message: manualMove ? 'Moving this hound changes course assignments and may change colors in the affected courses. Event scores and tie runoffs will be cleared. Replace posted sheets and notify the field crew and exhibitors.' : 'Colors and course assignments may already be posted. Changing runners or redrawing clears this event draw, scores, and tie runoffs. Replace posted sheets and notify the field crew and exhibitors.',
        primaryLabel: manualMove ? 'Move Hound and Clear Scores' : 'Replace Draw and Clear Scores', secondaryLabel: 'Keep Existing Draw', focusSecondary: true,
    });
    if (!accepted) return false;
    if (JSON.stringify(readForm().scorebook) !== before) {
        showMessage(bifMessage, 'Results changed while the warning was open. Review them and try again.', 'warning');
        return false;
    }
    return true;
}

async function saveBieConfiguration(change) {
    const trial = readForm();
    if (!await approveBifChange(trial)) { render(); return; }
    const bif = bifState(trial);
    const sameType = !change.eventType || change.eventType === (bif.eventType || 'BIF');
    const allowed = new Set((change.bieCandidates || bif.bieCandidates || []).map(c => String(c.entryId)));
    trial.scorebook = { ...(trial.scorebook || {}), bif: {
        ...bif, ...change, draw: null, outcomes: {}, tieRunoff: null, tieRunoffs: [], courseWinners: {}, finalWinner: '',
        roundHistory: [], preQualifierHistory: [], preQualifierCarryEntryIds: [], biePhase: '',
        selectedEntryIds: sameType ? (bif.selectedEntryIds || []).filter(id => allowed.has(String(id))) : [],
        statusByEntryId: sameType ? Object.fromEntries(Object.entries(bif.statusByEntryId || {}).filter(([id]) => allowed.has(id))) : {},
    }};
    upsertTrial(trial);
    saveTrials();
    render();
}

function bieTrialLabel(trial) {
    return [trial.trialName || trial.name || trial.clubName || trial.club || 'Trial', trial.startsOn || trial.startDate || trial.date || trial.trialDate || '', trial.id === readForm().id ? '(active)' : ''].filter(Boolean).join(' — ');
}

function bieSourceCandidates(source, bobOnly) {
    const winners = new Set(standardBifCandidates(source).map(c => String(c.entryId)));
    const finals = new Map(((source.preliminaryDraw || {}).groups || []).flatMap(g => finalsRowsForGroup(g)).map(r => [String(r.hound.entryId), r.hound]));
    return (source.entries || []).filter(e => !bobOnly || winners.has(String(e.id))).map(entry => {
        const final = finals.get(String(entry.id)) || {};
        const entryId = `bie:${source.id}:${entry.id}`;
        return {
            entryId, sourceTrialId: source.id, sourceEntryId: entry.id,
            sourceLabel: bieTrialLabel(source), isBob: winners.has(String(entry.id)), combinedScore: final.combinedScore ?? '',
            breed: normalizeBreedCode(entry.breed), stake: entry.className || '',
            name: entry.callName || entry.registeredName || 'Unnamed hound', registrationNumber: entry.registrationNumber || '',
            hound: { ...entry, entryId, sourceTrialId: source.id, sourceEntryId: entry.id, breed: normalizeBreedCode(entry.breed), stake: entry.className || '' },
        };
    });
}

function bieAggregateTrialScores(selectedTrials) {
    const byHound = new Map();
    selectedTrials.forEach((source) => {
        const bestForTrial = new Map();
        bieSourceCandidates(source, false).forEach((candidate) => {
            const score = Number(candidate.combinedScore);
            if (candidate.combinedScore === '' || !Number.isFinite(score)) return;
            const identity = bieIdentity(candidate);
            const existing = bestForTrial.get(identity);
            if (!existing || score > existing.score) bestForTrial.set(identity, { candidate, score });
        });
        bestForTrial.forEach(({ candidate, score }, identity) => {
            const row = byHound.get(identity) || { identity, candidate, totalScore: 0, eventScores: [] };
            row.totalScore += score;
            row.eventScores.push({ trialId: source.id, trialLabel: bieTrialLabel(source), score });
            byHound.set(identity, row);
        });
    });
    return [...byHound.values()]
        .sort((a, b) => b.totalScore - a.totalScore || b.eventScores.length - a.eventScores.length || a.candidate.name.localeCompare(b.candidate.name))
        .map((row, index) => ({ ...row, position: index + 1 }));
}

function bieAggregateCandidate(row) {
    return {
        ...row.candidate,
        aggregateTotalScore: row.totalScore,
        aggregateTrialCount: row.eventScores.length,
        aggregateScores: row.eventScores,
        selectionReason: row.position === 3 ? 'third-highest multi-trial total' : 'multi-trial score comparison',
    };
}

function renderBieTrialComparison(trial, sources, addCandidates) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'bie-trial-comparison';
    const legend = document.createElement('legend'); legend.textContent = 'Compare scores from 2 or 3 trials'; fieldset.appendChild(legend);
    const guidance = document.createElement('p');
    guidance.className = 'field-note';
    guidance.textContent = 'Select two or three trials. Each hound’s combined final score is totaled across the selected events. A dash means that hound has no completed combined score for that trial. The third row is highlighted; review eligibility before adding that hound to this BIE.';
    fieldset.appendChild(guidance);
    const choices = document.createElement('div'); choices.className = 'bie-trial-choices'; fieldset.appendChild(choices);
    const selected = new Set();
    sources.forEach((source) => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = String(source.id);
        checkbox.disabled = Boolean(trial.archivedAt);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked && selected.size >= 3) {
                checkbox.checked = false;
                showMessage(bifMessage, 'Select no more than three trials for the BIE comparison.', 'warning');
                return;
            }
            checkbox.checked ? selected.add(String(source.id)) : selected.delete(String(source.id));
            renderResults();
        });
        label.append(checkbox, document.createTextNode(` ${bieTrialLabel(source)}`)); choices.appendChild(label);
    });
    const results = document.createElement('div'); results.className = 'bie-comparison-results'; fieldset.appendChild(results);
    const renderResults = () => {
        results.innerHTML = '';
        if (selected.size < 2) {
            const note = document.createElement('p'); note.className = 'field-note'; note.textContent = 'Select at least two trials to calculate the rankings.'; results.appendChild(note); return;
        }
        const selectedSources = sources.filter(source => selected.has(String(source.id)));
        const rows = bieAggregateTrialScores(selectedSources);
        if (!rows.length) {
            const note = document.createElement('p'); note.className = 'field-note'; note.textContent = 'No completed combined final scores were found in those trials.'; results.appendChild(note); return;
        }
        const table = document.createElement('table'); table.className = 'bie-comparison-table';
        const head = document.createElement('thead'); const headRow = document.createElement('tr');
        ['Rank', 'Hound', 'Breed', ...selectedSources.map(source => source.startsOn || source.startDate || source.date || source.trialDate || bieTrialLabel(source)), 'Total', ''].forEach(value => {
            const th = document.createElement('th'); th.textContent = value; headRow.appendChild(th);
        });
        head.appendChild(headRow); table.appendChild(head);
        const body = document.createElement('tbody');
        rows.forEach((row) => {
            const tr = document.createElement('tr'); if (row.position === 3) tr.className = 'bie-third-highest';
            const scoresByTrial = new Map(row.eventScores.map(item => [String(item.trialId), item.score]));
            [String(row.position), row.candidate.name, displayBreedCode(row.candidate.breed), ...selectedSources.map(source => scoresByTrial.has(String(source.id)) ? String(scoresByTrial.get(String(source.id))) : '—'), String(row.totalScore)].forEach(value => {
                const td = document.createElement('td'); td.textContent = value; tr.appendChild(td);
            });
            const action = document.createElement('td'); const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary small';
            button.textContent = row.position === 3 ? 'Add Third-Highest Hound' : 'Add This Hound'; button.disabled = Boolean(trial.archivedAt);
            button.addEventListener('click', () => addCandidates([bieAggregateCandidate(row)])); action.appendChild(button); tr.appendChild(action); body.appendChild(tr);
        });
        table.appendChild(body); results.appendChild(table);
    };
    renderResults();
    return fieldset;
}

function renderBieConfiguration(trial) {
    const bif = bifState(trial);
    const box = document.createElement('div');
    box.className = 'bie-configuration';
    const label = document.createElement('label');
    label.textContent = 'Event type ';
    const type = document.createElement('select');
    type.id = 'bifEventType';
    [['BIF', 'BIF — Best in Field'], ['BIE', 'BIE — Best in Event']].forEach(([value, text]) => type.add(new Option(text, value)));
    type.value = bif.eventType === 'BIE' ? 'BIE' : 'BIF';
    type.disabled = Boolean(trial.archivedAt);
    type.addEventListener('change', () => saveBieConfiguration({ eventType: type.value }));
    label.appendChild(type); box.appendChild(label);
    if (bif.eventType !== 'BIE') return box;
    box.appendChild(renderBieCourseOptions(trial));
    box.appendChild(renderBieRoundControls(trial));
    const note = document.createElement('p');
    note.textContent = 'Add BOB winners from each trial day, or choose any individual hound (including a third-highest-point dog). Scores shown are that day’s combined scores; choose eligibility under your event rules. Then mark the desired hounds Running BIE below. Duplicate registrations are included once. Existing runner selections are retained when adding hounds; source trials are unchanged.';
    box.appendChild(note);
    const sourceSelect = document.createElement('select');
    sourceSelect.setAttribute('aria-label', 'Source trial day');
    const sources = [trial, ...trials.filter(t => t.id !== trial.id && t.association === trial.association)];
    sources.forEach((source, index) => sourceSelect.add(new Option(bieTrialLabel(source), String(index))));
    const houndSelect = document.createElement('select');
    houndSelect.setAttribute('aria-label', 'Individual BIE hound');
    let candidates = [];
    const refresh = () => {
        candidates = bieSourceCandidates(sources[Number(sourceSelect.value)], false);
        candidates.sort((a,b) => a.breed.localeCompare(b.breed) || Number(b.combinedScore || 0) - Number(a.combinedScore || 0) || a.name.localeCompare(b.name));
        houndSelect.innerHTML = '';
        candidates.forEach((c,index) => houndSelect.add(new Option(`${displayBreedCode(c.breed)} — ${c.name} — ${c.registrationNumber} — ${c.isBob ? 'BOB — ' : ''}Score: ${c.combinedScore === '' ? 'pending' : c.combinedScore}`, String(index))));
    };
    sourceSelect.addEventListener('change', refresh); refresh();
    const addButton = (text, action) => { const b = document.createElement('button'); b.type='button'; b.className='secondary small'; b.textContent=text; b.disabled=Boolean(trial.archivedAt); b.addEventListener('click',action); box.appendChild(b); };
    box.appendChild(sourceSelect);
    const add = (incoming) => {
        const merged = mergeBieCandidates(bif.bieCandidates || [], incoming);
        if (merged.length === (bif.bieCandidates || []).length) { showMessage(bifMessage, 'No new hounds to add. They may already be listed, or BOB winners are not finalized.', 'warning'); return; }
        saveBieConfiguration({ bieCandidates: merged });
    };
    box.appendChild(renderBieTrialComparison(trial, sources, add));
    addButton('Add This Day’s BOB Winners', () => add(bieSourceCandidates(sources[Number(sourceSelect.value)], true)));
    box.appendChild(houndSelect);
    addButton('Add Selected Hound', () => add(candidates[Number(houndSelect.value)] ? [candidates[Number(houndSelect.value)]] : []));
    const list = document.createElement('ul');
    (bif.bieCandidates || []).forEach(c => {
        const detail = c.aggregateTotalScore !== undefined ? `Total ${c.aggregateTotalScore} across ${c.aggregateTrialCount} trials` : c.sourceLabel;
        const li = document.createElement('li'); li.textContent = `${c.name} (${displayBreedCode(c.breed)}) — ${detail} `;
        const remove = document.createElement('button'); remove.type='button'; remove.className='secondary small'; remove.textContent='Remove'; remove.disabled=Boolean(trial.archivedAt);
        remove.addEventListener('click', () => saveBieConfiguration({ bieCandidates: bif.bieCandidates.filter(x => x.entryId !== c.entryId) }));
        li.appendChild(remove); list.appendChild(li);
    });
    box.appendChild(list);
    return box;
}

function bieCourseLimit(bif) {
    return [1, 2, 3].includes(Number(bif.dogsPerCourse)) ? Number(bif.dogsPerCourse) : 3;
}

function buildBieCourses(hounds, bif) {
    const pools = new Map();
    for (const hound of hounds) {
        const key = bif.sameBreedFirst ? normalizeBreedCode(hound.breed) : 'all';
        if (!pools.has(key)) pools.set(key, []);
        pools.get(key).push(hound);
    }
    const courses = [];
    for (const pool of secureShuffle([...pools.values()])) {
        const shuffled = secureShuffle([...pool]);
        const limit = bieCourseLimit(bif);
        const sizes = !bif.dogsPerCourse || limit === 3
            ? courseSizesForEntryCount(shuffled.length)
            : Array.from({ length: Math.ceil(shuffled.length / limit) }, (_, i) => Math.min(limit, shuffled.length - i * limit));
        for (const size of sizes) courses.push({ id: crypto.randomUUID(), number: courses.length + 1, hounds: shuffled.splice(0, size) });
    }
    return courses;
}

function renderBieCourseOptions(trial) {
    const bif = bifState(trial);
    const box = document.createElement('fieldset');
    const legend = document.createElement('legend'); legend.textContent = 'BIE course setup'; box.appendChild(legend);
    const label = document.createElement('label'); label.textContent = 'Dogs per course ';
    const select = document.createElement('select'); select.id = 'bieDogsPerCourse';
    [['', 'Automatic (up to 3)'], ['2', '2 — elimination pairs'], ['3', '3 maximum — balance pairs to avoid solos'], ['1', '1 — individual runs']].forEach(([value, text]) => select.add(new Option(text, value)));
    select.value = String(bif.dogsPerCourse || ''); select.disabled = Boolean(trial.archivedAt);
    select.addEventListener('change', () => saveBieConfiguration({dogsPerCourse: Number(select.value) || null})); label.appendChild(select); box.appendChild(label);
    const breedLabel = document.createElement('label');
    const check = document.createElement('input'); check.type = 'checkbox'; check.id = 'bieSameBreedFirst'; check.checked = Boolean(bif.sameBreedFirst); check.disabled = Boolean(trial.archivedAt);
    check.addEventListener('change', () => saveBieConfiguration({sameBreedFirst: check.checked}));
    breedLabel.append(check, document.createTextNode(' Keep like breeds together in this draw')); box.appendChild(breedLabel);
    const note = document.createElement('p'); note.className = 'field-note';
    note.textContent = 'Three-dog mode uses the regular balanced draw: when possible, pairs replace a leftover solo (for example, 10 dogs draw as 3, 3, 2, 2). Pair mode never puts more than two dogs in a course, so an odd dog receives a solo course for your review; in elimination mode, select its course winner to confirm a bye. Like-breed mode balances each breed separately. Use manual editing for exceptions.'; box.appendChild(note);
    if (bif.draw) {
        const add = document.createElement('button'); add.type = 'button'; add.className = 'secondary small'; add.textContent = 'Add Empty BIE Course'; add.disabled = Boolean(trial.archivedAt);
        add.addEventListener('click', addEmptyBieCourse); box.appendChild(add);
    }
    return box;
}

async function addEmptyBieCourse() {
    const trial = readForm(); const bif = bifState(trial);
    if (trial.archivedAt || bif.eventType !== 'BIE' || !bif.draw) return;
    const courses = bif.draw.courses || [];
    const number = Math.max(0, ...courses.map(c => Number(c.number) || 0)) + 1;
    trial.scorebook.bif = {...bif, draw: auditDrawChange({...bif.draw, courses: [...courses, {id: crypto.randomUUID(), number, hounds: []}]}, `Added empty BIE course ${number}; existing assignments preserved.`)};
    manualDrawEditKey = 'bif:draw'; upsertTrial(trial); saveTrials(); render();
    showMessage(bifMessage, `Course ${number} added. Use Move to in the manual editor to assign hounds.`, 'success');
}
