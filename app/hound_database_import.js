'use strict';

let houndDatabaseImportSourceRows = [];
let houndDatabaseImportHeaders = [];
let houndDatabaseImportMapping = {};
let stagedHoundDatabaseImports = [];
let houndDatabaseImportSort = { key: '', direction: 'asc' };

const houndDatabaseImportFieldDefinitions = [
    { key: 'callName', label: 'Call Name', aliases: ['call name', 'hound call name', 'dog call name', 'callname'] },
    { key: 'registeredName', label: 'Registered Name', aliases: ['registered name', 'registered hound name', 'dog registered name', 'registeredname'] },
    { key: 'breed', label: 'Breed', aliases: ['breed', 'hound breed', 'dog breed', 'breed code'] },
    { key: 'registrationNumber', label: 'Primary Registration Number', aliases: ['registration number', 'registration #', 'primary registration', 'reg number', 'reg #', 'akc number', 'asfa number', 'registrationnumber'] },
    { key: 'registry', label: 'Primary Registry', aliases: ['registry', 'primary registry', 'registration agency', 'organization'] },
    { key: 'registrationType', label: 'Registration Type', aliases: ['registration type', 'reg type', 'registrationtype'] },
    { key: 'alternateRegistrationNumber', label: 'Alternate Registration Number', aliases: ['alternate registration number', 'alternate reg #', 'second registration', 'other registration', 'alternateregistrationnumber'] },
    { key: 'alternateRegistry', label: 'Alternate Registry', aliases: ['alternate registry', 'second registry', 'other registry', 'alternateregistry'] },
    { key: 'sex', label: 'Sex', aliases: ['sex', 'gender'] },
    { key: 'dob', label: 'Date of Birth', aliases: ['date of birth', 'dob', 'birth date'] },
    { key: 'owner', label: 'Owner', aliases: ['owner', 'owner name', 'actual owner'] },
    { key: 'ownerEmail', label: 'Owner Email', aliases: ['owner email', 'email', 'email address'] },
    { key: 'ownerPhone', label: 'Owner Phone', aliases: ['owner phone', 'phone', 'telephone', 'phone number'] },
    { key: 'ownerAddress', label: 'Owner Address', aliases: ['owner address', 'address', 'street address'] },
    { key: 'ownerCity', label: 'Owner City', aliases: ['owner city', 'city'] },
    { key: 'ownerState', label: 'State/Province', aliases: ['state', 'province', 'state/province', 'owner state'] },
    { key: 'ownerPostalCode', label: 'Postal/Zip Code', aliases: ['zip', 'zip code', 'postal code', 'owner postal code'] },
    { key: 'ownerCountry', label: 'Country', aliases: ['country', 'owner country'] },
    { key: 'breeder', label: 'Breeder', aliases: ['breeder', 'breeder name'] },
    { key: 'sire', label: 'Sire', aliases: ['sire', 'sire name'] },
    { key: 'dam', label: 'Dam', aliases: ['dam', 'dam name'] },
];

const houndImportElement = (id) => document.getElementById(id);

