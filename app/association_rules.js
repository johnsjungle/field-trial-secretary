(function attachAssociationRules(root) {
    'use strict';

    const profiles = {
        ASFA: {
            association: 'ASFA', rulesetId: 'ASFA-2024-08-01', rulesetVersion: '2024-08-01',
            regularStakes: ['Open', 'Field Champion', 'Veteran', 'Provisional', 'Singles'],
            eligibleBreedCodes: ['AH', 'AZ', 'BA', 'BZ', 'CE', 'CH', 'DH', 'GA', 'GH', 'IB', 'IG', 'IW', 'MA', 'PIO', 'PH', 'POD', 'PPP', 'RR', 'SA', 'SL', 'SW', 'WH'],
            lciAllowed: true, judgeScoreMaximum: 100, combinedQualifyingMinimumPerJudge: 100,
            placementLabels: ['1', '2', '3', '4', 'NBQ'], bifExcludedBreedCodes: ['CH', 'GA', 'MA', 'POD', 'PPP'],
        },
        AKC: {
            association: 'AKC', rulesetId: 'AKC-2026-01-01', rulesetVersion: '2026-01-01',
            regularStakes: ['Open', 'Specials', 'Veteran', 'Singles'],
            eligibleBreedCodes: ['AH', 'AZ', 'BA', 'BZ', 'CE', 'DH', 'GH', 'IB', 'IG', 'IW', 'NBS', 'PIO', 'PH', 'POD', 'PPP', 'RR', 'SA', 'SL', 'SW', 'TR', 'WH'],
            lciAllowed: false, judgeScoreMaximum: 50, combinedQualifyingMinimumPerJudge: 50,
            placementLabels: ['1', '2', '3', '4', '5'], bifExcludedBreedCodes: ['PPP', 'SW', 'TR'],
        },
    };

    function normalizeAssociation(value) { return String(value || '').trim().toUpperCase() === 'AKC' ? 'AKC' : 'ASFA'; }
    function profileForAssociation(value) { return profiles[normalizeAssociation(value)]; }
    function profileForTrial(trial) { return profileForAssociation(trial && trial.association); }
    function normalizeTrialRuleset(trial) {
        const profile = profileForTrial(trial);
        return { ...trial, association: profile.association, rulesetId: profile.rulesetId, rulesetVersion: profile.rulesetVersion };
    }
    function placementName(value, association) {
        const number = Number(value);
        const labels = profileForAssociation(association).placementLabels;
        return Number.isInteger(number) && number >= 1 && number <= labels.length ? labels[number - 1] : '';
    }
    function placementNumber(value, association) {
        const normalized = String(value || '').trim().toUpperCase();
        const labels = profileForAssociation(association).placementLabels.map((label) => label.toUpperCase());
        const index = labels.indexOf(normalized);
        return index >= 0 ? index + 1 : Number(normalized);
    }
    const api = Object.freeze({ profiles, normalizeAssociation, profileForAssociation, profileForTrial, normalizeTrialRuleset, placementName, placementNumber });
    root.FTSAssociationRules = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis));
