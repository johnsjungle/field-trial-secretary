(function (root) {
    function text(value) {
        return String(value || '').trim();
    }

    function normalizeType(value) {
        return text(value).toUpperCase() === 'QC' ? 'QC' : 'JC';
    }

    function normalizeResult(value) {
        const result = text(value).toLowerCase();
        return ['pass', 'fail', 'scratch'].includes(result) ? result : 'pending';
    }

    function houndSnapshot(hound, extra = {}) {
        const source = hound || {};
        return {
            houndId: text(source.houndId || source.id),
            callName: text(source.callName),
            registeredName: text(source.registeredName || source.regName),
            breed: text(source.breed),
            registrationNumber: text(source.registrationNumber || source.regNumber),
            registry: text(source.registry || 'AKC'),
            registrationType: text(source.registrationType || source.regType),
            sex: text(source.sex),
            dateOfBirth: text(source.dateOfBirth || source.dob),
            owner: text(source.owner),
            handler: text(source.handler || source.owner),
            ...extra,
        };
    }

    function normalize(record, index = 0) {
        const source = record || {};
        return {
            id: text(source.id) || `akc-test-${index + 1}`,
            sourceEntryId: text(source.sourceEntryId),
            ...houndSnapshot(source),
            testType: normalizeType(source.testType),
            judgeName: text(source.judgeName),
            judgeNumber: text(source.judgeNumber),
            result: normalizeResult(source.result),
            partnerName: text(source.partnerName),
            partnerRegistrationNumber: text(source.partnerRegistrationNumber),
            partnerBreed: text(source.partnerBreed),
            notes: text(source.notes),
            runOrder: Number.isFinite(Number(source.runOrder)) ? Number(source.runOrder) : index + 1,
            createdAt: text(source.createdAt),
            updatedAt: text(source.updatedAt),
        };
    }

    function sorted(records) {
        return (records || []).map(normalize).sort((a, b) => (
            a.runOrder - b.runOrder
            || a.testType.localeCompare(b.testType)
            || a.registeredName.localeCompare(b.registeredName)
        ));
    }

    function syncLinked(records, entry, selectedTypes, idFactory, now) {
        const types = new Set((selectedTypes || []).map(normalizeType));
        const existing = (records || []).map(normalize);
        const linked = existing.filter((record) => record.sourceEntryId === entry.id);
        const unrelated = existing.filter((record) => record.sourceEntryId !== entry.id);
        const timestamp = now || new Date().toISOString();
        const createId = idFactory || (() => root.crypto.randomUUID());
        const next = [...unrelated];
        ['JC', 'QC'].forEach((testType) => {
            if (!types.has(testType)) return;
            const previous = linked.find((record) => record.testType === testType);
            next.push(normalize({
                ...(previous || {}),
                ...houndSnapshot(entry),
                id: previous?.id || createId(),
                sourceEntryId: entry.id,
                testType,
                result: previous?.result || 'pending',
                runOrder: previous?.runOrder || existing.length + next.length + 1,
                createdAt: previous?.createdAt || timestamp,
                updatedAt: timestamp,
            }));
        });
        return sorted(next).map((record, index) => ({ ...record, runOrder: index + 1 }));
    }

    function counts(records) {
        return (records || []).map(normalize).reduce((result, record) => {
            result.total += 1;
            result[record.testType.toLowerCase()] += 1;
            result[record.result] += 1;
            return result;
        }, { total: 0, jc: 0, qc: 0, pending: 0, pass: 0, fail: 0, scratch: 0 });
    }

    const api = { normalize, sorted, syncLinked, counts, houndSnapshot };
    root.AkcTests = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);