function houndExportCsvValue(value) {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportHoundDatabase() {
    if (!Array.isArray(masterHounds) || masterHounds.length === 0) {
        showMessage(masterHoundMessage, 'There are no hounds in the database to export.', 'warning');
        return;
    }

    const fields = houndDatabaseImportFieldDefinitions.map(({ key, label }) => ({ key, label }));
    const hounds = [...masterHounds].sort((left, right) => {
        const leftName = left.registeredName || left.callName || '';
        const rightName = right.registeredName || right.callName || '';
        return leftName.localeCompare(rightName, undefined, { sensitivity: 'base' });
    });
    const rows = [
        fields.map(({ label }) => houndExportCsvValue(label)).join(','),
        ...hounds.map((hound) => fields.map(({ key }) => houndExportCsvValue(hound[key])).join(',')),
    ];
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([`\uFEFF${rows.join('\r\n')}\r\n`], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `field-trial-secretary-hounds-${date}.csv`);
    showMessage(
        masterHoundMessage,
        `Exported ${hounds.length} hound${hounds.length === 1 ? '' : 's'}. No trial entries, scores, workers, or paperwork were included.`,
        'success'
    );
}

function showHoundImportMessage(message, type = 'warning') {
    const target = houndImportElement('houndDatabaseImportMessage');
    if (target) showMessage(target, message, type);
}

function setHoundImportBusy(busy, message = 'Working on the hound database import...') {
    const progress = houndImportElement('houndDatabaseImportProgress');
    if (progress) progress.hidden = !busy;
    const label = houndImportElement('houndDatabaseImportProgressText');
    if (label) label.textContent = message;
    ['previewHoundDatabaseImportButton', 'applyHoundDatabaseImportMappingButton', 'saveHoundDatabaseImportTemplateButton'].forEach((id) => {
        const button = houndImportElement(id);
        if (button) button.disabled = busy;
    });
    document.querySelectorAll('#houndDatabaseImportBulkTools button, #houndDatabaseImportBulkTools select, [data-hound-import-sort]').forEach((control) => {
        control.disabled = busy;
    });
    updateHoundImportButton();
}

function yieldHoundImportUi() {
    return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

function renderHoundImportTemplateOptions() {
    const select = houndImportElement('houndDatabaseImportTemplateSelect');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '';
    const automatic = document.createElement('option');
    automatic.value = '';
    automatic.textContent = 'Auto-detect columns';
    select.appendChild(automatic);
    entryImportTemplates.forEach((template) => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        select.appendChild(option);
    });
    if (entryImportTemplates.some((template) => template.id === current)) select.value = current;
}

function inferHoundImportMapping(headers) {
    const mapping = {};
    houndDatabaseImportFieldDefinitions.forEach((field) => {
        const exact = headers.find((header) => field.aliases.some((alias) => clean(header) === clean(alias)));
        if (exact) {
            mapping[field.key] = exact;
            return;
        }
        const partial = headers.find((header) => {
            const cleanedHeader = clean(header);
            return field.aliases.some((alias) => {
                const cleanedAlias = clean(alias);
                return cleanedAlias.length >= 6 && cleanedHeader.includes(cleanedAlias);
            });
        });
        if (partial) mapping[field.key] = partial;
    });
    return mapping;
}

function renderHoundImportMapping() {
    const wrap = houndImportElement('houndDatabaseImportMappingWrap');
    const body = houndImportElement('houndDatabaseImportMappingTable');
    if (!wrap || !body) return;
    wrap.hidden = houndDatabaseImportHeaders.length === 0;
    body.innerHTML = '';
    houndDatabaseImportFieldDefinitions.forEach((field) => {
        const row = document.createElement('tr');
        const label = document.createElement('td');
        label.textContent = field.label;
        const picker = document.createElement('td');
        const select = document.createElement('select');
        select.dataset.houndImportField = field.key;
        select.appendChild(new Option('Not imported', ''));
        houndDatabaseImportHeaders.forEach((header) => select.appendChild(new Option(header, header)));
        select.value = houndDatabaseImportMapping[field.key] || '';
        select.addEventListener('change', () => {
            houndDatabaseImportMapping[field.key] = select.value;
        });
        picker.appendChild(select);
        row.append(label, picker);
        body.appendChild(row);
    });
}

function readHoundImportMappingControls() {
    document.querySelectorAll('#houndDatabaseImportMappingTable select[data-hound-import-field]').forEach((select) => {
        houndDatabaseImportMapping[select.dataset.houndImportField] = select.value;
    });
}

function normalizeHoundImportSex(value) {
    const normalized = clean(value);
    if (['M', 'MALE', 'DOG'].includes(normalized)) return 'Dog';
    if (['F', 'FEMALE', 'BITCH'].includes(normalized)) return 'Bitch';
    return String(value || '').trim();
}

function normalizeHoundImportRow(row) {
    const pick = (key) => {
        const source = houndDatabaseImportMapping[key];
        return source ? String(row[source] ?? '').trim() : '';
    };
    const primary = splitImportedRegistration(pick('registrationNumber'), pick('registry'), pick('registrationType'));
    const alternate = splitImportedRegistration(pick('alternateRegistrationNumber'), pick('alternateRegistry'), '');
    const rawBreed = pick('breed');
    const lci = normalizeImportedLciParts(rawBreed, '');
    return {
        callName: pick('callName'), registeredName: pick('registeredName'),
        breed: lci ? lci.breed : normalizeImportedBreed(rawBreed),
        registrationNumber: primary.number, registry: primary.registry, registrationType: primary.registrationType,
        alternateRegistrationNumber: alternate.number, alternateRegistry: alternate.registry,
        sex: normalizeHoundImportSex(pick('sex')), dob: normalizeImportedDateOfBirth(pick('dob')),
        owner: pick('owner'), ownerEmail: pick('ownerEmail'), ownerPhone: formatNorthAmericanPhone(pick('ownerPhone')),
        ownerAddress: pick('ownerAddress'), ownerCity: pick('ownerCity'), ownerState: pick('ownerState'),
        ownerPostalCode: pick('ownerPostalCode'), ownerCountry: pick('ownerCountry'),
        breeder: pick('breeder'), sire: pick('sire'), dam: pick('dam'),
        sourceName: row.__sourceName || 'Imported data',
        importedFrom: `Hound database import: ${row.__sourceName || 'Imported data'}`,
        selected: true, imported: false,
    };
}

function stageHoundImportRow(row) {
    const imported = normalizeHoundImportRow(row);
    const match = matchImportedHound(imported);
    return { ...imported, match: match.hound, matchType: match.type, decision: match.hound ? 'fill' : 'create', decisionTouched: false };
}

function applyHoundImportMapping() {
    if (!houndDatabaseImportSourceRows.length) {
        showHoundImportMessage('Preview an Excel, CSV, text, or JSON hound file before applying a mapping.');
        return;
    }
    readHoundImportMappingControls();
    stagedHoundDatabaseImports = houndDatabaseImportSourceRows.map(stageHoundImportRow);
    renderHoundImportPreview();
    const mapped = Object.values(houndDatabaseImportMapping).filter(Boolean).length;
    showHoundImportMessage(`Mapped ${stagedHoundDatabaseImports.length} hound record${stagedHoundDatabaseImports.length === 1 ? '' : 's'} using ${mapped} field${mapped === 1 ? '' : 's'}. Review every match and decision before importing.`, stagedHoundDatabaseImports.length ? 'success' : 'warning');
}

function extractHoundRowsFromJson(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];
    const candidates = [payload.masterHounds, payload.hounds, payload.data?.masterHounds, payload.data?.hounds, payload['fieldTrialSecretary.masterHounds.v1']];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
        if (typeof candidate === 'string') {
            try {
                const parsed = JSON.parse(candidate);
                if (Array.isArray(parsed)) return parsed;
            } catch {
                // Check the next supported backup shape.
            }
        }
    }
    return (payload.callName || payload.registeredName || payload.registrationNumber) ? [payload] : [];
}

