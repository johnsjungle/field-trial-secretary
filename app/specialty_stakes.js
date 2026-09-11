/* Specialty links are trial-entry metadata; they never change draw separation. */
function specialtyPairEntries(entries, kind, entryId, partnerId) {
    if (!['Kennel', 'Breeder'].includes(kind)) throw new Error('Unknown specialty stake.');
    const flag = 'additional' + kind;
    const key = 'specialty' + kind + 'PartnerId';
    const labelKey = 'specialty' + kind + 'Name';
    const entry = entries.find(e => e.id === entryId);
    const partner = partnerId ? entries.find(e => e.id === partnerId) : null;
    if (!entry || !entry[flag]) throw new Error('Mark this entry for the specialty stake first.');
    if (partnerId && (!partner || !partner[flag] || partner.id === entry.id || normalizeBreedCode(partner.breed) !== normalizeBreedCode(entry.breed)
        || (entry.houndId && entry.houndId === partner.houndId)
        || (entry.registrationNumber && String(entry.registrationNumber).replace(/\W/g, '').toUpperCase() === String(partner.registrationNumber || '').replace(/\W/g, '').toUpperCase()))) {
        throw new Error('Choose a different hound of the same breed entered in this specialty stake.');
    }
    if (partner && partner[key] && partner[key] !== entryId && entries.some(e => e.id === partner[key] && e[flag] && e[key] === partner.id)) {
        throw new Error('That hound already has a partner. Unpair it first.');
    }
    return entries.map(e => {
        if (e.id === entryId) return {...e, [key]: partnerId || '', [labelKey]: entry[labelKey] || partner?.[labelKey] || ''};
        if (partner && e.id === partnerId) return {...e, [key]: entryId, [labelKey]: entry[labelKey] || partner[labelKey] || ''};
        if (e[key] === entryId || (partner && e[key] === partnerId)) return {...e, [key]: ''};
        return e;
    });
}

function renderSpecialtyEntries(trial) {
    const container = document.getElementById('specialtyPairs');
    if (!container) return;
    container.replaceChildren();
    const entries = trial?.entries || [];
    const enabled = entries.some(e => e.additionalKennel || e.additionalBreeder || e.additionalBench);
    document.getElementById('specialtyEntriesPanel').hidden = !enabled || currentTab !== 'entries';
    document.getElementById('printSpecialtyResultsButton').hidden = !enabled;
    for (const kind of ['Breeder', 'Kennel']) {
        const flag = 'additional' + kind, key = 'specialty' + kind + 'PartnerId', nameKey = 'specialty' + kind + 'Name';
        const eligible = entries.filter(e => e[flag]).sort((a,b) => String(a.callName || '').localeCompare(String(b.callName || '')));
        if (!eligible.length) continue;
        const heading = document.createElement('h3'); heading.textContent = kind + ' pairs'; container.append(heading);
        const wrap = document.createElement('div'); wrap.className = 'table-wrap';
        const table = document.createElement('table');
        const head = document.createElement('thead'); const hr = document.createElement('tr');
        ['Hound', 'Partner', kind === 'Breeder' ? 'Breeder name(s) for report' : 'Owner / kennel name(s) for report'].forEach(text => {const th=document.createElement('th');th.textContent=text;hr.append(th);});
        head.append(hr); table.append(head); const body=document.createElement('tbody');
        for (const entry of eligible) {
            const row=document.createElement('tr'); const name=document.createElement('td'); name.textContent=`${entry.callName || entry.registeredName} (${displayBreedCode(entry.breed)})`; row.append(name);
            const cell=document.createElement('td'); const select=document.createElement('select'); select.setAttribute('aria-label', `${kind} partner for ${entry.callName || entry.registeredName}`);
            select.add(new Option('Choose partner', ''));
            for (const other of eligible) {
                if (other.id === entry.id) continue;
                try { specialtyPairEntries(entries, kind, entry.id, other.id); }
                catch { continue; }
                select.add(new Option(`${other.callName || other.registeredName} - ${other.className || ''}`, other.id));
            }
            select.value=entry[key] || '';
            if (select.selectedIndex < 0) {select.value=''; select.title='Previous partner is unavailable. Choose a valid partner.';}
            select.disabled=Boolean(trial.archivedAt);
            select.addEventListener('change', () => {
                const current=readForm(); if (current.archivedAt) return;
                try {current.entries=specialtyPairEntries(current.entries || [], kind, entry.id, select.value); upsertTrial(current); saveTrials(); renderSpecialtyEntries(current); showMessage(document.getElementById('specialtyMessage'), 'Specialty pair saved.', 'success');}
                catch(error) {showMessage(document.getElementById('specialtyMessage'), error.message, 'warning'); renderSpecialtyEntries(current);}
            });
            cell.append(select); row.append(cell);
            const nameCell=document.createElement('td'); const input=document.createElement('input');
            input.value=entry[nameKey] || ''; input.placeholder=entry[kind === 'Breeder' ? 'breeder' : 'owner'] || 'Enter report name(s)';
            input.setAttribute('aria-label', `${kind} report name for ${entry.callName || entry.registeredName}`); input.disabled=Boolean(trial.archivedAt);
            input.addEventListener('change', () => {const current=readForm();if(current.archivedAt)return;const source=current.entries.find(e=>e.id===entry.id);current.entries=current.entries.map(e=>e.id===entry.id || (source?.[key]===e.id && e[key]===entry.id) ? {...e,[nameKey]:input.value.trim()} : e);upsertTrial(current);saveTrials();renderSpecialtyEntries(current);});
            nameCell.append(input); row.append(nameCell); body.append(row);
        }
        table.append(body);wrap.append(table);container.append(wrap);
    }
}

async function printSpecialtyReport(results = false) {
    const message=document.getElementById(results ? 'mainResultsMessage' : 'catalogReportMessage');
    const chosen=results ? [readForm()] : selectedCatalogTrials();
    if (!chosen.length) {showMessage(message,'Select at least one trial.','warning');return;}
    if (!chosen.some(t=>(t.entries||[]).some(e=>e.additionalKennel||e.additionalBreeder||e.additionalBench))) {showMessage(message,'No specialty stakes are marked in the selected entries.','warning');return;}
    if(results) upsertTrial(chosen[0]);
    await openTrialPdf(results ? '/api/specialty-results' : '/api/specialty-catalog', {trialIds:chosen.map(t=>String(t.id))}, message, 'Specialty stakes PDF created.', 'Specialty stakes report could not be created.');
}