function parseTabHoundRows(text) {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split('\t').map((header, index) => header.trim() || `Column ${index + 1}`);
    return lines.slice(1).map((line) => {
        const values = line.split('\t');
        return Object.fromEntries(headers.map((header, index) => [header, String(values[index] || '').replace(/^"|"$/g, '').trim()]));
    }).filter((row) => Object.values(row).some((value) => String(value || '').trim()));
}

function parseHoundImportText(text, sourceName) {
    const source = String(text || '').trim();
    if (!source) return [];
    if (/^[\[{]/.test(source)) {
        try {
            return extractHoundRowsFromJson(JSON.parse(source)).map((row) => ({ ...row, __sourceName: sourceName }));
        } catch (error) {
            throw new Error(`${sourceName} is not valid JSON: ${error.message}`);
        }
    }
    const firstLine = source.split(/\r?\n/, 1)[0] || '';
    const rows = firstLine.includes('\t') ? parseTabHoundRows(source) : parseCsvText(source);
    return rows.map((row) => ({ ...row, __sourceName: sourceName }));
}

function houndImportFileExtension(fileName) {
    const match = String(fileName || '').trim().toLowerCase().match(/\.([^.]+)$/);
    return match ? match[1] : '';
}

function isHoundImportWorkbook(file) {
    const extension = houndImportFileExtension(file?.name);
    const mimeType = String(file?.type || '').toLowerCase();
    return ['xlsx', 'xls'].includes(extension)
        || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        || mimeType === 'application/vnd.ms-excel';
}

function uniqueWorkbookHeaders(values) {
    const counts = new Map();
    return values.map((value, index) => {
        const base = String(value ?? '').trim() || `Column ${index + 1}`;
        const count = (counts.get(base) || 0) + 1;
        counts.set(base, count);
        return count === 1 ? base : `${base} (${count})`;
    });
}

function parseHoundImportWorkbook(arrayBuffer, sourceName, xlsxApi = globalThis.XLSX) {
    if (!xlsxApi?.read || !xlsxApi?.utils?.sheet_to_json) {
        throw new Error('The offline Excel reader did not load. Refresh the application and try again.');
    }
    let workbook;
    try {
        workbook = xlsxApi.read(arrayBuffer, { type: 'array', cellDates: true });
    } catch (error) {
        throw new Error(`${sourceName} could not be read as an Excel workbook: ${error.message}`);
    }
    const rows = [];
    workbook.SheetNames.forEach((sheetName) => {
        const matrix = xlsxApi.utils.sheet_to_json(workbook.Sheets[sheetName], {
            header: 1, defval: '', raw: false, dateNF: 'yyyy-mm-dd', blankrows: false,
        });
        const populated = matrix.filter((line) => Array.isArray(line) && line.some((value) => String(value ?? '').trim()));
        if (populated.length < 2) return;
        const headers = uniqueWorkbookHeaders(populated[0]);
        populated.slice(1).forEach((values) => {
            const row = Object.fromEntries(headers.map((header, index) => [header, String(values[index] ?? '').trim()]));
            if (Object.values(row).some((value) => value)) rows.push({ ...row, __sourceName: `${sourceName} / ${sheetName}` });
        });
    });
    return rows;
}

async function parseHoundImportFile(file) {
    const extension = houndImportFileExtension(file.name);
    if (extension === 'numbers') {
        throw new Error(`${file.name} is an Apple Numbers file. In Numbers, export it as Excel or CSV, then select the exported file.`);
    }
    if (isHoundImportWorkbook(file)) return parseHoundImportWorkbook(await file.arrayBuffer(), file.name);
    const supportedTextExtensions = ['', 'csv', 'tsv', 'txt', 'json'];
    const isTextFile = String(file.type || '').toLowerCase().startsWith('text/');
    if (!supportedTextExtensions.includes(extension) && !isTextFile) {
        throw new Error(`${file.name} is not a supported hound database file. Use Excel, CSV, tab-delimited text, or JSON.`);
    }
    return parseHoundImportText(await readTextFile(file), file.name);
}

async function previewHoundImport() {
    setHoundImportBusy(true, 'Reading hound database files and detecting columns...');
    showHoundImportMessage('Reading the selected hound database export. Large files may take a few seconds.');
    await yieldHoundImportUi();
    try {
        const pasted = houndImportElement('houndDatabaseImportText')?.value || '';
        const files = Array.from(houndImportElement('houndDatabaseImportFiles')?.files || []);
        const rows = pasted.trim() ? parseHoundImportText(pasted, 'Pasted data') : [];
        for (const file of files) rows.push(...await parseHoundImportFile(file));
        houndDatabaseImportSourceRows = rows;
        houndDatabaseImportHeaders = uniqueNames(rows.flatMap((row) => Object.keys(row).filter((key) => !key.startsWith('__'))));
        if (!rows.length) {
            stagedHoundDatabaseImports = [];
            renderHoundImportMapping();
            renderHoundImportPreview();
            showHoundImportMessage('No hound records were found. Select an Excel, CSV, tab-delimited, or JSON export first.');
            return;
        }
        const template = entryImportTemplates.find((item) => item.id === (houndImportElement('houndDatabaseImportTemplateSelect')?.value || ''));
        houndDatabaseImportMapping = { ...inferHoundImportMapping(houndDatabaseImportHeaders), ...(template?.mapping || {}) };
        renderHoundImportMapping();
        applyHoundImportMapping();
    } finally {
        setHoundImportBusy(false);
    }
}

function importTextInput(value, label, onChange, disabled) {
    const input = document.createElement('input');
    input.value = value || '';
    input.setAttribute('aria-label', label);
    input.disabled = disabled;
    input.addEventListener('change', () => onChange(input.value.trim()));
    return input;
}

function importBreedSelect(item, index) {
    const select = document.createElement('select');
    const values = uniqueNames(['', ...breedOptions.map(([value]) => value), ...lciDivisions, 'Singles']);
    values.forEach((value) => select.appendChild(new Option(value || 'Choose breed', value)));
    if (item.breed && !values.includes(item.breed)) select.appendChild(new Option(item.breed, item.breed));
    select.value = item.breed || '';
    select.disabled = item.imported;
    select.setAttribute('aria-label', `Breed for ${item.callName || item.registeredName || `row ${index + 1}`}`);
    select.addEventListener('change', () => updateStagedHoundImportField(index, 'breed', select.value));
    return select;
}

function refreshStagedHoundMatch(index) {
    const item = stagedHoundDatabaseImports[index];
    if (!item) return;
    if (item.matchType === 'manual choice' && masterHounds.some((hound) => hound.id === item.match?.id)) {
        if (!item.decisionTouched) item.decision = 'fill';
        return;
    }
    const match = matchImportedHound(item);
    item.match = match.hound;
    item.matchType = match.type;
    if (!item.decisionTouched) item.decision = match.hound ? 'fill' : 'create';
    if (!match.hound && ['fill', 'update'].includes(item.decision)) item.decision = 'create';
}

function updateStagedHoundImportField(index, key, value) {
    const item = stagedHoundDatabaseImports[index];
    if (!item || item.imported) return;
    item[key] = key === 'ownerPhone' ? formatNorthAmericanPhone(value) : value;
    if (key === 'breed') item[key] = normalizeImportedBreed(value);
    refreshStagedHoundMatch(index);
    renderHoundImportPreview();
}

function importDecisionSelect(item, index) {
    const select = document.createElement('select');
    const choices = item.match
        ? [['fill', 'Fill missing fields'], ['update', 'Update with imported values'], ['create', 'Create separate hound'], ['skip', 'Skip']]
        : [['create', 'Create new hound'], ['skip', 'Skip']];
    choices.forEach(([value, label]) => select.appendChild(new Option(label, value)));
    select.value = choices.some(([value]) => value === item.decision) ? item.decision : choices[0][0];
    select.disabled = item.imported;
    select.addEventListener('change', () => {
        item.decision = select.value;
        item.decisionTouched = true;
        renderHoundImportPreview();
    });
    return select;
}

function renderHoundImportMatchOptions() {
    const list = houndImportElement('houndDatabaseImportMatchOptions');
    if (!list) return;
    list.innerHTML = '';
    masterHounds.forEach((hound) => {
        const option = document.createElement('option');
        option.value = houndLabel(hound);
        list.appendChild(option);
    });
}

function importMatchControl(item, index) {
    const container = document.createElement('div');
    const status = document.createElement('strong');
    status.textContent = item.match
        ? `${item.match.callName || item.match.registeredName || 'Hound'} (${item.matchType})`
        : 'No match';
    const search = document.createElement('input');
    search.type = 'search';
    search.setAttribute('list', 'houndDatabaseImportMatchOptions');
    search.setAttribute('aria-label', `Choose database match for ${item.callName || item.registeredName || `row ${index + 1}`}`);
    search.placeholder = 'Choose another hound';
    search.disabled = item.imported;
    search.addEventListener('change', () => {
        const query = clean(search.value);
        const match = masterHounds.find((hound) => clean(houndLabel(hound)) === query
            || clean(hound.registrationNumber) === query
            || clean(hound.alternateRegistrationNumber) === query);
        if (!match) {
            search.setCustomValidity('Choose a hound from the database suggestions.');
            search.reportValidity();
            return;
        }
        item.match = match;
        item.matchType = 'manual choice';
        item.decision = 'fill';
        item.decisionTouched = false;
        renderHoundImportPreview();
    });
    search.addEventListener('input', () => search.setCustomValidity(''));
    container.append(status, search);
    return container;
}

function appendImportCell(row, content) {
    const cell = document.createElement('td');
    if (content instanceof Node) cell.appendChild(content);
    else cell.textContent = content || '';
    row.appendChild(cell);
}

function houndImportDecisionAllowed(item, decision) {
    if (!item || item.imported) return false;
    if (['fill', 'update'].includes(decision)) return Boolean(item.match);
    return ['create', 'skip'].includes(decision);
}

function selectHoundImportRows(mode) {
    let selected = 0;
    stagedHoundDatabaseImports.forEach((item) => {
        if (item.imported) return;
        item.selected = mode === 'all'
            || (mode === 'matched' && Boolean(item.match))
            || (mode === 'new' && !item.match);
        if (item.selected) selected += 1;
    });
    renderHoundImportPreview();
    const labels = { all: 'all available hound rows', matched: 'existing matched hounds', new: 'new unmatched hounds', none: 'no hound rows' };
    showHoundImportMessage('Selected ' + (labels[mode] || 'hound rows') + ' (' + selected + ' checked).');
}

function applyBulkHoundImportDecision() {
    const decision = houndImportElement('houndDatabaseImportBulkDecision')?.value || '';
    if (!decision) {
        showHoundImportMessage('Choose a decision to apply to the checked hounds.');
        return;
    }
    const checked = stagedHoundDatabaseImports.filter((item) => item.selected !== false && !item.imported);
    if (!checked.length) {
        showHoundImportMessage('Check at least one hound row before applying a decision.');
        return;
    }
    let changed = 0;
    let skipped = 0;
    checked.forEach((item) => {
        if (!houndImportDecisionAllowed(item, decision)) {
            skipped += 1;
            return;
        }
        item.decision = decision;
        item.decisionTouched = true;
        changed += 1;
    });
    renderHoundImportPreview();
    const labels = {
        fill: 'Fill missing fields',
        update: 'Update with imported values',
        create: 'Create as new hounds',
        skip: 'Skip',
    };
    const skippedMessage = skipped
        ? ' ' + skipped + ' unmatched row' + (skipped === 1 ? ' was' : 's were') + ' left unchanged because that decision requires an existing database match.'
        : '';
    showHoundImportMessage(labels[decision] + ' was applied to ' + changed + ' checked row' + (changed === 1 ? '' : 's') + '.' + skippedMessage, changed ? 'success' : 'warning');
}

function houndImportSortValue(item, key) {
    if (key === 'match') return item.match ? 'Existing ' + houndLabel(item.match) : 'New no match';
    if (key === 'decision') return item.decision || '';
    return item[key] || '';
}

function updateHoundImportSortHeaders() {
    document.querySelectorAll('[data-hound-import-sort]').forEach((button) => {
        if (!button.dataset.sortLabel) button.dataset.sortLabel = button.textContent.trim();
        const active = button.dataset.houndImportSort === houndDatabaseImportSort.key;
        button.textContent = button.dataset.sortLabel + (active ? (houndDatabaseImportSort.direction === 'asc' ? ' [ASC]' : ' [DESC]') : '');
        button.setAttribute('aria-sort', active ? (houndDatabaseImportSort.direction === 'asc' ? 'ascending' : 'descending') : 'none');
    });
}

function sortHoundImportRows(key) {
    if (!key) return;
    houndDatabaseImportSort = {
        key,
        direction: houndDatabaseImportSort.key === key && houndDatabaseImportSort.direction === 'asc' ? 'desc' : 'asc',
    };
    const direction = houndDatabaseImportSort.direction === 'asc' ? 1 : -1;
    stagedHoundDatabaseImports = stagedHoundDatabaseImports
        .map((item, index) => ({ item, index }))
        .sort((left, right) => {
            const comparison = String(houndImportSortValue(left.item, key)).localeCompare(
                String(houndImportSortValue(right.item, key)),
                undefined,
                { numeric: true, sensitivity: 'base' },
            );
            return comparison ? comparison * direction : left.index - right.index;
        })
        .map(({ item }) => item);
    renderHoundImportPreview();
}

function renderHoundImportPreview() {
    const wrap = houndImportElement('houndDatabaseImportPreviewWrap');
    const tools = houndImportElement('houndDatabaseImportBulkTools');
    const body = houndImportElement('houndDatabaseImportPreviewTable');
    if (!wrap || !body) return;
    wrap.hidden = !stagedHoundDatabaseImports.length;
    if (tools) tools.hidden = !stagedHoundDatabaseImports.length;
    body.innerHTML = '';
    updateHoundImportSortHeaders();
    renderHoundImportMatchOptions();
    stagedHoundDatabaseImports.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = item.match ? 'hound-import-matched' : 'hound-import-new';
        if (item.imported) row.classList.add('hound-import-complete');
        const checked = document.createElement('input');
        checked.type = 'checkbox'; checked.checked = item.selected !== false; checked.disabled = item.imported;
        checked.setAttribute('aria-label', `Import ${item.callName || item.registeredName || `row ${index + 1}`}`);
        checked.addEventListener('change', () => { item.selected = checked.checked; updateHoundImportButton(); });
        appendImportCell(row, checked);
        appendImportCell(row, item.sourceName);
        appendImportCell(row, importDecisionSelect(item, index));
        appendImportCell(row, importMatchControl(item, index));
        appendImportCell(row, importTextInput(item.callName, 'Call name', (value) => updateStagedHoundImportField(index, 'callName', value), item.imported));
        appendImportCell(row, importTextInput(item.registeredName, 'Registered name', (value) => updateStagedHoundImportField(index, 'registeredName', value), item.imported));
        appendImportCell(row, importBreedSelect(item, index));
        appendImportCell(row, importTextInput(item.registrationNumber, 'Registration number', (value) => updateStagedHoundImportField(index, 'registrationNumber', value), item.imported));
        appendImportCell(row, importTextInput(item.registry, 'Registry', (value) => updateStagedHoundImportField(index, 'registry', value), item.imported));
        appendImportCell(row, importTextInput(item.owner, 'Owner', (value) => updateStagedHoundImportField(index, 'owner', value), item.imported));
        body.appendChild(row);
    });
    updateHoundImportButton();
}

function updateHoundImportButton() {
    const button = houndImportElement('importHoundDatabaseButton');
    if (!button) return;
    const count = stagedHoundDatabaseImports.filter((item) => item.selected !== false && !item.imported && item.decision !== 'skip').length;
    button.disabled = !count || !houndImportElement('houndDatabaseImportProgress')?.hidden;
    button.textContent = count ? 'Import ' + count + ' Selected Hound' + (count === 1 ? '' : 's') : 'Import Selected Hounds';
    const available = stagedHoundDatabaseImports.filter((item) => !item.imported);
    const selectedCount = available.filter((item) => item.selected !== false).length;
    const countLabel = houndImportElement('houndDatabaseImportSelectionCount');
    if (countLabel) countLabel.textContent = selectedCount + ' of ' + available.length + ' rows checked';
}

function buildImportedMasterHound(imported) {
    const now = new Date().toISOString();
    return normalizeLciHoundShape({
        id: crypto.randomUUID(), callName: imported.callName || imported.registeredName || 'Imported Hound',
        registeredName: imported.registeredName || imported.callName || '', breed: normalizeImportedBreed(imported.breed),
        registrationNumber: imported.registrationNumber || '', registry: imported.registry || '', registrationType: imported.registrationType || '',
        registrationDisplay: formatRegistration(imported.registry, imported.registrationNumber, imported.registrationType),
        alternateRegistry: imported.alternateRegistry || '', alternateRegistrationNumber: imported.alternateRegistrationNumber || '',
        alternateRegistrationDisplay: formatRegistration(imported.alternateRegistry, imported.alternateRegistrationNumber, ''),
        registrationVerificationStatus: 'not_checked', alternateVerificationStatus: imported.alternateRegistrationNumber ? 'not_checked' : '',
        sex: imported.sex || '', dob: imported.dob || '', owner: imported.owner || '', ownerEmail: imported.ownerEmail || '',
        ownerPhone: formatNorthAmericanPhone(imported.ownerPhone || ''), ownerAddress: imported.ownerAddress || '',
        ownerCity: imported.ownerCity || '', ownerState: imported.ownerState || '', ownerPostalCode: imported.ownerPostalCode || '',
        ownerCountry: imported.ownerCountry || '', breeder: imported.breeder || '', sire: imported.sire || '', dam: imported.dam || '',
        importedFrom: imported.importedFrom || 'Hound database import', createdAt: now, updatedAt: now,
    });
}

function mergeImportedMasterHound(existing, imported, overwrite) {
    const fields = ['callName', 'registeredName', 'breed', 'registrationNumber', 'registry', 'registrationType', 'alternateRegistrationNumber', 'alternateRegistry', 'sex', 'dob', 'owner', 'ownerEmail', 'ownerPhone', 'ownerAddress', 'ownerCity', 'ownerState', 'ownerPostalCode', 'ownerCountry', 'breeder', 'sire', 'dam'];
    const updated = { ...existing };
    fields.forEach((field) => {
        const incoming = String(imported[field] ?? '').trim();
        if (incoming && (overwrite || !String(updated[field] ?? '').trim())) {
            updated[field] = field === 'ownerPhone'
                ? formatNorthAmericanPhone(incoming)
                : (field === 'breed' ? normalizeImportedBreed(incoming) : incoming);
        }
    });
    updated.registrationDisplay = formatRegistration(updated.registry, updated.registrationNumber, updated.registrationType);
    updated.alternateRegistrationDisplay = formatRegistration(updated.alternateRegistry, updated.alternateRegistrationNumber, '');
    updated.importedFrom = imported.importedFrom || updated.importedFrom || 'Hound database import';
    updated.updatedAt = new Date().toISOString();
    return normalizeLciHoundShape(updated);
}

function validateHoundImports(rows) {
    const problems = [];
    rows.forEach((item, index) => {
        const name = item.callName || item.registeredName || `Row ${index + 1}`;
        if (!item.callName && !item.registeredName) problems.push(`${name}: call name or registered name is required`);
        if (!item.breed) problems.push(`${name}: breed is required`);
        if (['fill', 'update'].includes(item.decision) && !item.match) problems.push(`${name}: no database match is selected`);
        if (item.decision === 'create' && item.matchType === 'registration') problems.push(`${name}: registration already belongs to ${item.match?.callName || 'another hound'}`);
    });
    return problems;
}

async function importSelectedHoundsToDatabase() {
    const selected = stagedHoundDatabaseImports.filter((item) => item.selected !== false && !item.imported && item.decision !== 'skip');
    if (!selected.length) {
        showHoundImportMessage('Select at least one previewed hound to import.');
        return;
    }
    selected.forEach((item) => refreshStagedHoundMatch(stagedHoundDatabaseImports.indexOf(item)));
    const problems = validateHoundImports(selected);
    if (problems.length) {
        showHoundImportMessage(`Fix the import before saving: ${problems.slice(0, 3).join('; ')}${problems.length > 3 ? `; and ${problems.length - 3} more` : ''}.`);
        renderHoundImportPreview();
        return;
    }
    const previous = masterHounds;
    let created = 0; let filled = 0; let updated = 0;
    setHoundImportBusy(true, `Saving ${selected.length} hound record${selected.length === 1 ? '' : 's'} to SQLite...`);
    showHoundImportMessage('Saving the reviewed hound records. Trial entries will not be added or changed.');
    await yieldHoundImportUi();
    try {
        for (const item of selected) {
            const liveMatch = matchImportedHound(item).hound;
            if (item.decision === 'create') {
                if (liveMatch && clean(liveMatch.registrationNumber) && clean(liveMatch.registrationNumber) === clean(item.registrationNumber)) throw new Error(`${item.callName || item.registeredName} now matches an existing registration. Review that row and try again.`);
                masterHounds = [buildImportedMasterHound(item), ...masterHounds];
                created += 1;
            } else {
                const match = masterHounds.find((hound) => hound.id === item.match?.id) || liveMatch;
                if (!match) throw new Error(`The selected match for ${item.callName || item.registeredName} is no longer available.`);
                const replacement = mergeImportedMasterHound(match, item, item.decision === 'update');
                masterHounds = masterHounds.map((hound) => hound.id === match.id ? replacement : hound);
                if (item.decision === 'update') updated += 1; else filled += 1;
            }
        }
        saveMasterHounds();
        if (sqliteModeAvailable && sqliteLoadComplete) {
            clearTimeout(sqliteSaveTimer);
            await saveToSQLite();
        }
        selected.forEach((item) => { item.imported = true; item.selected = false; });
        render();
        renderHoundImportPreview();
        showHoundImportMessage(`Hound database import saved: ${created} created, ${filled} matched record${filled === 1 ? '' : 's'} filled, and ${updated} updated. No trial entries were changed.`, 'success');
    } catch (error) {
        masterHounds = previous;
        saveBrowserCacheValue(houndStorageKey, masterHounds);
        showHoundImportMessage(`The hound database import was not saved. No records were changed. ${error.message}`);
    } finally {
        setHoundImportBusy(false);
    }
}

function applySelectedHoundImportTemplate() {
    const template = entryImportTemplates.find((item) => item.id === (houndImportElement('houndDatabaseImportTemplateSelect')?.value || ''));
    houndDatabaseImportMapping = { ...inferHoundImportMapping(houndDatabaseImportHeaders), ...(template?.mapping || {}) };
    renderHoundImportMapping();
    if (houndDatabaseImportSourceRows.length) applyHoundImportMapping();
}

function saveHoundImportTemplate() {
    if (!houndDatabaseImportHeaders.length) {
        showHoundImportMessage('Preview a hound database export before saving its mapping template.');
        return;
    }
    readHoundImportMappingControls();
    const name = houndImportElement('houndDatabaseImportTemplateName')?.value.trim() || `Hound Database Template ${entryImportTemplates.length + 1}`;
    const existing = entryImportTemplates.find((template) => clean(template.name) === clean(name));
    const template = { id: existing?.id || crypto.randomUUID(), name, mapping: { ...houndDatabaseImportMapping }, scope: 'hound-database', createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    entryImportTemplates = existing ? entryImportTemplates.map((item) => item.id === existing.id ? template : item) : [...entryImportTemplates, template];
    saveEntryImportTemplates();
    renderEntryImportTemplateOptions();
    renderHoundImportTemplateOptions();
    houndImportElement('houndDatabaseImportTemplateSelect').value = template.id;
    showHoundImportMessage(`Saved hound database mapping template "${name}".`, 'success');
}

function initializeHoundDatabaseImport() {
    if (!houndImportElement('houndDatabaseImportPanel')) return;
    houndImportElement('exportHoundDatabaseButton')?.addEventListener('click', exportHoundDatabase);
    renderHoundImportTemplateOptions();
    renderHoundImportMapping();
    renderHoundImportPreview();
    houndImportElement('previewHoundDatabaseImportButton')?.addEventListener('click', () => previewHoundImport().catch((error) => { setHoundImportBusy(false); showHoundImportMessage(`Hound database preview failed: ${error.message}`); }));
    houndImportElement('applyHoundDatabaseImportMappingButton')?.addEventListener('click', applyHoundImportMapping);
    houndImportElement('saveHoundDatabaseImportTemplateButton')?.addEventListener('click', saveHoundImportTemplate);
    houndImportElement('houndDatabaseImportTemplateSelect')?.addEventListener('change', applySelectedHoundImportTemplate);
    document.querySelectorAll('[data-hound-import-selection]').forEach((button) => {
        button.addEventListener('click', () => selectHoundImportRows(button.dataset.houndImportSelection));
    });
    document.querySelectorAll('[data-hound-import-sort]').forEach((button) => {
        button.addEventListener('click', () => sortHoundImportRows(button.dataset.houndImportSort));
    });
    houndImportElement('applyHoundDatabaseImportBulkDecision')?.addEventListener('click', applyBulkHoundImportDecision);
    houndImportElement('importHoundDatabaseButton')?.addEventListener('click', () => importSelectedHoundsToDatabase().catch((error) => { setHoundImportBusy(false); showHoundImportMessage(`Hound database import failed: ${error.message}`); }));
}

initializeHoundDatabaseImport();
