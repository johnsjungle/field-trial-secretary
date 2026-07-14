const storageKey = 'fieldTrialSecretary.trials.v1';
const houndStorageKey = 'fieldTrialSecretary.masterHounds.v1';
const judgeStorageKey = 'fieldTrialSecretary.masterJudges.v1';
const workerStorageKey = 'fieldTrialSecretary.masterWorkers.v1';
const formTemplateStatusKey = 'fieldTrialSecretary.formTemplateStatus.v1';
const formAlignmentKey = 'fieldTrialSecretary.formAlignment.v1';
const entryImportTemplateKey = 'fieldTrialSecretary.entryImportTemplates.v1';
const deletedTrialsKey = 'fieldTrialSecretary.deletedTrials.v1';
const activeKey = 'fieldTrialSecretary.activeTrialId.v1';
const activeLockKey = 'fieldTrialSecretary.activeTrialLocked.v1';
const buttonHelpText = {
    markScoringCompleteButton: 'Checks that every preliminary result has a score or outcome, then marks prelims complete and locks them. Use this before building finals so posted prelim results are protected.',
    togglePrelimLockButton: 'Locks or unlocks preliminary score entry only. Use Unlock Prelims when correcting a mistake; it does not by itself mark prelims complete.',
    toggleFinalsLockButton: 'Locks or unlocks finals score entry. Use Unlock Finals only when correcting a finals score or outcome.',
    buildPreliminaryDrawButton: 'Creates the randomized preliminary draw from present roll-call hounds, with Singles and LCI handled as their own run groups.',
    autoOwnerSeparationButton: 'Finds owners with more than one hound in the same breed/stake group and assigns owner separation letters before the preliminary draw.',
    markSeparationReviewedButton: 'Marks owner separation as reviewed for this trial. Use this after auto-marking or manually checking same-owner hounds before the preliminary draw.',
    printDrawSheetButton: 'Creates the official posted draw order sheet for the current preliminary draw.',
    printJudgeSheetsButton: 'Creates preliminary judge sheets for the courses and judges assigned in the run plan.',
    printJudgesMapButton: 'Prints a breed and stake map showing course breakdowns and judge assignments in running order.',
    createAdminTestTrialButton: 'Creates a realistic test trial with hounds, judges, workers, and a starter run plan.',
    populateAdminScoresButton: 'Fills preliminary Judge 1 and Judge 2 scores for testing, following the judges assigned in the run plan.',
    populateAdminFinalsScoresButton: 'Fills finals Judge 1 and Judge 2 scores for testing, then recomputes combined scores and placements.',
    removeAdminTestRecordsButton: 'Removes generated test hounds, judges, and workers from the reusable databases without deleting any trials.',
    redrawAllRunoffsButton: 'Builds or redraws all current tie runoff and BOB draws, assigning course numbers and blanket colors.',
    printRunoffDrawSheetButton: 'Prints the runoff running order sheet after colors have been drawn.',
    printAllRunoffJudgeSheetsButton: 'Prints judge sheets for the current runoff order after colors have been drawn.',
    printBifJudgeSheetsButton: 'Prints judge sheets for the current BIF draw using the BIF judges assigned on this page.',
    printBifDrawSheetButton: 'Prints the posted BIF draw order sheet after BIF colors are drawn.',
    setActiveButton: 'Makes this the active trial shown at the top of the app.',
    setSelectedActiveButton: 'Locks the selected trial as the working trial. Unlock it before switching to a different trial.',
    newTrialButton: 'Starts a new trial setup record.',
    saveTrialButton: 'Saves the current trial details.',
    createSQLiteBackupButton: 'Creates a restore point of the current SQLite database. Use this before trial day, before restoring, and before major changes.',
    saveBackupRetentionButton: 'Saves how many automatic SQLite backups are kept before older backups are pruned.',
    exportDataBackupButton: 'Exports a JSON copy of the trial data for an extra portable backup. SQLite backup is preferred when server mode is available.',
    refreshSQLiteBackupsButton: 'Reloads the SQLite backup list from the backups folder.',
    restoreSQLiteBackupButton: 'Restores the selected SQLite backup after making a safety copy of the current database.',
    restoreBrowserBackupButton: 'Restores the latest protected browser safety backup. Use only if SQLite data is missing or unavailable.',
    importDataBackupButton: 'Imports a JSON data backup and replaces the current browser/app data after confirmation.',
    createTransferPackageButton: 'Builds one installer zip for a new computer, including the app, current SQLite database, and a blank starter database.',
    createProgramUpdatePackageButton: 'Builds a smaller update zip for a computer that already has Field Trial Secretary installed. It leaves that computer’s database alone.',
    restoreTransferAppFilesButton: 'Restores program files and templates from a transfer package without replacing the current SQLite database.',
    refreshPortableStatusButton: 'Checks whether the portable executable package is current.',
    buildPortablePackageButton: 'Rebuilds the portable executable only. Most users should use Create Transfer Installer or Create Program Update instead.',
    restartServerButton: 'Restarts the local app server. Use after restoring app files or rebuilding portable packages.',
    exitAppButton: 'Saves the current data, stops the local app server, and tells you when it is safe to close the browser tab.',
    exitAppToolsButton: 'Saves the current data, stops the local app server, and tells you when it is safe to close the browser tab.',
};

const form = document.getElementById('trialForm');
const trialList = document.getElementById('trialList');
const activeTrialBadge = document.getElementById('activeTrialBadge');
const workflowStrip = document.getElementById('workflowStrip');
const trialGuideCard = document.getElementById('trialGuideCard');
const trialGuideSummary = document.getElementById('trialGuideSummary');
const trialGuideNext = document.getElementById('trialGuideNext');
const trialGuideList = document.getElementById('trialGuideList');
const subTabs = document.getElementById('subTabs');
const newTrialButton = document.getElementById('newTrialButton');
const setActiveButton = document.getElementById('setActiveButton');
const setSelectedActiveButton = document.getElementById('setSelectedActiveButton');
const deleteSelectedSetupTrialButton = document.getElementById('deleteSelectedSetupTrialButton');
const setupChecklist = document.getElementById('setupChecklist');
const checklistSummary = document.getElementById('checklistSummary');
const formMessage = document.getElementById('formMessage');
const entryMessage = document.getElementById('entryMessage');
const masterHoundMessage = document.getElementById('masterHoundMessage');
const masterJudgeMessage = document.getElementById('masterJudgeMessage');
const masterWorkerMessage = document.getElementById('masterWorkerMessage');
const runPlanMessage = document.getElementById('runPlanMessage');
const rollCallMessage = document.getElementById('rollCallMessage');
const runoffMessage = document.getElementById('runoffMessage');
const bifMessage = document.getElementById('bifMessage');
const mainResultsMessage = document.getElementById('mainResultsMessage');
const wrapUpMessage = document.getElementById('wrapUpMessage');
const wrapUpSecretaryMessage = document.getElementById('wrapUpSecretaryMessage');
const archiveTrialMessage = document.getElementById('archiveTrialMessage');
const archiveTrialStatus = document.getElementById('archiveTrialStatus');
const adminTestMessage = document.getElementById('adminTestMessage');
const officialFormsMessage = document.getElementById('officialFormsMessage');
const storageSafetyMessage = document.getElementById('storageSafetyMessage');
const appVersionBadge = document.getElementById('appVersionBadge');
const saveStatusBadge = document.getElementById('saveStatusBadge');
const databaseIntegrityStatusBadge = document.getElementById('databaseIntegrityStatusBadge');
const startupSplash = document.getElementById('startupSplash');
const startupSplashFrame = document.getElementById('startupSplashFrame');
const sqliteBackupSelect = document.getElementById('sqliteBackupSelect');
const sqliteBackupDetails = document.getElementById('sqliteBackupDetails');
const portablePackageStatus = document.getElementById('portablePackageStatus');
const showArchivedTrials = document.getElementById('showArchivedTrials');

const breedOptions = [
    ['', 'Breed'],
    ['AH', 'Afghan Hound'],
    ['AZ', 'Azawakh'],
    ['BA', 'Basenji'],
    ['BZ', 'Borzoi'],
    ['CE', "Cirneco dell'Etna"],
    ['CH', 'Chart Polski'],
    ['DH', 'Deerhound'],
    ['GA', 'Galgo Espanol'],
    ['GH', 'Greyhound'],
    ['HW', 'Hortaya Borzaya'],
    ['IB', 'Ibizan Hound'],
    ['IG', 'Italian Greyhound'],
    ['IW', 'Irish Wolfhound'],
    ['MA', 'Magyar Agar'],
    ['NBS', 'Norrbottenspets'],
    ['PIO', 'Peruvian Inca Orchid'],
    ['PH', 'Pharaoh Hound'],
    ['POD', 'Portuguese Podengo (Medio & Grande)'],
    ['PPP', 'Portuguese Podengo Pequeno'],
    ['RR', 'Rhodesian Ridgeback'],
    ['SA', 'Saluki'],
    ['SL', 'Sloughi'],
    ['SW', 'Silken Windhound'],
    ['TR', 'Thai Ridgeback'],
    ['WH', 'Whippet'],
    ['OTHER', 'Other'],
];

const startupSplashFrames = [
    'assets/startup/startup-01.jpg',
    'assets/startup/startup-02.jpg',
    'assets/startup/startup-03.jpg',
    'assets/startup/startup-04.jpg',
    'assets/startup/startup-05.jpg',
    'assets/startup/startup-06.jpg',
    'assets/startup/startup-07.jpg',
    'assets/startup/startup-08.jpg',
    'assets/startup/startup-09.jpg',
    'assets/startup/startup-10.jpg',
];
let startupSplashTimer = null;
let startupSplashStartedAt = 0;
const startupSplashMinimumMs = 2600;

const lciDivisions = ['LCI Small', 'LCI Large', 'LCI Sighthound Mix'];
const lciStakes = ['Open', 'Excellent', 'Veteran'];
const lciClassOptions = lciDivisions.flatMap((division) => lciStakes.map((stake) => `${division} ${stake}`));
const regularClassOptions = ['Open', 'Field Champion', 'Veteran', 'Provisional', 'Singles'];
const defaultClassOptions = regularClassOptions;
const adminPageTabs = ['Judges & Workers', 'Paperwork', 'Hound DB', 'Tools'];

const asfaRegularBreedCodes = ['AH', 'AZ', 'BA', 'BZ', 'CE', 'GH', 'IB', 'IW', 'IG', 'PIO', 'PH', 'RR', 'SA', 'DH', 'SW', 'SL', 'WH'];
const asfaProvisionalBreedCodes = ['CH', 'GA', 'MA', 'POD', 'PPP'];
const asfaJudgeSheetBreedCodes = {
    AH: 'A',
    AZ: 'AZ',
    BA: 'BA',
    BZ: 'B',
    CE: 'CE',
    GH: 'G',
    IB: 'IB',
    IW: 'IW',
    IG: 'IG',
    PIO: 'PIO',
    PH: 'P',
    RR: 'RR',
    SA: 'S',
    DH: 'SD',
    SL: 'SL',
    SW: 'SW',
    WH: 'W',
};
const asfaPremiumBreedAliases = {
    A: 'AH',
    AF: 'AH',
    AH: 'AH',
    AFGHAN: 'AH',
    AZ: 'AZ',
    BA: 'BA',
    B: 'BZ',
    BZ: 'BZ',
    C: 'CE',
    CE: 'CE',
    G: 'GH',
    GH: 'GH',
    IB: 'IB',
    IW: 'IW',
    IG: 'IG',
    PIO: 'PIO',
    P: 'PH',
    PH: 'PH',
    RR: 'RR',
    S: 'SA',
    SA: 'SA',
    SD: 'DH',
    DH: 'DH',
    SL: 'SL',
    SW: 'SW',
    W: 'WH',
    WH: 'WH',
    LCI: 'LCI',
    PROV: 'PROV',
    PROVISIONAL: 'PROV',
    SGL: 'SINGLES',
    SINGLES: 'SINGLES',
};

const officialFormTemplates = [
    {
        id: 'asfa-sec-02-judging-form',
        association: 'ASFA',
        name: 'Judging Form',
        code: 'SEC-02',
        use: 'Judge sheet',
        revision: 'Rev 04-01-26',
        sourceUrl: 'https://www.asfa.org/forms/SEC-02--Judging%20Form.pdf',
        localTemplatePath: 'templates/asfa/SEC-02-Judging-Form-Rev-04-01-26.pdf',
        notes: 'Primary ASFA judge scoring sheet.'
    },
    {
        id: 'asfa-sec-01-record-sheet',
        association: 'ASFA',
        name: 'ASFA Record Sheet',
        code: 'SEC-01',
        use: 'Posted scores / record sheet',
        revision: 'Rev 03-02',
        sourceUrl: 'https://www.asfa.org/forms/SEC01--RecordSheet.pdf',
        localTemplatePath: 'templates/asfa/SEC-01-Record-Sheet-Rev-03-02.pdf',
        notes: 'Posting and trial record sheet.'
    },
    {
        id: 'asfa-sec-05-draw-order',
        association: 'ASFA',
        name: 'Draw Order',
        code: 'SEC-05',
        use: 'Draw order',
        revision: 'Rev 08-01',
        sourceUrl: 'https://www.asfa.org/forms/SEC-05--DrawOrder3upACoD.pdf',
        localTemplatePath: 'templates/asfa/SEC-05-Draw-Order-Rev-08-01.pdf',
        notes: 'Three-up draw order sheet.'
    },
    {
        id: 'asfa-rec-25-fts-report',
        association: 'ASFA',
        name: 'Field Trial Secretary Report',
        code: 'REC-25',
        use: 'Secretary report',
        revision: 'New 3-26',
        sourceUrl: 'https://www.asfa.org/docs/REC%2025--FIELD%20TRIAL%20SECRETARY%20REPORT.pdf',
        localTemplatePath: 'templates/asfa/REC-25-Field-Trial-Secretary-Report-New-03-26.pdf',
        notes: 'Final ASFA report packet form.'
    },
    {
        id: 'asfa-sec-06-hound-certification',
        association: 'ASFA',
        name: 'Hound Certification Form',
        code: 'SEC-06',
        use: 'Certification',
        revision: 'Rev 01-21',
        sourceUrl: 'https://www.asfa.org/forms/SEC-06--Hound%20Certification%20%281%29.pdf',
        localTemplatePath: 'templates/asfa/SEC-06-Hound-Certification-Rev-01-21.pdf',
        notes: 'Tracks first-time certification paperwork.'
    },
    {
        id: 'asfa-ef-a-entry-form',
        association: 'ASFA',
        name: 'Entry Form',
        code: 'ID-EF-A',
        use: 'Premium entry form',
        revision: 'Rev 6/26',
        sourceUrl: 'https://www.asfa.org/forms/EF-A--Entry%20Form.pdf',
        localTemplatePath: 'templates/asfa/EF-A-Entry-Form-Rev-06-26.pdf',
        notes: 'Official ASFA regular trial entry form.'
    },
    {
        id: 'asfa-ef-a-lci-entry-form',
        association: 'ASFA',
        name: 'LCI Entry Form',
        code: 'EF-A-LCI',
        use: 'Premium entry form',
        revision: 'Rev 8-24',
        sourceUrl: 'https://www.asfa.org/forms/EF-A-LCI-Entry%20Form--08-2024.pdf',
        localTemplatePath: 'templates/asfa/EF-A-LCI-Entry-Form-Rev-08-24.pdf',
        notes: 'Official ASFA LCI entry form.'
    },
    {
        id: 'asfa-ef-a-lci-registration-form',
        association: 'ASFA',
        name: 'LCI Registration Form',
        code: 'EF-A_LCI',
        use: 'LCI registration',
        revision: 'Rev 08-24',
        sourceUrl: 'https://www.asfa.org/forms/EF-A-LCI-Registration%20Form--08-2024.pdf',
        localTemplatePath: 'templates/asfa/EF-A-LCI-Registration-Form-Rev-08-24.pdf',
        notes: 'Official ASFA LCI registration form for LCI paperwork.'
    },
    {
        id: 'akc-lure-coursing-entry-form',
        association: 'AKC',
        name: 'Lure Coursing/CAT/FCAT Entry Form',
        code: 'ALR999',
        use: 'Premium entry form',
        revision: '03/25 v1.1',
        sourceUrl: 'https://images.akc.org/pdf/LureCoursing_Entry.pdf',
        localTemplatePath: 'templates/akc/LureCoursing-Entry-Form-ALR999-03-25.pdf',
        notes: 'Official AKC lure coursing performance entry form.'
    },
    {
        id: 'akc-jersc1-judges-sheet',
        association: 'AKC',
        name: 'Lure Coursing Judges Sheet',
        code: 'JERSC1',
        use: 'Judge sheet',
        revision: '5-18',
        sourceUrl: 'https://www.akc.org/wp-content/uploads/2022/03/JERSC1_518-New-Logo.pdf',
        localTemplatePath: 'templates/akc/JERSC1-Lure-Coursing-Judges-Sheet-5-18.pdf',
        notes: 'AKC judge scoring sheet.'
    },
    {
        id: 'akc-jersc3-scoresheet',
        association: 'AKC',
        name: 'Lure Coursing Scoresheet',
        code: 'JERSC3',
        use: 'Posted scores / results',
        revision: '4-22',
        sourceUrl: 'https://www.akc.org/wp-content/uploads/2022/04/JERSC3-4.22-fillable.pdf',
        localTemplatePath: 'templates/akc/JERSC3-Lure-Coursing-Scoresheet-4-22.pdf',
        notes: 'Regular stake posting and results sheet.'
    },
    {
        id: 'akc-jersc7-single-stake',
        association: 'AKC',
        name: 'Single Stake Scoresheet',
        code: 'JERSC7',
        use: 'Single stake posted scores',
        revision: '5-18',
        sourceUrl: 'https://www.akc.org/wp-content/uploads/2022/04/JERSC7_0518-Fillable.pdf',
        localTemplatePath: 'templates/akc/JERSC7-Single-Stake-Scoresheet-5-18.pdf',
        notes: 'AKC single stake result sheet.'
    },
    {
        id: 'akc-jersc2-draw-order',
        association: 'AKC',
        name: 'Lure Coursing Draw Order Sheet',
        code: 'JERSC2',
        use: 'Draw order',
        revision: 'Current PDF',
        sourceUrl: 'https://images.akc.org/pdf/JERSC2.pdf',
        localTemplatePath: 'templates/akc/JERSC2-Lure-Coursing-Draw-Order.pdf',
        notes: 'AKC draw order sheet.'
    },
    {
        id: 'akc-jfsec2-secretary-report',
        association: 'AKC',
        name: 'Event Secretary Report',
        code: 'JFSEC2',
        use: 'Secretary report',
        revision: '10-25',
        sourceUrl: 'https://images.akc.org/pdf/JFSEC2.pdf',
        localTemplatePath: 'templates/akc/JFSEC2-Event-Secretary-Report-10-25.pdf',
        notes: 'AKC lure coursing event secretary report.'
    },
    {
        id: 'akc-iejdg1-judge-book-directions',
        association: 'AKC',
        name: 'Coursing Judges Book Directions',
        code: 'IEJDG1',
        use: 'Judge book directions',
        revision: 'Current PDF',
        sourceUrl: 'https://images.akc.org/pdf/IEJDG1.pdf',
        localTemplatePath: 'templates/akc/IEJDG1-Coursing-Judges-Book-Directions.pdf',
        notes: 'Directions for completing AKC judge books.'
    }
];

const defaultFormAlignment = {
    asfaRecordSheet: {
        headerFontSize: 10,
        bodyFontSize: 8.5,
        codeFontSize: 8.5,
        globalYAdjust: 0,
        breedX: 158,
        stakeX: 392,
        flightX: 622,
        enteredX: 426,
        refundsX: 555,
        perCapitaX: 720,
        breedY: 77,
        stakeY: 77,
        flightY: 77,
        enteredY: 102,
        refundsY: 102,
        perCapitaY: 102,
        rowTop: 164,
        rowHeight: 18.1,
        callNameX: 36,
        callNameY: 164,
        registrationX: 124,
        registrationY: 164,
        prelimCodeX: 250,
        prelimCodeY: 164,
        prelimJudge1X: 293,
        prelimJudge1Y: 164,
        prelimJudge2X: 334,
        prelimJudge2Y: 164,
        prelimScoreX: 373,
        prelimScoreY: 164,
        finalCodeX: 414,
        finalCodeY: 164,
        finalJudge1X: 456,
        finalJudge1Y: 164,
        finalJudge2X: 498,
        finalJudge2Y: 164,
        finalScoreX: 535,
        finalScoreY: 164,
        combinedScoreX: 585,
        combinedScoreY: 164,
        stakesRunoffLabelX: 640,
        stakesRunoffLabelY: 159,
        stakesRunoffCodeX: 640,
        stakesRunoffCodeY: 169,
        secondRunoffLabelX: 682,
        secondRunoffLabelY: 159,
        secondRunoffCodeX: 682,
        secondRunoffCodeY: 169,
        bobRunoffLabelX: 724,
        bobRunoffLabelY: 159,
        bobRunoffCodeX: 724,
        bobRunoffCodeY: 169,
        placementX: 760,
        placementY: 164,
        judge1X: 365,
        judge1Y: 542,
        judge2X: 365,
        judge2Y: 565,
        footerClubX: 160,
        footerClubY: 566,
        footerDateX: 395,
        footerDateY: 566,
        fieldClerkX: 575,
        fieldClerkY: 542,
        fieldSecretaryX: 575,
        fieldSecretaryY: 565,
        scratchReasonX: 650,
        scratchLineStartX: 30,
        scratchLineEndX: 770,
        scratchLineYOffset: -5,
    },
    asfaJudgeSheet: {
        fontSize: 8,
        circleWeight: 1.5,
        globalYAdjust: 0,
        rightFormYAdjust: 1.5,
        clubX: 108,
        clubY: 96,
        dateX: 286,
        dateY: 96,
        breedCircleY: 127,
        breedCircleW: 9,
        breedCircleH: 7,
        otherBreedX: 292,
        otherBreedY: 169,
        stakeCircleY: 147,
        stakeCircleW: 15,
        stakeCircleH: 8,
        provisionalStakeX: 305,
        mixedTextX: 292,
        mixedTextY: 169,
        flightCircleX: 58,
        flightCircleY: 167,
        flightCircleW: 8,
        flightCircleH: 7,
        phaseCircleX: 66,
        phaseCircleY: 217,
        phaseCircleW: 18,
        phaseCircleH: 7,
        finalPhaseCircleX: 106,
        finalPhaseCircleY: 217,
        finalPhaseCircleW: 16,
        finalPhaseCircleH: 7,
        bobPhaseCircleX: 169,
        bobPhaseCircleY: 197,
        bobPhaseCircleW: 18,
        bobPhaseCircleH: 7,
        bifPhaseCircleX: 244,
        bifPhaseCircleY: 197,
        bifPhaseCircleW: 18,
        bifPhaseCircleH: 7,
        biePhaseCircleX: 319,
        biePhaseCircleY: 197,
        biePhaseCircleW: 18,
        biePhaseCircleH: 7,
        lciLargeX: 91,
        lciSmallX: 162,
        lciShMixX: 239,
        lciCircleY: 169,
        lciCircleW: 24,
        lciCircleH: 7,
        courseCircleY: 217,
        courseCircleXAdjust: 0,
        courseCircleW: 8,
        courseCircleH: 7,
        phaseTextX: 66,
        phaseTextY: 197,
        judgeX: 150,
        judgeY: 235,
        judgeNumberCircleX: 62,
        judgeNumber1CircleY: 235,
        judgeNumber2CircleY: 252,
        judgeNumberCircleW: 10,
        judgeNumberCircleH: 7,
        colorStrikeTopY: 266,
        colorStrikeBottomY: 494,
        yellowColumnX: 205,
        pinkColumnX: 285,
        blueColumnX: 365,
        colorColumnW: 80,
    },
    asfaSecretaryReport: {
        fontSize: 9,
        circleWeight: 1.5,
        globalYAdjust: 0,
        clubX: 115,
        clubY: 129,
        regionX: 490,
        regionY: 129,
        chairX: 205,
        chairY: 158,
        emailX: 183,
        emailY: 194,
        dateX: 114,
        dateY: 229,
        locationX: 330,
        locationY: 229,
        q1YesX: 455,
        q1NoX: 499,
        q1Y: 272,
        q2YesX: 483,
        q2NoX: 525,
        q2Y: 392,
        q3YesX: 483,
        q3NoX: 525,
        q3Y: 442,
        q4YesX: 483,
        q4NoX: 525,
        q4Y: 530,
        q5YesX: 483,
        q5NoX: 525,
        q5Y: 580,
        q6YesX: 483,
        q6NoX: 525,
        q6Y: 630,
        answerCircleW: 13,
        answerCircleH: 7,
        notesX: 86,
        notesY: 336,
        page2ClubX: 112,
        page2ClubY: 115,
        page2DateX: 372,
        page2DateY: 115,
        entryFirstRowY: 148,
        entryRowHeight: 14,
        openX: 201,
        fchX: 232,
        vetsX: 265,
        entryTotalX: 306,
        breederX: 358,
        kennelX: 409,
        benchX: 453,
        specialTotalX: 501,
        totalsY: 477,
        breedFeeX: 535,
        breedFeeY: 544,
        specialFeeX: 535,
        specialFeeY: 582,
        recordsFeeX: 535,
        recordsFeeY: 619,
        checkAmountX: 535,
        checkAmountY: 656,
        paypalAmountX: 535,
        paypalAmountY: 693,
        paypalIdX: 348,
        paypalIdY: 720,
    },
    asfaEntryForm: {
        fontSize: 8,
        smallFontSize: 6.5,
        circleWeight: 1.4,
        globalYAdjust: 0,
        copyOffsetX: 396,
        trialClubX: 30,
        trialClubY: 58,
        trialDateX: 30,
        trialDateY: 72,
        trialSecretaryX: 205,
        trialSecretaryY: 58,
        trialSecretaryEmailX: 205,
        trialSecretaryEmailY: 72,
        breedX: 54,
        breedY: 82,
        callNameX: 78,
        callNameY: 112,
        registeredNameX: 126,
        registeredNameY: 141,
        registrationX: 74,
        registrationY: 202,
        dobX: 276,
        dobY: 202,
        ownerX: 118,
        ownerY: 252,
        addressX: 74,
        addressY: 281,
        phoneX: 58,
        phoneY: 311,
        cityX: 48,
        cityY: 340,
        stateX: 232,
        stateY: 340,
        zipX: 302,
        zipY: 340,
        emailX: 58,
        emailY: 369,
        regionX: 288,
        regionY: 369,
        stakeCheckY: 169,
        openX: 70,
        fchX: 112,
        veteranX: 163,
        singlesX: 228,
        provisionalX: 296,
        kennelX: 70,
        kennelY: 184,
        breederX: 117,
        breederY: 184,
        benchX: 165,
        benchY: 184,
        dogX: 252,
        bitchX: 317,
        sexCheckY: 226,
        ownerSeparationX: 245,
        ownerSeparationY: 188,
        firstAsfaTrialX: 30,
        firstAsfaTrialY: 402,
        firstTimeEntryX: 30,
        firstTimeEntryY: 435,
        changeInfoX: 30,
        changeInfoY: 468,
        dismissedX: 30,
        dismissedY: 501,
        checkSize: 7,
        signatureX: 230,
        signatureY: 581,
    },
    asfaLciEntryForm: {
        fontSize: 8,
        smallFontSize: 6.5,
        circleWeight: 1.4,
        globalYAdjust: 0,
        copyOffsetX: 396,
        trialClubX: 30,
        trialClubY: 64,
        trialDateX: 30,
        trialDateY: 78,
        trialSecretaryX: 205,
        trialSecretaryY: 64,
        trialSecretaryEmailX: 205,
        trialSecretaryEmailY: 78,
        breedX: 54,
        breedY: 88,
        callNameX: 78,
        callNameY: 118,
        registeredNameX: 126,
        registeredNameY: 147,
        registrationX: 74,
        registrationY: 223,
        dobX: 276,
        dobY: 223,
        ownerX: 118,
        ownerY: 273,
        addressX: 74,
        addressY: 302,
        phoneX: 58,
        phoneY: 332,
        cityX: 48,
        cityY: 361,
        stateX: 232,
        stateY: 361,
        zipX: 302,
        zipY: 361,
        emailX: 58,
        emailY: 390,
        regionX: 288,
        regionY: 390,
        lciDivisionY: 171,
        lciSmallX: 82,
        lciLargeX: 174,
        lciMixX: 295,
        stakeCheckY: 196,
        openX: 83,
        excellentX: 176,
        veteranX: 272,
        dogX: 252,
        bitchX: 317,
        sexCheckY: 247,
        firstTimeEntryX: 30,
        firstTimeEntryY: 425,
        changeInfoX: 30,
        changeInfoY: 467,
        checkSize: 7,
        signatureX: 230,
        signatureY: 581,
    },
    asfaDrawSheet: {
        globalXAdjust: 0,
        globalYAdjust: 0,
        checkSize: 7,
        checkWeight: 0.7,
        checkFontSize: 8,
        breedTextX: 35,
        breedTextYAdjust: 0,
        stakeTextX: 35,
        stakeTextYAdjust: 0,
        prelimCheckX: 74,
        prelimCheckY: 90,
        finalCheckX: 113,
        finalCheckY: 90,
        runoffCheckX: 183,
        runoffCheckY: 90,
        bobCheckX: 231,
        bobCheckY: 90,
        bifCheckX: 281,
        bifCheckY: 90,
    },
    alignmentLocks: {
        asfaRecordSheet: false,
        asfaJudgeSheet: false,
        asfaSecretaryReport: false,
        asfaEntryForm: false,
        asfaLciEntryForm: false,
        asfaDrawSheet: false,
    },
};

const fields = [
    'trialId',
    'trialName',
    'association',
    'clubName',
    'eventNumber',
    'startsOn',
    'endsOn',
    'trialType',
    'specialtyBreed',
    'region',
    'singlesOffered',
    'lciOffered',
    'priorityDate',
    'locationName',
    'nearestCity',
    'locationAddress',
    'locationCity',
    'locationState',
    'closingAt',
    'rollCallAt',
    'secretaryName',
    'secretaryEmail',
    'secretaryJudgesChanged',
    'secretaryPremiumChanged',
    'secretaryJudgeChangeNotes',
    'secretaryOpenVetFirstTimers',
    'secretarySinglesFirstTimers',
    'secretaryWorkingOffDismissal',
    'secretaryChangeOfInfo',
    'secretarySpecialBreederCount',
    'secretarySpecialKennelCount',
    'secretarySpecialBenchCount',
    'secretaryPerCapitaRate',
    'secretaryCheckAmount',
    'secretaryPaypalAmount',
    'secretaryPaypalTransactionId',
    'trialChair',
    'fieldClerk',
];

let trials = loadJson(storageKey);
trials = normalizeLoadedTrials(trials);
let masterHounds = loadJson(houndStorageKey);
masterHounds = normalizeLoadedHounds(masterHounds);
let masterJudges = loadJson(judgeStorageKey);
let masterWorkers = loadJson(workerStorageKey);
let formTemplateStatus = loadJson(formTemplateStatusKey);
let formAlignment = normalizeFormAlignment(loadJson(formAlignmentKey));
let entryImportTemplates = loadJson(entryImportTemplateKey);
let deletedTrials = loadJson(deletedTrialsKey);
let selectedTrialId = localStorage.getItem(activeKey) || (trials[0] && trials[0].id) || '';
let currentTab = 'setup';
let currentScoringPage = 'Prelim Scoring';
let currentWrapUpPage = 'ASFA Secretary Report';
let currentAdminPage = 'Judges & Workers';
let editingHoundId = '';
let editingEntryId = '';
let selectedEntryHoundId = '';
let selectedRunPlanRowId = '';
let selectedRunoffItemId = '';
let manualDrawEditKey = '';
let pendingScoreFocusIndex = null;
let tableSort = {};
let sqliteModeAvailable = false;
let sqliteSaveTimer = null;
let sqliteLoadComplete = false;
let lastSQLiteSaveAt = '';
let lastBrowserSaveAt = '';
let saveStatusState = 'checking';
let databaseIntegrityStatus = { status: 'checking', checkedAt: '', messages: [] };
let appVersionInfo = { version: '0.0.0', channel: 'local', releaseDate: '' };
let sqliteBackupRows = [];
let sqliteBackupListLoaded = false;
let sqliteBackupDirectory = '';
let backupSettingsLoaded = false;
let backupSettings = { maxDbBackups: 30 };
let portableStatusLoaded = false;
let portableStatusPayload = null;
let serverRuntimeInfo = { root: '', isPortableExe: false, canBuildPortable: false };
let adminBreedPlan = [];
let stagedJotformEntries = [];
let stagedJotformFiles = [];
let currentImportHeaders = [];
let currentImportRows = [];
let currentImportMapping = {};

const entryImportFieldDefinitions = [
    { key: 'callName', label: 'Call Name', aliases: ['call name', 'dog call name', 'hound call name'] },
    { key: 'registeredName', label: 'Registered Name', aliases: ['registered name', 'full name of dog', 'dog registered name', 'hound registered name'] },
    { key: 'breed', label: 'Breed', aliases: ['breed', 'dog breed', 'hound breed'] },
    { key: 'className', label: 'Stake/Class', aliases: ['stake', 'class', 'sighthound stakes', 'stake/class'] },
    { key: 'registrationNumber', label: 'Registration Number', aliases: ['registration number', 'reg #', 'akc number', 'asfa number'] },
    { key: 'registry', label: 'Registry', aliases: ['registry', 'agency', 'registration agency'] },
    { key: 'registrationType', label: 'Registration Type', aliases: ['registration type', 'reg type'] },
    { key: 'owner', label: 'Owner', aliases: ['owner', 'actual owner', 'owner name'] },
    { key: 'ownerEmail', label: 'Owner Email', aliases: ['email', 'owner email'] },
    { key: 'ownerPhone', label: 'Owner Phone', aliases: ['phone', 'phone number', 'owner phone'] },
    { key: 'handler', label: 'Handler', aliases: ['handler', 'agent', 'owner agent', 'name of owner agent handler'] },
    { key: 'trialDates', label: 'Entry Dates', aliases: ['date', 'trial date', 'entry date', 'dates'] },
    { key: 'firstTime', label: 'First-Time Entry', aliases: ['first time', 'first-time entry', 'first time entry'] },
    { key: 'certRequired', label: 'Cert/Docs Required', aliases: ['certificate', 'cert required', 'documentation', 'registration certificate'] },
    { key: 'entryNumber', label: 'Entry Number', aliases: ['entry number', 'entry #'] },
];

if (Array.isArray(formTemplateStatus) || !formTemplateStatus) {
    formTemplateStatus = {};
}

function normalizeFormAlignment(value) {
    const source = value && !Array.isArray(value) ? value : {};
    const recordSource = source.asfaRecordSheet || {};
    const migratedRecord = {
        ...recordSource,
        breedY: recordSource.breedY ?? recordSource.headerTop,
        stakeY: recordSource.stakeY ?? recordSource.headerTop,
        flightY: recordSource.flightY ?? recordSource.headerTop,
        enteredY: recordSource.enteredY ?? recordSource.enteredTop,
        refundsY: recordSource.refundsY ?? recordSource.enteredTop,
        perCapitaY: recordSource.perCapitaY ?? recordSource.enteredTop,
        callNameY: recordSource.callNameY ?? recordSource.rowTop,
        registrationY: recordSource.registrationY ?? recordSource.rowTop,
        prelimCodeY: recordSource.prelimCodeY ?? recordSource.rowTop,
        prelimJudge1Y: recordSource.prelimJudge1Y ?? recordSource.rowTop,
        prelimJudge2Y: recordSource.prelimJudge2Y ?? recordSource.rowTop,
        prelimScoreY: recordSource.prelimScoreY ?? recordSource.rowTop,
        finalCodeY: recordSource.finalCodeY ?? recordSource.rowTop,
        finalJudge1Y: recordSource.finalJudge1Y ?? recordSource.rowTop,
        finalJudge2Y: recordSource.finalJudge2Y ?? recordSource.rowTop,
        finalScoreY: recordSource.finalScoreY ?? recordSource.rowTop,
        combinedScoreY: recordSource.combinedScoreY ?? recordSource.rowTop,
        placementY: recordSource.placementY ?? recordSource.rowTop,
        footerClubY: recordSource.footerClubY ?? recordSource.footerTop,
        footerDateY: recordSource.footerDateY ?? recordSource.footerTop,
    };
    const entrySource = source.asfaEntryForm || {};
    const migratedEntry = {
        ...entrySource,
        stakeCheckY: entrySource.stakeCheckY ?? entrySource.stakeCircleY ?? defaultFormAlignment.asfaEntryForm.stakeCheckY,
        sexCheckY: entrySource.sexCheckY ?? entrySource.sexY ?? defaultFormAlignment.asfaEntryForm.sexCheckY,
    };
    const lciEntrySource = source.asfaLciEntryForm || {};
    const migratedLciEntry = {
        ...lciEntrySource,
        sexCheckY: lciEntrySource.sexCheckY ?? lciEntrySource.sexY ?? defaultFormAlignment.asfaLciEntryForm.sexCheckY,
    };
    return {
        asfaRecordSheet: {
            ...defaultFormAlignment.asfaRecordSheet,
            ...migratedRecord,
        },
        asfaJudgeSheet: {
            ...defaultFormAlignment.asfaJudgeSheet,
            ...(source.asfaJudgeSheet || {}),
        },
        asfaSecretaryReport: {
            ...defaultFormAlignment.asfaSecretaryReport,
            ...(source.asfaSecretaryReport || {}),
        },
        asfaEntryForm: {
            ...defaultFormAlignment.asfaEntryForm,
            ...migratedEntry,
        },
        asfaLciEntryForm: {
            ...defaultFormAlignment.asfaLciEntryForm,
            ...migratedLciEntry,
        },
        asfaDrawSheet: {
            ...defaultFormAlignment.asfaDrawSheet,
            ...(source.asfaDrawSheet || {}),
        },
        alignmentLocks: {
            ...defaultFormAlignment.alignmentLocks,
            ...(source.alignmentLocks || {}),
        },
    };
}

function loadJson(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
}

function normalizeLoadedTrials(rows) {
    let changed = false;
    const normalized = (Array.isArray(rows) ? rows : []).reduce((list, trial) => {
        if (!trial || typeof trial !== 'object') {
            changed = true;
            return list;
        }
        if (isBlankPlaceholderTrial(trial)) {
            changed = true;
            return list;
        }
        const id = cleanTrialId(trial.id || trial.trialId);
        if (!id) {
            changed = true;
            const repairedId = crypto.randomUUID();
            list.push({
                ...trial,
                id: repairedId,
                trialId: repairedId,
                updatedAt: trial.updatedAt || new Date().toISOString(),
            });
            return list;
        }
        if (trial.id !== id || trial.trialId !== id) {
            changed = true;
        }
        const normalizedEntries = normalizeLciEntries(trial.entries || trial.hounds || []);
        if (JSON.stringify(normalizedEntries) !== JSON.stringify(trial.entries || trial.hounds || [])) {
            changed = true;
        }
        const hasBuiltRunPlan = Array.isArray(trial.runPlan) && trial.runPlan.length > 0;
        if (hasBuiltRunPlan && !trial.runPlanEntriesFingerprint) {
            changed = true;
        }
        list.push({
            ...trial,
            id,
            trialId: id,
            entries: normalizedEntries,
            runPlanEntriesFingerprint: trial.runPlanEntriesFingerprint || (hasBuiltRunPlan ? entrySetupFingerprint(normalizedEntries) : ''),
        });
        return list;
    }, []);
    if (changed) {
        localStorage.setItem(storageKey, JSON.stringify(normalized));
    }
    return normalized;
}

function normalizeLoadedHounds(rows) {
    let changed = false;
    const normalized = (Array.isArray(rows) ? rows : []).map((hound) => {
        const next = normalizeLciHoundShape(hound);
        if (next !== hound) {
            changed = true;
        }
        return next;
    });
    if (changed) {
        localStorage.setItem(houndStorageKey, JSON.stringify(normalized));
    }
    return normalized;
}

function cleanTrialId(value) {
    const text = String(value || '').trim();
    if (!text || text === 'undefined' || text === 'null') {
        return '';
    }
    return text;
}

function isBlankPlaceholderTrial(trial) {
    return !cleanTrialId(trial.id || trial.trialId)
        && !String(trial.trialName || '').trim()
        && !String(trial.clubName || '').trim()
        && !String(trial.startsOn || '').trim()
        && !String(trial.endsOn || '').trim()
        && (!Array.isArray(trial.entries) || trial.entries.length === 0)
        && (!Array.isArray(trial.judges) || trial.judges.length === 0)
        && (!Array.isArray(trial.workers) || trial.workers.length === 0);
}

function saveTrials() {
    localStorage.setItem(storageKey, JSON.stringify(trials));
    queueBrowserSafetyBackup();
    queueSQLiteSave();
}

function saveMasterHounds() {
    localStorage.setItem(houndStorageKey, JSON.stringify(masterHounds));
    queueBrowserSafetyBackup();
    queueSQLiteSave();
}

function saveMasterJudges() {
    localStorage.setItem(judgeStorageKey, JSON.stringify(masterJudges));
    queueBrowserSafetyBackup();
    queueSQLiteSave();
}

function saveMasterWorkers() {
    localStorage.setItem(workerStorageKey, JSON.stringify(masterWorkers));
    queueBrowserSafetyBackup();
    queueSQLiteSave();
}

function saveFormTemplateStatus() {
    localStorage.setItem(formTemplateStatusKey, JSON.stringify(formTemplateStatus));
    queueBrowserSafetyBackup();
    queueSQLiteSave();
}

function saveFormAlignment() {
    formAlignment = normalizeFormAlignment(formAlignment);
    localStorage.setItem(formAlignmentKey, JSON.stringify(formAlignment));
    queueBrowserSafetyBackup();
    queueSQLiteSave();
}

function isAlignmentLocked(reportKey) {
    formAlignment = normalizeFormAlignment(formAlignment);
    return Boolean(formAlignment.alignmentLocks && formAlignment.alignmentLocks[reportKey]);
}

function saveEntryImportTemplates() {
    localStorage.setItem(entryImportTemplateKey, JSON.stringify(entryImportTemplates));
    queueBrowserSafetyBackup();
    queueSQLiteSave();
}

function saveDeletedTrials() {
    deletedTrials = Array.isArray(deletedTrials) ? deletedTrials.slice(0, 5) : [];
    localStorage.setItem(deletedTrialsKey, JSON.stringify(deletedTrials));
    queueBrowserSafetyBackup();
    queueSQLiteSave();
}

function makeBackupSnapshot() {
    return {
        app: 'Field Trial Secretary',
        version: 1,
        appVersion: appVersionInfo.version || '0.0.0',
        appVersionInfo,
        exportedAt: new Date().toISOString(),
        data: {
            trials,
            masterHounds,
            masterJudges,
            masterWorkers,
            formTemplateStatus,
            formAlignment,
            entryImportTemplates,
            deletedTrials,
            activeTrialId: localStorage.getItem(activeKey) || selectedTrialId || '',
        },
    };
}

function isLocalServerMode() {
    return ['http:', 'https:'].includes(window.location.protocol);
}

async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `Request failed: ${path}`);
    }
    return payload;
}

function renderAppVersion() {
    if (!appVersionBadge) {
        return;
    }
    const version = appVersionInfo.version || '0.0.0';
    const channel = appVersionInfo.channel && appVersionInfo.channel !== 'local' ? ` ${appVersionInfo.channel}` : '';
    appVersionBadge.textContent = `v${version}${channel}`;
    const releaseDate = appVersionInfo.releaseDate ? ` | ${appVersionInfo.releaseDate}` : '';
    appVersionBadge.title = `${appVersionInfo.name || 'Field Trial Secretary'} ${version}${releaseDate}`;
}

async function loadAppVersion() {
    try {
        const response = await fetch(isLocalServerMode() ? '/api/version' : 'version.json', { cache: 'no-store' });
        const payload = await response.json();
        const info = payload.appVersion || payload;
        if (info && typeof info === 'object') {
            appVersionInfo = { ...appVersionInfo, ...info };
        }
    } catch {
        // Keep fallback version when running from an older package or blocked file access.
    }
    renderAppVersion();
}

function hideStartupSplash() {
    if (!startupSplash) {
        return;
    }
    const elapsed = startupSplashStartedAt ? Date.now() - startupSplashStartedAt : startupSplashMinimumMs;
    const waitForMinimum = Math.max(0, startupSplashMinimumMs - elapsed);
    window.setTimeout(() => {
        if (startupSplashTimer) {
            window.clearInterval(startupSplashTimer);
            startupSplashTimer = null;
        }
        startupSplash.classList.add('hidden');
        window.setTimeout(() => {
            startupSplash.remove();
        }, 360);
    }, waitForMinimum);
}

function startStartupSplashAnimation() {
    if (!startupSplash || !startupSplashFrame || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }
    startupSplashStartedAt = Date.now();
    startupSplashFrames.forEach((src) => {
        const image = new Image();
        image.src = src;
    });
    let frameIndex = 0;
    startupSplashTimer = window.setInterval(() => {
        frameIndex = (frameIndex + 1) % startupSplashFrames.length;
        startupSplashFrame.src = startupSplashFrames[frameIndex];
    }, 145);
}

function setSaveStatus(state, detail = '') {
    saveStatusState = state;
    if (detail) {
        if (state === 'saved') {
            lastSQLiteSaveAt = detail;
        } else if (state === 'browser-saved') {
            lastBrowserSaveAt = detail;
        }
    }
    renderSaveStatus();
}

function renderSaveStatus() {
    if (!saveStatusBadge) {
        return;
    }
    saveStatusBadge.className = `save-status ${saveStatusState}`;
    if (!isLocalServerMode()) {
        saveStatusBadge.textContent = 'Browser only - start app server for SQLite protection';
        saveStatusBadge.className = 'save-status browser-only';
        return;
    }
    if (!sqliteLoadComplete || saveStatusState === 'checking') {
        saveStatusBadge.textContent = 'Checking SQLite...';
        return;
    }
    if (!sqliteModeAvailable) {
        saveStatusBadge.textContent = 'SQLite unavailable - browser backup only';
        saveStatusBadge.className = 'save-status warning';
        return;
    }
    if (saveStatusState === 'saving') {
        saveStatusBadge.textContent = 'Saving to SQLite...';
        return;
    }
    if (saveStatusState === 'error') {
        saveStatusBadge.textContent = 'Save failed - check Tools';
        return;
    }
    if (lastSQLiteSaveAt) {
        saveStatusBadge.textContent = `SQLite protected - saved ${formatTimestamp(lastSQLiteSaveAt)}`;
        return;
    }
    if (lastBrowserSaveAt) {
        saveStatusBadge.textContent = 'Browser saved - SQLite pending';
        saveStatusBadge.className = 'save-status warning';
        return;
    }
    saveStatusBadge.textContent = 'SQLite protected';
}

function renderDatabaseIntegrityStatus() {
    if (!databaseIntegrityStatusBadge) {
        return;
    }
    const status = databaseIntegrityStatus.status || 'checking';
    databaseIntegrityStatusBadge.className = `database-integrity-status ${status}`;
    if (status === 'ok') {
        databaseIntegrityStatusBadge.textContent = 'Database OK';
        databaseIntegrityStatusBadge.title = `SQLite integrity check passed${databaseIntegrityStatus.checkedAt ? ` at ${formatTimestamp(databaseIntegrityStatus.checkedAt)}` : ''}.`;
        return;
    }
    if (status === 'error') {
        databaseIntegrityStatusBadge.textContent = 'Database check failed';
        databaseIntegrityStatusBadge.title = Array.isArray(databaseIntegrityStatus.messages) && databaseIntegrityStatus.messages.length
            ? databaseIntegrityStatus.messages.join(' | ')
            : 'SQLite integrity check failed.';
        return;
    }
    if (status === 'warning') {
        databaseIntegrityStatusBadge.textContent = 'Database check unavailable';
        databaseIntegrityStatusBadge.title = 'The SQLite integrity check could not run. Use Admin Tools backups if needed.';
        return;
    }
    databaseIntegrityStatusBadge.textContent = 'Checking database...';
    databaseIntegrityStatusBadge.title = 'Running SQLite integrity check.';
}

function queueSQLiteSave() {
    lastBrowserSaveAt = new Date().toISOString();
    if (!sqliteModeAvailable || !sqliteLoadComplete) {
        renderSaveStatus();
        return;
    }
    setSaveStatus('saving');
    clearTimeout(sqliteSaveTimer);
    sqliteSaveTimer = setTimeout(() => {
        saveToSQLite().catch((error) => {
            setSaveStatus('error');
            showMessage(storageSafetyMessage || adminTestMessage, `SQLite save failed: ${error.message}`, 'warning');
        });
    }, 300);
}

async function saveToSQLite() {
    if (!sqliteModeAvailable) {
        return;
    }
    const payload = await apiRequest('/api/state', {
        method: 'POST',
        body: JSON.stringify({ state: makeBackupSnapshot() }),
    });
    setSaveStatus('saved', payload.savedToSQLiteAt || new Date().toISOString());
    if (storageSafetyMessage && currentTab === 'admintest') {
        showMessage(storageSafetyMessage, `Saved to SQLite at ${formatTimestamp(payload.savedToSQLiteAt)}.`, 'success');
    }
}

async function loadFromSQLiteIfAvailable() {
    if (!isLocalServerMode()) {
        sqliteLoadComplete = true;
        renderSaveStatus();
        return;
    }
    try {
        const payload = await apiRequest('/api/state');
        try {
            const status = await apiRequest('/api/status');
            serverRuntimeInfo = { ...serverRuntimeInfo, ...(status.runtime || {}) };
        } catch {
            serverRuntimeInfo = { root: '', isPortableExe: false, canBuildPortable: false };
        }
        sqliteModeAvailable = true;
        if (payload.state) {
            applyBackupSnapshot(payload.state);
            lastSQLiteSaveAt = payload.state.savedToSQLiteAt || payload.state.exportedAt || '';
            saveStatusState = 'saved';
        } else if (trials.length > 0 || masterHounds.length > 0 || masterJudges.length > 0 || masterWorkers.length > 0) {
            await saveToSQLite();
        } else {
            saveStatusState = 'saved';
        }
    } catch {
        sqliteModeAvailable = false;
        setSaveStatus('error');
    } finally {
        sqliteLoadComplete = true;
        renderSaveStatus();
    }
}

function flushSQLiteSaveBeforeClose() {
    if (!sqliteModeAvailable || !sqliteLoadComplete || !isLocalServerMode()) {
        return;
    }
    clearTimeout(sqliteSaveTimer);
    const body = JSON.stringify({ state: makeBackupSnapshot() });
    try {
        if (navigator.sendBeacon) {
            const blob = new Blob([body], { type: 'application/json' });
            navigator.sendBeacon('/api/state', blob);
            return;
        }
        fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
        }).catch(() => {});
    } catch {
        // Browser close flush is best-effort; normal saves and backups still protect prior changes.
    }
}

let safetyBackupTimer = null;

function queueBrowserSafetyBackup() {
    if (!window.indexedDB) {
        return;
    }
    clearTimeout(safetyBackupTimer);
    safetyBackupTimer = setTimeout(() => {
        writeBrowserSafetyBackup().catch(() => {});
    }, 200);
}

function openSafetyBackupDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('fieldTrialSecretarySafetyBackups', 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore('backups');
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function writeBrowserSafetyBackup() {
    const db = await openSafetyBackupDb();
    await new Promise((resolve, reject) => {
        const tx = db.transaction('backups', 'readwrite');
        tx.objectStore('backups').put(makeBackupSnapshot(), 'latest');
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
    db.close();
}

async function readBrowserSafetyBackup() {
    if (!window.indexedDB) {
        return null;
    }
    const db = await openSafetyBackupDb();
    const backup = await new Promise((resolve, reject) => {
        const tx = db.transaction('backups', 'readonly');
        const request = tx.objectStore('backups').get('latest');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
    db.close();
    return backup;
}

function applyBackupSnapshot(backup) {
    if (!backup || backup.app !== 'Field Trial Secretary' || !backup.data) {
        throw new Error('Invalid backup');
    }

    trials = normalizeLoadedTrials(Array.isArray(backup.data.trials) ? backup.data.trials : []);
    masterHounds = normalizeLoadedHounds(Array.isArray(backup.data.masterHounds) ? backup.data.masterHounds : []);
    masterJudges = Array.isArray(backup.data.masterJudges) ? backup.data.masterJudges : [];
    masterWorkers = Array.isArray(backup.data.masterWorkers) ? backup.data.masterWorkers : [];
    formTemplateStatus = backup.data.formTemplateStatus && !Array.isArray(backup.data.formTemplateStatus)
        ? backup.data.formTemplateStatus
        : {};
    formAlignment = normalizeFormAlignment(backup.data.formAlignment);
    entryImportTemplates = Array.isArray(backup.data.entryImportTemplates) ? backup.data.entryImportTemplates : [];
    deletedTrials = Array.isArray(backup.data.deletedTrials) ? backup.data.deletedTrials.slice(0, 5) : [];
    selectedTrialId = backup.data.activeTrialId || (trials[0] && trials[0].id) || '';

    localStorage.setItem(storageKey, JSON.stringify(trials));
    localStorage.setItem(houndStorageKey, JSON.stringify(masterHounds));
    localStorage.setItem(judgeStorageKey, JSON.stringify(masterJudges));
    localStorage.setItem(workerStorageKey, JSON.stringify(masterWorkers));
    localStorage.setItem(formTemplateStatusKey, JSON.stringify(formTemplateStatus));
    localStorage.setItem(formAlignmentKey, JSON.stringify(formAlignment));
    localStorage.setItem(entryImportTemplateKey, JSON.stringify(entryImportTemplates));
    localStorage.setItem(deletedTrialsKey, JSON.stringify(deletedTrials));
    if (selectedTrialId) {
        localStorage.setItem(activeKey, selectedTrialId);
    } else {
        localStorage.removeItem(activeKey);
    }
    queueSQLiteSave();
}

async function restoreBrowserSafetyBackup() {
    const backup = await readBrowserSafetyBackup();
    if (!backup) {
        showMessage(storageSafetyMessage, 'No browser safety backup was found.', 'warning');
        return;
    }

    const restore = await showTrialConfirm({
        title: 'Restore Safety Backup',
        eyebrow: 'Browser Backup',
        message: `Restore browser safety backup from ${formatTimestamp(backup.exportedAt)}? This replaces current browser data.`,
        primaryText: 'Restore Backup',
    });
    if (!restore) {
        return;
    }

    applyBackupSnapshot(backup);
    await writeBrowserSafetyBackup();
    showMessage(storageSafetyMessage, `Restored safety backup from ${formatTimestamp(backup.exportedAt)}.`, 'success');
    render();
}

async function createSQLiteBackup() {
    if (!sqliteModeAvailable) {
        showMessage(storageSafetyMessage, 'SQLite mode is not active. Start the app with start_field_trial_secretary.ps1 first.', 'warning');
        return;
    }
    try {
        await saveToSQLite();
        const payload = await apiRequest('/api/backup', { method: 'POST', body: '{}' });
        showMessage(storageSafetyMessage, `SQLite backup created: ${payload.backupPath}`, 'success');
        await refreshSQLiteBackupList();
    } catch (error) {
        showMessage(storageSafetyMessage, `SQLite backup failed: ${error.message}`, 'warning');
    }
}

function formatBytes(value) {
    const bytes = Number(value || 0);
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return '0 KB';
    }
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderSQLiteBackupList() {
    if (!sqliteBackupSelect) {
        return;
    }
    const current = sqliteBackupSelect.value;
    sqliteBackupSelect.innerHTML = '';
    if (!sqliteModeAvailable) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Start server mode to view backups';
        sqliteBackupSelect.appendChild(option);
        if (sqliteBackupDetails) {
            sqliteBackupDetails.textContent = 'SQLite backups are available only when the app is running from http://127.0.0.1:8765/.';
        }
        return;
    }
    if (!sqliteBackupRows.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No SQLite backups found';
        sqliteBackupSelect.appendChild(option);
        if (sqliteBackupDetails) {
            sqliteBackupDetails.textContent = sqliteBackupDirectory
                ? `No SQLite backups found in ${sqliteBackupDirectory}. Create a backup to make a restore point.`
                : 'Create a SQLite backup to make a restore point.';
        }
        return;
    }
    sqliteBackupRows.forEach((backup) => {
        const option = document.createElement('option');
        option.value = backup.fileName;
        option.textContent = `${formatTimestamp(backup.modifiedAt)} - ${formatBytes(backup.size)}`;
        sqliteBackupSelect.appendChild(option);
    });
    sqliteBackupSelect.value = sqliteBackupRows.some((backup) => backup.fileName === current) ? current : sqliteBackupRows[0].fileName;
    updateSQLiteBackupDetails();
}

function updateSQLiteBackupDetails() {
    if (!sqliteBackupDetails || !sqliteBackupSelect) {
        return;
    }
    const backup = sqliteBackupRows.find((row) => row.fileName === sqliteBackupSelect.value);
    sqliteBackupDetails.textContent = backup
        ? `${backup.fileName} | ${backup.path}`
        : 'Select a SQLite backup to restore.';
}

function renderPortableStatus(status = null) {
    if (!portablePackageStatus) {
        return;
    }
    const buildButton = document.getElementById('buildPortablePackageButton');
    if (buildButton) {
        buildButton.disabled = Boolean(serverRuntimeInfo.isPortableExe) || (sqliteModeAvailable && serverRuntimeInfo.canBuildPortable === false);
        buildButton.title = buildButton.disabled
            ? 'Build portable packages from the source folder, not from inside the portable EXE.'
            : '';
    }
    if (!sqliteModeAvailable) {
        portablePackageStatus.textContent = 'Portable status requires SQLite/server mode.';
        portablePackageStatus.className = 'backup-restore-note portable-status-note warning';
        return;
    }
    if (serverRuntimeInfo.isPortableExe) {
        portablePackageStatus.textContent = 'Running from the portable EXE. Portable EXE builds must be created from the source folder on the build computer, not from inside this portable copy.';
        portablePackageStatus.className = 'backup-restore-note portable-status-note warning';
        return;
    }
    if (!status) {
        portablePackageStatus.textContent = 'Portable status has not been checked yet.';
        portablePackageStatus.className = 'backup-restore-note portable-status-note';
        return;
    }
    const parts = [status.message || 'Portable status checked.'];
    if (status.appVersion?.version) {
        parts.push(`Version: ${status.appVersion.version}.`);
    }
    if (status.zipPath) {
        parts.push(`Zip: ${status.zipPath}`);
    }
    if (status.zipModifiedAt) {
        parts.push(`Built: ${formatTimestamp(status.zipModifiedAt)}`);
    }
    if (!status.current && status.newestAppFile) {
        parts.push(`Newest app file: ${status.newestAppFile}`);
    }
    portablePackageStatus.textContent = parts.join(' ');
    portablePackageStatus.className = `backup-restore-note portable-status-note ${status.current ? 'success' : 'warning'}`;
}

async function refreshPortableStatus(showResult = false) {
    if (!sqliteModeAvailable) {
        renderPortableStatus(null);
        return;
    }
    try {
        const payload = await apiRequest('/api/portable-status');
        portableStatusLoaded = true;
        portableStatusPayload = payload.portable || null;
        renderPortableStatus(portableStatusPayload);
        if (showResult && storageSafetyMessage) {
            showMessage(storageSafetyMessage, payload.portable?.message || 'Portable status refreshed.', payload.portable?.current ? 'success' : 'warning');
        }
    } catch (error) {
        portablePackageStatus.textContent = `Portable status failed: ${error.message}`;
        portablePackageStatus.className = 'backup-restore-note portable-status-note warning';
    }
}

async function buildPortablePackage() {
    if (!sqliteModeAvailable) {
        showMessage(storageSafetyMessage, 'Portable builds require SQLite/server mode. Start the app with start_field_trial_secretary.ps1 first.', 'warning');
        return;
    }
    if (serverRuntimeInfo.isPortableExe || !serverRuntimeInfo.canBuildPortable) {
        showMessage(storageSafetyMessage, 'This copy is running from the portable EXE. To build a new portable package, close this app and run the source-folder app from C:\\Users\\johns\\Documents\\Field Trial Secretary, then use Build Portable EXE there.', 'warning');
        renderPortableStatus(portableStatusPayload);
        return;
    }
    const proceed = await showTrialConfirm({
        title: 'Build Portable Package',
        eyebrow: 'Update EXE',
        message: 'Build only the portable EXE folder and zip from the current program files? Use Build Transfer Installer for the simpler package to move to another computer.',
        primaryText: 'Build EXE Only',
    });
    if (!proceed) {
        return;
    }
    showMessage(storageSafetyMessage, 'Building portable package. This can take a few minutes; leave the app open.', 'warning');
    try {
        await saveToSQLite();
        const payload = await apiRequest('/api/build-portable', { method: 'POST', body: '{}' });
        portableStatusLoaded = true;
        portableStatusPayload = payload.status || null;
        renderPortableStatus(portableStatusPayload);
        showMessage(storageSafetyMessage, `Portable package built: ${payload.zipPath}`, 'success');
    } catch (error) {
        showMessage(storageSafetyMessage, `Portable build failed: ${error.message}`, 'warning');
        refreshPortableStatus().catch(() => {});
    }
}

async function refreshSQLiteBackupList() {
    if (!sqliteModeAvailable || !sqliteBackupSelect) {
        sqliteBackupListLoaded = true;
        renderSQLiteBackupList();
        return;
    }
    try {
        const payload = await apiRequest('/api/database-backups');
        sqliteBackupRows = Array.isArray(payload.backups) ? payload.backups : [];
        sqliteBackupDirectory = payload.backupDir || '';
        if (payload.settings) {
            backupSettings = { ...backupSettings, ...payload.settings };
            backupSettingsLoaded = true;
            renderBackupSettings();
        }
        sqliteBackupListLoaded = true;
        renderSQLiteBackupList();
    } catch (error) {
        sqliteBackupRows = [];
        sqliteBackupListLoaded = true;
        renderSQLiteBackupList();
        showMessage(storageSafetyMessage, `Could not load SQLite backups: ${error.message}`, 'warning');
    }
}

function renderBackupSettings() {
    const input = document.getElementById('backupRetentionInput');
    const note = document.getElementById('backupRetentionNote');
    if (input) {
        input.value = String(backupSettings.maxDbBackups || 30);
    }
    if (note) {
        note.textContent = `${sqliteBackupRows.length} SQLite backup${sqliteBackupRows.length === 1 ? '' : 's'} found. Keeping the newest ${backupSettings.maxDbBackups || 30}.`;
    }
}

async function refreshBackupSettings() {
    if (!sqliteModeAvailable) {
        renderBackupSettings();
        return;
    }
    try {
        const payload = await apiRequest('/api/backup-settings');
        backupSettings = { ...backupSettings, ...(payload.settings || {}) };
        backupSettingsLoaded = true;
        renderBackupSettings();
    } catch (error) {
        showMessage(storageSafetyMessage, `Could not load backup settings: ${error.message}`, 'warning');
    }
}

async function refreshDatabaseIntegrityStatus(showResult = false) {
    if (!sqliteModeAvailable) {
        databaseIntegrityStatus = { status: 'warning', checkedAt: '', messages: ['SQLite/server mode is not active.'] };
        renderDatabaseIntegrityStatus();
        return;
    }
    databaseIntegrityStatus = { status: 'checking', checkedAt: '', messages: [] };
    renderDatabaseIntegrityStatus();
    try {
        const payload = await apiRequest('/api/database-integrity');
        databaseIntegrityStatus = payload.integrity || { status: 'warning', checkedAt: '', messages: ['No integrity status returned.'] };
        renderDatabaseIntegrityStatus();
        if (showResult) {
            showMessage(
                storageSafetyMessage,
                databaseIntegrityStatus.status === 'ok' ? 'SQLite integrity check passed.' : 'SQLite integrity check needs attention.',
                databaseIntegrityStatus.status === 'ok' ? 'success' : 'warning'
            );
        }
    } catch (error) {
        databaseIntegrityStatus = { status: 'warning', checkedAt: '', messages: [error.message] };
        renderDatabaseIntegrityStatus();
        if (showResult) {
            showMessage(storageSafetyMessage, `SQLite integrity check failed: ${error.message}`, 'warning');
        }
    }
}

async function saveBackupRetention() {
    if (!sqliteModeAvailable) {
        showMessage(storageSafetyMessage, 'SQLite mode is not active. Start the app server to save backup settings.', 'warning');
        return;
    }
    const input = document.getElementById('backupRetentionInput');
    const maxDbBackups = Number(input?.value || 30);
    try {
        const payload = await apiRequest('/api/backup-settings', {
            method: 'POST',
            body: JSON.stringify({ maxDbBackups }),
        });
        backupSettings = { ...backupSettings, ...(payload.settings || {}) };
        sqliteBackupRows = Array.isArray(payload.backups) ? payload.backups : sqliteBackupRows;
        backupSettingsLoaded = true;
        renderBackupSettings();
        renderSQLiteBackupList();
        showMessage(storageSafetyMessage, `SQLite backup limit saved. Keeping newest ${backupSettings.maxDbBackups}.`, 'success');
    } catch (error) {
        showMessage(storageSafetyMessage, `Backup limit could not be saved: ${error.message}`, 'warning');
    }
}

async function restoreSQLiteBackup() {
    if (!sqliteModeAvailable) {
        showMessage(storageSafetyMessage, 'SQLite mode is not active. Start the app with start_field_trial_secretary.ps1 first.', 'warning');
        return;
    }
    const fileName = sqliteBackupSelect?.value || '';
    const backup = sqliteBackupRows.find((row) => row.fileName === fileName);
    if (!backup) {
        showMessage(storageSafetyMessage, 'Choose a SQLite backup to restore.', 'warning');
        return;
    }
    const restore = await showTrialConfirm({
        title: 'Restore SQLite Backup',
        eyebrow: 'Replace Current Trial Data',
        message: `Restore the SQLite database from ${formatTimestamp(backup.modifiedAt)}? The app will first create a safety backup of the current database.`,
        primaryText: 'Restore SQLite',
    });
    if (!restore) {
        return;
    }
    try {
        const payload = await apiRequest('/api/restore-sqlite-backup', {
            method: 'POST',
            body: JSON.stringify({ fileName: backup.fileName }),
        });
        if (payload.state) {
            applyBackupSnapshot(payload.state);
            lastSQLiteSaveAt = payload.state.savedToSQLiteAt || new Date().toISOString();
        }
        await writeBrowserSafetyBackup();
        await refreshSQLiteBackupList();
        showMessage(storageSafetyMessage, `SQLite restored. Current database safety copy: ${payload.preRestoreBackup}`, 'success');
        render();
    } catch (error) {
        showMessage(storageSafetyMessage, `SQLite restore failed: ${error.message}`, 'warning');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || '').split(',').pop() || '');
        reader.onerror = () => reject(reader.error || new Error('File could not be read.'));
        reader.readAsDataURL(file);
    });
}

async function restoreTransferAppFiles(file) {
    if (!file) {
        return;
    }
    if (!sqliteModeAvailable) {
        showMessage(storageSafetyMessage, 'App file restore requires SQLite/server mode. Start the app with start_field_trial_secretary.ps1 first.', 'warning');
        return;
    }
    const restore = await showTrialConfirm({
        title: 'Restore App Files',
        eyebrow: 'Program Repair',
        message: 'Restore app files and templates from this transfer package? Trial data in the current SQLite database will not be replaced. The app will first create an app-file safety backup.',
        primaryText: 'Restore App Files',
    });
    if (!restore) {
        return;
    }
    try {
        await saveToSQLite();
        const contentBase64 = await fileToBase64(file);
        const payload = await apiRequest('/api/restore-transfer-app-files', {
            method: 'POST',
            body: JSON.stringify({ fileName: file.name, contentBase64 }),
        });
        showMessage(storageSafetyMessage, `Restored ${payload.restoredCount} app files. Safety backup: ${payload.preRestoreBackup}. Restart the app server, then refresh.`, 'success');
    } catch (error) {
        showMessage(storageSafetyMessage, `App file restore failed: ${error.message}`, 'warning');
    }
}

async function createTransferPackage() {
    if (!sqliteModeAvailable) {
        showMessage(storageSafetyMessage, 'Transfer installers require SQLite/server mode. Start the app with start_field_trial_secretary.ps1 first.', 'warning');
        return;
    }
    const proceed = await showTrialConfirm({
        title: 'Build Transfer Installer',
        eyebrow: 'Move To Another Computer',
        message: 'Build one installer zip with the current program, current SQLite database, and a blank starter database? The new computer will not need Python.',
        primaryText: 'Build Installer',
    });
    if (!proceed) {
        return;
    }
    showMessage(storageSafetyMessage, 'Building transfer installer. This can take a few minutes because it may rebuild the portable EXE.', 'warning');
    try {
        await saveToSQLite();
        const response = await fetch('/api/transfer-package', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: makeBackupSnapshot() }),
        });
        if (!response.ok) {
            let message = 'Transfer installer could not be created.';
            if (response.status === 404) {
                message = 'Transfer installer support is not loaded yet. Restart the app server, refresh the page, then try again.';
                throw new Error(message);
            }
            try {
                const payload = await response.json();
                message = payload.error || message;
            } catch {
                // Keep generic message.
            }
            throw new Error(message);
        }
        const blob = await response.blob();
        const disposition = response.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="([^"]+)"/);
        const filename = match ? match[1] : `field-trial-secretary-installer-${new Date().toISOString().slice(0, 10)}.zip`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        const archivePath = response.headers.get('X-Archive-Path');
        showMessage(storageSafetyMessage, archivePath ? `Transfer installer created: ${archivePath}` : 'Transfer installer created and downloaded.', 'success');
    } catch (error) {
        showMessage(storageSafetyMessage, error.message || 'Transfer installer could not be created.', 'warning');
    }
}

async function createProgramUpdatePackage() {
    if (!sqliteModeAvailable) {
        showMessage(storageSafetyMessage, 'Program update packages require SQLite/server mode. Start the app with start_field_trial_secretary.ps1 first.', 'warning');
        return;
    }
    const proceed = await showTrialConfirm({
        title: 'Create Program Update Package',
        eyebrow: 'Update Existing Computer',
        message: 'Build a smaller update zip for a computer that already has Field Trial Secretary installed? This package updates program files only and does not include the live SQLite database.',
        primaryText: 'Build Update',
    });
    if (!proceed) {
        return;
    }
    showMessage(storageSafetyMessage, 'Building program update package. This may rebuild the portable EXE first.', 'warning');
    try {
        await saveToSQLite();
        const response = await fetch('/api/program-update-package', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
        });
        if (!response.ok) {
            let message = 'Program update package could not be created.';
            try {
                const payload = await response.json();
                message = payload.error || message;
            } catch {
                // Keep generic message.
            }
            throw new Error(message);
        }
        const blob = await response.blob();
        const disposition = response.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="([^"]+)"/);
        const filename = match ? match[1] : `field-trial-secretary-program-update-${new Date().toISOString().slice(0, 10)}.zip`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        const archivePath = response.headers.get('X-Archive-Path');
        showMessage(storageSafetyMessage, archivePath ? `Program update package created: ${archivePath}` : 'Program update package created and downloaded.', 'success');
    } catch (error) {
        showMessage(storageSafetyMessage, error.message || 'Program update package could not be created.', 'warning');
    }
}

async function restartAppServer() {
    if (!sqliteModeAvailable) {
        showMessage(storageSafetyMessage, 'Server restart requires SQLite/server mode. Start the app with start_field_trial_secretary.ps1 first.', 'warning');
        return;
    }
    const restart = await showTrialConfirm({
        title: 'Restart App Server',
        eyebrow: 'Local Server',
        message: 'Restart the app server now? Save any active edits first. The page may be unavailable for a few seconds.',
        primaryText: 'Restart Server',
    });
    if (!restart) {
        return;
    }
    try {
        await saveToSQLite();
        const payload = await apiRequest('/api/restart', { method: 'POST', body: '{}' });
        showMessage(storageSafetyMessage, `${payload.message || 'Restarting app server.'} Wait 5 seconds, then refresh this page.`, 'success');
        setTimeout(() => {
            showMessage(storageSafetyMessage, 'The app server should be back. Refresh the page if it has not reconnected.', 'success');
        }, 5500);
    } catch (error) {
        showMessage(storageSafetyMessage, `Restart failed: ${error.message}`, 'warning');
    }
}

function showAppClosedScreen(message) {
    const existing = document.getElementById('appClosedScreen');
    if (existing) {
        existing.querySelector('p').textContent = message;
        return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'app-closed-screen';
    overlay.id = 'appClosedScreen';
    overlay.innerHTML = `
        <div>
            <h2>Field Trial Secretary Is Closed</h2>
            <p></p>
            <strong>You can close this browser tab.</strong>
        </div>
    `;
    overlay.querySelector('p').textContent = message;
    document.body.appendChild(overlay);
}

async function exitAppServer() {
    if (!sqliteModeAvailable) {
        showMessage(storageSafetyMessage || adminTestMessage, 'This browser view is not connected to the local app server, so the app cannot close itself here. Close this browser tab when you are finished.', 'warning');
        return;
    }
    const exit = await showTrialConfirm({
        title: 'Exit Field Trial Secretary',
        eyebrow: 'Local Server',
        message: 'Save your current data and close the local Field Trial Secretary app server now?',
        primaryText: 'Save and Exit',
    });
    if (!exit) {
        return;
    }
    try {
        await saveToSQLite();
        const payload = await apiRequest('/api/shutdown', { method: 'POST', body: '{}' });
        showAppClosedScreen(payload.message || 'Field Trial Secretary has stopped.');
    } catch (error) {
        showMessage(storageSafetyMessage || adminTestMessage, `Exit failed: ${error.message}`, 'warning');
    }
}

function goToArchiveTrialSection() {
    currentWrapUpPage = 'Archive Trial';
    switchTab('wrapup');
    requestAnimationFrame(() => {
        const section = [...document.querySelectorAll('.form-section[data-tab="wrapup"]')]
            .find((candidate) => candidate.querySelector('h2, h3')?.textContent === 'Archive Trial');
        if (section) {
            scrollToElement(section, { offset: scrollOffset() + 10 });
        }
    });
}

function exportDataBackup() {
    const backup = makeBackupSnapshot();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `field-trial-secretary-data-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    showMessage(adminTestMessage, 'Data backup exported. Keep it with the program folder backup.', 'success');
}

function importDataBackup(file) {
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const backup = JSON.parse(reader.result);
            if (!backup || backup.app !== 'Field Trial Secretary' || !backup.data) {
                throw new Error('Invalid backup file');
            }

            const proceed = await showTrialConfirm({
                title: 'Import Backup',
                eyebrow: 'Replace Current Data',
                message: 'Importing this backup will replace the trial data currently stored in this browser. Continue?',
                primaryText: 'Import Backup',
            });
            if (!proceed) {
                return;
            }

            applyBackupSnapshot(backup);
            writeBrowserSafetyBackup().catch(() => {});

            showMessage(adminTestMessage, `Imported backup with ${trials.length} trial${trials.length === 1 ? '' : 's'} and ${masterHounds.length} hound${masterHounds.length === 1 ? '' : 's'}.`, 'success');
            render();
        } catch (error) {
            showMessage(adminTestMessage, 'That backup file could not be imported.', 'warning');
        }
    };
    reader.readAsText(file);
}

function readForm() {
    const data = {};

    fields.forEach((field) => {
        const element = document.getElementById(field);
        data[field] = element.type === 'checkbox' ? element.checked : element.value.trim();
    });

    const existing = getSelectedTrial();
    data.id = cleanTrialId(data.trialId) || (existing && cleanTrialId(existing.id)) || crypto.randomUUID();
    data.trialId = data.id;
    data.updatedAt = new Date().toISOString();
    data.documentsReady = readCheckedValues('documentOptions');
    data.entries = normalizeLciEntries(getSelectedArray('entries'));
    if (data.entries.length === 0) {
        data.entries = normalizeLciEntries(getSelectedArray('hounds'));
    }
    data.classesOffered = deriveClassesFromEntries(data.entries, existing ? existing.classesOffered : []);
    data.breedsOffered = deriveBreedsFromEntries(data.entries, existing ? existing.breedsOffered : '');
    data.judges = getSelectedArray('judges');
    data.workers = getSelectedArray('workers');
    data.runPlan = getSelectedArray('runPlan');
    data.runPlanEntriesFingerprint = existing && existing.runPlanEntriesFingerprint ? existing.runPlanEntriesFingerprint : '';
    data.preliminaryDraw = existing && existing.preliminaryDraw ? existing.preliminaryDraw : null;
    data.scorebook = existing && existing.scorebook ? existing.scorebook : { prelimComplete: false };
    data.runoffOrder = existing && Array.isArray(existing.runoffOrder) ? existing.runoffOrder : [];
    data.bobRunoffs = existing && Array.isArray(existing.bobRunoffs) ? existing.bobRunoffs : [];
    data.bobRunoffOutcomes = existing && existing.bobRunoffOutcomes ? existing.bobRunoffOutcomes : {};
    data.resultState = existing && existing.resultState ? existing.resultState : {};
    data.printStatus = existing && existing.printStatus ? existing.printStatus : {};
    data.printStatusFingerprints = existing && existing.printStatusFingerprints ? existing.printStatusFingerprints : {};
    data.ownerSeparationReviewedAt = existing && existing.ownerSeparationReviewedAt ? existing.ownerSeparationReviewedAt : '';
    data.mixedStakeBreeds = existing && Array.isArray(existing.mixedStakeBreeds) ? existing.mixedStakeBreeds : [];
    data.premiumJudgeAssignments = existing && existing.premiumJudgeAssignments ? existing.premiumJudgeAssignments : null;
    data.rollCallSort = document.getElementById('rollCallSort')?.value || 'breedClass';
    data.archivedAt = existing && existing.archivedAt ? existing.archivedAt : '';
    data.archivePackageName = existing && existing.archivePackageName ? existing.archivePackageName : '';
    data.archivePackagePath = existing && existing.archivePackagePath ? existing.archivePackagePath : '';
    data.archiveUnlockedAt = existing && existing.archiveUnlockedAt ? existing.archiveUnlockedAt : '';
    data.paperworkSubmittedAt = existing && existing.paperworkSubmittedAt ? existing.paperworkSubmittedAt : '';

    return data;
}

function writeForm(trial) {
    if (trial && normalizeTrialDerivedState(trial)) {
        upsertTrial(trial);
        saveTrials();
    }

    fields.forEach((field) => {
        const element = document.getElementById(field);
        const value = trial ? trial[field] : '';

        if (element.type === 'checkbox') {
            element.checked = Boolean(value);
            return;
        }

        element.value = value || '';
    });

    document.getElementById('trialId').value = trial ? trial.id : '';
    if (document.getElementById('rollCallSort')) {
        document.getElementById('rollCallSort').value = trial && trial.rollCallSort ? trial.rollCallSort : 'breedClass';
    }
    writeCheckedValues('documentOptions', trial ? trial.documentsReady : []);
    renderClassOptions(trial);
    renderRosterTables(trial || {});
    renderRollCall(trial || {});
    renderChecklist(trial);
    renderOfficialForms(trial);
    renderScorebook(trial || {});
    renderRunoffBoard(trial || {});
    renderBifBieCheck(trial || {});
    renderSecretaryFeeSummary(trial || {});
    renderAdminTools();
}

function renderSecretaryFeeSummary(trial) {
    const container = document.getElementById('secretaryFeeSummary');
    if (!container) {
        return;
    }
    const summary = calculateSecretaryFees(trial || {});
    container.innerHTML = '';
    [
        ['Breed entries', summary.breedEntries],
        ['Per-capita rate', currency(summary.rate)],
        ['Breed per capita', currency(summary.breedFee)],
        ['Special stakes', currency(summary.specialFee)],
        ['Records fee', currency(summary.recordsFee)],
        ['Total due', currency(summary.totalDue)],
        ['Paid', currency(summary.paid)],
        ['Remaining', currency(summary.remaining)],
    ].forEach(([label, value]) => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        const strong = document.createElement('strong');
        strong.textContent = value;
        const span = document.createElement('span');
        span.textContent = label;
        card.append(strong, span);
        container.appendChild(card);
    });
}

function calculateSecretaryFees(trial) {
    const dismissedEntryIds = secretaryDismissedEntryIds(trial || {});
    const breedEntries = (trial.entries || []).filter((entry) => secretaryEntryCountsForPerCapita(entry, dismissedEntryIds)).length;
    const rate = Number(trial.secretaryPerCapitaRate || 4);
    const specialTotal = positiveNumber(trial.secretarySpecialBreederCount)
        + positiveNumber(trial.secretarySpecialKennelCount)
        + positiveNumber(trial.secretarySpecialBenchCount);
    const recordsFee = 15;
    const breedFee = breedEntries * rate;
    const specialFee = specialTotal;
    const totalDue = breedFee + specialFee + recordsFee;
    const paid = positiveNumber(trial.secretaryCheckAmount) + positiveNumber(trial.secretaryPaypalAmount);
    return {
        breedEntries,
        rate,
        breedFee,
        specialFee,
        recordsFee,
        totalDue,
        paid,
        remaining: Math.max(0, totalDue - paid),
    };
}

function secretaryPaymentStatus(trial) {
    const summary = calculateSecretaryFees(trial || {});
    const checkPaid = positiveNumber((trial || {}).secretaryCheckAmount);
    const paypalPaid = positiveNumber((trial || {}).secretaryPaypalAmount);
    const paypalId = String((trial || {}).secretaryPaypalTransactionId || '').trim();
    const paidEnough = summary.totalDue > 0 && summary.remaining <= 0.005;
    const hasPaymentMethod = checkPaid > 0 || paypalPaid > 0;
    if (!hasPaymentMethod || !paidEnough) {
        return {
            done: false,
            attention: true,
            detail: `Pay trial fees to treasurer@asfa.org via PayPal or record a check payment. Remaining: ${currency(summary.remaining)}.`,
        };
    }
    if (paypalPaid > 0 && !paypalId) {
        return {
            done: false,
            attention: true,
            detail: 'PayPal amount is entered. Add the PayPal transaction ID before the Secretary Report is complete.',
        };
    }
    return {
        done: true,
        attention: false,
        detail: checkPaid > 0
            ? `Trial fees are marked paid by check: ${currency(checkPaid)}.`
            : `Trial fees are marked paid by PayPal: ${currency(paypalPaid)}.`,
    };
}

function secretaryEntryCountsForPerCapita(entry, dismissedEntryIds = new Set()) {
    const status = clean(entry.rollCallStatus);
    const notes = clean(entry.rollCallNotes);
    if (['LAME', 'INSEASON', 'SEASON', 'BREEDDQ', 'BREEDDISQUALIFIED', 'SCRATCHED', 'SCRATCH'].includes(status)) {
        return false;
    }
    if (['LAME', 'INSEASON', 'SEASON', 'BREEDDQ', 'BREEDDISQUALIFIED', 'SCRATCHED', 'SCRATCH'].some((value) => notes.includes(value))) {
        return false;
    }
    return !dismissedEntryIds.has(String(entry.id || ''));
}

function secretaryDismissedEntryIds(trial) {
    const dismissed = new Set();
    (((trial.preliminaryDraw || {}).groups || [])).forEach((group) => {
        (group.courses || []).forEach((course) => {
            (course.hounds || []).forEach((hound) => {
                if (rowOutcomeIsDismissed(hound.prelimOutcome)) {
                    dismissed.add(String(hound.entryId || ''));
                }
            });
        });
        (((group.finalDraw || {}).courses || [])).forEach((course) => {
            (course.hounds || []).forEach((hound) => {
                if (rowOutcomeIsDismissed(hound.finalOutcome)) {
                    dismissed.add(String(hound.entryId || ''));
                }
            });
        });
    });
    dismissed.delete('');
    return dismissed;
}

function rowOutcomeIsDismissed(outcome) {
    return clean(outcome) === 'DIS' || clean(outcome) === 'DISMISSED';
}

function positiveNumber(value) {
    const numeric = Number(value || 0);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function currency(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

function normalizeTrialDerivedState(trial) {
    return recalculateTrialResults(trial);
}

function populateBreedSelects() {
    ['masterBreed', 'entryBreed'].forEach((id) => {
        const select = document.getElementById(id);
        if (!select) {
            return;
        }
        const current = select.value;
        select.innerHTML = '';
        breedOptions.forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = breedOptionLabel(value, label);
            select.appendChild(option);
        });
        lciDivisions.forEach((division) => {
            const option = document.createElement('option');
            option.value = division;
            option.textContent = division;
            select.appendChild(option);
        });
        select.value = current || '';
    });
    populateAdminPlanBreedSelect();
}

function renderAdminTools() {
    populateAdminPlanClassSelect();
    renderAdminBreedPlan();
    renderAdminDeleteTrials();
    renderDeletedTrials();
    renderBackupSettings();
    renderSQLiteBackupList();
    if (sqliteModeAvailable && currentTab === 'admin' && currentAdminPage === 'Tools' && !backupSettingsLoaded) {
        refreshBackupSettings();
    }
    if (sqliteModeAvailable && currentTab === 'admin' && currentAdminPage === 'Tools' && !sqliteBackupListLoaded) {
        refreshSQLiteBackupList();
    }
    if (sqliteModeAvailable && currentTab === 'admin' && currentAdminPage === 'Tools' && !portableStatusLoaded) {
        refreshPortableStatus();
    } else {
        renderPortableStatus(portableStatusPayload);
    }
}

function populateAdminPlanBreedSelect() {
    const select = document.getElementById('adminPlanBreed');
    if (!select) {
        return;
    }
    const current = select.value;
    select.innerHTML = '';
    breedOptions.forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value ? breedOptionLabel(value, label) : 'Run group / breed';
        select.appendChild(option);
    });
    lciDivisions.forEach((division) => {
        const option = document.createElement('option');
        option.value = division;
        option.textContent = division;
        select.appendChild(option);
    });
    const singles = document.createElement('option');
    singles.value = 'Singles';
    singles.textContent = 'Singles';
    select.appendChild(singles);
    select.value = [...breedOptions.map(([value]) => value), ...lciDivisions, 'Singles'].includes(current) ? current : '';
}

function populateAdminPlanClassSelect() {
    const select = document.getElementById('adminPlanClass');
    if (!select) {
        return;
    }
    const current = select.value;
    const runGroup = document.getElementById('adminPlanBreed')?.value || '';
    const options = lciDivisions.includes(runGroup)
        ? lciStakes
        : clean(runGroup) === 'SINGLES'
            ? ['Singles']
            : ['Open', 'Field Champion', 'Veteran', 'Singles'];
    select.innerHTML = '';
    options.forEach((className) => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        select.appendChild(option);
    });
    select.value = options.includes(current) ? current : options[0];
}

function renderAdminBreedPlan() {
    const body = document.getElementById('adminPlanTable');
    if (!body) {
        return;
    }

    body.innerHTML = '';
    if (adminBreedPlan.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.textContent = 'No custom groups yet. Create Test Trial will randomly choose breed/stake groups unless you add specific ones here.';
        tr.appendChild(td);
        body.appendChild(tr);
        return;
    }

    adminBreedPlan.forEach((row) => {
        const tr = document.createElement('tr');
        tr.appendChild(textCell(adminPlanGroupLabel(row.breed)));
        tr.appendChild(textCell(row.className));
        tr.appendChild(textCell(row.count));
        const actions = document.createElement('td');
        actions.className = 'row-actions';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'text-button danger';
        remove.textContent = 'Remove';
        remove.addEventListener('click', () => {
            adminBreedPlan = adminBreedPlan.filter((item) => item.id !== row.id);
            renderAdminBreedPlan();
        });
        actions.appendChild(remove);
        tr.appendChild(actions);
        body.appendChild(tr);
    });
}

function renderAdminDeleteTrials() {
    const select = document.getElementById('adminDeleteTrial');
    if (!select) {
        return;
    }

    const current = select.value;
    select.innerHTML = '';
    trials.forEach((trial) => {
        const option = document.createElement('option');
        option.value = trial.id;
        option.textContent = `${trial.trialName || 'Untitled trial'} | ${formatDateRange(trial.startsOn, trial.endsOn) || 'No date'}`;
        select.appendChild(option);
    });
    select.value = trials.some((trial) => trial.id === current) ? current : (trials[0] && trials[0].id) || '';
}

function renderDeletedTrials() {
    const body = document.getElementById('deletedTrialsTable');
    if (!body) {
        return;
    }
    body.innerHTML = '';
    if (!Array.isArray(deletedTrials) || deletedTrials.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.textContent = 'No deleted trials are available to recover.';
        tr.appendChild(td);
        body.appendChild(tr);
        return;
    }
    deletedTrials.forEach((record) => {
        const trial = record.trial || {};
        const tr = document.createElement('tr');
        tr.appendChild(textCell(formatTimestamp(record.deletedAt)));
        tr.appendChild(textCell(trial.trialName || 'Untitled trial'));
        tr.appendChild(textCell(formatDateRange(trial.startsOn, trial.endsOn) || 'No date'));
        const action = document.createElement('td');
        const restore = document.createElement('button');
        restore.type = 'button';
        restore.className = 'text-button';
        restore.textContent = 'Restore';
        restore.addEventListener('click', () => restoreDeletedTrial(record.id));
        action.appendChild(restore);
        tr.appendChild(action);
        body.appendChild(tr);
    });
}

function breedLabel(code) {
    const match = breedOptions.find(([value]) => value === code);
    return match ? breedOptionLabel(match[0], match[1]) : code;
}

function breedDisplayCode(code) {
    const cleaned = clean(code);
    return asfaJudgeSheetBreedCodes[cleaned] || code;
}

function displayBreedCode(code) {
    if (!code || isQuasiBreedClass(code)) {
        return code || '';
    }
    return breedDisplayCode(code);
}

function breedOptionLabel(value, label) {
    if (!value) {
        return label;
    }
    const displayCode = breedDisplayCode(value);
    return `${displayCode} - ${label}`;
}

function adminPlanGroupLabel(value) {
    if (lciDivisions.includes(value) || clean(value) === 'SINGLES') {
        return value;
    }
    return value ? breedLabel(value) : 'Run group / breed';
}

function saveCurrentTrial(options = {}) {
    const trial = readForm();
    const problem = validateTrialBasics(trial);

    if (problem && !options.silent) {
        showMessage(formMessage, problem, 'warning');
        return null;
    }

    upsertTrial(trial);

    if (!options.silent) {
        showMessage(formMessage, 'Trial saved.', 'success');
    }

    render();
    return trial;
}

function validateTrialBasics(trial) {
    if (!trial.trialName) {
        return 'Trial name is required.';
    }

    if (!trial.clubName) {
        return 'Club is required.';
    }

    if (trial.startsOn && trial.endsOn && trial.endsOn < trial.startsOn) {
        return 'End date cannot be before start date.';
    }

    if (trial.trialType === 'specialty' && !trial.specialtyBreed) {
        return 'Specialty trials need a specialty breed.';
    }

    return '';
}

function upsertTrial(trial) {
    recalculateTrialResults(trial);
    const index = trials.findIndex((item) => item.id === trial.id);

    if (index >= 0) {
        trials[index] = trial;
    } else {
        trials.unshift(trial);
    }

    selectedTrialId = trial.id;
    saveTrials();
}

function setActiveTrial(id) {
    if (!id) {
        return;
    }
    const trial = trials.find((item) => item.id === id);
    if (trial && trial.archivedAt) {
        showMessage(formMessage, 'Archived trials cannot be set active. Unlock the trial first if you need to work on it again.', 'warning');
        return;
    }

    localStorage.setItem(activeKey, id);
    selectedTrialId = id;
    queueSQLiteSave();
    render();
}

function selectTrial(id) {
    if (isActiveTrialLocked() && id !== getActiveTrialId()) {
        const lockedTrial = trials.find((trial) => trial.id === getActiveTrialId());
        showMessage(formMessage, `${lockedTrial ? lockedTrial.trialName || 'The active trial' : 'The active trial'} is locked active. Unlock it before switching trials.`, 'warning');
        return;
    }
    selectedTrialId = id;
    clearMessages();
    render();
}

function getActiveTrialId() {
    return localStorage.getItem(activeKey) || '';
}

function isActiveTrialLocked() {
    return localStorage.getItem(activeLockKey) === 'true' && Boolean(getActiveTrialId());
}

function setActiveTrialLocked(locked) {
    if (locked) {
        localStorage.setItem(activeLockKey, 'true');
    } else {
        localStorage.removeItem(activeLockKey);
    }
}

function toggleSelectedActiveTrialLock() {
    if (isActiveTrialLocked()) {
        setActiveTrialLocked(false);
        showMessage(formMessage, 'Active trial unlocked. You can switch trials again.', 'success');
        render();
        return;
    }

    const trial = getSelectedTrial();
    if (!trial) {
        showMessage(formMessage, 'Select a trial first.', 'warning');
        return;
    }
    if (trial.archivedAt) {
        showMessage(formMessage, 'Archived trials cannot be locked active. Unlock the archived trial first if you need to work on it.', 'warning');
        return;
    }
    setActiveTrial(trial.id);
    setActiveTrialLocked(true);
    showMessage(formMessage, `${trial.trialName || 'Selected trial'} is locked active. Unlock it before switching trials.`, 'success');
    render();
}

function startNewTrial() {
    selectedTrialId = '';
    clearMessages();
    form.reset();
    document.getElementById('trialId').value = '';
    document.getElementById('association').value = 'ASFA';
    document.getElementById('trialType').value = 'all_breed';
    writeForm(null);
    switchTab('setup');
}

function renderTrialList() {
    const activeId = getActiveTrialId();
    const locked = isActiveTrialLocked();
    trialList.innerHTML = '';

    const showArchived = Boolean(showArchivedTrials && showArchivedTrials.checked);
    const visibleTrials = trials
        .filter((trial) => showArchived || !trial.archivedAt)
        .sort(compareTrialsByDateThenName);

    if (visibleTrials.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = trials.length === 0 ? 'No trials yet.' : 'No active trials. Turn on Show archived to view archived trials.';
        trialList.appendChild(empty);
        return;
    }

    visibleTrials.forEach((trial) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `trial-card ${trial.id === selectedTrialId ? 'active' : ''} ${trial.archivedAt ? 'archived' : ''}`;
        button.addEventListener('click', () => selectTrial(trial.id));

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = trial.trialName || 'Untitled trial';

        const meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = [trial.association, formatDateRange(trial.startsOn, trial.endsOn), trial.locationCity]
            .filter(Boolean)
            .join(' | ');

        button.append(name, meta);

        if (trial.id === activeId) {
            const flag = document.createElement('span');
            flag.className = 'active-flag';
            flag.textContent = 'Active';
            button.appendChild(flag);
        }
        if (locked && trial.id === activeId) {
            const flag = document.createElement('span');
            flag.className = 'active-flag locked-flag';
            flag.textContent = 'Locked';
            button.appendChild(flag);
        }
        if (trial.archivedAt) {
            const flag = document.createElement('span');
            flag.className = 'active-flag archive-flag';
            flag.textContent = 'Archived';
            button.appendChild(flag);
        }

        trialList.appendChild(button);
    });
}

function compareTrialsByDateThenName(a, b) {
    const dateA = trialSortDate(a);
    const dateB = trialSortDate(b);
    if (dateA !== dateB) {
        return dateA - dateB;
    }
    return String(a.trialName || '').localeCompare(String(b.trialName || ''), undefined, { numeric: true, sensitivity: 'base' });
}

function trialSortDate(trial) {
    const value = trial && (trial.startsOn || trial.endsOn);
    if (!value) {
        return Number.MAX_SAFE_INTEGER;
    }
    const timestamp = Date.parse(`${value}T00:00:00`);
    return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

function renderActiveBadge() {
    const activeId = getActiveTrialId();
    const activeTrial = trials.find((trial) => trial.id === activeId);
    const selectedTrial = trials.find((trial) => trial.id === selectedTrialId);
    const displayTrial = selectedTrial && selectedTrial.archivedAt ? selectedTrial : activeTrial;
    const locked = isActiveTrialLocked();
    const label = displayTrial
        ? `${displayTrial.archivedAt ? 'Read-only archived trial: ' : ''}${locked && !displayTrial.archivedAt ? 'Locked active trial: ' : ''}${displayTrial.trialName || 'Untitled trial'} | ${formatDateRange(displayTrial.startsOn, displayTrial.endsOn) || 'Dates not set'}`
        : 'No trial selected';
    const statusLabel = displayTrial && displayTrial.archivedAt
        ? 'Archived Trial'
        : locked ? 'Locked Active Trial' : 'Active Trial';

    activeTrialBadge.querySelector('.label').textContent = statusLabel;
    activeTrialBadge.querySelector('strong').textContent = label;
    if (setSelectedActiveButton) {
        setSelectedActiveButton.textContent = locked ? 'Unlock Active Trial' : 'Lock Active Trial';
    }
    if (setActiveButton) {
        const selectedIsActive = selectedTrial && selectedTrial.id === activeId;
        setActiveButton.textContent = selectedIsActive ? 'Active Trial' : 'Set Selected Active';
        setActiveButton.disabled = !selectedTrial || selectedIsActive || Boolean(selectedTrial.archivedAt);
    }
}

function renderWorkflowStrip(trial) {
    if (!workflowStrip) {
        return;
    }

    const step = nextWorkflowStep(trial);
    workflowStrip.innerHTML = '';
    workflowStrip.dataset.defaultLabel = step.label;
    workflowStrip.dataset.defaultDetail = step.detail;

    const text = document.createElement('span');
    text.className = 'workflow-help-text';
    text.innerHTML = `<strong>${step.label}</strong> ${step.detail}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary small';
    button.textContent = step.action;
    button.dataset.help = `Jump to ${step.tab} to work on the next recommended step.`;
    button.addEventListener('click', () => goToWorkflowStep(step));
    workflowStrip.append(text, button);
}

function setWorkflowHelp(label, detail) {
    if (!workflowStrip) {
        return;
    }
    const text = workflowStrip.querySelector('.workflow-help-text');
    if (!text) {
        return;
    }
    text.innerHTML = `<strong>${label}</strong> ${detail}`;
    workflowStrip.classList.toggle('showing-help', label === 'Help:');
}

function restoreWorkflowHelp() {
    if (!workflowStrip) {
        return;
    }
    setWorkflowHelp(workflowStrip.dataset.defaultLabel || 'Next:', workflowStrip.dataset.defaultDetail || 'continue the current workflow.');
}

function helpForButton(button) {
    if (!button) {
        return '';
    }
    if (button.dataset.help) {
        return button.dataset.help;
    }
    if (button.id && buttonHelpText[button.id]) {
        return buttonHelpText[button.id];
    }
    const label = String(button.textContent || '').trim();
    const byLabel = {
        'Draw Finals Stake': 'Draws the finals course and blanket colors for this one run group after preliminary scoring is complete.',
        'ReDraw Finals Stake': 'Rebuilds the finals course and blanket colors for this one run group. Use only when something changed.',
        'Draw Finals Breed': 'Draws finals for every completed stake in this breed or quasi-breed group.',
        'ReDraw Finals Breed': 'Rebuilds finals draws for every completed stake in this breed or quasi-breed group. Use only when something changed.',
        'Draw Finals Group': 'Draws finals for every completed stake in this Singles or LCI group.',
        'ReDraw Finals Group': 'Rebuilds finals draws for every completed stake in this Singles or LCI group. Use only when something changed.',
        'ASFA Stake Sheet': 'Creates the ASFA record sheet for this one stake so it can be printed and posted.',
        'ASFA Breed Sheet': 'Creates ASFA record sheets for all stakes in this breed.',
        'Finals Judge Sheets': 'Creates judge sheets for this stake from the finals draw.',
        'Preview Record Sheet': 'Generates a preview of the ASFA record sheet using the current alignment settings.',
        'Preview Judge Sheet': 'Generates a preview of the ASFA judge sheet using the current alignment settings.',
        'Reset': 'Restores this form alignment tool to its default positions.',
    };
    if (byLabel[label]) {
        return byLabel[label];
    }
    return label ? `${label}: runs this action for the current trial area.` : '';
}

function nextWorkflowStep(trial) {
    const step = nextTrialGuideStep(trialGuideSteps(trial));
    if (!step) {
        return {
            label: 'Next:',
            detail: 'all guide items are complete for this trial.',
            action: 'Go To Wrap Up',
            tab: 'wrapup',
        };
    }
    return {
        ...step,
        label: 'Next:',
        detail: step.detail,
        action: step.action,
        tab: step.tab,
    };
}

function goToWorkflowStep(step) {
    if (!step) {
        return;
    }
    if (step.scoringPage) {
        currentScoringPage = step.scoringPage;
    }
    if (step.wrapUpPage) {
        currentWrapUpPage = step.wrapUpPage;
    }
    if (step.adminPage) {
        currentAdminPage = step.adminPage;
    }
    switchTab(step.tab || 'setup');
    if (step.sectionTitle) {
        requestAnimationFrame(() => scrollToWorkflowSection(step));
    }
}

function scrollToWorkflowSection(step) {
    const section = [...document.querySelectorAll(`.form-section[data-tab="${step.tab}"]`)]
        .find((candidate) => {
            const heading = candidate.querySelector('h2, h3');
            return heading && heading.textContent.trim() === step.sectionTitle;
        });
    if (!section) {
        return;
    }
    if (!['scoring', 'wrapup'].includes(step.tab)) {
        [...document.querySelectorAll('.sub-tab-button')].forEach((button) => {
            const active = button.textContent.trim() === step.sectionTitle;
            button.classList.toggle('active', active);
            if (active) {
                button.setAttribute('aria-current', 'page');
            } else {
                button.removeAttribute('aria-current');
            }
        });
    }
    scrollToElement(section, { offset: scrollOffset() + 10 });
    if (step.targetSelector) {
        requestAnimationFrame(() => {
            const target = document.querySelector(step.targetSelector);
            if (target) {
                scrollToElement(target, { offset: scrollOffset() + 18 });
                if (typeof target.focus === 'function') {
                    target.focus({ preventScroll: true });
                }
            }
        });
    }
}

function stepStatus(done, ready) {
    if (done) {
        return 'done';
    }
    return ready ? 'ready' : 'blocked';
}

function attentionStatus(done, ready, attention) {
    if (attention) {
        return 'attention';
    }
    return stepStatus(done, ready);
}

function entrySetupFingerprint(entries = []) {
    return JSON.stringify((entries || [])
        .map((entry) => ({
            id: entry.id || '',
            houndId: entry.houndId || '',
            callName: entry.callName || '',
            breed: runGroupBreedForEntry(entry),
            className: entry.className || entry.stake || '',
            registrationNumber: entry.registrationNumber || '',
        }))
        .sort((a, b) => `${a.id}|${a.houndId}|${a.callName}`.localeCompare(`${b.id}|${b.houndId}|${b.callName}`, undefined, { numeric: true, sensitivity: 'base' })));
}

function entryDrawFingerprint(entries = []) {
    return JSON.stringify((entries || [])
        .map((entry) => ({
            id: entry.id || '',
            houndId: entry.houndId || '',
            breed: runGroupBreedForEntry(entry),
            className: entry.className || entry.stake || '',
            rollCallStatus: entry.rollCallStatus || '',
            ownerSeparationRequested: Boolean(entry.ownerSeparationRequested || entry.separateOwnerHounds),
            ownerSeparationGroup: entry.ownerSeparationGroup || '',
        }))
        .sort((a, b) => `${a.id}|${a.houndId}`.localeCompare(`${b.id}|${b.houndId}`, undefined, { numeric: true, sensitivity: 'base' })));
}

function entriesChangedAfterRunPlan(trial) {
    return Boolean(trial && trial.runPlanEntriesFingerprint && entrySetupFingerprint(trial.entries || []) !== trial.runPlanEntriesFingerprint);
}

function entriesChangedAfterPreliminaryDraw(trial) {
    return Boolean(trial && trial.preliminaryDraw && trial.preliminaryDraw.entriesFingerprint && entryDrawFingerprint(trial.entries || []) !== trial.preliminaryDraw.entriesFingerprint);
}

function entriesChangedAfterPrinted(trial, key) {
    const printedFingerprint = trial && trial.printStatusFingerprints && trial.printStatusFingerprints[key];
    return Boolean(printedFingerprint && entrySetupFingerprint((trial || {}).entries || []) !== printedFingerprint);
}

function printStatus(trial, key) {
    return Boolean(trial && trial.printStatus && trial.printStatus[key]);
}

function trialBasicsComplete(trial) {
    return Boolean(trial && trial.trialName && trial.clubName && trial.association && trial.startsOn && trial.endsOn);
}

function rollCallComplete(trial) {
    const entries = (trial || {}).entries || [];
    return entries.length > 0 && entries.every((entry) => entry.rollCallStatus && entry.rollCallStatus !== 'not_checked');
}

function runPlanComplete(trial) {
    return Boolean(trial && Array.isArray(trial.runPlan) && trial.runPlan.length > 0);
}

function preliminaryDrawComplete(trial) {
    return Boolean(trial && trial.preliminaryDraw && Array.isArray(trial.preliminaryDraw.groups) && trial.preliminaryDraw.groups.length > 0);
}

function prelimScoringComplete(trial) {
    if (!preliminaryDrawComplete(trial)) {
        return false;
    }
    const rows = preliminaryScoreRows(trial.preliminaryDraw);
    return rows.length > 0 && rows.every((row) => hasScoreValue(row.score) || row.outcome);
}

function finalsDrawComplete(trial) {
    const groups = (((trial || {}).preliminaryDraw || {}).groups || []).filter(groupHasPrelimHounds);
    return groups.length > 0 && groups.every((group) => group.finalDraw && Array.isArray(group.finalDraw.courses) && group.finalDraw.courses.length > 0);
}

function finalsScoringComplete(trial) {
    if (!finalsDrawComplete(trial)) {
        return false;
    }
    const rows = finalsScoreRows(trial.preliminaryDraw);
    return rows.length > 0 && rows.every((row) => hasScoreValue(row.score) || row.outcome);
}

function runoffNeedsExist(trial) {
    return collectRunoffItems(trial || {}).length > 0;
}

function runoffDrawComplete(trial) {
    const items = collectRunoffItems(trial || {});
    return items.length > 0 && undrawnRunoffItems(trial || {}).length === 0;
}

function runoffScoringComplete(trial) {
    const items = collectRunoffItems(trial || {});
    if (items.length === 0) {
        return false;
    }
    return items.every((item) => runoffDisplayRows(trial, item)
        .filter((row) => !row.archived && !row.placeholder)
        .every((row) => hasScoreValue(row.score) || row.outcome || row.result));
}

function bifRunnersSet(trial) {
    const bif = bifState(trial || {});
    const selected = selectedBifEntryIds(bif);
    return [...selected].some((entryId) => (bif.statusByEntryId || {})[entryId] !== 'not_running');
}

function bifDrawComplete(trial) {
    const bif = bifState(trial || {});
    return Boolean(bif.draw && Array.isArray(bif.draw.courses) && bif.draw.courses.length > 0);
}

function bifScoringComplete(trial) {
    const bif = bifState(trial || {});
    if (!bifDrawComplete(trial)) {
        return false;
    }
    const rows = ((bif.draw || {}).courses || []).flatMap((course) => course.hounds || []);
    return rows.length > 0 && rows.every((hound) => {
        const outcome = normalizedBobOutcome((bif.outcomes || {})[bifEntryKey(hound.entryId)]);
        return hasScoreValue(outcome.value) || hasScoreValue(outcome.score);
    });
}

function ownerSeparationStatus(trial) {
    const entries = ((trial || {}).entries || []).filter((entry) => entry.rollCallStatus === 'present' || !entry.rollCallStatus || entry.rollCallStatus === 'not_checked');
    if (entries.length === 0) {
        return { done: false, detail: 'Add trial entries before reviewing owner separation.' };
    }
    if (trial && trial.ownerSeparationReviewedAt) {
        return { done: true, detail: `Owner separation reviewed ${formatTimestamp(trial.ownerSeparationReviewedAt)}.` };
    }
    const groups = new Map();
    entries.forEach((entry) => {
        const key = `${clean(entry.breed)}|${clean(entry.stake)}`;
        const owner = ownerKey(entry);
        if (!owner) {
            return;
        }
        if (!groups.has(key)) {
            groups.set(key, new Map());
        }
        const owners = groups.get(key);
        owners.set(owner, (owners.get(owner) || 0) + 1);
    });
    const needsReview = [...groups.values()].some((owners) => [...owners.values()].some((count) => count > 1));
    const hasLetters = entries.some((entry) => (entry.ownerSeparationRequested || entry.separateOwnerHounds) && entry.ownerSeparationGroup);
    if (!needsReview) {
        return { done: true, detail: 'No same-owner conflicts detected in the current entries.' };
    }
    if (hasLetters) {
        return { done: true, detail: 'Owner separation letters are assigned for at least one same-owner group.' };
    }
    return { done: false, detail: 'Same-owner hounds may need separation letters before the preliminary draw.' };
}

function trialGuideSteps(trial) {
    const hasTrial = Boolean(trial);
    const entriesDone = Boolean(hasTrial && (trial.entries || []).length > 0);
    const rollDone = rollCallComplete(trial);
    const runDone = runPlanComplete(trial);
    const entriesStaleForRunPlan = entriesChangedAfterRunPlan(trial);
    const ownerStatus = ownerSeparationStatus(trial);
    const prelimDrawDone = preliminaryDrawComplete(trial);
    const entriesStaleForPrelimDraw = entriesChangedAfterPreliminaryDraw(trial);
    const workerSheetStale = printStatus(trial, 'workerSheet') && entriesChangedAfterPrinted(trial, 'workerSheet');
    const rollCallSheetStale = printStatus(trial, 'rollCallSheet') && entriesChangedAfterPrinted(trial, 'rollCallSheet');
    const prelimDrawSheetStale = printStatus(trial, 'prelimDrawSheet') && entriesChangedAfterPrinted(trial, 'prelimDrawSheet');
    const prelimDone = prelimScoringComplete(trial);
    const finalsDrawDone = finalsDrawComplete(trial);
    const finalsDone = finalsScoringComplete(trial);
    const runoffsExist = runoffNeedsExist(trial);
    const runoffDrawDone = runoffDrawComplete(trial);
    const runoffDone = runoffScoringComplete(trial);
    const bifSet = bifRunnersSet(trial);
    const bifDrawn = bifDrawComplete(trial);
    const bifDone = bifScoringComplete(trial);

    const steps = [
        { id: 'trial-set', label: 'Trial Info', tab: 'setup', sectionTitle: 'Event', status: stepStatus(trialBasicsComplete(trial), hasTrial), detail: 'Enter the trial name, club, association, and dates.', action: 'Go To Setup' },
        { id: 'entries-set', label: 'Hound Entry', tab: 'entries', sectionTitle: 'Trial Entries', status: stepStatus(entriesDone, trialBasicsComplete(trial)), detail: entriesDone ? `${(trial.entries || []).length} entries are in this trial.` : 'Add or import the hounds running in this trial.', action: 'Go To Entries' },
        { id: 'running-order-assignments', label: 'Running Order & Assignments', tab: 'runplan', sectionTitle: 'Running Order & Assignments', status: attentionStatus(runDone, entriesDone, runDone && entriesStaleForRunPlan), detail: runDone && entriesStaleForRunPlan ? 'Entries changed after Running Order was built. Build from entries again before printing or drawing.' : (runDone ? 'Running order and assignment rows are set.' : 'Set breed running order, judges, lure operators, and huntmasters.'), action: 'Go To Running Order' },
        { id: 'print-roll-call-sheet', label: 'Print Roll Call Sheet', tab: 'runplan', sectionTitle: 'Printable Sheets', targetSelector: '#printRollCallButton', status: attentionStatus(printStatus(trial, 'rollCallSheet'), entriesDone, rollCallSheetStale || (printStatus(trial, 'rollCallSheet') && entriesStaleForRunPlan)), detail: rollCallSheetStale || (printStatus(trial, 'rollCallSheet') && entriesStaleForRunPlan) ? 'Entries changed after the roll call sheet was printed. Reprint the roll call sheet for the current entry list.' : (printStatus(trial, 'rollCallSheet') ? 'Roll call sheet has been printed or marked printed.' : 'Print the roll call sheet before checking in hounds at roll call.'), action: 'Go To Roll Call Sheet' },
        { id: 'worker-sheet', label: 'Worker Sheet', tab: 'runplan', sectionTitle: 'Printable Sheets', status: attentionStatus(printStatus(trial, 'workerSheet'), runDone && !entriesStaleForRunPlan, workerSheetStale || (printStatus(trial, 'workerSheet') && entriesStaleForRunPlan)), detail: workerSheetStale || (printStatus(trial, 'workerSheet') && entriesStaleForRunPlan) ? 'Entries changed after the worker sheet was printed. Rebuild Running Order if needed, then print the worker sheet again.' : (printStatus(trial, 'workerSheet') ? 'Worker sheet has been printed or marked printed.' : 'Print the worker sheet after running order and assignments are ready.'), action: 'Go To Worker Sheet' },
        { id: 'roll-call', label: 'Roll Call Check In', tab: 'rollcall', sectionTitle: 'Roll Call Check In', status: attentionStatus(rollDone, entriesDone, rollDone && (entriesStaleForRunPlan || rollCallSheetStale)), detail: rollDone && (entriesStaleForRunPlan || rollCallSheetStale) ? 'Entries changed after setup was built. Review roll call for the current entry list.' : (rollDone ? 'Every trial entry has a roll-call status.' : 'Mark all entered hounds present, absent, lame, in season, or another outcome.'), action: 'Go To Roll Call' },
        { id: 'separate-hounds', label: 'Separate Hounds', tab: 'rollcall', sectionTitle: 'Owner Separation', status: attentionStatus(entriesDone && ownerStatus.done, entriesDone, entriesDone && ownerStatus.done && entriesStaleForRunPlan), detail: entriesDone && ownerStatus.done && entriesStaleForRunPlan ? 'Entries changed after Running Order was built. Review owner separation again before drawing.' : ownerStatus.detail, action: 'Go To Separation' },
        { id: 'prelim-draw', label: 'Preliminary Draw', tab: 'rollcall', sectionTitle: 'Preliminary Draw', status: attentionStatus(prelimDrawDone, rollDone && runDone && !entriesStaleForRunPlan, prelimDrawDone && (entriesStaleForRunPlan || entriesStaleForPrelimDraw)), detail: prelimDrawDone && (entriesStaleForRunPlan || entriesStaleForPrelimDraw) ? 'Entries or roll call changed after the preliminary draw was built. Rebuild before scoring starts.' : (prelimDrawDone ? 'Preliminary courses and blanket colors are built.' : 'Build the randomized preliminary draw after roll call and running order are ready.'), action: 'Go To Draw' },
        { id: 'print-draw', label: 'Print Draw Sheets', tab: 'rollcall', sectionTitle: 'Preliminary Draw', status: attentionStatus(printStatus(trial, 'prelimDrawSheet'), prelimDrawDone && !entriesStaleForPrelimDraw, prelimDrawSheetStale || (printStatus(trial, 'prelimDrawSheet') && entriesStaleForPrelimDraw)), detail: prelimDrawSheetStale || (printStatus(trial, 'prelimDrawSheet') && entriesStaleForPrelimDraw) ? 'Entries changed after draw sheets were printed. Rebuild/reprint the draw sheets.' : (printStatus(trial, 'prelimDrawSheet') ? 'Preliminary draw sheets have been printed or marked printed.' : 'Print the posted draw order sheet for the fancy.'), action: 'Go To Draw Sheets' },
        { id: 'print-judge-prelim', label: 'Print Judges Sheets', tab: 'rollcall', sectionTitle: 'Preliminary Draw', status: attentionStatus(allReadyPrelimJudgeSheetsPrinted(trial), prelimDrawDone && !entriesStaleForPrelimDraw, allReadyPrelimJudgeSheetsPrinted(trial) && entriesStaleForPrelimDraw), detail: allReadyPrelimJudgeSheetsPrinted(trial) && entriesStaleForPrelimDraw ? 'Entries changed after preliminary judge sheets were queued/printed. Rebuild the draw, then print judge sheets again.' : (allReadyPrelimJudgeSheetsPrinted(trial) ? 'All currently ready preliminary judge sheets have been printed.' : 'Print preliminary judge sheets from the judge sheet queue.'), action: 'Go To Judge Sheets' },
        { id: 'prelim-scoring', label: 'Prelim Scoring', tab: 'scoring', scoringPage: 'Prelim Scoring', sectionTitle: 'Prelim Scoring', status: stepStatus(prelimDone, prelimDrawDone && !entriesStaleForPrelimDraw), detail: prelimDone ? 'All preliminary rows have a score or outcome.' : 'Enter preliminary judge scores and outcomes.', action: 'Go To Prelims' },
        { id: 'finals-draw', label: 'Draw Finals Stake/Breed', tab: 'scoring', scoringPage: 'Prelim Scoring', sectionTitle: 'Prelim Scoring', status: stepStatus(finalsDrawDone, prelimDone), detail: finalsDrawDone ? 'Finals draws are built for all preliminary groups.' : 'Draw finals stake by stake or breed by breed after prelims are complete.', action: 'Go To Prelims' },
        { id: 'print-stake-breed', label: 'Print Stake/Breed', tab: 'scoring', scoringPage: 'Finals Scoring', sectionTitle: 'Finals Scoring', status: stepStatus(printStatus(trial, 'stakeBreedSheets'), finalsDrawDone), detail: printStatus(trial, 'stakeBreedSheets') ? 'At least one stake or breed sheet has been printed.' : 'Print the ASFA stake or breed score sheets for posting.', action: 'Go To Finals' },
        { id: 'print-finals-huntmaster', label: 'Print Finals Huntmaster Sheet', tab: 'scoring', scoringPage: 'Finals Scoring', sectionTitle: 'Finals Scoring', status: stepStatus(printStatus(trial, 'finalHuntmasterSheet'), finalsDrawDone), detail: printStatus(trial, 'finalHuntmasterSheet') ? 'The finals huntmaster sheet has been printed or marked printed.' : 'Print the finals draw order sheet for the huntmaster from the finals judge sheet queue.', action: 'Go To Finals' },
        { id: 'print-final-judges', label: 'Print Final Judges Sheets', tab: 'scoring', scoringPage: 'Finals Scoring', sectionTitle: 'Finals Scoring', status: stepStatus(allReadyFinalsJudgeSheetsPrinted(trial), finalsDrawDone), detail: allReadyFinalsJudgeSheetsPrinted(trial) ? 'All currently ready finals judge sheets have been printed.' : 'Print finals judge sheets from the finals draw queue.', action: 'Go To Finals' },
        { id: 'final-scoring', label: 'Enter Final Scoring', tab: 'scoring', scoringPage: 'Finals Scoring', sectionTitle: 'Finals Scoring', status: stepStatus(finalsDone, finalsDrawDone), detail: finalsDone ? 'All finals rows have a score or outcome.' : 'Enter finals scores and outcomes, then resolve placements.', action: 'Go To Finals' },
        { id: 'runoff-draw', label: 'Draw Runoffs', tab: 'scoring', scoringPage: 'Run Offs Scoring', sectionTitle: 'Run Offs Scoring', status: !runoffsExist && finalsDone ? 'done' : stepStatus(runoffDrawDone, finalsDone && runoffsExist), detail: runoffsExist ? 'Build or redraw tie and BOB runoff colors from the Run Offs page.' : 'No runoff or BOB draw is currently needed.', action: 'Go To Run Offs' },
        { id: 'print-runoff-draw', label: 'Print Runoff Draw Sheets', tab: 'scoring', scoringPage: 'Run Offs Scoring', sectionTitle: 'Run Offs Scoring', status: !runoffsExist && finalsDone ? 'done' : stepStatus(printStatus(trial, 'runoffDrawSheet'), runoffDrawDone), detail: printStatus(trial, 'runoffDrawSheet') ? 'Runoff draw sheet has been printed or marked printed.' : 'Print the runoff running order once colors are drawn.', action: 'Go To Run Offs' },
        { id: 'print-runoff-judges', label: 'Print Runoff Judge Sheet', tab: 'scoring', scoringPage: 'Run Offs Scoring', sectionTitle: 'Run Offs Scoring', status: !runoffsExist && finalsDone ? 'done' : stepStatus(printStatus(trial, 'runoffJudgeSheets'), runoffDrawDone), detail: printStatus(trial, 'runoffJudgeSheets') ? 'Runoff judge sheets have been printed or marked printed.' : 'Print judges sheets for the current runoff order.', action: 'Go To Run Offs' },
        { id: 'runoff-scoring', label: 'Runoffs Scoring', tab: 'scoring', scoringPage: 'Run Offs Scoring', sectionTitle: 'Run Offs Scoring', status: !runoffsExist && finalsDone ? 'done' : stepStatus(runoffDone, runoffDrawDone), detail: runoffDone ? 'Runoff and BOB scoring is complete.' : 'Enter runoff and BOB scores or outcomes.', action: 'Go To Run Offs' },
        { id: 'bif-runners', label: 'Set BIF/BIE Runners Status', tab: 'scoring', scoringPage: 'BIF / BIE', sectionTitle: 'BIF / BIE', status: stepStatus(bifSet, finalsDone || runoffDone), detail: bifSet ? 'At least one BOB winner is checked to run BIF.' : 'Check which BOB winners are running in BIF/BIE.', action: 'Go To BIF / BIE' },
        { id: 'bif-draw', label: 'Draw BIF/BIE', tab: 'scoring', scoringPage: 'BIF / BIE', sectionTitle: 'BIF / BIE', status: stepStatus(bifDrawn, bifSet), detail: bifDrawn ? 'BIF draw and blanket colors are built.' : 'Draw BIF/BIE after runners and judges are set.', action: 'Go To BIF / BIE' },
        { id: 'print-bif-draw', label: 'Print BIF Draw Sheet', tab: 'scoring', scoringPage: 'BIF / BIE', sectionTitle: 'BIF / BIE', status: stepStatus(printStatus(trial, 'bifDrawSheet'), bifDrawn), detail: printStatus(trial, 'bifDrawSheet') ? 'BIF draw sheet has been printed or marked printed.' : 'Print the BIF draw order sheet.', action: 'Go To BIF / BIE' },
        { id: 'print-bif-judges', label: 'Print BIF Judge Sheets', tab: 'scoring', scoringPage: 'BIF / BIE', sectionTitle: 'BIF / BIE', status: stepStatus(printStatus(trial, 'bifJudgeSheets'), bifDrawn), detail: printStatus(trial, 'bifJudgeSheets') ? 'BIF judge sheets have been printed or marked printed.' : 'Print judge sheets for the BIF draw.', action: 'Go To BIF / BIE' },
        { id: 'bif-scores', label: 'Enter BIF Scores', tab: 'scoring', scoringPage: 'BIF / BIE', sectionTitle: 'BIF / BIE', status: stepStatus(bifDone, bifDrawn), detail: bifDone ? 'BIF scores are complete.' : 'Enter BIF scores and resolve any BIF ties.', action: 'Go To BIF / BIE' },
        { id: 'ribbon-report', label: 'Print Ribbon Report', tab: 'scoring', scoringPage: 'Main Results', sectionTitle: 'Main Results', status: stepStatus(printStatus(trial, 'ribbonReport'), finalsDone || bifDone), detail: printStatus(trial, 'ribbonReport') ? 'Ribbon report has been printed or marked printed.' : 'Print the final placements and BIF section for ribbons/prizes.', action: 'Go To Main Results' },
    ];
    const normalizedSteps = steps.map((step) => ({
        ...step,
        status: hasTrial ? step.status : (step.id === 'trial-set' ? 'ready' : 'blocked'),
    }));
    if (hasTrial && normalizedSteps.every((step) => step.status === 'done')) {
        return [...normalizedSteps, ...trialWrapUpGuideSteps(trial)];
    }
    return normalizedSteps;
}

function trialWrapUpGuideSteps(trial) {
    const secretaryPrinted = printStatus(trial, 'asfaSecretaryReport');
    const payment = secretaryPaymentStatus(trial || {});
    const secretaryReady = Boolean(trial);
    const feesReady = Boolean(secretaryPrinted);
    const secretaryDone = Boolean(secretaryPrinted && payment.done);
    const recordPacketPrinted = printStatus(trial, 'asfaRecordPacket');
    const paperworkSubmitted = Boolean(trial && trial.paperworkSubmittedAt);
    const archived = Boolean(trial && trial.archivedAt);
    return [
        {
            id: 'wrap-secretary-report',
            label: 'ASFA Secretary Report',
            tab: 'wrapup',
            wrapUpPage: 'ASFA Secretary Report',
            sectionTitle: 'ASFA Secretary Report',
            status: stepStatus(secretaryPrinted, secretaryReady),
            detail: secretaryPrinted ? 'ASFA Secretary Report has been printed or marked created.' : 'Fill out and print the ASFA Field Trial Secretary Report first.',
            action: 'Go To Secretary Report',
        },
        {
            id: 'wrap-pay-fees',
            label: 'Pay Trial Fees',
            tab: 'wrapup',
            wrapUpPage: 'ASFA Secretary Report',
            sectionTitle: 'ASFA Secretary Report',
            targetSelector: '#secretaryPaypalTransactionId',
            status: payment.done ? 'done' : (feesReady ? 'attention' : 'blocked'),
            detail: payment.detail,
            action: 'Go To Payment Fields',
        },
        {
            id: 'wrap-record-packet',
            label: 'Print & Review ASFA Record Packet',
            tab: 'wrapup',
            wrapUpPage: 'ASFA Record Packet',
            sectionTitle: 'ASFA Record Packet',
            status: stepStatus(recordPacketPrinted, secretaryDone),
            detail: recordPacketPrinted ? 'ASFA record packet has been printed or marked created.' : 'Print and review the ASFA record packet after fees and the Secretary Report are complete.',
            action: 'Go To Record Packet',
        },
        {
            id: 'wrap-submit-paperwork',
            label: 'Submit Paperwork',
            tab: 'wrapup',
            wrapUpPage: 'Submit Paperwork',
            sectionTitle: 'Submit Paperwork',
            status: stepStatus(paperworkSubmitted, recordPacketPrinted),
            detail: paperworkSubmitted ? `Paperwork marked submitted ${formatTimestamp(trial.paperworkSubmittedAt)}.` : 'Submit paperwork to records@asfa.org, then mark it submitted.',
            action: 'Go To Submission',
        },
        {
            id: 'wrap-archive-trial',
            label: 'Archive Trial',
            tab: 'wrapup',
            wrapUpPage: 'Archive Trial',
            sectionTitle: 'Archive Trial',
            status: stepStatus(archived, paperworkSubmitted),
            detail: archived ? `Trial archived ${formatTimestamp(trial.archivedAt)}.` : 'Create the final archive package and lock the trial after submission.',
            action: 'Go To Archive',
        },
    ];
}

function nextTrialGuideStep(steps) {
    return (steps || []).find((step) => step.status === 'ready' || step.status === 'attention')
        || (steps || []).find((step) => step.status === 'blocked')
        || null;
}

function renderTrialGuide(trial) {
    if (!trialGuideSummary || !trialGuideNext || !trialGuideList) {
        applyTabGuideStatuses([]);
        return;
    }
    const steps = trialGuideSteps(trial);
    const doneCount = steps.filter((step) => step.status === 'done').length;
    const next = nextTrialGuideStep(steps);
    trialGuideSummary.textContent = trial ? `${doneCount} of ${steps.length} complete` : 'No trial selected';
    trialGuideNext.innerHTML = '';
    trialGuideList.innerHTML = '';

    if (!trial) {
        const empty = document.createElement('p');
        empty.textContent = 'Create or select a trial to start the guided workflow.';
        trialGuideNext.appendChild(empty);
        applyTabGuideStatuses(steps);
        return;
    }

    const nextText = document.createElement('span');
    nextText.innerHTML = `<strong>${next ? next.label : 'Trial Complete'}</strong> ${next ? next.detail : 'All guide items are complete.'}`;
    trialGuideNext.appendChild(nextText);
    if (next) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'secondary small';
        button.textContent = next.action;
        button.addEventListener('click', () => goToWorkflowStep(next));
        trialGuideNext.appendChild(button);
    }

    steps.forEach((step) => {
        const item = document.createElement('li');
        item.className = `guide-step ${step.status}`;
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.help = step.detail;
        button.addEventListener('click', () => goToWorkflowStep(step));
        const dot = document.createElement('span');
        dot.className = 'guide-dot';
        const text = document.createElement('span');
        text.textContent = step.label;
        const status = document.createElement('span');
        status.className = 'guide-step-status';
        status.textContent = step.status === 'done' ? 'Done' : (step.status === 'blocked' ? 'Blocked' : 'Next');
        button.append(dot, text, status);
        item.appendChild(button);
        trialGuideList.appendChild(item);
    });
    applyTabGuideStatuses(steps);
}

function applyTabGuideStatuses(steps) {
    const byTab = new Map();
    (steps || []).forEach((step) => {
        if (!step.tab) {
            return;
        }
        if (!byTab.has(step.tab)) {
            byTab.set(step.tab, []);
        }
        byTab.get(step.tab).push(step.status);
    });
    document.querySelectorAll('.tab-button').forEach((button) => {
        button.classList.remove('guide-done', 'guide-ready', 'guide-attention', 'guide-blocked');
        const statuses = byTab.get(button.dataset.tabTarget) || [];
        if (statuses.length === 0) {
            return;
        }
        const status = guideStatusFromList(statuses);
        if (status) {
            button.classList.add(`guide-${status}`);
        }
    });
}

function markTrialGuidePrinted(key) {
    const trial = readForm();
    if (!trial || !trial.id || !key) {
        return;
    }
    const existing = getSelectedTrial();
    trial.printStatus = {
        ...((existing && existing.printStatus) || {}),
        ...(trial.printStatus || {}),
        [key]: new Date().toISOString(),
    };
    trial.printStatusFingerprints = {
        ...((existing && existing.printStatusFingerprints) || {}),
        ...(trial.printStatusFingerprints || {}),
        [key]: entrySetupFingerprint(trial.entries || []),
    };
    upsertTrial(trial);
    saveTrials();
    render();
}

function renderChecklist(trial) {
    const checks = [
        ['Event details', trial && trial.trialName && trial.association && trial.clubName],
        ['Dates', trial && trial.startsOn && trial.endsOn],
        ['Location', trial && trial.locationName && trial.locationCity && trial.locationState],
        ['Trial type', trial && trial.trialType && (trial.trialType !== 'specialty' || trial.specialtyBreed)],
        ['Entries establish breeds/stakes', trial && trial.entries && trial.entries.length > 0],
        ['Trial entries started', trial && trial.entries && trial.entries.length > 0],
        ['Roll call complete', trial && trial.entries && trial.entries.length > 0 && trial.entries.every((entry) => entry.rollCallStatus && entry.rollCallStatus !== 'not_checked')],
        ['Judges listed', trial && trial.judges && trial.judges.length > 0],
        ['Workers listed', trial && trial.workers && trial.workers.length > 0],
        ['Closing time', trial && trial.closingAt],
        ['Roll call time', trial && trial.rollCallAt],
        ['Secretary contact', trial && trial.secretaryName && trial.secretaryEmail],
        ['Event or sanction number', trial && trial.eventNumber],
        ['Document checklist started', trial && trial.documentsReady && trial.documentsReady.length > 0],
    ];

    const complete = checks.filter(([, done]) => done).length;
    checklistSummary.textContent = trial
        ? `${complete} of ${checks.length} setup items are complete.`
        : 'Create or select a trial to see setup status.';

    setupChecklist.innerHTML = '';
    checks.forEach(([label, done]) => {
        const item = document.createElement('li');
        const text = document.createElement('span');
        const status = document.createElement('span');

        text.textContent = label;
        status.className = `status ${done ? 'done' : 'todo'}`;
        status.textContent = done ? 'Done' : 'Needed';
        item.append(text, status);
        setupChecklist.appendChild(item);
    });
}

function renderOfficialForms(trial) {
    const table = document.getElementById('officialFormsTable');
    const associationFilter = document.getElementById('officialFormsAssociation');
    if (!table || !associationFilter) {
        return;
    }

    const selectedAssociation = associationFilter.value || 'all';
    const forms = officialFormTemplates.filter((template) => (
        selectedAssociation === 'all' || template.association === selectedAssociation
    ));

    table.innerHTML = '';
    forms.forEach((template) => {
        const status = formTemplateStatus[template.id] || {};
        const isReady = status.ready !== undefined ? Boolean(status.ready) : Boolean(template.localTemplatePath);
        const tr = document.createElement('tr');

        tr.appendChild(textCell(template.association));
        tr.appendChild(textCell(`${template.code} - ${template.name}`));
        tr.appendChild(textCell(template.use));
        tr.appendChild(textCell(template.revision));

        const sourceCell = document.createElement('td');
        const sourceLink = document.createElement('a');
        sourceLink.href = template.sourceUrl;
        sourceLink.target = '_blank';
        sourceLink.rel = 'noopener';
        sourceLink.textContent = 'Open PDF';
        sourceLink.title = template.notes;
        sourceCell.appendChild(sourceLink);
        tr.appendChild(sourceCell);

        const localCell = document.createElement('td');
        const localStack = document.createElement('div');
        localStack.className = 'local-template-cell';
        if (template.localTemplatePath) {
            const localLink = document.createElement('a');
            localLink.href = template.localTemplatePath;
            localLink.target = '_blank';
            localLink.rel = 'noopener';
            localLink.textContent = 'Open Local';
            localStack.appendChild(localLink);
        }

        const label = document.createElement('label');
        label.className = 'switch compact-switch';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isReady;
        checkbox.addEventListener('change', () => {
            formTemplateStatus[template.id] = {
                ...status,
                ready: checkbox.checked,
                updatedAt: new Date().toISOString()
            };
            saveFormTemplateStatus();
            showMessage(
                officialFormsMessage,
                checkbox.checked ? `${template.code} marked ready for offline template work.` : `${template.code} marked as needing a local template.`,
                checkbox.checked ? 'success' : 'warning'
            );
            renderOfficialForms(trial);
        });
        const text = document.createElement('span');
        text.textContent = checkbox.checked ? 'Ready' : 'Needed';
        label.append(checkbox, text);
        localStack.appendChild(label);
        localCell.appendChild(localStack);
        tr.appendChild(localCell);

        table.appendChild(tr);
    });

    if (officialFormsMessage && !officialFormsMessage.textContent) {
        const currentAssociation = trial && trial.association ? trial.association : 'AKC/ASFA';
        officialFormsMessage.textContent = `Official ${currentAssociation} PDFs will be used as print templates, then filled from trial data.`;
    }
    renderAsfaRecordAlignmentTool(trial);
}

function renderAsfaRecordAlignmentTool(trial) {
    const container = document.getElementById('asfaRecordAlignmentControls');
    if (!container) {
        return;
    }
    const layout = getAsfaRecordLayout();
    const controls = [
        ['headerFontSize', 'Header font', 6, 16, 0.5],
        ['bodyFontSize', 'Hound/reg font', 5, 14, 0.5],
        ['codeFontSize', 'Score/code font', 5, 14, 0.5],
        ['globalYAdjust', 'All record text Y offset', -12, 12, 0.5],
        ['rowTop', 'First hound row', 135, 190, 1],
        ['rowHeight', 'Row spacing', 12, 28, 0.1],
        ['breedX', 'Breed X', 110, 230, 1],
        ['breedY', 'Breed Y', 55, 120, 1],
        ['stakeX', 'Stake X', 330, 480, 1],
        ['stakeY', 'Stake Y', 55, 120, 1],
        ['flightX', 'Flight X', 560, 700, 1],
        ['flightY', 'Flight Y', 55, 120, 1],
        ['enteredX', '# Entered X', 360, 500, 1],
        ['enteredY', '# Entered Y', 80, 140, 1],
        ['refundsX', 'Refunds X', 500, 650, 1],
        ['refundsY', 'Refunds Y', 80, 140, 1],
        ['perCapitaX', '# Per Capita X', 650, 780, 1],
        ['perCapitaY', '# Per Capita Y', 80, 140, 1],
        ['callNameX', 'Call name X', 15, 85, 1],
        ['callNameY', 'Call name Y offset', 135, 190, 1],
        ['registrationX', 'Reg # X', 95, 185, 1],
        ['registrationY', 'Reg # Y offset', 135, 190, 1],
        ['prelimCodeX', 'Prelim #/Clr X', 215, 285, 1],
        ['prelimCodeY', 'Prelim #/Clr Y offset', 135, 190, 1],
        ['prelimJudge1X', 'Prelim J1 X', 270, 310, 1],
        ['prelimJudge1Y', 'Prelim J1 Y offset', 135, 190, 1],
        ['prelimJudge2X', 'Prelim J2 X', 310, 350, 1],
        ['prelimJudge2Y', 'Prelim J2 Y offset', 135, 190, 1],
        ['prelimScoreX', 'Prelim score X', 345, 405, 1],
        ['prelimScoreY', 'Prelim score Y offset', 135, 190, 1],
        ['finalCodeX', 'Final #/Clr X', 385, 455, 1],
        ['finalCodeY', 'Final #/Clr Y offset', 135, 190, 1],
        ['finalJudge1X', 'Final J1 X', 430, 470, 1],
        ['finalJudge1Y', 'Final J1 Y offset', 135, 190, 1],
        ['finalJudge2X', 'Final J2 X', 470, 510, 1],
        ['finalJudge2Y', 'Final J2 Y offset', 135, 190, 1],
        ['finalScoreX', 'Final score X', 500, 560, 1],
        ['finalScoreY', 'Final score Y offset', 135, 190, 1],
        ['combinedScoreX', 'Combined score X', 555, 610, 1],
        ['combinedScoreY', 'Combined score Y offset', 135, 190, 1],
        ['stakesRunoffLabelX', 'Stake runoff label X', 610, 690, 1],
        ['stakesRunoffLabelY', 'Stake runoff label Y offset', 135, 190, 1],
        ['stakesRunoffCodeX', 'Stake runoff color X', 610, 690, 1],
        ['stakesRunoffCodeY', 'Stake runoff color Y offset', 135, 190, 1],
        ['secondRunoffLabelX', '2nd runoff label X', 650, 715, 1],
        ['secondRunoffLabelY', '2nd runoff label Y offset', 135, 190, 1],
        ['secondRunoffCodeX', '2nd runoff score X', 650, 715, 1],
        ['secondRunoffCodeY', '2nd runoff score Y offset', 135, 190, 1],
        ['bobRunoffLabelX', 'BOB runoff label X', 690, 755, 1],
        ['bobRunoffLabelY', 'BOB runoff label Y offset', 135, 190, 1],
        ['bobRunoffCodeX', 'BOB runoff color X', 690, 755, 1],
        ['bobRunoffCodeY', 'BOB runoff color Y offset', 135, 190, 1],
        ['placementX', 'Placement X', 720, 780, 1],
        ['placementY', 'Placement Y offset', 135, 190, 1],
        ['judge1X', 'Judge 1 name X', 300, 430, 1],
        ['judge1Y', 'Judge 1 name Y', 520, 575, 1],
        ['judge2X', 'Judge 2 name X', 300, 430, 1],
        ['judge2Y', 'Judge 2 name Y', 540, 590, 1],
        ['footerClubX', 'Club footer X', 100, 240, 1],
        ['footerClubY', 'Club footer Y', 520, 590, 1],
        ['footerDateX', 'Date footer X', 330, 470, 1],
        ['footerDateY', 'Date footer Y', 520, 590, 1],
        ['fieldClerkX', 'Field Clerk X', 520, 720, 1],
        ['fieldClerkY', 'Field Clerk Y', 520, 590, 1],
        ['fieldSecretaryX', 'Field Secretary X', 520, 720, 1],
        ['fieldSecretaryY', 'Field Secretary Y', 520, 590, 1],
    ];

    renderAlignmentControls(container, 'asfaRecordSheet', layout, controls);
    renderAsfaRecordVisualEditor(layout);

    const tool = document.getElementById('asfaRecordAlignmentTool');
    if (tool) {
        tool.hidden = Boolean(trial && clean(trial.association || 'ASFA') !== 'ASFA');
    }
    renderAsfaEntryAlignmentTool(trial);
    renderAsfaJudgeAlignmentTool(trial);
    renderAsfaDrawAlignmentTool(trial);
}

function getAsfaRecordLayout() {
    formAlignment = normalizeFormAlignment(formAlignment);
    return formAlignment.asfaRecordSheet;
}

function getAsfaEntryLayout() {
    formAlignment = normalizeFormAlignment(formAlignment);
    return formAlignment.asfaEntryForm;
}

function getAsfaLciEntryLayout() {
    formAlignment = normalizeFormAlignment(formAlignment);
    return formAlignment.asfaLciEntryForm;
}

function getAsfaDrawLayout() {
    formAlignment = normalizeFormAlignment(formAlignment);
    return formAlignment.asfaDrawSheet;
}

function renderAsfaDrawAlignmentTool(trial) {
    const container = document.getElementById('asfaDrawAlignmentControls');
    if (!container) {
        return;
    }
    const layout = getAsfaDrawLayout();
    const controls = [
        ['globalXAdjust', 'All check marks X offset', -20, 20, 0.5],
        ['globalYAdjust', 'All check marks Y offset', -20, 20, 0.5],
        ['checkSize', 'Checkbox size', 4, 12, 0.5],
        ['checkWeight', 'Checkbox line weight', 0.3, 3, 0.1],
        ['checkFontSize', 'X font size', 5, 14, 0.5],
        ['breedTextX', 'Breed value X', 10, 80, 0.5],
        ['breedTextYAdjust', 'Breed value Y adjust', -12, 12, 0.5],
        ['stakeTextX', 'Stake value X', 10, 80, 0.5],
        ['stakeTextYAdjust', 'Stake value Y adjust', -12, 12, 0.5],
        ['prelimCheckX', 'Prelim check X', 40, 105, 0.5],
        ['prelimCheckY', 'Prelim check Y', 70, 110, 0.5],
        ['finalCheckX', 'Final check X', 80, 145, 0.5],
        ['finalCheckY', 'Final check Y', 70, 110, 0.5],
        ['runoffCheckX', 'Run-Off check X', 140, 220, 0.5],
        ['runoffCheckY', 'Run-Off check Y', 70, 110, 0.5],
        ['bobCheckX', 'BOB check X', 185, 265, 0.5],
        ['bobCheckY', 'BOB check Y', 70, 110, 0.5],
        ['bifCheckX', 'BIF check X', 235, 315, 0.5],
        ['bifCheckY', 'BIF check Y', 70, 110, 0.5],
    ];
    renderAlignmentControls(container, 'asfaDrawSheet', layout, controls);
    renderAsfaDrawVisualEditor(layout);

    const tool = document.getElementById('asfaDrawAlignmentTool');
    if (tool) {
        tool.hidden = Boolean(trial && clean(trial.association || 'ASFA') !== 'ASFA');
    }
}

function renderAsfaDrawVisualEditor(layout) {
    const container = document.getElementById('asfaDrawVisualEditor');
    if (!container) {
        return;
    }
    const width = 792;
    const height = 612;
    const columnX = 36;
    const textItems = [
        { key: 'breedText', label: 'Breed value', xKey: 'breedTextX', yKey: 'breedTextYAdjust', baseY: 141 },
        { key: 'stakeText', label: 'Stake value', xKey: 'stakeTextX', yKey: 'stakeTextYAdjust', baseY: 158 },
    ];
    const items = [
        { key: 'prelim', label: 'Prelim', xKey: 'prelimCheckX', yKey: 'prelimCheckY' },
        { key: 'final', label: 'Final', xKey: 'finalCheckX', yKey: 'finalCheckY' },
        { key: 'runoff', label: 'Run-Off', xKey: 'runoffCheckX', yKey: 'runoffCheckY' },
        { key: 'bob', label: 'BOB', xKey: 'bobCheckX', yKey: 'bobCheckY' },
        { key: 'bif', label: 'BIF', xKey: 'bifCheckX', yKey: 'bifCheckY' },
    ];
    container.innerHTML = `
        <p class="field-note">This is the official ASFA draw order sheet. Drag the red checkbox targets on the first panel; the same positions are used for every panel on the printed page.</p>
        <div class="draw-sheet-stage">
            <svg class="draw-sheet-overlay" viewBox="0 0 ${width} ${height}" aria-label="ASFA draw sheet alignment editor">
                <image href="/api/template-image/asfa-draw" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"></image>
            </svg>
        </div>
    `;
    const svg = container.querySelector('svg');
    textItems.forEach((item) => {
        const x = columnX + Number(layout[item.xKey] || 0);
        const y = Number(item.baseY || 0) + Number(layout[item.yKey] || 0);
        const group = svgElement('g', {
            class: 'draw-editor-item',
            'data-type': 'text',
            'data-x-key': item.xKey,
            'data-y-key': item.yKey,
            'data-base-y': String(item.baseY),
            'data-column-x': columnX,
        });
        group.appendChild(svgElement('rect', { x: x - 2, y: y - 10, width: 82, height: 14, fill: 'rgba(255,255,255,0.75)', stroke: '#b3261e', 'stroke-width': '1.4' }));
        group.appendChild(svgElement('text', { x, y, 'font-size': '7', fill: '#b3261e', 'font-weight': '700' }, item.label));
        svg.appendChild(group);
    });
    items.forEach((item) => {
        const x = columnX + Number(layout[item.xKey] || 0) + Number(layout.globalXAdjust || 0);
        const y = Number(layout[item.yKey] || 0) + Number(layout.globalYAdjust || 0);
        const size = Number(layout.checkSize || 7);
        const group = svgElement('g', {
            class: 'draw-editor-item',
            'data-x-key': item.xKey,
            'data-y-key': item.yKey,
            'data-column-x': columnX,
        });
        group.appendChild(svgElement('rect', { x: x - 1, y: y - 1, width: size, height: size, fill: 'rgba(255,255,255,0.2)', stroke: '#b3261e', 'stroke-width': '1.8' }));
        group.appendChild(svgElement('text', { x, y: y + size - 1, 'font-size': String(Number(layout.checkFontSize || 8)), fill: '#b3261e', 'font-weight': '800' }, 'X'));
        group.appendChild(svgElement('text', { x: x + size + 5, y: y + size - 1, 'font-size': '8', fill: '#5c2b25', 'font-weight': '700' }, item.label));
        group.appendChild(svgElement('rect', { class: 'draw-editor-handle', x: x + size - 2, y: y + size - 2, width: 6, height: 6, fill: '#b3261e' }));
        svg.appendChild(group);
    });
    enableAsfaDrawVisualDrag(svg);
}

function enableAsfaDrawVisualDrag(svg) {
    let drag = null;
    const pointFromEvent = (event) => {
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        return point.matrixTransform(svg.getScreenCTM().inverse());
    };

    svg.addEventListener('pointerdown', (event) => {
        if (isAlignmentLocked('asfaDrawSheet')) {
            return;
        }
        const item = event.target.closest('.draw-editor-item');
        if (!item) {
            return;
        }
        event.preventDefault();
        item.setPointerCapture?.(event.pointerId);
        drag = {
            item,
            start: pointFromEvent(event),
            layout: { ...getAsfaDrawLayout() },
        };
    });

    svg.addEventListener('pointermove', (event) => {
        if (!drag) {
            return;
        }
        const point = pointFromEvent(event);
        const dx = point.x - drag.start.x;
        const dy = point.y - drag.start.y;
        const layout = getAsfaDrawLayout();
        const xKey = drag.item.dataset.xKey;
        const yKey = drag.item.dataset.yKey;
        layout[xKey] = Math.max(0, Math.round((Number(drag.layout[xKey] || 0) + dx) * 10) / 10);
        if (drag.item.dataset.type === 'text') {
            layout[yKey] = Math.round((Number(drag.layout[yKey] || 0) + dy) * 10) / 10;
        } else {
            layout[yKey] = Math.max(0, Math.round((Number(drag.layout[yKey] || 0) + dy) * 10) / 10);
        }
        saveFormAlignment();
        updateAsfaDrawVisualItem(drag.item, layout);
    });

    const finish = () => {
        if (!drag) {
            return;
        }
        drag = null;
        renderAsfaDrawAlignmentTool(readForm());
    };
    svg.addEventListener('pointerup', finish);
    svg.addEventListener('pointerleave', finish);
}

function updateAsfaDrawVisualItem(item, layout) {
    const columnX = Number(item.dataset.columnX || 0);
    const xKey = item.dataset.xKey;
    const yKey = item.dataset.yKey;
    if (item.dataset.type === 'text') {
        const x = columnX + Number(layout[xKey] || 0);
        const y = Number(item.dataset.baseY || 0) + Number(layout[yKey] || 0);
        const rect = item.querySelector('rect:first-child');
        const label = item.querySelector('text');
        if (rect) {
            rect.setAttribute('x', String(x - 2));
            rect.setAttribute('y', String(y - 10));
        }
        if (label) {
            label.setAttribute('x', String(x));
            label.setAttribute('y', String(y));
        }
        return;
    }
    const x = columnX + Number(layout[xKey] || 0) + Number(layout.globalXAdjust || 0);
    const y = Number(layout[yKey] || 0) + Number(layout.globalYAdjust || 0);
    const size = Number(layout.checkSize || 7);
    const rect = item.querySelector('rect:first-child');
    const mark = item.querySelector('text');
    const label = item.querySelectorAll('text')[1];
    const handle = item.querySelector('.draw-editor-handle');
    if (rect) {
        rect.setAttribute('x', String(x - 1));
        rect.setAttribute('y', String(y - 1));
        rect.setAttribute('width', String(size));
        rect.setAttribute('height', String(size));
    }
    if (mark) {
        mark.setAttribute('x', String(x));
        mark.setAttribute('y', String(y + size - 1));
    }
    if (label) {
        label.setAttribute('x', String(x + size + 5));
        label.setAttribute('y', String(y + size - 1));
    }
    if (handle) {
        handle.setAttribute('x', String(x + size - 2));
        handle.setAttribute('y', String(y + size - 2));
    }
}

function renderAsfaEntryAlignmentTool(trial) {
    const container = document.getElementById('asfaEntryAlignmentControls');
    if (!container) {
        return;
    }
    const layout = getAsfaEntryLayout();
    const controls = [
        ['fontSize', 'Filled text font size', 5, 14, 0.5],
        ['smallFontSize', 'Small text font size', 4, 12, 0.5],
        ['circleWeight', 'Mark weight', 0.5, 4, 0.1],
        ['globalYAdjust', 'All entry text Y offset', -20, 20, 0.5],
        ['trialClubX', 'Trial club X', 15, 180, 1],
        ['trialClubY', 'Trial club Y', 45, 95, 1],
        ['trialDateX', 'Trial date X', 15, 180, 1],
        ['trialDateY', 'Trial date Y', 55, 105, 1],
        ['trialSecretaryX', 'FTS name X', 170, 330, 1],
        ['trialSecretaryY', 'FTS name Y', 45, 95, 1],
        ['trialSecretaryEmailX', 'FTS email X', 170, 330, 1],
        ['trialSecretaryEmailY', 'FTS email Y', 55, 105, 1],
        ['breedX', 'Breed X', 20, 150, 1],
        ['breedY', 'Breed Y', 55, 105, 1],
        ['callNameX', 'Call name X', 35, 160, 1],
        ['callNameY', 'Call name Y', 90, 130, 1],
        ['registeredNameX', 'Registered name X', 75, 230, 1],
        ['registeredNameY', 'Registered name Y', 120, 155, 1],
        ['registrationX', 'Registration X', 35, 160, 1],
        ['registrationY', 'Registration Y', 180, 220, 1],
        ['dobX', 'DOB X', 240, 330, 1],
        ['dobY', 'DOB Y', 180, 220, 1],
        ['stakeCheckY', 'Stake check row Y', 150, 185, 1],
        ['openX', 'Open check X', 45, 90, 1],
        ['fchX', 'FCH check X', 90, 130, 1],
        ['veteranX', 'Veteran check X', 140, 190, 1],
        ['singlesX', 'Singles check X', 200, 250, 1],
        ['provisionalX', 'Provisional check X', 265, 340, 1],
        ['kennelX', 'Kennel check X', 45, 100, 1],
        ['kennelY', 'Kennel check Y', 170, 205, 1],
        ['breederX', 'Breeder check X', 90, 145, 1],
        ['breederY', 'Breeder check Y', 170, 205, 1],
        ['benchX', 'Bench check X', 140, 200, 1],
        ['benchY', 'Bench check Y', 170, 205, 1],
        ['dogX', 'Dog check X', 225, 280, 1],
        ['bitchX', 'Bitch check X', 290, 350, 1],
        ['sexCheckY', 'Sex check row Y', 205, 240, 1],
        ['ownerX', 'Owner X', 70, 190, 1],
        ['ownerY', 'Owner Y', 230, 270, 1],
        ['addressX', 'Address X', 35, 170, 1],
        ['addressY', 'Address Y', 260, 300, 1],
        ['phoneX', 'Phone X', 35, 120, 1],
        ['phoneY', 'Phone Y', 290, 330, 1],
        ['cityX', 'City X', 30, 120, 1],
        ['cityY', 'City Y', 320, 360, 1],
        ['stateX', 'State X', 200, 270, 1],
        ['stateY', 'State Y', 320, 360, 1],
        ['zipX', 'ZIP X', 275, 350, 1],
        ['zipY', 'ZIP Y', 320, 360, 1],
        ['emailX', 'Email X', 35, 140, 1],
        ['emailY', 'Email Y', 350, 390, 1],
        ['regionX', 'Region X', 250, 340, 1],
        ['regionY', 'Region Y', 350, 390, 1],
        ['ownerSeparationX', 'Separate hounds check X', 220, 290, 1],
        ['ownerSeparationY', 'Separate hounds check Y', 170, 205, 1],
        ['firstAsfaTrialX', 'First ASFA trial check X', 15, 60, 1],
        ['firstAsfaTrialY', 'First ASFA trial check Y', 380, 420, 1],
        ['firstTimeEntryX', 'First-time entry check X', 15, 60, 1],
        ['firstTimeEntryY', 'First-time entry check Y', 415, 455, 1],
        ['changeInfoX', 'Info changed check X', 15, 60, 1],
        ['changeInfoY', 'Info changed check Y', 450, 485, 1],
        ['dismissedX', 'Dismissed check X', 15, 60, 1],
        ['dismissedY', 'Dismissed check Y', 485, 525, 1],
        ['checkSize', 'Check box size', 4, 14, 0.5],
        ['signatureX', 'Signature text X', 180, 310, 1],
        ['signatureY', 'Signature text Y', 555, 595, 1],
    ];
    renderAlignmentControls(container, 'asfaEntryForm', layout, controls);
    renderAsfaEntryVisualEditor(layout);

    const tool = document.getElementById('asfaEntryAlignmentTool');
    if (tool) {
        tool.hidden = Boolean(trial && clean(trial.association || 'ASFA') !== 'ASFA');
    }
    renderAsfaLciEntryAlignmentTool(trial);
}

function renderAsfaLciEntryAlignmentTool(trial) {
    const container = document.getElementById('asfaLciEntryAlignmentControls');
    if (!container) {
        return;
    }
    const layout = getAsfaLciEntryLayout();
    const controls = [
        ['fontSize', 'Filled text font size', 5, 14, 0.5],
        ['smallFontSize', 'Small text font size', 4, 12, 0.5],
        ['circleWeight', 'Mark weight', 0.5, 4, 0.1],
        ['globalYAdjust', 'All LCI entry text Y offset', -20, 20, 0.5],
        ['trialClubX', 'Trial club X', 15, 180, 1],
        ['trialClubY', 'Trial club Y', 50, 100, 1],
        ['trialDateX', 'Trial date X', 15, 180, 1],
        ['trialDateY', 'Trial date Y', 60, 110, 1],
        ['trialSecretaryX', 'FTS name X', 170, 330, 1],
        ['trialSecretaryY', 'FTS name Y', 50, 100, 1],
        ['trialSecretaryEmailX', 'FTS email X', 170, 330, 1],
        ['trialSecretaryEmailY', 'FTS email Y', 60, 110, 1],
        ['breedX', 'Breed X', 20, 150, 1],
        ['breedY', 'Breed Y', 55, 110, 1],
        ['callNameX', 'Call name X', 35, 160, 1],
        ['callNameY', 'Call name Y', 95, 135, 1],
        ['registeredNameX', 'Registered name X', 75, 230, 1],
        ['registeredNameY', 'Registered name Y', 125, 165, 1],
        ['lciDivisionY', 'LCI division check row Y', 150, 190, 1],
        ['lciSmallX', 'LCI Small check X', 55, 115, 1],
        ['lciLargeX', 'LCI Large check X', 145, 215, 1],
        ['lciMixX', 'LCI SH Mix check X', 250, 345, 1],
        ['stakeCheckY', 'Stake check row Y', 180, 215, 1],
        ['openX', 'Open check X', 55, 115, 1],
        ['excellentX', 'Excellent check X', 145, 215, 1],
        ['veteranX', 'Veteran check X', 240, 315, 1],
        ['registrationX', 'Registration X', 35, 160, 1],
        ['registrationY', 'Registration Y', 200, 240, 1],
        ['dobX', 'DOB X', 240, 330, 1],
        ['dobY', 'DOB Y', 200, 240, 1],
        ['dogX', 'Dog check X', 225, 280, 1],
        ['bitchX', 'Bitch check X', 290, 350, 1],
        ['sexCheckY', 'Sex check row Y', 225, 265, 1],
        ['ownerX', 'Owner X', 70, 190, 1],
        ['ownerY', 'Owner Y', 250, 290, 1],
        ['addressX', 'Address X', 35, 170, 1],
        ['addressY', 'Address Y', 280, 320, 1],
        ['phoneX', 'Phone X', 35, 120, 1],
        ['phoneY', 'Phone Y', 310, 350, 1],
        ['cityX', 'City X', 30, 120, 1],
        ['cityY', 'City Y', 340, 380, 1],
        ['stateX', 'State X', 200, 270, 1],
        ['stateY', 'State Y', 340, 380, 1],
        ['zipX', 'ZIP X', 275, 350, 1],
        ['zipY', 'ZIP Y', 340, 380, 1],
        ['emailX', 'Email X', 35, 140, 1],
        ['emailY', 'Email Y', 370, 410, 1],
        ['regionX', 'Region X', 250, 340, 1],
        ['regionY', 'Region Y', 370, 410, 1],
        ['firstTimeEntryX', 'First-time entry check X', 15, 60, 1],
        ['firstTimeEntryY', 'First-time entry check Y', 405, 445, 1],
        ['changeInfoX', 'Info changed check X', 15, 60, 1],
        ['changeInfoY', 'Info changed check Y', 445, 485, 1],
        ['checkSize', 'Check box size', 4, 14, 0.5],
        ['signatureX', 'Signature text X', 180, 310, 1],
        ['signatureY', 'Signature text Y', 555, 595, 1],
    ];
    renderAlignmentControls(container, 'asfaLciEntryForm', layout, controls);
    renderAsfaLciEntryVisualEditor(layout);

    const tool = document.getElementById('asfaLciEntryAlignmentTool');
    if (tool) {
        tool.hidden = Boolean(trial && clean(trial.association || 'ASFA') !== 'ASFA');
    }
}

function renderAsfaLciEntryVisualEditor(layout) {
    const container = document.getElementById('asfaLciEntryVisualEditor');
    if (!container) {
        return;
    }
    const width = Number(layout.copyOffsetX || 396);
    const height = 612;
    const textItems = [
        { label: 'Club', xKey: 'trialClubX', yKey: 'trialClubY', small: true },
        { label: 'Trial Date', xKey: 'trialDateX', yKey: 'trialDateY', small: true },
        { label: 'FTS Name', xKey: 'trialSecretaryX', yKey: 'trialSecretaryY', small: true },
        { label: 'FTS Email', xKey: 'trialSecretaryEmailX', yKey: 'trialSecretaryEmailY', small: true },
        { label: 'Breed', xKey: 'breedX', yKey: 'breedY' },
        { label: 'Call Name', xKey: 'callNameX', yKey: 'callNameY' },
        { label: 'Registered Name', xKey: 'registeredNameX', yKey: 'registeredNameY' },
        { label: 'Registration', xKey: 'registrationX', yKey: 'registrationY', small: true },
        { label: 'DOB', xKey: 'dobX', yKey: 'dobY' },
        { label: 'Owner', xKey: 'ownerX', yKey: 'ownerY' },
        { label: 'Address', xKey: 'addressX', yKey: 'addressY', small: true },
        { label: 'Phone', xKey: 'phoneX', yKey: 'phoneY' },
        { label: 'City', xKey: 'cityX', yKey: 'cityY' },
        { label: 'State', xKey: 'stateX', yKey: 'stateY' },
        { label: 'ZIP', xKey: 'zipX', yKey: 'zipY' },
        { label: 'Email', xKey: 'emailX', yKey: 'emailY', small: true },
        { label: 'Region', xKey: 'regionX', yKey: 'regionY' },
        { label: 'Signature', xKey: 'signatureX', yKey: 'signatureY' },
    ];
    const checks = [
        { label: 'LCI Small', xKey: 'lciSmallX', yKey: 'lciDivisionY' },
        { label: 'LCI Large', xKey: 'lciLargeX', yKey: 'lciDivisionY' },
        { label: 'LCI SH Mix', xKey: 'lciMixX', yKey: 'lciDivisionY' },
        { label: 'Open', xKey: 'openX', yKey: 'stakeCheckY' },
        { label: 'Excellent', xKey: 'excellentX', yKey: 'stakeCheckY' },
        { label: 'Veteran', xKey: 'veteranX', yKey: 'stakeCheckY' },
        { label: 'Sex Dog', xKey: 'dogX', yKey: 'sexCheckY' },
        { label: 'Sex Bitch', xKey: 'bitchX', yKey: 'sexCheckY' },
        { label: 'First-time', xKey: 'firstTimeEntryX', yKey: 'firstTimeEntryY' },
        { label: 'Info changed', xKey: 'changeInfoX', yKey: 'changeInfoY' },
    ];
    container.innerHTML = `
        <p class="field-note">This is the left half of the official ASFA LCI entry form. LCI division, stake, sex, and first-time fields print as check boxes.</p>
        <div class="entry-sheet-stage">
            <svg class="entry-sheet-overlay" viewBox="0 0 ${width} ${height}" aria-label="ASFA LCI entry form overlay alignment editor">
                <image href="templates/asfa/EF-A-LCI-Entry-Form-Rev-08-24-half.png" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"></image>
            </svg>
        </div>
    `;
    const svg = container.querySelector('svg');
    textItems.forEach((item) => appendAsfaEntryTextItem(svg, layout, item));
    checks.forEach((item) => appendAsfaEntryCheckItem(svg, layout, item));
    enableAsfaLciEntryVisualDrag(svg);
}

function enableAsfaLciEntryVisualDrag(svg) {
    enableAsfaEntryVisualDragFor(svg, 'asfaLciEntryForm', getAsfaLciEntryLayout, renderAsfaLciEntryAlignmentTool);
}

function renderAsfaEntryVisualEditor(layout) {
    const container = document.getElementById('asfaEntryVisualEditor');
    if (!container) {
        return;
    }
    const width = Number(layout.copyOffsetX || 396);
    const height = 612;
    const textItems = [
        { label: 'Club', xKey: 'trialClubX', yKey: 'trialClubY', small: true },
        { label: 'Trial Date', xKey: 'trialDateX', yKey: 'trialDateY', small: true },
        { label: 'FTS Name', xKey: 'trialSecretaryX', yKey: 'trialSecretaryY', small: true },
        { label: 'FTS Email', xKey: 'trialSecretaryEmailX', yKey: 'trialSecretaryEmailY', small: true },
        { label: 'Breed', xKey: 'breedX', yKey: 'breedY' },
        { label: 'Call Name', xKey: 'callNameX', yKey: 'callNameY' },
        { label: 'Registered Name', xKey: 'registeredNameX', yKey: 'registeredNameY' },
        { label: 'Registration', xKey: 'registrationX', yKey: 'registrationY', small: true },
        { label: 'DOB', xKey: 'dobX', yKey: 'dobY' },
        { label: 'Owner', xKey: 'ownerX', yKey: 'ownerY' },
        { label: 'Address', xKey: 'addressX', yKey: 'addressY', small: true },
        { label: 'Phone', xKey: 'phoneX', yKey: 'phoneY' },
        { label: 'City', xKey: 'cityX', yKey: 'cityY' },
        { label: 'State', xKey: 'stateX', yKey: 'stateY' },
        { label: 'ZIP', xKey: 'zipX', yKey: 'zipY' },
        { label: 'Email', xKey: 'emailX', yKey: 'emailY', small: true },
        { label: 'Region', xKey: 'regionX', yKey: 'regionY' },
        { label: 'Signature', xKey: 'signatureX', yKey: 'signatureY' },
    ];
    const circles = [];
    const checks = [
        { label: 'Open', xKey: 'openX', yKey: 'stakeCheckY' },
        { label: 'FCH', xKey: 'fchX', yKey: 'stakeCheckY' },
        { label: 'Veteran', xKey: 'veteranX', yKey: 'stakeCheckY' },
        { label: 'Singles', xKey: 'singlesX', yKey: 'stakeCheckY' },
        { label: 'Provisional', xKey: 'provisionalX', yKey: 'stakeCheckY' },
        { label: 'Dog', xKey: 'dogX', yKey: 'sexCheckY' },
        { label: 'Bitch', xKey: 'bitchX', yKey: 'sexCheckY' },
        { label: 'Kennel', xKey: 'kennelX', yKey: 'kennelY' },
        { label: 'Breeder', xKey: 'breederX', yKey: 'breederY' },
        { label: 'Bench', xKey: 'benchX', yKey: 'benchY' },
        { label: 'Separate', xKey: 'ownerSeparationX', yKey: 'ownerSeparationY' },
        { label: 'First ASFA', xKey: 'firstAsfaTrialX', yKey: 'firstAsfaTrialY' },
        { label: 'First-time', xKey: 'firstTimeEntryX', yKey: 'firstTimeEntryY' },
        { label: 'Info changed', xKey: 'changeInfoX', yKey: 'changeInfoY' },
        { label: 'Dismissed', xKey: 'dismissedX', yKey: 'dismissedY' },
    ];
    container.innerHTML = `
        <p class="field-note">This is the left half of the official ASFA entry form. Drag red text, circles, and check boxes into place. Stakes and additional stakes print as check boxes.</p>
        <div class="entry-sheet-stage">
            <svg class="entry-sheet-overlay" viewBox="0 0 ${width} ${height}" aria-label="ASFA entry form overlay alignment editor">
                <image href="templates/asfa/EF-A-Entry-Form-Rev-06-26-half.png" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"></image>
            </svg>
        </div>
    `;
    const svg = container.querySelector('svg');
    textItems.forEach((item) => appendAsfaEntryTextItem(svg, layout, item));
    circles.forEach((item) => appendAsfaEntryCircleItem(svg, layout, item));
    checks.forEach((item) => appendAsfaEntryCheckItem(svg, layout, item));
    enableAsfaEntryVisualDrag(svg);
}

function asfaEntryDisplayY(layout, key) {
    return Number(layout[key] || 0) + Number(layout.globalYAdjust || 0);
}

function appendAsfaEntryTextItem(svg, layout, item) {
    const x = Number(layout[item.xKey] || 0);
    const y = asfaEntryDisplayY(layout, item.yKey);
    const fontSize = Number(item.small ? layout.smallFontSize : layout.fontSize);
    const group = svgElement('g', { class: 'entry-editor-item', 'data-type': 'text', 'data-x-key': item.xKey, 'data-y-key': item.yKey });
    group.appendChild(svgElement('rect', { x: x - 2, y: y - fontSize - 3, width: 76, height: fontSize + 7, fill: 'rgba(255,255,255,0.72)', stroke: '#b3261e' }));
    group.appendChild(svgElement('text', { x, y, 'font-size': String(fontSize), fill: '#b3261e', 'font-weight': '700' }, item.label));
    svg.appendChild(group);
}

function appendAsfaEntryCircleItem(svg, layout, item) {
    const cx = Number(layout[item.xKey] || 0);
    const cy = asfaEntryDisplayY(layout, item.yKey);
    const rx = Number(layout[item.rxKey] || 12);
    const ry = Number(layout[item.ryKey] || 7);
    const group = svgElement('g', { class: 'entry-editor-item', 'data-type': 'circle', 'data-x-key': item.xKey, 'data-y-key': item.yKey });
    group.appendChild(svgElement('ellipse', { cx, cy, rx, ry, fill: 'none', stroke: '#b3261e', 'stroke-width': '1.8' }));
    group.appendChild(svgElement('text', { x: cx + rx + 4, y: cy + 2, 'font-size': '6', fill: '#5c2b25' }, item.label));
    svg.appendChild(group);
}

function appendAsfaEntryCheckItem(svg, layout, item) {
    const x = Number(layout[item.xKey] || 0);
    const y = asfaEntryDisplayY(layout, item.yKey);
    const size = Number(layout.checkSize || 7);
    const group = svgElement('g', { class: 'entry-editor-item', 'data-type': 'check', 'data-x-key': item.xKey, 'data-y-key': item.yKey });
    group.appendChild(svgElement('rect', { x, y: y - size + 2, width: size, height: size, fill: 'none', stroke: '#b3261e', 'stroke-width': '1.8' }));
    group.appendChild(svgElement('text', { x: x + size + 4, y: y + 1, 'font-size': '6', fill: '#5c2b25' }, item.label));
    svg.appendChild(group);
}

function enableAsfaEntryVisualDrag(svg) {
    enableAsfaEntryVisualDragFor(svg, 'asfaEntryForm', getAsfaEntryLayout, renderAsfaEntryAlignmentTool);
}

function enableAsfaEntryVisualDragFor(svg, reportKey, getLayout, renderTool) {
    let drag = null;
    const pointFromEvent = (event) => {
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        return point.matrixTransform(svg.getScreenCTM().inverse());
    };
    svg.addEventListener('pointerdown', (event) => {
        if (isAlignmentLocked(reportKey)) {
            return;
        }
        const item = event.target.closest('.entry-editor-item');
        if (!item) {
            return;
        }
        event.preventDefault();
        item.setPointerCapture?.(event.pointerId);
        drag = { item, start: pointFromEvent(event), layout: { ...getLayout() } };
    });
    svg.addEventListener('pointermove', (event) => {
        if (!drag) {
            return;
        }
        const point = pointFromEvent(event);
        const dx = point.x - drag.start.x;
        const dy = point.y - drag.start.y;
        const layout = getLayout();
        const xKey = drag.item.dataset.xKey;
        const yKey = drag.item.dataset.yKey;
        layout[xKey] = Math.max(0, Math.round(Number(drag.layout[xKey] || 0) + dx));
        layout[yKey] = Math.max(0, Math.round(Number(drag.layout[yKey] || 0) + dy));
        saveFormAlignment();
        updateAsfaEntryVisualItem(drag.item, layout);
    });
    svg.addEventListener('pointerup', () => {
        if (drag) {
            renderTool(readForm());
        }
        drag = null;
    });
    svg.addEventListener('pointercancel', () => {
        drag = null;
    });
}

function updateAsfaEntryVisualItem(item, layout) {
    const x = Number(layout[item.dataset.xKey] || 0);
    const y = asfaEntryDisplayY(layout, item.dataset.yKey);
    if (item.dataset.type === 'circle') {
        const ellipse = item.querySelector('ellipse');
        const text = item.querySelector('text');
        const rx = Number(ellipse?.getAttribute('rx') || 12);
        ellipse?.setAttribute('cx', x);
        ellipse?.setAttribute('cy', y);
        text?.setAttribute('x', x + rx + 4);
        text?.setAttribute('y', y + 2);
        return;
    }
    if (item.dataset.type === 'check') {
        const rect = item.querySelector('rect');
        const text = item.querySelector('text');
        const size = Number(layout.checkSize || 7);
        rect?.setAttribute('x', x);
        rect?.setAttribute('y', y - size + 2);
        text?.setAttribute('x', x + size + 4);
        text?.setAttribute('y', y + 1);
        return;
    }
    const rect = item.querySelector('rect');
    const text = item.querySelector('text');
    rect?.setAttribute('x', x - 2);
    rect?.setAttribute('y', y - Number(text?.getAttribute('font-size') || 8) - 3);
    text?.setAttribute('x', x);
    text?.setAttribute('y', y);
}

function renderAsfaRecordVisualEditor(layout) {
    const container = document.getElementById('asfaRecordVisualEditor');
    if (!container) {
        return;
    }
    const width = 792;
    const height = 612;
    const textItems = [
        { key: 'breed', label: 'Breed', xKey: 'breedX', yKey: 'breedY', fontKey: 'headerFontSize' },
        { key: 'stake', label: 'Stake', xKey: 'stakeX', yKey: 'stakeY', fontKey: 'headerFontSize' },
        { key: 'flight', label: 'Flight', xKey: 'flightX', yKey: 'flightY', fontKey: 'headerFontSize' },
        { key: 'entered', label: '# Entered', xKey: 'enteredX', yKey: 'enteredY', fontKey: 'headerFontSize' },
        { key: 'refunds', label: 'Refunds', xKey: 'refundsX', yKey: 'refundsY', fontKey: 'headerFontSize' },
        { key: 'perCapita', label: '# Per Capita', xKey: 'perCapitaX', yKey: 'perCapitaY', fontKey: 'headerFontSize' },
        { key: 'call', label: 'Call Name', xKey: 'callNameX', yKey: 'callNameY', fontKey: 'bodyFontSize' },
        { key: 'reg', label: 'Registration', xKey: 'registrationX', yKey: 'registrationY', fontKey: 'bodyFontSize' },
        { key: 'preCode', label: '1Y', xKey: 'prelimCodeX', yKey: 'prelimCodeY', fontKey: 'codeFontSize', centered: true },
        { key: 'preJ1', label: 'J1', xKey: 'prelimJudge1X', yKey: 'prelimJudge1Y', fontKey: 'codeFontSize', centered: true },
        { key: 'preJ2', label: 'J2', xKey: 'prelimJudge2X', yKey: 'prelimJudge2Y', fontKey: 'codeFontSize', centered: true },
        { key: 'preTotal', label: 'Pre Total', xKey: 'prelimScoreX', yKey: 'prelimScoreY', fontKey: 'codeFontSize', centered: true },
        { key: 'finalCode', label: '2P', xKey: 'finalCodeX', yKey: 'finalCodeY', fontKey: 'codeFontSize', centered: true },
        { key: 'finalJ1', label: 'F J1', xKey: 'finalJudge1X', yKey: 'finalJudge1Y', fontKey: 'codeFontSize', centered: true },
        { key: 'finalJ2', label: 'F J2', xKey: 'finalJudge2X', yKey: 'finalJudge2Y', fontKey: 'codeFontSize', centered: true },
        { key: 'finalTotal', label: 'F Total', xKey: 'finalScoreX', yKey: 'finalScoreY', fontKey: 'codeFontSize', centered: true },
        { key: 'combined', label: 'Combined', xKey: 'combinedScoreX', yKey: 'combinedScoreY', fontKey: 'codeFontSize', centered: true },
        { key: 'stakeRunoffLabel', label: 'Stake RO label', xKey: 'stakesRunoffLabelX', yKey: 'stakesRunoffLabelY', fontKey: 'codeFontSize', centered: true },
        { key: 'stakeRunoffCode', label: 'Stake RO color', xKey: 'stakesRunoffCodeX', yKey: 'stakesRunoffCodeY', fontKey: 'codeFontSize', centered: true },
        { key: 'secondRunoffLabel', label: '2nd RO label', xKey: 'secondRunoffLabelX', yKey: 'secondRunoffLabelY', fontKey: 'codeFontSize', centered: true },
        { key: 'secondRunoffCode', label: '2nd RO score', xKey: 'secondRunoffCodeX', yKey: 'secondRunoffCodeY', fontKey: 'codeFontSize', centered: true },
        { key: 'bobRunoffLabel', label: 'BOB RO label', xKey: 'bobRunoffLabelX', yKey: 'bobRunoffLabelY', fontKey: 'codeFontSize', centered: true },
        { key: 'bobRunoffCode', label: 'BOB RO color', xKey: 'bobRunoffCodeX', yKey: 'bobRunoffCodeY', fontKey: 'codeFontSize', centered: true },
        { key: 'place', label: 'Place', xKey: 'placementX', yKey: 'placementY', fontKey: 'codeFontSize', centered: true },
        { key: 'judge1', label: 'Judge 1', xKey: 'judge1X', yKey: 'judge1Y', fontKey: 'bodyFontSize' },
        { key: 'judge2', label: 'Judge 2', xKey: 'judge2X', yKey: 'judge2Y', fontKey: 'bodyFontSize' },
        { key: 'club', label: 'Club', xKey: 'footerClubX', yKey: 'footerClubY', fontKey: 'bodyFontSize' },
        { key: 'date', label: 'Date', xKey: 'footerDateX', yKey: 'footerDateY', fontKey: 'bodyFontSize' },
        { key: 'fieldClerk', label: 'Field Clerk', xKey: 'fieldClerkX', yKey: 'fieldClerkY', fontKey: 'bodyFontSize' },
        { key: 'fieldSecretary', label: 'Field Secretary', xKey: 'fieldSecretaryX', yKey: 'fieldSecretaryY', fontKey: 'bodyFontSize' },
    ];

    container.innerHTML = `
        <p class="field-note">This is the actual ASFA record sheet. Drag the red labels or their corner handles into place, adjust font sizes above, then use Preview Record Sheet to test the generated PDF. Drag the row spacing handle to set the distance between hound rows.</p>
        <div class="record-sheet-stage">
            <svg class="record-sheet-overlay" viewBox="0 0 ${width} ${height}" aria-label="ASFA record sheet overlay alignment editor">
                <image href="/api/template-image/asfa-record" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"></image>
            </svg>
        </div>
    `;
    const svg = container.querySelector('svg');
    appendAsfaRecordRowSpacingGuides(svg, layout, textItems);

    textItems.forEach((item) => {
        const x = layout[item.xKey];
        const y = asfaRecordDisplayY(layout, item.yKey);
        const fontSize = Number(layout[item.fontKey] || 8);
        const anchor = item.centered ? 'middle' : 'start';
        const group = svgElement('g', { class: 'record-editor-item', 'data-type': 'text', 'data-x-key': item.xKey, 'data-y-key': item.yKey });
        group.appendChild(svgElement('rect', { x: item.centered ? x - 28 : x - 2, y: y - fontSize - 3, width: item.centered ? 56 : 72, height: fontSize + 7, fill: 'rgba(255,255,255,0.72)', stroke: '#b3261e' }));
        group.appendChild(svgElement('text', { x, y, 'font-size': String(fontSize), fill: '#b3261e', 'font-weight': '700', 'text-anchor': anchor }, item.label));
        group.appendChild(svgElement('rect', { class: 'record-editor-handle', x: (item.centered ? x + 24 : x + 66), y: y + 1, width: 6, height: 6, fill: '#b3261e' }));
        svg.appendChild(group);
    });

    enableAsfaRecordVisualDrag(svg);
}

function appendAsfaRecordRowSpacingGuides(svg, layout, textItems) {
    const resultBoxYKeys = [
        'callNameY',
        'registrationY',
        'combinedScoreY',
        'stakesRunoffLabelY',
        'stakesRunoffCodeY',
        'secondRunoffLabelY',
        'secondRunoffCodeY',
        'bobRunoffLabelY',
        'bobRunoffCodeY',
        'placementY',
    ];
    const rowItems = textItems.filter((item) => item.yKey.includes('prelim') || item.yKey.includes('final') || resultBoxYKeys.includes(item.yKey));
    rowItems.forEach((item) => {
        const x = layout[item.xKey];
        const y = asfaRecordDisplayY(layout, item.yKey) + Number(layout.rowHeight || 0);
        const anchor = item.centered ? 'middle' : 'start';
        svg.appendChild(svgElement('text', {
            x,
            y,
            'font-size': '6',
            fill: '#2f6f9f',
            opacity: '0.38',
            'font-weight': '700',
            'text-anchor': anchor,
            'pointer-events': 'none',
        }, item.label));
    });
    const baseY = asfaRecordDisplayY(layout, 'callNameY');
    const rowY = baseY + Number(layout.rowHeight || 0);
    const group = svgElement('g', {
        class: 'record-row-height-item',
        'data-type': 'row-height',
        'data-base-y': String(baseY),
    });
    group.appendChild(svgElement('line', { x1: 20, y1: rowY, x2: 772, y2: rowY, stroke: '#2f6f9f', 'stroke-width': '1', 'stroke-dasharray': '4 4', opacity: '0.65' }));
    group.appendChild(svgElement('rect', { class: 'record-editor-handle', x: 24, y: rowY - 5, width: 10, height: 10, fill: '#2f6f9f' }));
    group.appendChild(svgElement('text', { x: 40, y: rowY + 3, 'font-size': '8', fill: '#2f6f9f', 'font-weight': '700' }, 'Row spacing'));
    svg.appendChild(group);
}

function asfaRecordDisplayY(layout, key) {
    return Number(layout[key] || 0) + Number(layout.globalYAdjust || 0);
}

function enableAsfaRecordVisualDrag(svg) {
    let drag = null;
    const pointFromEvent = (event) => {
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        return point.matrixTransform(svg.getScreenCTM().inverse());
    };

    svg.addEventListener('pointerdown', (event) => {
        if (isAlignmentLocked('asfaRecordSheet')) {
            return;
        }
        const item = event.target.closest('.record-editor-item, .record-row-height-item');
        if (!item) {
            return;
        }
        event.preventDefault();
        item.setPointerCapture?.(event.pointerId);
        drag = {
            item,
            start: pointFromEvent(event),
            layout: { ...getAsfaRecordLayout() },
        };
    });

    svg.addEventListener('pointermove', (event) => {
        if (!drag) {
            return;
        }
        const point = pointFromEvent(event);
        const dx = point.x - drag.start.x;
        const dy = point.y - drag.start.y;
        const layout = getAsfaRecordLayout();
        if (drag.item.dataset.type === 'row-height') {
            layout.rowHeight = Math.max(8, Math.round((Number(drag.layout.rowHeight || 0) + dy) * 10) / 10);
            saveFormAlignment();
            updateAsfaRecordRowHeightItem(drag.item, layout);
            return;
        }
        const xKey = drag.item.dataset.xKey;
        const yKey = drag.item.dataset.yKey;
        layout[xKey] = Math.max(0, Math.round(Number(drag.layout[xKey] || 0) + dx));
        layout[yKey] = Math.max(0, Math.round(Number(drag.layout[yKey] || 0) + dy));
        saveFormAlignment();
        updateAsfaRecordVisualItem(drag.item, layout);
    });

    svg.addEventListener('pointerup', () => {
        if (drag) {
            renderAsfaRecordAlignmentTool(readForm());
        }
        drag = null;
    });
    svg.addEventListener('pointercancel', () => {
        drag = null;
    });
}

function updateAsfaRecordVisualItem(item, layout) {
    const x = layout[item.dataset.xKey];
    const y = asfaRecordDisplayY(layout, item.dataset.yKey);
    const rect = item.querySelector('rect');
    const text = item.querySelector('text');
    const handle = item.querySelector('.record-editor-handle');
    const width = Number(rect.getAttribute('width') || 72);
    const centered = text.getAttribute('text-anchor') === 'middle';
    rect.setAttribute('x', centered ? x - width / 2 : x - 2);
    rect.setAttribute('y', y - Number(text.getAttribute('font-size') || 8) - 3);
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    if (handle) {
        handle.setAttribute('x', centered ? x + width / 2 - 4 : x + width - 6);
        handle.setAttribute('y', y + 1);
    }
}

function updateAsfaRecordRowHeightItem(item, layout) {
    const baseY = Number(item.dataset.baseY || asfaRecordDisplayY(layout, 'callNameY'));
    const rowY = baseY + Number(layout.rowHeight || 0);
    const line = item.querySelector('line');
    const handle = item.querySelector('.record-editor-handle');
    const text = item.querySelector('text');
    if (line) {
        line.setAttribute('y1', rowY);
        line.setAttribute('y2', rowY);
    }
    if (handle) {
        handle.setAttribute('y', rowY - 5);
    }
    if (text) {
        text.setAttribute('y', rowY + 3);
    }
}

function renderAsfaJudgeAlignmentTool(trial) {
    const container = document.getElementById('asfaJudgeAlignmentControls');
    if (!container) {
        return;
    }
    const layout = getAsfaJudgeLayout();
    const controls = [
        ['fontSize', 'Filled text font size', 5, 14, 0.5],
        ['circleWeight', 'Circle weight', 0.5, 4, 0.1],
        ['globalYAdjust', 'All overlay Y offset', -12, 12, 0.5],
        ['rightFormYAdjust', 'Right form Y offset', -12, 12, 0.5],
        ['clubX', 'Host club X', 60, 170, 1],
        ['clubY', 'Host club Y', 70, 130, 1],
        ['dateX', 'Date X', 235, 340, 1],
        ['dateY', 'Date Y', 70, 130, 1],
        ['breedCircleY', 'Breed circle Y', 105, 150, 1],
        ['breedCircleW', 'Breed circle width', 5, 18, 0.5],
        ['breedCircleH', 'Breed circle height', 4, 14, 0.5],
        ['otherBreedX', 'Other breed X', 250, 335, 1],
        ['otherBreedY', 'Other breed Y', 145, 185, 1],
        ['stakeCircleY', 'Stake circle Y', 128, 170, 1],
        ['stakeCircleW', 'Stake circle width', 7, 24, 0.5],
        ['stakeCircleH', 'Stake circle height', 4, 16, 0.5],
        ['provisionalStakeX', 'Provisional circle X', 270, 350, 1],
        ['mixedTextX', 'Mixed text X', 250, 340, 1],
        ['mixedTextY', 'Mixed text Y', 145, 190, 1],
        ['lciCircleY', 'LCI type circle Y', 150, 185, 1],
        ['lciLargeX', 'LCI Large circle X', 60, 130, 1],
        ['lciSmallX', 'LCI Small circle X', 130, 205, 1],
        ['lciShMixX', 'LCI SH Mix circle X', 200, 285, 1],
        ['lciCircleW', 'LCI type circle width', 10, 36, 0.5],
        ['lciCircleH', 'LCI type circle height', 4, 16, 0.5],
        ['flightCircleX', 'Flight A circle X', 35, 100, 1],
        ['flightCircleY', 'Flight A circle Y', 150, 185, 1],
        ['flightCircleW', 'Flight circle width', 5, 18, 0.5],
        ['flightCircleH', 'Flight circle height', 4, 14, 0.5],
        ['phaseCircleX', 'Prelim circle X', 35, 100, 1],
        ['phaseCircleY', 'Prelim circle Y', 195, 235, 1],
        ['phaseCircleW', 'Prelim circle width', 8, 28, 0.5],
        ['phaseCircleH', 'Prelim circle height', 4, 16, 0.5],
        ['finalPhaseCircleX', 'Final circle X', 80, 145, 1],
        ['finalPhaseCircleY', 'Final circle Y', 195, 235, 1],
        ['finalPhaseCircleW', 'Final circle width', 8, 28, 0.5],
        ['finalPhaseCircleH', 'Final circle height', 4, 16, 0.5],
        ['bobPhaseCircleX', 'BOB circle X', 140, 205, 1],
        ['bobPhaseCircleY', 'BOB circle Y', 175, 215, 1],
        ['bobPhaseCircleW', 'BOB circle width', 8, 28, 0.5],
        ['bobPhaseCircleH', 'BOB circle height', 4, 16, 0.5],
        ['bifPhaseCircleX', 'BIF circle X', 215, 280, 1],
        ['bifPhaseCircleY', 'BIF circle Y', 175, 215, 1],
        ['bifPhaseCircleW', 'BIF circle width', 8, 28, 0.5],
        ['bifPhaseCircleH', 'BIF circle height', 4, 16, 0.5],
        ['biePhaseCircleX', 'BIE circle X', 290, 355, 1],
        ['biePhaseCircleY', 'BIE circle Y', 175, 215, 1],
        ['biePhaseCircleW', 'BIE circle width', 8, 28, 0.5],
        ['biePhaseCircleH', 'BIE circle height', 4, 16, 0.5],
        ['courseCircleY', 'Course # circle Y', 195, 235, 1],
        ['courseCircleXAdjust', 'Course # circle X offset', -50, 50, 0.5],
        ['courseCircleW', 'Course # circle width', 4, 16, 0.5],
        ['courseCircleH', 'Course # circle height', 4, 16, 0.5],
        ['phaseTextX', 'Runoff/tie text X', 35, 140, 1],
        ['phaseTextY', 'Runoff/tie text Y', 175, 215, 1],
        ['judgeX', 'Judge name X', 95, 220, 1],
        ['judgeY', 'Judge name Y', 215, 255, 1],
        ['judgeNumberCircleX', 'Judge # circle X', 35, 100, 1],
        ['judgeNumber1CircleY', 'Judge #1 circle Y', 220, 245, 1],
        ['judgeNumber2CircleY', 'Judge #2 circle Y', 238, 265, 1],
        ['judgeNumberCircleW', 'Judge # circle width', 5, 18, 0.5],
        ['judgeNumberCircleH', 'Judge # circle height', 4, 14, 0.5],
        ['colorStrikeTopY', 'Unused color X top Y', 245, 310, 1],
        ['colorStrikeBottomY', 'Unused color X bottom Y', 430, 540, 1],
        ['yellowColumnX', 'Yellow unused mark X', 175, 245, 1],
        ['pinkColumnX', 'Pink unused mark X', 255, 325, 1],
        ['blueColumnX', 'Blue unused mark X', 335, 405, 1],
        ['colorColumnW', 'Unused color mark width', 35, 95, 1],
    ];
    renderAlignmentControls(container, 'asfaJudgeSheet', layout, controls);
    renderAsfaJudgeVisualEditor(layout);

    const tool = document.getElementById('asfaJudgeAlignmentTool');
    if (tool) {
        tool.hidden = Boolean(trial && clean(trial.association || 'ASFA') !== 'ASFA');
    }
    renderAsfaSecretaryAlignmentTool(trial);
}

function renderAsfaSecretaryAlignmentTool(trial) {
    const container = document.getElementById('asfaSecretaryAlignmentControls');
    if (!container) {
        return;
    }
    const layout = getAsfaSecretaryLayout();
    const controls = [
        ['fontSize', 'Filled text font size', 6, 14, 0.5],
        ['circleWeight', 'Circle weight', 0.5, 4, 0.1],
        ['globalYAdjust', 'All secretary text Y offset', -20, 20, 0.5],
        ['clubX', 'Page 1 club X', 80, 180, 1],
        ['clubY', 'Page 1 club Y', 100, 150, 1],
        ['regionX', 'Region X', 450, 535, 1],
        ['regionY', 'Region Y', 100, 150, 1],
        ['chairX', 'Chair X', 160, 260, 1],
        ['chairY', 'Chair Y', 135, 180, 1],
        ['emailX', 'FTS email X', 140, 240, 1],
        ['emailY', 'FTS email Y', 170, 215, 1],
        ['dateX', 'Trial date X', 80, 160, 1],
        ['dateY', 'Trial date Y', 205, 250, 1],
        ['locationX', 'Location X', 280, 380, 1],
        ['locationY', 'Location Y', 205, 250, 1],
        ['q1YesX', 'Q1 Yes X', 430, 485, 1],
        ['q1NoX', 'Q1 No X', 475, 530, 1],
        ['q1Y', 'Q1 circle Y', 250, 292, 1],
        ['q2YesX', 'Q2 Yes X', 455, 510, 1],
        ['q2NoX', 'Q2 No X', 500, 555, 1],
        ['q2Y', 'Q2 circle Y', 370, 415, 1],
        ['q3YesX', 'Q3 Yes X', 455, 510, 1],
        ['q3NoX', 'Q3 No X', 500, 555, 1],
        ['q3Y', 'Q3 circle Y', 420, 465, 1],
        ['q4YesX', 'Q4 Yes X', 455, 510, 1],
        ['q4NoX', 'Q4 No X', 500, 555, 1],
        ['q4Y', 'Q4 circle Y', 505, 550, 1],
        ['q5YesX', 'Q5 Yes X', 455, 510, 1],
        ['q5NoX', 'Q5 No X', 500, 555, 1],
        ['q5Y', 'Q5 circle Y', 555, 605, 1],
        ['q6YesX', 'Q6 Yes X', 455, 510, 1],
        ['q6NoX', 'Q6 No X', 500, 555, 1],
        ['q6Y', 'Q6 circle Y', 605, 655, 1],
        ['answerCircleW', 'Answer circle width', 6, 24, 0.5],
        ['answerCircleH', 'Answer circle height', 4, 16, 0.5],
        ['notesX', 'Judge notes X', 50, 130, 1],
        ['notesY', 'Judge notes Y', 315, 365, 1],
        ['page2ClubX', 'Page 2 club X', 80, 160, 1],
        ['page2ClubY', 'Page 2 club Y', 95, 135, 1],
        ['page2DateX', 'Page 2 date X', 330, 430, 1],
        ['page2DateY', 'Page 2 date Y', 95, 135, 1],
        ['entryFirstRowY', 'First entry row Y', 130, 165, 0.5],
        ['entryRowHeight', 'Entry row spacing', 10, 18, 0.1],
        ['openX', 'Open column X', 180, 225, 1],
        ['fchX', 'FCH column X', 210, 250, 1],
        ['vetsX', 'Vets column X', 245, 285, 1],
        ['entryTotalX', 'Entry total X', 285, 330, 1],
        ['breederX', 'Breeder X', 335, 380, 1],
        ['kennelX', 'Kennel X', 385, 430, 1],
        ['benchX', 'Bench X', 430, 475, 1],
        ['specialTotalX', 'Special total X', 475, 530, 1],
        ['totalsY', 'Totals row Y', 450, 500, 1],
        ['breedFeeX', 'Breed fee X', 500, 575, 1],
        ['breedFeeY', 'Breed fee Y', 520, 565, 1],
        ['specialFeeX', 'Special fee X', 500, 575, 1],
        ['specialFeeY', 'Special fee Y', 560, 600, 1],
        ['recordsFeeX', 'Records fee X', 500, 575, 1],
        ['recordsFeeY', 'Records fee Y', 600, 640, 1],
        ['checkAmountX', 'Check amount X', 500, 575, 1],
        ['checkAmountY', 'Check amount Y', 635, 675, 1],
        ['paypalAmountX', 'PayPal amount X', 500, 575, 1],
        ['paypalAmountY', 'PayPal amount Y', 675, 710, 1],
        ['paypalIdX', 'PayPal ID X', 300, 420, 1],
        ['paypalIdY', 'PayPal ID Y', 700, 740, 1],
    ];
    renderAlignmentControls(container, 'asfaSecretaryReport', layout, controls);
    renderAsfaSecretaryVisualEditor(layout);
    const tool = document.getElementById('asfaSecretaryAlignmentTool');
    if (tool) {
        tool.hidden = Boolean(trial && clean(trial.association || 'ASFA') !== 'ASFA');
    }
}

function getAsfaSecretaryLayout() {
    formAlignment = normalizeFormAlignment(formAlignment);
    return formAlignment.asfaSecretaryReport;
}

function renderAsfaSecretaryVisualEditor(layout) {
    const container = document.getElementById('asfaSecretaryVisualEditor');
    if (!container) {
        return;
    }
    const width = 612;
    const height = 792;
    const page1Text = [
        { label: 'Club', xKey: 'clubX', yKey: 'clubY' },
        { label: 'Region', xKey: 'regionX', yKey: 'regionY' },
        { label: 'Chair', xKey: 'chairX', yKey: 'chairY' },
        { label: 'Email', xKey: 'emailX', yKey: 'emailY' },
        { label: 'Date', xKey: 'dateX', yKey: 'dateY' },
        { label: 'Location', xKey: 'locationX', yKey: 'locationY' },
        { label: 'Notes', xKey: 'notesX', yKey: 'notesY' },
    ];
    const page1Circles = [
        { label: 'Q1 Yes', xKey: 'q1YesX', yKey: 'q1Y' },
        { label: 'Q1 No', xKey: 'q1NoX', yKey: 'q1Y' },
        { label: 'Q2 Yes', xKey: 'q2YesX', yKey: 'q2Y' },
        { label: 'Q2 No', xKey: 'q2NoX', yKey: 'q2Y' },
        { label: 'Q3 Yes', xKey: 'q3YesX', yKey: 'q3Y' },
        { label: 'Q3 No', xKey: 'q3NoX', yKey: 'q3Y' },
        { label: 'Q4 Yes', xKey: 'q4YesX', yKey: 'q4Y' },
        { label: 'Q4 No', xKey: 'q4NoX', yKey: 'q4Y' },
        { label: 'Q5 Yes', xKey: 'q5YesX', yKey: 'q5Y' },
        { label: 'Q5 No', xKey: 'q5NoX', yKey: 'q5Y' },
        { label: 'Q6 Yes', xKey: 'q6YesX', yKey: 'q6Y' },
        { label: 'Q6 No', xKey: 'q6NoX', yKey: 'q6Y' },
    ];
    const page2Text = [
        { label: 'Club', xKey: 'page2ClubX', yKey: 'page2ClubY' },
        { label: 'Date', xKey: 'page2DateX', yKey: 'page2DateY' },
        { label: 'Open', xKey: 'openX', yKey: 'entryFirstRowY', centered: true },
        { label: 'FCH', xKey: 'fchX', yKey: 'entryFirstRowY', centered: true },
        { label: 'Vets', xKey: 'vetsX', yKey: 'entryFirstRowY', centered: true },
        { label: 'Total', xKey: 'entryTotalX', yKey: 'entryFirstRowY', centered: true },
        { label: 'Breeder', xKey: 'breederX', yKey: 'totalsY', centered: true },
        { label: 'Kennel', xKey: 'kennelX', yKey: 'totalsY', centered: true },
        { label: 'Bench', xKey: 'benchX', yKey: 'totalsY', centered: true },
        { label: 'Special Total', xKey: 'specialTotalX', yKey: 'totalsY', centered: true },
        { label: 'Breed Fee', xKey: 'breedFeeX', yKey: 'breedFeeY', right: true },
        { label: 'Special Fee', xKey: 'specialFeeX', yKey: 'specialFeeY', right: true },
        { label: 'Records Fee', xKey: 'recordsFeeX', yKey: 'recordsFeeY', right: true },
        { label: 'Check Amt', xKey: 'checkAmountX', yKey: 'checkAmountY', right: true },
        { label: 'PayPal Amt', xKey: 'paypalAmountX', yKey: 'paypalAmountY', right: true },
        { label: 'PayPal ID', xKey: 'paypalIdX', yKey: 'paypalIdY' },
    ];
    container.innerHTML = `
        <p class="field-note">Drag the red labels and circles on the actual secretary report pages. The lock checkbox above disables dragging and numeric edits.</p>
        <div class="secretary-page-stage">
            <h4>Page 1</h4>
            <svg class="secretary-sheet-overlay" viewBox="0 0 ${width} ${height}" aria-label="ASFA secretary report page 1 alignment editor">
                <image href="/api/template-image/asfa-secretary-1" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"></image>
            </svg>
        </div>
        <div class="secretary-page-stage">
            <h4>Page 2</h4>
            <svg class="secretary-sheet-overlay" viewBox="0 0 ${width} ${height}" aria-label="ASFA secretary report page 2 alignment editor">
                <image href="/api/template-image/asfa-secretary-2" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"></image>
            </svg>
        </div>
    `;
    const [page1, page2] = container.querySelectorAll('svg');
    page1Text.forEach((item) => appendSecretaryTextItem(page1, layout, item));
    page1Circles.forEach((item) => appendSecretaryCircleItem(page1, layout, item));
    page2Text.forEach((item) => appendSecretaryTextItem(page2, layout, item));
    appendSecretaryRowSpacingItem(page2, layout);
    enableAsfaSecretaryVisualDrag(page1);
    enableAsfaSecretaryVisualDrag(page2);
}

function secretaryDisplayY(layout, key) {
    return Number(layout[key] || 0) + Number(layout.globalYAdjust || 0);
}

function appendSecretaryTextItem(svg, layout, item) {
    const x = Number(layout[item.xKey] || 0);
    const y = secretaryDisplayY(layout, item.yKey);
    const fontSize = Number(layout.fontSize || 9);
    const anchor = item.centered ? 'middle' : (item.right ? 'end' : 'start');
    const group = svgElement('g', { class: 'secretary-editor-item', 'data-type': 'text', 'data-x-key': item.xKey, 'data-y-key': item.yKey });
    group.appendChild(svgElement('rect', { x: item.centered ? x - 30 : item.right ? x - 60 : x - 2, y: y - fontSize - 3, width: item.centered ? 60 : 70, height: fontSize + 7, fill: 'rgba(255,255,255,0.72)', stroke: '#b3261e' }));
    group.appendChild(svgElement('text', { x, y, 'font-size': String(fontSize), fill: '#b3261e', 'font-weight': '700', 'text-anchor': anchor }, item.label));
    svg.appendChild(group);
}

function appendSecretaryCircleItem(svg, layout, item) {
    const cx = Number(layout[item.xKey] || 0);
    const cy = secretaryDisplayY(layout, item.yKey);
    const rx = Number(layout.answerCircleW || 13);
    const ry = Number(layout.answerCircleH || 7);
    const group = svgElement('g', { class: 'secretary-editor-item', 'data-type': 'circle', 'data-x-key': item.xKey, 'data-y-key': item.yKey });
    group.appendChild(svgElement('ellipse', { cx, cy, rx, ry, fill: 'none', stroke: '#b3261e', 'stroke-width': '1.8' }));
    group.appendChild(svgElement('text', { x: cx + rx + 4, y: cy + 2, 'font-size': '6', fill: '#5c2b25' }, item.label));
    group.appendChild(svgElement('rect', { class: 'secretary-editor-handle', x: cx + rx - 2, y: cy + ry - 2, width: 6, height: 6, fill: '#b3261e' }));
    svg.appendChild(group);
}

function appendSecretaryRowSpacingItem(svg, layout) {
    const y = secretaryDisplayY(layout, 'entryFirstRowY') + Number(layout.entryRowHeight || 14);
    const group = svgElement('g', { class: 'secretary-editor-item', 'data-type': 'row-height', 'data-base-y': String(secretaryDisplayY(layout, 'entryFirstRowY')) });
    group.appendChild(svgElement('line', { x1: 75, y1: y, x2: 520, y2: y, stroke: '#2f6f9f', 'stroke-width': '1', 'stroke-dasharray': '4 4', opacity: '0.65' }));
    group.appendChild(svgElement('rect', { class: 'secretary-editor-handle', x: 78, y: y - 5, width: 10, height: 10, fill: '#2f6f9f' }));
    group.appendChild(svgElement('text', { x: 92, y: y + 3, 'font-size': '8', fill: '#2f6f9f', 'font-weight': '700' }, 'Entry row spacing'));
    svg.appendChild(group);
}

function enableAsfaSecretaryVisualDrag(svg) {
    let drag = null;
    const pointFromEvent = (event) => {
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        return point.matrixTransform(svg.getScreenCTM().inverse());
    };
    svg.addEventListener('pointerdown', (event) => {
        if (isAlignmentLocked('asfaSecretaryReport')) {
            return;
        }
        const handle = event.target.closest('.secretary-editor-handle');
        const item = event.target.closest('.secretary-editor-item');
        if (!item) {
            return;
        }
        event.preventDefault();
        item.setPointerCapture?.(event.pointerId);
        drag = {
            item,
            resize: Boolean(handle),
            start: pointFromEvent(event),
            layout: { ...getAsfaSecretaryLayout() },
        };
    });
    svg.addEventListener('pointermove', (event) => {
        if (!drag) {
            return;
        }
        const point = pointFromEvent(event);
        const dx = point.x - drag.start.x;
        const dy = point.y - drag.start.y;
        const layout = getAsfaSecretaryLayout();
        if (drag.item.dataset.type === 'row-height') {
            layout.entryRowHeight = Math.max(8, Math.round((Number(drag.layout.entryRowHeight || 14) + dy) * 10) / 10);
        } else if (drag.item.dataset.type === 'circle' && drag.resize) {
            layout.answerCircleW = Math.max(3, Math.round((Number(drag.layout.answerCircleW || 13) + dx) * 10) / 10);
            layout.answerCircleH = Math.max(3, Math.round((Number(drag.layout.answerCircleH || 7) + dy) * 10) / 10);
        } else {
            const xKey = drag.item.dataset.xKey;
            const yKey = drag.item.dataset.yKey;
            layout[xKey] = Math.max(0, Math.round(Number(drag.layout[xKey] || 0) + dx));
            layout[yKey] = Math.max(0, Math.round(Number(drag.layout[yKey] || 0) + dy));
        }
        saveFormAlignment();
        updateAsfaSecretaryVisualItem(drag.item, layout);
    });
    svg.addEventListener('pointerup', () => {
        if (drag) {
            renderAsfaSecretaryAlignmentTool(readForm());
        }
        drag = null;
    });
    svg.addEventListener('pointercancel', () => {
        drag = null;
    });
}

function updateAsfaSecretaryVisualItem(item, layout) {
    if (item.dataset.type === 'row-height') {
        const baseY = Number(item.dataset.baseY || secretaryDisplayY(layout, 'entryFirstRowY'));
        const y = baseY + Number(layout.entryRowHeight || 14);
        const line = item.querySelector('line');
        const handle = item.querySelector('.secretary-editor-handle');
        const text = item.querySelector('text');
        line?.setAttribute('y1', y);
        line?.setAttribute('y2', y);
        handle?.setAttribute('y', y - 5);
        text?.setAttribute('y', y + 3);
        return;
    }
    if (item.dataset.type === 'circle') {
        const cx = Number(layout[item.dataset.xKey] || 0);
        const cy = secretaryDisplayY(layout, item.dataset.yKey);
        const rx = Number(layout.answerCircleW || 13);
        const ry = Number(layout.answerCircleH || 7);
        const ellipse = item.querySelector('ellipse');
        const label = item.querySelector('text');
        const handle = item.querySelector('.secretary-editor-handle');
        ellipse?.setAttribute('cx', cx);
        ellipse?.setAttribute('cy', cy);
        ellipse?.setAttribute('rx', rx);
        ellipse?.setAttribute('ry', ry);
        label?.setAttribute('x', cx + rx + 4);
        label?.setAttribute('y', cy + 2);
        handle?.setAttribute('x', cx + rx - 2);
        handle?.setAttribute('y', cy + ry - 2);
        return;
    }
    const x = Number(layout[item.dataset.xKey] || 0);
    const y = secretaryDisplayY(layout, item.dataset.yKey);
    const rect = item.querySelector('rect');
    const text = item.querySelector('text');
    const width = Number(rect?.getAttribute('width') || 70);
    const anchor = text?.getAttribute('text-anchor') || 'start';
    rect?.setAttribute('x', anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width + 10 : x - 2);
    rect?.setAttribute('y', y - Number(text?.getAttribute('font-size') || 9) - 3);
    text?.setAttribute('x', x);
    text?.setAttribute('y', y);
}

function renderAlignmentControls(container, reportKey, layout, controls) {
    const locked = isAlignmentLocked(reportKey);
    container.innerHTML = '';
    const details = document.createElement('details');
    details.className = 'alignment-details';
    details.open = false;
    const summary = document.createElement('summary');
    summary.textContent = 'Alignment controls';
    const lockLabel = document.createElement('label');
    lockLabel.className = 'switch compact-switch alignment-lock';
    const lock = document.createElement('input');
    lock.type = 'checkbox';
    lock.checked = locked;
    lock.addEventListener('change', () => {
        formAlignment = normalizeFormAlignment(formAlignment);
        formAlignment.alignmentLocks[reportKey] = lock.checked;
        saveFormAlignment();
        if (reportKey === 'asfaJudgeSheet') {
            renderAsfaJudgeAlignmentTool(readForm());
        } else if (reportKey === 'asfaRecordSheet') {
            renderAsfaRecordAlignmentTool(readForm());
        } else if (reportKey === 'asfaSecretaryReport') {
            renderAsfaSecretaryAlignmentTool(readForm());
        } else if (reportKey === 'asfaEntryForm') {
            renderAsfaEntryAlignmentTool(readForm());
        } else if (reportKey === 'asfaLciEntryForm') {
            renderAsfaLciEntryAlignmentTool(readForm());
        } else if (reportKey === 'asfaDrawSheet') {
            renderAsfaDrawAlignmentTool(readForm());
        }
    });
    const lockText = document.createElement('span');
    lockText.textContent = 'Lock alignment controls';
    lockLabel.append(lock, lockText);
    details.appendChild(summary);
    details.appendChild(lockLabel);
    const grid = document.createElement('div');
    grid.className = 'alignment-grid';
    controls.forEach(([key, label, min, max, step]) => {
        const field = document.createElement('label');
        field.className = 'alignment-control';
        const title = document.createElement('span');
        title.textContent = label;
        const row = document.createElement('div');
        row.className = 'alignment-control-row';
        const range = document.createElement('input');
        range.type = 'range';
        range.min = min;
        range.max = max;
        range.step = step;
        range.value = layout[key];
        range.disabled = locked;
        const number = document.createElement('input');
        number.type = 'number';
        number.step = 'any';
        number.value = layout[key];
        number.disabled = locked;
        const update = (value) => {
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) {
                return;
            }
            formAlignment[reportKey][key] = numeric;
            range.value = numeric;
            number.value = numeric;
            saveFormAlignment();
            if (reportKey === 'asfaJudgeSheet') {
                renderAsfaJudgeVisualEditor(formAlignment.asfaJudgeSheet);
            } else if (reportKey === 'asfaRecordSheet') {
                renderAsfaRecordVisualEditor(formAlignment.asfaRecordSheet);
            } else if (reportKey === 'asfaSecretaryReport') {
                renderAsfaSecretaryVisualEditor(formAlignment.asfaSecretaryReport);
            } else if (reportKey === 'asfaEntryForm') {
                renderAsfaEntryVisualEditor(formAlignment.asfaEntryForm);
            } else if (reportKey === 'asfaLciEntryForm') {
                renderAsfaLciEntryVisualEditor(formAlignment.asfaLciEntryForm);
            } else if (reportKey === 'asfaDrawSheet') {
                renderAsfaDrawAlignmentTool(readForm());
            }
        };
        range.addEventListener('input', () => update(range.value));
        number.addEventListener('change', () => update(number.value));
        row.append(range, number);
        field.append(title, row);
        grid.appendChild(field);
    });
    details.appendChild(grid);
    container.appendChild(details);
}

function renderAsfaJudgeVisualEditor(layout) {
    const container = document.getElementById('asfaJudgeVisualEditor');
    if (!container) {
        return;
    }
    const width = 792;
    const height = 612;
    const formX = 36;
    const textItems = [
        { key: 'club', label: 'Club', xKey: 'clubX', yKey: 'clubY' },
        { key: 'date', label: 'Date', xKey: 'dateX', yKey: 'dateY' },
        { key: 'mixedText', label: 'Mixed text', xKey: 'mixedTextX', yKey: 'mixedTextY' },
        { key: 'phaseText', label: 'Tie text', xKey: 'phaseTextX', yKey: 'phaseTextY' },
        { key: 'judge', label: 'Judge name', xKey: 'judgeX', yKey: 'judgeY' },
    ];
    const ovalItems = [
        { key: 'breed', label: 'Breed sample (RR)', cx: 227, cyKey: 'breedCircleY', rxKey: 'breedCircleW', ryKey: 'breedCircleH' },
        { key: 'stake', label: 'Stake sample (Open)', cx: 65, cyKey: 'stakeCircleY', rxKey: 'stakeCircleW', ryKey: 'stakeCircleH' },
        { key: 'provisionalStake', label: 'Provisional', cxKey: 'provisionalStakeX', cyKey: 'stakeCircleY', rxKey: 'stakeCircleW', ryKey: 'stakeCircleH' },
        { key: 'lciLarge', label: 'LCI Large', cxKey: 'lciLargeX', cyKey: 'lciCircleY', rxKey: 'lciCircleW', ryKey: 'lciCircleH' },
        { key: 'lciSmall', label: 'LCI Small', cxKey: 'lciSmallX', cyKey: 'lciCircleY', rxKey: 'lciCircleW', ryKey: 'lciCircleH' },
        { key: 'lciShMix', label: 'LCI SH Mix', cxKey: 'lciShMixX', cyKey: 'lciCircleY', rxKey: 'lciCircleW', ryKey: 'lciCircleH' },
        { key: 'flight', label: 'Flight A', cxKey: 'flightCircleX', cyKey: 'flightCircleY', rxKey: 'flightCircleW', ryKey: 'flightCircleH' },
        { key: 'prelim', label: 'Prelim', cxKey: 'phaseCircleX', cyKey: 'phaseCircleY', rxKey: 'phaseCircleW', ryKey: 'phaseCircleH' },
        { key: 'final', label: 'Final', cxKey: 'finalPhaseCircleX', cyKey: 'finalPhaseCircleY', rxKey: 'finalPhaseCircleW', ryKey: 'finalPhaseCircleH' },
        { key: 'bob', label: 'BOB', cxKey: 'bobPhaseCircleX', cyKey: 'bobPhaseCircleY', rxKey: 'bobPhaseCircleW', ryKey: 'bobPhaseCircleH' },
        { key: 'bif', label: 'BIF', cxKey: 'bifPhaseCircleX', cyKey: 'bifPhaseCircleY', rxKey: 'bifPhaseCircleW', ryKey: 'bifPhaseCircleH' },
        { key: 'bie', label: 'BIE', cxKey: 'biePhaseCircleX', cyKey: 'biePhaseCircleY', rxKey: 'biePhaseCircleW', ryKey: 'biePhaseCircleH' },
        { key: 'course1', label: 'Course # sample', baseCx: 164, xAdjustKey: 'courseCircleXAdjust', cyKey: 'courseCircleY', rxKey: 'courseCircleW', ryKey: 'courseCircleH' },
        { key: 'judge1', label: 'Judge #1', cxKey: 'judgeNumberCircleX', cyKey: 'judgeNumber1CircleY', rxKey: 'judgeNumberCircleW', ryKey: 'judgeNumberCircleH' },
        { key: 'judge2', label: 'Judge #2', cxKey: 'judgeNumberCircleX', cyKey: 'judgeNumber2CircleY', rxKey: 'judgeNumberCircleW', ryKey: 'judgeNumberCircleH' },
    ];
    const strikeItems = [
        { key: 'yellowStrike', label: 'Yellow unused mark', xKey: 'yellowColumnX' },
        { key: 'pinkStrike', label: 'Pink unused mark', xKey: 'pinkColumnX' },
        { key: 'blueStrike', label: 'Blue unused mark', xKey: 'blueColumnX' },
    ];

    container.innerHTML = `
        <p class="field-note">This is the actual ASFA judge sheet. Drag text, red ovals, and unused-color X marks into place, then use Preview Judge Sheet to test the real PDF. Breed, stake, LCI type, and course number use mapped X positions; this editor adjusts their shared row height and circle size. Judge #1 and #2 targets are both shown for calibration, but each printed judge sheet circles only one.</p>
        <div class="judge-sheet-stage">
            <svg class="judge-sheet-overlay" viewBox="0 0 ${width} ${height}" aria-label="ASFA judge sheet overlay alignment editor">
                <image href="/api/template-image/asfa-judge" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none"></image>
            </svg>
        </div>
    `;
    const svg = container.querySelector('svg');
    appendAsfaJudgeGuideOvals(svg, formX, layout);

    textItems.forEach((item) => {
        const x = formX + layout[item.xKey];
        const y = asfaJudgeDisplayY(layout, item.yKey);
        const group = svgElement('g', { class: 'judge-editor-item', 'data-type': 'text', 'data-x-key': item.xKey, 'data-y-key': item.yKey, 'data-form-x': formX });
        group.appendChild(svgElement('rect', { x: x - 2, y: y - 10, width: 76, height: 14, fill: 'rgba(237,248,244,0.86)', stroke: '#176a59' }));
        group.appendChild(svgElement('text', { x, y, 'font-size': '7', fill: '#123b33' }, item.label));
        svg.appendChild(group);
    });

    ovalItems.forEach((item) => {
        const cx = formX + asfaJudgeOvalX(layout, item);
        const cy = asfaJudgeDisplayY(layout, item.cyKey);
        const rx = layout[item.rxKey];
        const ry = layout[item.ryKey];
        const group = svgElement('g', {
            class: 'judge-editor-item',
            'data-type': 'oval',
            'data-cx-key': item.cxKey || '',
            'data-x-adjust-key': item.xAdjustKey || '',
            'data-base-cx': item.baseCx ?? '',
            'data-cy-key': item.cyKey,
            'data-rx-key': item.rxKey,
            'data-ry-key': item.ryKey,
            'data-fixed-cx': item.cx ? formX + item.cx : '',
            'data-form-x': formX,
        });
        group.appendChild(svgElement('ellipse', { cx, cy, rx, ry, fill: 'none', stroke: '#b3261e', 'stroke-width': '1.8' }));
        group.appendChild(svgElement('text', { x: cx + rx + 4, y: cy + 2, 'font-size': '6', fill: '#5c2b25' }, item.label));
        group.appendChild(svgElement('rect', { class: 'judge-editor-handle', x: cx + rx - 2, y: cy + ry - 2, width: 5, height: 5, fill: '#b3261e' }));
        svg.appendChild(group);
    });

    strikeItems.forEach((item) => appendAsfaJudgeStrikeItem(svg, formX, layout, item));

    enableAsfaJudgeVisualDrag(svg);
}

function appendAsfaJudgeStrikeItem(svg, formX, layout, item) {
    const left = formX + Number(layout[item.xKey] || 0);
    const right = left + Number(layout.colorColumnW || 0);
    const top = asfaJudgeDisplayY(layout, 'colorStrikeTopY');
    const bottom = asfaJudgeDisplayY(layout, 'colorStrikeBottomY');
    const group = svgElement('g', {
        class: 'judge-editor-item',
        'data-type': 'strike',
        'data-x-key': item.xKey,
        'data-top-key': 'colorStrikeTopY',
        'data-bottom-key': 'colorStrikeBottomY',
        'data-width-key': 'colorColumnW',
        'data-form-x': formX,
    });
    group.appendChild(svgElement('rect', { x: left, y: top, width: right - left, height: bottom - top, fill: 'rgba(179,38,30,0.04)', stroke: '#b3261e', 'stroke-width': '0.8', 'stroke-dasharray': '4 3' }));
    group.appendChild(svgElement('line', { x1: left, y1: top, x2: right, y2: bottom, stroke: '#b3261e', 'stroke-width': '1.8' }));
    group.appendChild(svgElement('line', { x1: right, y1: top, x2: left, y2: bottom, stroke: '#b3261e', 'stroke-width': '1.8' }));
    group.appendChild(svgElement('text', { x: left + 2, y: top - 4, 'font-size': '6', fill: '#5c2b25', 'font-weight': '700' }, item.label));
    group.appendChild(svgElement('rect', { class: 'judge-editor-handle', x: right - 4, y: bottom - 4, width: 7, height: 7, fill: '#b3261e' }));
    svg.appendChild(group);
}

function appendAsfaJudgeGuideOvals(svg, formX, layout) {
    const courseOffset = Number(layout.courseCircleXAdjust || 0);
    const guides = [
        { xs: [57, 72, 90, 104, 121, 134, 149, 164, 179, 191, 207, 227, 242, 259, 278, 299, 316], cyKey: 'breedCircleY', rxKey: 'breedCircleW', ryKey: 'breedCircleH' },
        { xs: [65, 103, 146, 196, 245, Number(layout.provisionalStakeX || 305)], cyKey: 'stakeCircleY', rxKey: 'stakeCircleW', ryKey: 'stakeCircleH' },
        { xs: [layout.lciLargeX, layout.lciSmallX, layout.lciShMixX], cyKey: 'lciCircleY', rxKey: 'lciCircleW', ryKey: 'lciCircleH' },
        { xs: [layout.finalPhaseCircleX], cyKey: 'finalPhaseCircleY', rxKey: 'finalPhaseCircleW', ryKey: 'finalPhaseCircleH' },
        { xs: [layout.bobPhaseCircleX], cyKey: 'bobPhaseCircleY', rxKey: 'bobPhaseCircleW', ryKey: 'bobPhaseCircleH' },
        { xs: [layout.bifPhaseCircleX], cyKey: 'bifPhaseCircleY', rxKey: 'bifPhaseCircleW', ryKey: 'bifPhaseCircleH' },
        { xs: [layout.biePhaseCircleX], cyKey: 'biePhaseCircleY', rxKey: 'biePhaseCircleW', ryKey: 'biePhaseCircleH' },
        { xs: [164, 186, 207, 235, 262, 290, 317, 344].map((x) => x + courseOffset), cyKey: 'courseCircleY', rxKey: 'courseCircleW', ryKey: 'courseCircleH' },
    ];
    guides.forEach((guide) => {
        guide.xs.forEach((x) => {
            svg.appendChild(svgElement('ellipse', {
                cx: formX + x,
                cy: asfaJudgeDisplayY(layout, guide.cyKey),
                rx: layout[guide.rxKey],
                ry: layout[guide.ryKey],
                fill: 'none',
                stroke: '#2f6f9f',
                'stroke-width': '0.8',
                opacity: '0.28',
                'pointer-events': 'none',
            }));
        });
    });
}

function asfaJudgeDisplayY(layout, key) {
    return Number(layout[key] || 0) + Number(layout.globalYAdjust || 0);
}

function asfaJudgeOvalX(layout, item) {
    if (item.xAdjustKey) {
        return Number(item.baseCx || 0) + Number(layout[item.xAdjustKey] || 0);
    }
    return item.cx ?? layout[item.cxKey];
}

function svgElement(tag, attrs = {}, text = '') {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    if (text) {
        element.textContent = text;
    }
    return element;
}

function enableAsfaJudgeVisualDrag(svg) {
    let drag = null;
    const pointFromEvent = (event) => {
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        return point.matrixTransform(svg.getScreenCTM().inverse());
    };

    svg.addEventListener('pointerdown', (event) => {
        if (isAlignmentLocked('asfaJudgeSheet')) {
            return;
        }
        const handle = event.target.closest('.judge-editor-handle');
        const item = event.target.closest('.judge-editor-item');
        if (!item) {
            return;
        }
        event.preventDefault();
        item.setPointerCapture?.(event.pointerId);
        drag = {
            item,
            resize: Boolean(handle),
            start: pointFromEvent(event),
            layout: { ...getAsfaJudgeLayout() },
        };
    });

    svg.addEventListener('pointermove', (event) => {
        if (!drag) {
            return;
        }
        const point = pointFromEvent(event);
        const dx = point.x - drag.start.x;
        const dy = point.y - drag.start.y;
        const layout = getAsfaJudgeLayout();
        if (drag.item.dataset.type === 'text') {
            layout[drag.item.dataset.xKey] = Math.max(0, Math.round(drag.layout[drag.item.dataset.xKey] + dx));
            layout[drag.item.dataset.yKey] = Math.max(0, Math.round(drag.layout[drag.item.dataset.yKey] + dy));
        } else if (drag.item.dataset.type === 'oval') {
            const cxKey = drag.item.dataset.cxKey;
            const xAdjustKey = drag.item.dataset.xAdjustKey;
            const cyKey = drag.item.dataset.cyKey;
            const rxKey = drag.item.dataset.rxKey;
            const ryKey = drag.item.dataset.ryKey;
            if (drag.resize) {
                layout[rxKey] = Math.max(2, Math.round((drag.layout[rxKey] || 8) + dx));
                layout[ryKey] = Math.max(2, Math.round((drag.layout[ryKey] || 6) + dy));
            } else {
                if (xAdjustKey) {
                    layout[xAdjustKey] = Math.round(Number(drag.layout[xAdjustKey] || 0) + dx);
                } else if (cxKey) {
                    layout[cxKey] = Math.max(0, Math.round(drag.layout[cxKey] + dx));
                }
                layout[cyKey] = Math.max(0, Math.round(drag.layout[cyKey] + dy));
            }
        } else if (drag.item.dataset.type === 'strike') {
            const xKey = drag.item.dataset.xKey;
            const topKey = drag.item.dataset.topKey;
            const bottomKey = drag.item.dataset.bottomKey;
            const widthKey = drag.item.dataset.widthKey;
            if (drag.resize) {
                layout[widthKey] = Math.max(20, Math.round(Number(drag.layout[widthKey] || 80) + dx));
                layout[bottomKey] = Math.max(Number(layout[topKey] || 0) + 20, Math.round(Number(drag.layout[bottomKey] || 0) + dy));
            } else {
                layout[xKey] = Math.max(0, Math.round(Number(drag.layout[xKey] || 0) + dx));
                layout[topKey] = Math.max(0, Math.round(Number(drag.layout[topKey] || 0) + dy));
                layout[bottomKey] = Math.max(layout[topKey] + 20, Math.round(Number(drag.layout[bottomKey] || 0) + dy));
            }
        }
        saveFormAlignment();
        updateAsfaJudgeVisualItem(drag.item, layout);
    });

    svg.addEventListener('pointerup', () => {
        if (drag) {
            renderAsfaJudgeAlignmentTool(readForm());
        }
        drag = null;
    });
    svg.addEventListener('pointercancel', () => {
        drag = null;
    });
}

function updateAsfaJudgeVisualItem(item, layout) {
    const formX = Number(item.dataset.formX || 0);
    if (item.dataset.type === 'text') {
        const x = formX + layout[item.dataset.xKey];
        const y = asfaJudgeDisplayY(layout, item.dataset.yKey);
        const rect = item.querySelector('rect');
        const text = item.querySelector('text');
        rect.setAttribute('x', x - 2);
        rect.setAttribute('y', y - 10);
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        return;
    }
    if (item.dataset.type === 'oval') {
        let cx = item.dataset.cxKey ? formX + layout[item.dataset.cxKey] : Number(item.dataset.fixedCx);
        if (item.dataset.xAdjustKey) {
            cx = formX + Number(item.dataset.baseCx || 0) + Number(layout[item.dataset.xAdjustKey] || 0);
        }
        const cy = asfaJudgeDisplayY(layout, item.dataset.cyKey);
        const rx = layout[item.dataset.rxKey];
        const ry = layout[item.dataset.ryKey];
        const ellipse = item.querySelector('ellipse');
        const label = item.querySelector('text');
        const handle = item.querySelector('rect');
        ellipse.setAttribute('cx', cx);
        ellipse.setAttribute('cy', cy);
        ellipse.setAttribute('rx', rx);
        ellipse.setAttribute('ry', ry);
        label.setAttribute('x', cx + rx + 4);
        label.setAttribute('y', cy + 2);
        handle.setAttribute('x', cx + rx - 2);
        handle.setAttribute('y', cy + ry - 2);
    }
    if (item.dataset.type === 'strike') {
        const left = formX + Number(layout[item.dataset.xKey] || 0);
        const right = left + Number(layout[item.dataset.widthKey] || 0);
        const top = asfaJudgeDisplayY(layout, item.dataset.topKey);
        const bottom = asfaJudgeDisplayY(layout, item.dataset.bottomKey);
        const rect = item.querySelector('rect:not(.judge-editor-handle)');
        const lines = item.querySelectorAll('line');
        const label = item.querySelector('text');
        const handle = item.querySelector('.judge-editor-handle');
        rect.setAttribute('x', left);
        rect.setAttribute('y', top);
        rect.setAttribute('width', right - left);
        rect.setAttribute('height', bottom - top);
        lines[0].setAttribute('x1', left);
        lines[0].setAttribute('y1', top);
        lines[0].setAttribute('x2', right);
        lines[0].setAttribute('y2', bottom);
        lines[1].setAttribute('x1', right);
        lines[1].setAttribute('y1', top);
        lines[1].setAttribute('x2', left);
        lines[1].setAttribute('y2', bottom);
        label.setAttribute('x', left + 2);
        label.setAttribute('y', top - 4);
        handle.setAttribute('x', right - 4);
        handle.setAttribute('y', bottom - 4);
    }
}

function getAsfaJudgeLayout() {
    formAlignment = normalizeFormAlignment(formAlignment);
    return formAlignment.asfaJudgeSheet;
}

function renderClassOptions(trial) {
    const select = document.getElementById('entryClass');
    const current = select.value;
    const selectedBreed = document.getElementById('entryBreed')?.value || '';
    const isLciBreed = lciDivisions.includes(selectedBreed);
    const classes = isLciBreed ? lciStakes : defaultClassOptions;

    select.innerHTML = '';
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = isLciBreed ? 'Select LCI stake' : 'Select stake/class';
    select.appendChild(blank);
    classes.forEach((className) => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        select.appendChild(option);
    });

    const lciCurrent = parseLciClass(current);
    if (isLciBreed && lciCurrent && lciCurrent.division === selectedBreed && classes.includes(lciCurrent.stake)) {
        select.value = lciCurrent.stake;
    } else if (classes.includes(current)) {
        select.value = current;
    } else {
        select.value = '';
    }

    renderEntryRegistrationOptions(getSelectedEntryHound());
}

function deriveClassesFromEntries(entries = [], fallback = []) {
    const classes = uniqueNames((entries || []).map((entry) => entry.className).filter(Boolean));
    if (classes.length > 0) {
        return classes;
    }
    return expandClassOptions(fallback || []);
}

function deriveBreedsFromEntries(entries = [], fallback = '') {
    const breeds = uniqueNames((entries || []).map((entry) => runGroupBreedForEntry(entry)).filter(Boolean));
    if (breeds.length > 0) {
        return breeds.join('\n');
    }
    return fallback || '';
}

function expandClassOptions(classes) {
    const expanded = [];
    (classes || []).forEach((className) => {
        if (clean(className) === 'LCI') {
            expanded.push(...lciStakes);
            return;
        }
        const lci = parseLciClass(className);
        if (lci) {
            expanded.push(lci.stake);
            return;
        }
        expanded.push(className);
    });
    return uniqueNames(expanded);
}

function renderRosterTables(trial) {
    const houndRows = masterHounds.map((hound) => ({
        ...hound,
        registrationDisplay: hound.registrationDisplay || formatRegistration(hound.registry, hound.registrationNumber, hound.registrationType),
        alternateRegistrationDisplay: hound.alternateRegistrationDisplay || formatRegistration(hound.alternateRegistry, hound.alternateRegistrationNumber, ''),
    }));
    const filteredHounds = filterHounds(houndRows);
    renderHoundDatabaseCount(filteredHounds.length, houndRows.length);

    renderRows('masterHoundsTable', filteredHounds, ['callName', 'registeredName', 'breed', 'registrationDisplay', 'alternateRegistrationDisplay', 'owner'], { actions: 'hounds' });
    const entryRows = (trial.entries || trial.hounds || []).map((entry) => ({
        ...entry,
        entryDatesLabel: entryDatesLabel(entry, trial),
        trialMembershipLabel: entryTrialMembershipLabel(entry),
        ownerSeparationLabel: entry.ownerSeparationRequested ? (entry.ownerSeparationGroup || 'Yes') : '',
        documentLabel: entryDocumentLabel(entry),
        rowClass: entryNeedsDocuments(entry) ? 'entry-needs-documents' : '',
    }));
    renderRows('entriesTable', entryRows, ['callName', 'registeredName', 'breed', 'registrationNumber', 'registry', 'className', 'entryDatesLabel', 'trialMembershipLabel', 'handler', 'ownerSeparationLabel', 'documentLabel'], { actions: 'entries' });
    renderRows('masterJudgesTable', masterJudges, ['name', 'number', 'email', 'phone'], { actions: 'masterJudges' });
    renderRows('judgesTable', trial.judges || [], ['name', 'number', 'assignment'], { actions: 'trialJudges' });
    renderRows('masterWorkersTable', masterWorkers, ['name', 'email', 'phone', 'notes'], { actions: 'masterWorkers' });
    renderRows('workersTable', trial.workers || [], ['name', 'role', 'phone'], { actions: 'trialWorkers' });
    renderHoundSearchOptions();
    renderPeopleSearchOptions();
    renderEntryTrialTargets();
    renderJotformTargetTrialOptions();
    renderEntryImportTemplateOptions();
    renderJotformImportPreview();
    renderEntryImportMapping();
    renderRunPlan(trial);
    renderPrintableSheets(trial);
}

function renderRollCall(trial) {
    const body = document.getElementById('rollCallCheckInTable');
    const groupsContainer = document.getElementById('initialCourseGroups');
    if (!body || !groupsContainer) {
        return;
    }

    const entries = (trial.entries || trial.hounds || []).map(enrichEntryForRollCall);
    const ownerLetters = buildOwnerSeparationLetters(entries);
    updateRollCallAllPresentControl(entries);

    body.innerHTML = '';
    if (entries.length === 0) {
        const empty = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 9;
        cell.textContent = 'No hounds entered in this trial yet.';
        empty.appendChild(cell);
        body.appendChild(empty);
        renderOwnerSeparationQuickEditor(entries);
        groupsContainer.innerHTML = '<p class="empty">Roll call groups will appear after entries are added.</p>';
        return;
    }

    entries.forEach((entry) => {
        const tr = document.createElement('tr');
        if (entryNeedsDocuments(entry)) {
            tr.classList.add('roll-call-needs-documents');
        }
        tr.appendChild(textCell(entry.entryNumber || ''));
        const nameCell = textCell([entry.callName, entry.registeredName].filter(Boolean).join(' / '));
        if (entryNeedsDocuments(entry)) {
            const badge = document.createElement('span');
            badge.className = 'document-warning-badge';
            badge.textContent = 'Needs docs';
            nameCell.appendChild(badge);
        }
        tr.appendChild(nameCell);
        tr.appendChild(textCell(entry.owner || 'Unknown owner'));
        tr.appendChild(textCell(displayBreedCode(entry.breed)));
        tr.appendChild(textCell(entry.className || ''));
        tr.appendChild(rollCallPresentCell(entry));
        tr.appendChild(rollCallReasonCell(entry));
        tr.appendChild(textCell(ownerLetters.get(ownerKey(entry)) || ''));
        tr.appendChild(rollCallNotesCell(entry));
        body.appendChild(tr);
    });

    renderOwnerSeparationQuickEditor(entries);
    renderInitialCourseGroups(entries, ownerLetters);
    renderPreliminaryDraw(trial);
}

function enrichEntryForRollCall(entry) {
    const hound = entry.houndId ? masterHounds.find((item) => item.id === entry.houndId) : null;
    return {
        ...entry,
        owner: entry.owner || (hound && hound.owner) || entry.handler || '',
        ownerEmail: entry.ownerEmail || (hound && hound.ownerEmail) || '',
        ownerPhone: entry.ownerPhone || (hound && hound.ownerPhone) || '',
    };
}

function ownerKey(entry) {
    return clean([entry.owner, entry.ownerEmail, entry.ownerPhone].filter(Boolean).join('|')) || clean(entry.handler) || `UNKNOWN${entry.id || ''}`;
}

function buildOwnerSeparationLetters(entries) {
    const letters = new Map();
    const fallbackKeys = [];
    entries
        .filter((entry) => entry.ownerSeparationRequested)
        .forEach((entry) => {
            const key = ownerKey(entry);
            const group = String(entry.ownerSeparationGroup || '').trim().toUpperCase();
            if (group) {
                letters.set(key, group);
            } else if (!fallbackKeys.includes(key)) {
                fallbackKeys.push(key);
            }
        });

    fallbackKeys.forEach((key) => {
        if (!letters.has(key)) {
            letters.set(key, ownerLetter(letters.size));
        }
    });
    return letters;
}

function ownerLetter(index) {
    let value = '';
    let number = index;
    do {
        value = String.fromCharCode(65 + (number % 26)) + value;
        number = Math.floor(number / 26) - 1;
    } while (number >= 0);
    return value;
}

function suggestOwnerSeparationGroup() {
    const existing = getSelectedTrial();
    const hound = getSelectedEntryHound();
    const owner = (hound && hound.owner) || document.getElementById('entryOwner')?.value || '';
    const ownerEmail = (hound && hound.ownerEmail) || document.getElementById('entryOwnerEmail')?.value || '';
    const ownerPhone = (hound && hound.ownerPhone) || document.getElementById('entryOwnerPhone')?.value || '';
    const ownerId = clean([owner, ownerEmail, ownerPhone].filter(Boolean).join('|'));
    const entries = existing && Array.isArray(existing.entries) ? existing.entries : [];

    if (ownerId) {
        const matchingEntry = entries.find((entry) => entry.ownerSeparationRequested && ownerKey(entry) === ownerId && entry.ownerSeparationGroup);
        if (matchingEntry) {
            return matchingEntry.ownerSeparationGroup;
        }
    }

    const usedGroups = uniqueNames(entries
        .filter((entry) => entry.ownerSeparationRequested && entry.ownerSeparationGroup)
        .map((entry) => String(entry.ownerSeparationGroup).toUpperCase()));
    let index = 0;
    let candidate = ownerLetter(index);
    while (usedGroups.includes(candidate)) {
        index += 1;
        candidate = ownerLetter(index);
    }
    return candidate;
}

function toggleOwnerSeparationGroupField() {
    const checkbox = document.getElementById('entryOwnerSeparation');
    const row = document.getElementById('entryOwnerSeparationGroupRow');
    const input = document.getElementById('entryOwnerSeparationGroup');
    if (!checkbox || !row || !input) {
        return;
    }

    row.hidden = !checkbox.checked;
    if (checkbox.checked && !input.value.trim()) {
        input.value = suggestOwnerSeparationGroup();
    }
    if (!checkbox.checked) {
        input.value = '';
    }
}

function rollCallPresentCell(entry) {
    const td = document.createElement('td');
    const label = document.createElement('label');
    label.className = 'switch compact-switch';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = entry.rollCallStatus === 'present';
    checkbox.addEventListener('change', () => {
        updateEntryRollCall(entry.id, { rollCallStatus: checkbox.checked ? 'present' : 'absent' });
    });
    const text = document.createElement('span');
    text.textContent = 'Present';
    label.append(checkbox, text);
    td.appendChild(label);
    return td;
}

function rollCallReasonCell(entry) {
    const td = document.createElement('td');
    const select = document.createElement('select');
    [
        ['', 'Not checked'],
        ['absent', 'Absent'],
        ['lame', 'Lame'],
        ['in_season', 'In season'],
        ['breed_dq', 'Breed DQ'],
        ['scratched', 'Scratched'],
        ['excused', 'Excused'],
    ].forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
    });
    select.value = entry.rollCallStatus === 'present' ? '' : (entry.rollCallStatus || '');
    select.disabled = entry.rollCallStatus === 'present';
    select.addEventListener('change', () => updateEntryRollCall(entry.id, { rollCallStatus: select.value }));
    td.appendChild(select);
    return td;
}

function rollCallNotesCell(entry) {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.value = entry.rollCallNotes || '';
    input.placeholder = 'Notes';
    input.addEventListener('change', () => updateEntryRollCall(entry.id, { rollCallNotes: input.value.trim() }));
    td.appendChild(input);
    return td;
}

function renderOwnerSeparationQuickEditor(entries) {
    const container = document.getElementById('ownerSeparationQuickList');
    if (!container) {
        return;
    }

    const trial = getSelectedTrial();
    const status = document.getElementById('ownerSeparationReviewedStatus');
    if (status) {
        status.textContent = trial && trial.ownerSeparationReviewedAt
            ? `Owner separation reviewed ${formatTimestamp(trial.ownerSeparationReviewedAt)}.`
            : 'Owner separation has not been reviewed yet.';
    }

    container.innerHTML = '';
    if (!entries.length) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Add trial entries before marking owner separation.';
        container.appendChild(empty);
        return;
    }

    const breeds = new Map();
    entries.forEach((entry) => {
        const breed = runGroupBreedForEntry(entry) || 'Unknown breed';
        if (!breeds.has(breed)) {
            breeds.set(breed, new Map());
        }
        const owners = breeds.get(breed);
        const owner = entry.owner || 'Unknown owner';
        const ownerId = `${ownerKey(entry)}|${owner}`;
        if (!owners.has(ownerId)) {
            owners.set(ownerId, { owner, entries: [] });
        }
        owners.get(ownerId).entries.push(entry);
    });

    const separationGroupCounts = new Map();
    entries.forEach((entry) => {
        const group = String(entry.ownerSeparationGroup || '').trim().toUpperCase();
        if (entry.ownerSeparationRequested && group) {
            const key = `${clean(runGroupBreedForEntry(entry))}|${clean(runGroupStakeForEntry(entry))}|${group}`;
            separationGroupCounts.set(key, (separationGroupCounts.get(key) || 0) + 1);
        }
    });

    [...breeds.entries()]
        .sort(([breedA], [breedB]) => breedA.localeCompare(breedB, undefined, { numeric: true, sensitivity: 'base' }))
        .forEach(([breed, owners]) => {
            const breedSection = document.createElement('div');
            breedSection.className = 'owner-separation-breed';
            const heading = document.createElement('h3');
            const houndCount = [...owners.values()].reduce((total, ownerGroup) => total + ownerGroup.entries.length, 0);
            heading.textContent = `${displayBreedCode(breed)} (${houndCount} hound${houndCount === 1 ? '' : 's'})`;
            breedSection.appendChild(heading);

            const breedEntries = [...owners.values()].flatMap((ownerGroup) => ownerGroup.entries);
            const stakes = uniqueNames(breedEntries.map(runGroupStakeForEntry)).filter(Boolean);
            if (!isQuasiBreedClass(breed) && stakes.length > 1) {
                const mixedEligibility = mixedStakeEligibilityForEntries(breedEntries, breed);
                const mixedPanel = document.createElement('div');
                mixedPanel.className = 'owner-separation-mixed-panel';
                if (!mixedEligibility.eligible) {
                    mixedPanel.classList.add('is-disabled');
                }
                const mixedLabel = document.createElement('label');
                mixedLabel.className = 'switch compact-switch';
                const mixed = document.createElement('input');
                mixed.type = 'checkbox';
                mixed.checked = mixedStakeBreedEnabled(trial, breed) && mixedEligibility.eligible;
                mixed.disabled = !mixedEligibility.eligible;
                mixed.addEventListener('change', () => updateMixedStakeBreed(breed, mixed.checked));
                const mixedText = document.createElement('span');
                mixedText.textContent = 'Run these stakes as a mixed stake course before the draw';
                mixedLabel.append(mixed, mixedText);
                const mixedDetail = document.createElement('span');
                mixedDetail.className = 'owner-separation-mixed-detail';
                mixedDetail.textContent = mixedEligibility.eligible
                    ? `Eligible: ${mixedEligibility.stakes.map(displayJudgeMapStake).join(' / ')} | ${mixedEligibility.total} hounds total`
                    : `Not eligible: ${mixedEligibility.reason}`;
                mixedPanel.append(mixedLabel, mixedDetail);
                breedSection.appendChild(mixedPanel);
            }

            [...owners.values()]
                .sort((a, b) => a.owner.localeCompare(b.owner, undefined, { numeric: true, sensitivity: 'base' }))
                .forEach((ownerGroup) => {
                    const ownerBlock = document.createElement('div');
                    ownerBlock.className = 'owner-separation-owner';
                    const ownerHeading = document.createElement('h4');
                    ownerHeading.textContent = `${ownerGroup.owner} (${ownerGroup.entries.length})`;
                    ownerBlock.appendChild(ownerHeading);

                    const rowHeader = document.createElement('div');
                    rowHeader.className = 'owner-separation-row owner-separation-row-header';
                    ['Separate', 'Group', 'Hound', 'Breed', 'Stake'].forEach((label) => {
                        const cell = document.createElement('span');
                        cell.textContent = label;
                        rowHeader.appendChild(cell);
                    });
                    ownerBlock.appendChild(rowHeader);

                    ownerGroup.entries
                        .slice()
                        .sort((a, b) => String(runGroupStakeForEntry(a)).localeCompare(String(runGroupStakeForEntry(b)), undefined, { numeric: true, sensitivity: 'base' })
                            || String(a.callName || a.registeredName || '').localeCompare(String(b.callName || b.registeredName || ''), undefined, { numeric: true, sensitivity: 'base' }))
                        .forEach((entry) => {
                            const row = document.createElement('div');
                            row.className = 'owner-separation-row';
                            const separationGroup = String(entry.ownerSeparationGroup || '').trim().toUpperCase();
                            const separationKey = `${clean(runGroupBreedForEntry(entry))}|${clean(runGroupStakeForEntry(entry))}|${separationGroup}`;
                            if (entry.ownerSeparationRequested && separationGroup && separationGroupCounts.get(separationKey) > 1) {
                                row.classList.add('owner-separation-row-linked');
                                row.dataset.separationGroup = separationGroup;
                            }
                            const checkLabel = document.createElement('label');
                            checkLabel.className = 'switch compact-switch';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = Boolean(entry.ownerSeparationRequested);
                            const checkText = document.createElement('span');
                            checkText.textContent = 'Separate';
                            checkLabel.append(checkbox, checkText);

            const groupInput = document.createElement('input');
            groupInput.className = 'owner-separation-group-input';
            groupInput.maxLength = 3;
            groupInput.placeholder = 'A';
            groupInput.value = entry.ownerSeparationGroup || '';
            groupInput.disabled = !checkbox.checked;

            const save = () => {
                const group = checkbox.checked
                    ? (groupInput.value.trim().toUpperCase() || suggestNextOwnerSeparationGroupForTrial(entry.id))
                    : '';
                updateOwnerSeparationForEntry(entry.id, Boolean(group), group);
            };

            checkbox.addEventListener('change', () => {
                groupInput.disabled = !checkbox.checked;
                if (checkbox.checked && !groupInput.value.trim()) {
                    groupInput.value = suggestNextOwnerSeparationGroupForTrial(entry.id);
                }
                save();
            });
            groupInput.addEventListener('change', save);

                            const hound = document.createElement('strong');
                            hound.textContent = entry.callName || entry.registeredName || 'Unnamed hound';
                            const breedCell = document.createElement('span');
                            breedCell.className = 'owner-separation-breed-cell';
                            breedCell.textContent = displayBreedCode(runGroupBreedForEntry(entry));
                            const stake = document.createElement('span');
                            stake.className = 'owner-separation-stake-cell';
                            stake.textContent = runGroupStakeForEntry(entry);
                            row.append(checkLabel, groupInput, hound, breedCell, stake);
                            ownerBlock.appendChild(row);
                        });

                    breedSection.appendChild(ownerBlock);
                });

            container.appendChild(breedSection);
        });
}

function suggestNextOwnerSeparationGroupForTrial(ignoreEntryId = '') {
    const trial = readForm();
    const usedGroups = uniqueNames((trial.entries || [])
        .filter((entry) => entry.id !== ignoreEntryId && entry.ownerSeparationRequested && entry.ownerSeparationGroup)
        .map((entry) => String(entry.ownerSeparationGroup).trim().toUpperCase()));
    let index = 0;
    let candidate = ownerLetter(index);
    while (usedGroups.includes(candidate)) {
        index += 1;
        candidate = ownerLetter(index);
    }
    return candidate;
}

function updateOwnerSeparationForEntry(entryId, requested, groupValue) {
    const group = requested ? String(groupValue || '').trim().toUpperCase() : '';
    updateDrawSeparationGroup(entryId, group);
}

function mixedStakeBreedEnabled(trial, breed) {
    const key = clean(breed);
    return Boolean(trial && Array.isArray(trial.mixedStakeBreeds) && trial.mixedStakeBreeds.some((item) => clean(item) === key));
}

function entriesForRunGroupBreed(trial, breed) {
    const key = clean(breed);
    return (trial.entries || []).filter((entry) => clean(runGroupBreedForEntry(entry)) === key);
}

function stakeCountsForEntries(entries = []) {
    const stakeMap = new Map();
    entries.forEach((entry) => {
        const stake = runGroupStakeForEntry(entry) || 'Unassigned';
        const key = clean(stake) || 'UNASSIGNED';
        if (!stakeMap.has(key)) {
            stakeMap.set(key, { stake, count: 0 });
        }
        stakeMap.get(key).count += 1;
    });
    return Array.from(stakeMap.values());
}

function mixedStakeEligibilityForEntries(entries = [], breed = '') {
    if (isQuasiBreedClass(breed)) {
        return { eligible: false, reason: 'Mixed stakes are only for regular breed stakes.' };
    }
    const stakeCounts = stakeCountsForEntries(entries).filter((row) => row.count > 0);
    const total = entries.length;
    if (stakeCounts.length < 2) {
        return { eligible: false, reason: 'Mixed stake needs hounds in at least two stakes.' };
    }
    if (total < 2 || total > 3) {
        return { eligible: false, reason: 'Mixed stake must have 2 or 3 total hounds.' };
    }
    const largeStake = stakeCounts.find((row) => row.count >= 3);
    if (largeStake) {
        return { eligible: false, reason: `${displayJudgeMapStake(largeStake.stake)} already has ${largeStake.count} hounds.` };
    }
    return {
        eligible: true,
        total,
        stakes: stakeCounts
            .sort((a, b) => stakeSortOrder(a.stake) - stakeSortOrder(b.stake) || String(a.stake).localeCompare(String(b.stake)))
            .map((row) => row.stake),
        stakeCounts,
    };
}

function mixedStakeBreedActive(trial, breed) {
    const entries = entriesForRunGroupBreed(trial, breed);
    const eligibility = mixedStakeEligibilityForEntries(entries, breed);
    return mixedStakeBreedEnabled(trial, breed) && eligibility.eligible;
}

function updateMixedStakeBreed(breed, enabled) {
    const trial = readForm();
    if (isPreliminaryDrawLocked(trial)) {
        showPreliminaryDrawLockedMessage('draw');
        render();
        return;
    }
    if (enabled) {
        const eligibility = mixedStakeEligibilityForEntries(entriesForRunGroupBreed(trial, breed), breed);
        if (!eligibility.eligible) {
            showMessage(rollCallMessage, `${displayBreedCode(breed)} cannot be mixed: ${eligibility.reason}`, 'warning');
            render();
            return;
        }
    }
    const key = clean(breed);
    const existing = Array.isArray(trial.mixedStakeBreeds) ? trial.mixedStakeBreeds.filter((item) => clean(item) !== key) : [];
    trial.mixedStakeBreeds = enabled ? [...existing, breed] : existing;
    if (trial.preliminaryDraw) {
        trial.preliminaryDraw = null;
    }
    upsertTrial(trial);
    saveTrials();
    showMessage(rollCallMessage, enabled
        ? `${displayBreedCode(breed)} will draw as a mixed stake course.`
        : `${displayBreedCode(breed)} will draw by separate stakes.`, 'success');
    render();
}

function autoMarkOwnerSeparationGroups() {
    const trial = readForm();
    if (isPreliminaryDrawLocked(trial)) {
        showPreliminaryDrawLockedMessage('draw');
        return;
    }

    const entries = (trial.entries || []).map(enrichEntryForRollCall);
    if (entries.length === 0) {
        showMessage(rollCallMessage, 'Add trial entries before marking owner separation.', 'warning');
        return;
    }

    const groupCounts = new Map();
    entries.forEach((entry) => {
        const key = `${ownerKey(entry)}|${clean(runGroupBreedForEntry(entry))}|${clean(runGroupStakeForEntry(entry))}`;
        groupCounts.set(key, (groupCounts.get(key) || 0) + 1);
    });

    const ownersToSeparate = uniqueNames(entries
        .filter((entry) => groupCounts.get(`${ownerKey(entry)}|${clean(runGroupBreedForEntry(entry))}|${clean(runGroupStakeForEntry(entry))}`) > 1)
        .map(ownerKey));

    if (ownersToSeparate.length === 0) {
        showMessage(rollCallMessage, 'No owners have multiple hounds in the same breed/stake group.', 'warning');
        return;
    }

    const ownerLetters = new Map(ownersToSeparate.map((key, index) => [key, ownerLetter(index)]));
    trial.entries = (trial.entries || []).map((entry) => {
        const enriched = enrichEntryForRollCall(entry);
        const letter = ownerLetters.get(ownerKey(enriched));
        if (!letter) {
            return entry;
        }
        return {
            ...entry,
            ownerSeparationRequested: true,
            ownerSeparationGroup: letter,
        };
    });

    if (trial.preliminaryDraw && Array.isArray(trial.preliminaryDraw.groups)) {
        trial.preliminaryDraw = auditDrawChange({
            ...trial.preliminaryDraw,
            groups: trial.preliminaryDraw.groups.map((drawGroup) => ({
                ...drawGroup,
                courses: (drawGroup.courses || []).map((course) => ({
                    ...course,
                    hounds: (course.hounds || []).map((hound) => {
                        const entry = trial.entries.find((row) => row.id === hound.entryId);
                        return entry ? { ...hound, ownerSeparationGroup: entry.ownerSeparationGroup || '' } : hound;
                    }),
                })),
            })),
        }, 'Auto marked owner separation groups.');
    }

    trial.ownerSeparationReviewedAt = new Date().toISOString();
    upsertTrial(trial);
    saveTrials();
    showMessage(rollCallMessage, `Marked owner separation for ${ownersToSeparate.length} owner group${ownersToSeparate.length === 1 ? '' : 's'}.`, 'success');
    render();
}

function markOwnerSeparationReviewed() {
    const trial = readForm();
    if (isPreliminaryDrawLocked(trial)) {
        showPreliminaryDrawLockedMessage('draw');
        return;
    }
    if (!trial || !trial.id || !(trial.entries || []).length) {
        showMessage(rollCallMessage, 'Add trial entries before marking owner separation reviewed.', 'warning');
        return;
    }
    trial.ownerSeparationReviewedAt = new Date().toISOString();
    upsertTrial(trial);
    saveTrials();
    showMessage(rollCallMessage, 'Owner separation marked reviewed for this trial.', 'success');
    render();
}

function updateEntryRollCall(entryId, changes) {
    const trial = readForm();
    trial.entries = (trial.entries || []).map((entry) => entry.id === entryId ? { ...entry, ...changes } : entry);
    upsertTrial(trial);
    saveTrials();
    render();
}

function updateRollCallAllPresentControl(entries) {
    const checkbox = document.getElementById('rollCallAllPresent');
    if (!checkbox) {
        return;
    }
    checkbox.checked = entries.length > 0 && entries.every((entry) => entry.rollCallStatus === 'present');
    checkbox.indeterminate = entries.some((entry) => entry.rollCallStatus === 'present') && !checkbox.checked;
}

function setAllRollCallPresent(isPresent) {
    const trial = readForm();
    const entries = trial.entries || [];
    if (entries.length === 0) {
        showMessage(rollCallMessage, 'No hounds are entered in this trial yet.', 'warning');
        return;
    }

    trial.entries = entries.map((entry) => ({
        ...entry,
        rollCallStatus: isPresent ? 'present' : '',
    }));
    upsertTrial(trial);
    saveTrials();
    showMessage(
        rollCallMessage,
        isPresent
            ? `Marked ${entries.length} hound${entries.length === 1 ? '' : 's'} present. Uncheck any hound that is absent, lame, in season, breed DQ, scratched, or excused.`
            : 'Cleared roll call present checks.',
        isPresent ? 'success' : 'warning'
    );
    render();
}

function renderInitialCourseGroups(entries, ownerLetters) {
    const container = document.getElementById('initialCourseGroups');
    const eligible = entries.filter((entry) => entry.rollCallStatus === 'present');
    const pending = entries.filter((entry) => !entry.rollCallStatus || entry.rollCallStatus === 'not_checked');
    const unavailable = entries.filter((entry) => ['absent', 'lame', 'in_season', 'breed_dq', 'scratched', 'excused'].includes(entry.rollCallStatus));
    const groups = new Map();

    eligible.forEach((entry) => {
        const breed = runGroupBreedForEntry(entry);
        const stake = runGroupStakeForEntry(entry);
        const key = `${breed}|${stake}`;
        if (!groups.has(key)) {
            groups.set(key, { breed, stake, entries: [] });
        }
        groups.get(key).entries.push(entry);
    });

    container.innerHTML = '';

    const summary = document.createElement('div');
    summary.className = 'roll-call-summary';
    summary.appendChild(summaryItem('Present', eligible.length, 'done'));
    summary.appendChild(summaryItem('Not checked', pending.length, 'todo'));
    summary.appendChild(summaryItem('Unavailable', unavailable.length, 'todo'));
    container.appendChild(summary);

    if (groups.size === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Mark hounds present at roll call to build initial run groups.';
        container.appendChild(empty);
        return;
    }

    [...groups.values()]
        .sort((a, b) => a.breed.localeCompare(b.breed, undefined, { numeric: true, sensitivity: 'base' }) || a.stake.localeCompare(b.stake, undefined, { numeric: true, sensitivity: 'base' }))
        .forEach((group) => {
            const groupEntries = group.entries;
            const card = document.createElement('div');
            card.className = 'course-group';

            const heading = document.createElement('div');
            heading.className = 'course-group-heading';
            const title = document.createElement('h3');
            title.textContent = groupTitle(group);
            const meta = document.createElement('span');
            meta.textContent = `${groupEntries.length} hound${groupEntries.length === 1 ? '' : 's'}`;
            heading.append(title, meta);
            card.appendChild(heading);

            const list = document.createElement('ul');
            groupEntries
                .sort((a, b) => String(a.callName || a.registeredName).localeCompare(String(b.callName || b.registeredName)))
                .forEach((entry) => {
                    const item = document.createElement('li');
                    const letter = ownerLetters.get(ownerKey(entry));
                    item.textContent = `${letter ? `${letter} - ` : ''}${entry.callName || entry.registeredName || 'Unnamed hound'} (${entry.owner || 'Unknown owner'})`;
                    list.appendChild(item);
                });
            card.appendChild(list);

            const unavoidable = ownerSeparationWarning(groupEntries, ownerLetters);
            if (unavoidable) {
                const warning = document.createElement('p');
                warning.className = 'group-warning';
                warning.textContent = unavoidable;
                card.appendChild(warning);
            }

            container.appendChild(card);
        });
}

function summaryItem(label, value, tone) {
    const item = document.createElement('div');
    item.className = 'summary-item';
    const strong = document.createElement('strong');
    strong.textContent = value;
    const text = document.createElement('span');
    text.textContent = label;
    const status = document.createElement('span');
    status.className = `status ${tone}`;
    status.textContent = label;
    item.append(strong, text, status);
    return item;
}

function ownerSeparationWarning(entries, ownerLetters) {
    const requested = entries.filter((entry) => ownerLetters.has(ownerKey(entry)));
    if (requested.length < 2) {
        return '';
    }

    const owners = uniqueNames(requested.map(ownerKey));
    if (owners.length === 1 && entries.length === requested.length) {
        return 'Owner separation requested, but every hound in this group has the same owner. They may have to run together.';
    }

    return '';
}

function houndHasPrelimResult(hound) {
    return Boolean(
        hasScoreValue(hound.prelimScore)
        || hound.prelimOutcome
        || hasScoreValue(hound.prelimJudge1Score)
        || hasScoreValue(hound.prelimJudge2Score)
        || hound.prelimScoredAt
    );
}

function drawGroupHasPrelimResults(group) {
    return (group.courses || [])
        .flatMap((course) => course.hounds || [])
        .some(houndHasPrelimResult);
}

function preliminaryDrawHasPrelimResults(draw) {
    return Boolean(draw && Array.isArray(draw.groups) && draw.groups.some(drawGroupHasPrelimResults));
}

function isPreliminaryDrawLocked(trial) {
    return Boolean((trial.scorebook && trial.scorebook.prelimsLocked) || preliminaryDrawHasPrelimResults(trial.preliminaryDraw));
}

function isPreliminaryDrawGroupLocked(trial, group) {
    return Boolean((trial.scorebook && trial.scorebook.prelimsLocked) || drawGroupHasPrelimResults(group));
}

function showPreliminaryDrawLockedMessage(scope = 'draw') {
    const text = scope === 'group'
        ? 'This preliminary group has scores entered or prelims are locked. Unlock/correct scores before changing its draw.'
        : 'Preliminary scoring has started or prelims are locked. The Roll Call draw cannot be rebuilt now.';
    showMessage(rollCallMessage, text, 'warning');
}

function buildPreliminaryDraw() {
    const trial = readForm();
    if (isPreliminaryDrawLocked(trial)) {
        showPreliminaryDrawLockedMessage('draw');
        render();
        return;
    }
    const entries = (trial.entries || []).map(enrichEntryForRollCall);
    const presentEntries = entries.filter((entry) => entry.rollCallStatus === 'present');
    const unchecked = entries.filter((entry) => !entry.rollCallStatus || entry.rollCallStatus === 'not_checked');

    if (presentEntries.length === 0) {
        showMessage(rollCallMessage, 'Mark hounds present at roll call before building the preliminary draw.', 'warning');
        return;
    }

    if (unchecked.length > 0) {
        showMessage(rollCallMessage, `${unchecked.length} hound${unchecked.length === 1 ? '' : 's'} still not checked. Finish roll call before drawing.`, 'warning');
        return;
    }

    const groups = groupEntriesByBreedAndStake(presentEntries, trial.mixedStakeBreeds || []);
    trial.preliminaryDraw = {
        id: crypto.randomUUID(),
        phase: 'preliminary',
        createdAt: new Date().toISOString(),
        entriesFingerprint: entryDrawFingerprint(trial.entries || []),
        groups: groups.map((group) => buildDrawGroup(group)),
    };

    upsertTrial(trial);
    saveTrials();
    showMessage(rollCallMessage, `Built preliminary draw for ${trial.preliminaryDraw.groups.length} run group${trial.preliminaryDraw.groups.length === 1 ? '' : 's'}.`, 'success');
    render();
}

function groupEntriesByBreedAndStake(entries, mixedStakeBreeds = []) {
    const groups = new Map();
    const mixedBreeds = new Set((mixedStakeBreeds || []).map(clean));
    const eligibleMixedBreeds = new Set();
    mixedBreeds.forEach((breedKey) => {
        const breedEntries = entries.filter((entry) => clean(runGroupBreedForEntry(entry)) === breedKey);
        const breed = breedEntries.length ? runGroupBreedForEntry(breedEntries[0]) : breedKey;
        if (mixedStakeEligibilityForEntries(breedEntries, breed).eligible) {
            eligibleMixedBreeds.add(breedKey);
        }
    });
    entries.forEach((entry) => {
        const breed = runGroupBreedForEntry(entry);
        const mixedStake = eligibleMixedBreeds.has(clean(breed)) && !isQuasiBreedClass(breed);
        const stake = mixedStake ? 'Mixed' : runGroupStakeForEntry(entry);
        const key = `${breed}|${stake}`;
        if (!groups.has(key)) {
            groups.set(key, { key, breed, stake, mixedStake, entries: [] });
        }
        groups.get(key).entries.push(entry);
    });
    return [...groups.values()].sort((a, b) => a.breed.localeCompare(b.breed, undefined, { numeric: true, sensitivity: 'base' }) || a.stake.localeCompare(b.stake, undefined, { numeric: true, sensitivity: 'base' }));
}

function buildDrawGroup(group) {
    const quasiGroup = isQuasiBreedGroup(group);
    const sizes = courseSizesForEntryCount(group.entries.length, quasiGroup);
    const courses = sizes.map((size, index) => ({
        id: crypto.randomUUID(),
        number: index + 1,
        capacity: size,
        hounds: [],
    }));
    const randomizedEntries = quasiGroup
        ? orderEntriesForSequentialSoloDraw(group.entries)
        : orderEntriesForDraw(group.entries);

    if (quasiGroup) {
        assignEntriesSequentiallyToCourses(courses, randomizedEntries);
    } else {
        randomizedEntries.forEach((entry) => {
            const course = chooseCourseForEntry(courses, entry);
            course.hounds.push(entry);
        });
    }

    courses.forEach((course) => {
        const colors = blanketColorsForCourseSize(course.hounds.length);
        const orderedHounds = quasiGroup ? course.hounds : secureShuffle(course.hounds);
        course.hounds = orderedHounds.map((entry, index) => ({
            entryId: entry.id,
            houndId: entry.houndId,
            callName: entry.callName,
            registeredName: entry.registeredName,
            registrationNumber: entry.registrationNumber,
            owner: entry.owner,
            breed: entry.breed || group.breed,
            runGroupBreed: group.breed,
            stake: entry.className || group.stake,
            ownerSeparationGroup: entry.ownerSeparationGroup || '',
            blanketColor: colors[index],
            drawPosition: index + 1,
        }));
        delete course.capacity;
    });

    return {
        id: crypto.randomUUID(),
        breed: group.breed,
        stake: group.stake,
        mixedStake: Boolean(group.mixedStake),
        entryCount: group.entries.length,
        courses,
    };
}

function auditDrawChange(draw, description) {
    return {
        ...draw,
        manuallyAltered: true,
        manualChanges: [
            ...(draw.manualChanges || []),
            {
                id: crypto.randomUUID(),
                at: new Date().toISOString(),
                description,
            },
        ],
    };
}

function redrawPreliminaryDrawGroup(groupId) {
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups)) {
        showMessage(rollCallMessage, 'Build the preliminary draw first.', 'warning');
        return;
    }

    const existingGroup = draw.groups.find((group) => group.id === groupId);
    if (!existingGroup) {
        showMessage(rollCallMessage, 'Could not find that draw group.', 'warning');
        return;
    }

    if (isPreliminaryDrawGroupLocked(trial, existingGroup)) {
        showPreliminaryDrawLockedMessage('group');
        render();
        return;
    }

    const entries = (trial.entries || []).map(enrichEntryForRollCall);
    const presentEntryById = new Map(entries
        .filter((entry) => entry.rollCallStatus === 'present')
        .map((entry) => [entry.id, entry]));
    const currentGroupEntryIds = (existingGroup.courses || [])
        .flatMap((course) => course.hounds || [])
        .map((hound) => hound.entryId)
        .filter(Boolean);
    const currentGroupEntries = uniqueNames(currentGroupEntryIds)
        .map((entryId) => presentEntryById.get(entryId))
        .filter(Boolean);

    if (currentGroupEntries.length === 0) {
        showMessage(rollCallMessage, 'No present hounds found for that run group.', 'warning');
        return;
    }

    const replacement = buildDrawGroup({
        key: existingGroup.key || `${existingGroup.breed}|${existingGroup.stake}`,
        breed: existingGroup.breed,
        stake: existingGroup.stake,
        entries: currentGroupEntries,
    });
    replacement.id = existingGroup.id;
    replacement.mixedStake = existingGroup.mixedStake || false;
    replacement.manualNote = existingGroup.manualNote || '';
    replacement.manuallyAltered = existingGroup.manuallyAltered || false;
    trial.preliminaryDraw = auditDrawChange({
        ...draw,
        createdAt: new Date().toISOString(),
        groups: draw.groups.map((group) => group.id === groupId ? replacement : group),
    }, `Redrew ${existingGroup.breed} ${existingGroup.stake}.`);

    upsertTrial(trial);
    saveTrials();
    showMessage(rollCallMessage, `Redrew ${existingGroup.breed} ${existingGroup.stake}.`, 'success');
    render();
}

function updateDrawSeparationGroup(entryId, groupValue) {
    const group = String(groupValue || '').trim().toUpperCase();
    const trial = readForm();
    const drawGroup = ((trial.preliminaryDraw || {}).groups || [])
        .find((item) => (item.courses || []).some((course) => (course.hounds || []).some((hound) => hound.entryId === entryId)));
    if (drawGroup && isPreliminaryDrawGroupLocked(trial, drawGroup) && manualDrawEditKey !== `prelim:${drawGroup.id}`) {
        showPreliminaryDrawLockedMessage('group');
        render();
        return;
    }
    const existingEntry = (trial.entries || []).find((entry) => entry.id === entryId);
    const changed = clean((existingEntry || {}).ownerSeparationGroup) !== clean(group)
        || Boolean((existingEntry || {}).ownerSeparationRequested) !== Boolean(group);
    if (changed) {
        trial.ownerSeparationReviewedAt = '';
    }
    trial.entries = (trial.entries || []).map((entry) => entry.id === entryId ? {
        ...entry,
        ownerSeparationRequested: Boolean(group),
        ownerSeparationGroup: group,
    } : entry);

    if (trial.preliminaryDraw && Array.isArray(trial.preliminaryDraw.groups)) {
        trial.preliminaryDraw = auditDrawChange({
            ...trial.preliminaryDraw,
            groups: trial.preliminaryDraw.groups.map((drawGroup) => ({
                ...drawGroup,
                courses: (drawGroup.courses || []).map((course) => ({
                    ...course,
                    hounds: (course.hounds || []).map((hound) => hound.entryId === entryId ? {
                        ...hound,
                        ownerSeparationGroup: group,
                    } : hound),
                })),
            })),
        }, `Updated owner separation group for draw hound to ${group || 'blank'}.`);
    }

    upsertTrial(trial);
    saveTrials();
    render();
}

function updateDrawGroupManualFields(groupId, changes) {
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups)) {
        return;
    }
    const group = draw.groups.find((item) => item.id === groupId);
    if (group && isPreliminaryDrawGroupLocked(trial, group) && manualDrawEditKey !== `prelim:${group.id}`) {
        showPreliminaryDrawLockedMessage('group');
        render();
        return;
    }

    trial.preliminaryDraw = auditDrawChange({
        ...draw,
        groups: draw.groups.map((group) => group.id === groupId ? { ...group, ...changes, manuallyAltered: true } : group),
    }, 'Updated manual draw notes or mixed-stake marking.');
    upsertTrial(trial);
    saveTrials();
    render();
}

function moveDrawHound(entryId, targetValue) {
    if (!targetValue) {
        return;
    }

    const [targetGroupId, targetCourseId] = targetValue.split('|');
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups)) {
        return;
    }
    const sourceGroup = draw.groups
        .find((group) => (group.courses || []).some((course) => (course.hounds || []).some((hound) => hound.entryId === entryId)));
    const targetGroup = draw.groups.find((group) => group.id === targetGroupId);
    if (
        ((sourceGroup && isPreliminaryDrawGroupLocked(trial, sourceGroup)) || (targetGroup && isPreliminaryDrawGroupLocked(trial, targetGroup)))
        && sourceGroup
        && manualDrawEditKey !== `prelim:${sourceGroup.id}`
    ) {
        showPreliminaryDrawLockedMessage('group');
        render();
        return;
    }

    let movedHound = null;
    let sourceLabel = '';
    const groupsWithoutHound = draw.groups.map((group) => ({
        ...group,
        courses: (group.courses || []).map((course) => {
            const found = (course.hounds || []).find((hound) => hound.entryId === entryId);
            if (found) {
                movedHound = { ...found, manuallyMoved: true };
                sourceLabel = `${groupTitle(group)} course ${course.number}`;
            }
            return {
                ...course,
                hounds: normalizeManualCourseHounds((course.hounds || []).filter((hound) => hound.entryId !== entryId)),
            };
        }),
    }));

    if (!movedHound) {
        showMessage(rollCallMessage, 'Could not find that hound in the draw.', 'warning');
        return;
    }

    let targetLabel = '';
    const nextGroups = groupsWithoutHound.map((group) => ({
        ...group,
        manuallyAltered: group.manuallyAltered || group.id === targetGroupId,
        courses: (group.courses || []).map((course) => {
            if (group.id !== targetGroupId || course.id !== targetCourseId) {
                return course;
            }
            targetLabel = `${groupTitle(group)} course ${course.number}`;
            const hounds = normalizeManualCourseHounds([...(course.hounds || []), movedHound]);
            return { ...course, hounds, manuallyAltered: true };
        }),
    }));

    if (!targetLabel) {
        showMessage(rollCallMessage, 'Choose a valid target course.', 'warning');
        return;
    }

    trial.preliminaryDraw = auditDrawChange({
        ...draw,
        groups: nextGroups,
    }, `Moved ${movedHound.callName || movedHound.registeredName || 'hound'} from ${sourceLabel} to ${targetLabel}.`);

    upsertTrial(trial);
    saveTrials();
    showMessage(rollCallMessage, 'Manual draw move saved and audit note recorded.', 'success');
    render();
}

function updatePreliminaryDrawBlanket(entryId, color) {
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups)) {
        return;
    }

    const sourceGroup = draw.groups
        .find((group) => (group.courses || []).some((course) => (course.hounds || []).some((hound) => hound.entryId === entryId)));
    if (!sourceGroup) {
        showMessage(rollCallMessage, 'Could not find that hound in the draw.', 'warning');
        render();
        return;
    }
    if (manualDrawEditKey !== `prelim:${sourceGroup.id}`) {
        showPreliminaryDrawLockedMessage('group');
        render();
        return;
    }

    const changed = changeHoundBlanketWithinDraw({ courses: sourceGroup.courses || [] }, entryId, color, 'prelim', groupTitle(sourceGroup));
    if (!changed) {
        showMessage(rollCallMessage, 'Choose a valid blanket color for that course.', 'warning');
        render();
        return;
    }

    trial.preliminaryDraw = auditDrawChange({
        ...draw,
        groups: draw.groups.map((group) => group.id === sourceGroup.id
            ? { ...group, manuallyAltered: true, courses: changed.draw.courses }
            : group),
    }, `Manual edit: ${changed.description}`);
    upsertTrial(trial);
    saveTrials();
    showMessage(rollCallMessage, `Manual blanket change saved: ${changed.description}`, 'success');
    render();
}

function normalizeManualCourseHounds(hounds) {
    const colors = ['Yellow', 'Pink', 'Blue'];
    return hounds.map((hound, index) => ({
        ...hound,
        blanketColor: colors[index] || hound.blanketColor || '',
        drawPosition: index + 1,
    }));
}

function orderEntriesForDraw(entries) {
    const randomizedEntries = secureShuffle(entries);
    const separationCounts = new Map();

    randomizedEntries.forEach((entry) => {
        const group = ownerSeparationDrawKey(entry);
        if (group) {
            separationCounts.set(group, (separationCounts.get(group) || 0) + 1);
        }
    });

    const separatedEntries = randomizedEntries.filter((entry) => {
        const group = ownerSeparationDrawKey(entry);
        return group && separationCounts.get(group) > 1;
    });
    const otherEntries = randomizedEntries.filter((entry) => {
        const group = ownerSeparationDrawKey(entry);
        return !group || separationCounts.get(group) <= 1;
    });

    return [...separatedEntries, ...otherEntries];
}

function orderEntriesForSequentialSoloDraw(entries) {
    let bestOrder = secureShuffle(entries);
    let bestScore = sequentialSeparationConflictCount(bestOrder);

    for (let attempt = 0; attempt < 60 && bestScore > 0; attempt += 1) {
        const candidate = secureShuffle(entries);
        const score = sequentialSeparationConflictCount(candidate);
        if (score < bestScore) {
            bestOrder = candidate;
            bestScore = score;
        }
    }

    return bestOrder;
}

function sequentialSeparationConflictCount(entries) {
    let conflicts = 0;
    for (let index = 1; index < entries.length; index += 1) {
        const previous = ownerSeparationDrawKey(entries[index - 1]);
        const current = ownerSeparationDrawKey(entries[index]);
        if (previous && current && previous === current) {
            conflicts += 1;
        }
    }
    return conflicts;
}

function ownerSeparationDrawKey(entry) {
    return String(entry.ownerSeparationGroup || '').trim().toUpperCase();
}

function drawCourseOptions(draw, currentCourseId) {
    const options = [];
    (draw.groups || []).forEach((group) => {
        (group.courses || []).forEach((course) => {
            options.push({
                value: `${group.id}|${course.id}`,
                label: `${groupTitle(group)} - Course ${course.number}`,
                current: course.id === currentCourseId,
            });
        });
    });
    return options;
}

function courseSizesForEntryCount(count, fillCourses = false) {
    if (fillCourses) {
        const sizes = [];
        let remaining = count;
        while (remaining > 0) {
            const size = Math.min(3, remaining);
            sizes.push(size);
            remaining -= size;
        }
        return sizes;
    }
    const sizes = [];
    let remaining = count;
    while (remaining > 0) {
        if (remaining <= 3) {
            sizes.push(remaining);
            break;
        }
        if (remaining === 4) {
            sizes.push(2, 2);
            break;
        }
        sizes.push(3);
        remaining -= 3;
    }
    return sizes;
}

function assignEntriesSequentiallyToCourses(courses, entries) {
    let courseIndex = 0;
    entries.forEach((entry) => {
        while (courseIndex < courses.length && courses[courseIndex].hounds.length >= courses[courseIndex].capacity) {
            courseIndex += 1;
        }
        const course = courses[Math.min(courseIndex, courses.length - 1)];
        course.hounds.push(entry);
    });
}

function chooseCourseForEntry(courses, entry) {
    const open = courses.filter((course) => course.hounds.length < course.capacity);
    const group = ownerSeparationDrawKey(entry);
    const preferred = group
        ? open.filter((course) => !course.hounds.some((hound) => ownerSeparationDrawKey(hound) === group))
        : open;
    const candidates = preferred.length ? preferred : open;
    const fewestHounds = Math.min(...candidates.map((course) => course.hounds.length));
    return secureChoice(candidates.filter((course) => course.hounds.length === fewestHounds));
}

function blanketColorsForCourseSize(size) {
    if (size <= 1) {
        return ['Yellow'];
    }
    if (size === 2) {
        return ['Yellow', 'Pink'];
    }
    return ['Yellow', 'Pink', 'Blue'];
}

function secureShuffle(values) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = secureRandomInt(index + 1);
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

function secureChoice(values) {
    return values[secureRandomInt(values.length)];
}

function secureRandomInt(maxExclusive) {
    if (maxExclusive <= 0) {
        return 0;
    }
    const maxUint = 0x100000000;
    const limit = maxUint - (maxUint % maxExclusive);
    const array = new Uint32Array(1);
    do {
        crypto.getRandomValues(array);
    } while (array[0] >= limit);
    return array[0] % maxExclusive;
}

function renderPreliminaryDraw(trial) {
    const container = document.getElementById('preliminaryDraw');
    if (!container) {
        return;
    }
    renderPrelimJudgeSheetQueue(trial);

    const draw = trial.preliminaryDraw;
    const buildButton = document.getElementById('buildPreliminaryDrawButton');
    const drawLocked = isPreliminaryDrawLocked(trial || {});
    if (buildButton) {
        buildButton.disabled = drawLocked;
        buildButton.textContent = drawLocked ? 'Prelim Draw Locked' : 'Build Preliminary Draw';
        buildButton.dataset.help = drawLocked
            ? 'Preliminary scoring has started or prelims are locked, so the Roll Call draw cannot be rebuilt.'
            : 'Creates the randomized preliminary draw from present roll-call hounds.';
    }
    container.innerHTML = '';
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Build the preliminary draw after roll call is complete.';
        container.appendChild(empty);
        return;
    }

    const meta = document.createElement('p');
    meta.className = 'field-note';
    meta.textContent = `${draw.manuallyAltered ? 'Random draw with manual changes' : 'Random draw'} created ${formatTimestamp(draw.createdAt)}.${drawLocked ? ' Preliminary draw is locked because scoring has started.' : ''}`;
    container.appendChild(meta);

    draw.groups.forEach((group) => {
        const manualKey = `prelim:${group.id}`;
        const manualMode = manualDrawEditKey === manualKey;
        const groupLocked = isPreliminaryDrawGroupLocked(trial || {}, group);
        const card = document.createElement('div');
        card.className = 'course-group';

        const heading = document.createElement('div');
        heading.className = 'course-group-heading';
        const title = document.createElement('h3');
        title.textContent = groupTitle(group);
        const metaText = document.createElement('span');
        const currentCount = (group.courses || []).reduce((total, course) => total + (course.hounds || []).length, 0);
        metaText.textContent = `${currentCount} hound${currentCount === 1 ? '' : 's'} / ${group.courses.length} course${group.courses.length === 1 ? '' : 's'}`;
        heading.append(title, metaText);
        const redraw = document.createElement('button');
        redraw.type = 'button';
        redraw.className = 'secondary small';
        redraw.textContent = groupLocked ? 'Draw Locked' : 'Redraw This Stake';
        redraw.disabled = groupLocked;
        redraw.dataset.help = groupLocked
            ? 'This group has preliminary scores entered or prelims are locked, so it cannot be redrawn.'
            : 'Randomly redraws only this preliminary stake.';
        redraw.addEventListener('click', () => redrawPreliminaryDrawGroup(group.id));
        heading.appendChild(redraw);
        heading.appendChild(manualDrawToggleButton(manualKey));
        card.appendChild(heading);

        const manualRow = document.createElement('div');
        manualRow.className = 'draw-manual-row';
        const mixedLabel = document.createElement('label');
        mixedLabel.className = 'switch compact-switch';
        const mixed = document.createElement('input');
        mixed.type = 'checkbox';
        mixed.checked = Boolean(group.mixedStake);
        mixed.disabled = groupLocked && !manualMode;
        mixed.addEventListener('change', () => updateDrawGroupManualFields(group.id, { mixedStake: mixed.checked }));
        const mixedText = document.createElement('span');
        mixedText.textContent = 'Mixed stake course';
        mixedLabel.append(mixed, mixedText);
        const note = document.createElement('input');
        note.placeholder = 'Manual draw note';
        note.value = group.manualNote || '';
        note.disabled = groupLocked && !manualMode;
        note.addEventListener('change', () => updateDrawGroupManualFields(group.id, { manualNote: note.value.trim() }));
        manualRow.append(mixedLabel, note);
        card.appendChild(manualRow);
        if (manualMode) {
            const manualNote = document.createElement('p');
            manualNote.className = 'field-note';
            manualNote.textContent = 'Manual override mode. Move hounds only when the FTS intentionally needs to override the random draw.';
            card.appendChild(manualNote);
        }

        group.courses.forEach((course) => {
            const courseBlock = document.createElement('div');
            courseBlock.className = 'draw-course';
            const courseTitle = document.createElement('h4');
            courseTitle.textContent = `Course ${course.number}`;
            courseBlock.appendChild(courseTitle);

            const list = document.createElement('ul');
            if (!course.hounds || course.hounds.length === 0) {
                const empty = document.createElement('li');
                empty.className = 'empty';
                empty.textContent = 'No hounds in this course.';
                list.appendChild(empty);
            }
            (course.hounds || []).forEach((hound) => {
                const item = document.createElement('li');
                const color = document.createElement('span');
                color.className = `blanket blanket-${clean(hound.blanketColor).toLowerCase()}`;
                color.textContent = hound.blanketColor;
                const text = document.createElement('span');
                const houndDetail = isQuasiBreedGroup(group)
                    ? `${hound.breed || 'Unknown breed'}${hound.stake ? ` - ${hound.stake}` : ''}`
                    : (hound.stake || group.stake);
                text.textContent = `${drawHoundName(hound)} - ${houndDetail}${hound.manuallyMoved ? ' [manual]' : ''}`;
                const groupInput = document.createElement('input');
                groupInput.className = 'draw-separation-input';
                groupInput.maxLength = 3;
                groupInput.placeholder = 'Group';
                groupInput.title = 'Owner separation group';
                groupInput.value = hound.ownerSeparationGroup || '';
                groupInput.disabled = groupLocked && !manualMode;
                groupInput.addEventListener('input', (event) => {
                    event.target.value = event.target.value.toUpperCase();
                });
                groupInput.addEventListener('change', () => updateDrawSeparationGroup(hound.entryId, groupInput.value));
                const moveSelect = document.createElement('select');
                moveSelect.className = 'draw-move-select';
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Move to...';
                moveSelect.appendChild(defaultOption);
                moveSelect.disabled = !manualMode;
                drawCourseOptions(draw, course.id).filter((option) => !option.current).forEach((option) => {
                    const itemOption = document.createElement('option');
                    itemOption.value = option.value;
                    itemOption.textContent = option.label;
                    moveSelect.appendChild(itemOption);
                });
                moveSelect.addEventListener('change', () => moveDrawHound(hound.entryId, moveSelect.value));
                const colorSelect = document.createElement('select');
                colorSelect.className = 'draw-move-select';
                colorSelect.disabled = !manualMode;
                blanketColorsForCourseSize((course.hounds || []).length).forEach((blanketColor) => {
                    const option = document.createElement('option');
                    option.value = blanketColor;
                    option.textContent = blanketColor;
                    colorSelect.appendChild(option);
                });
                colorSelect.value = drawColorForType(hound, 'prelim') || blanketColorsForCourseSize((course.hounds || []).length)[0] || '';
                colorSelect.addEventListener('change', () => updatePreliminaryDrawBlanket(hound.entryId, colorSelect.value));
                item.append(color, text, groupInput, moveSelect, colorSelect);
                list.appendChild(item);
            });
            courseBlock.appendChild(list);
            card.appendChild(courseBlock);
        });

        container.appendChild(card);
    });

    renderDrawAuditLog(container, draw);
}

function renderDrawAuditLog(container, draw) {
    if (!draw.manualChanges || draw.manualChanges.length === 0) {
        return;
    }

    const audit = document.createElement('div');
    audit.className = 'draw-audit';
    const title = document.createElement('h3');
    title.textContent = 'Manual Draw Changes';
    audit.appendChild(title);
    const list = document.createElement('ul');
    draw.manualChanges.slice().reverse().forEach((change) => {
        const item = document.createElement('li');
        item.textContent = `${formatTimestamp(change.at)} - ${change.description}`;
        list.appendChild(item);
    });
    audit.appendChild(list);
    container.appendChild(audit);
}

function manualDrawToggleButton(key) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary small';
    button.textContent = manualDrawEditKey === key ? 'Close Manual Edit' : 'Manual Edit Draw';
    button.dataset.help = 'Opens controlled manual draw override controls. Any move is recorded in the draw audit log.';
    button.addEventListener('click', () => {
        manualDrawEditKey = manualDrawEditKey === key ? '' : key;
        render();
    });
    return button;
}

function drawHoundName(hound) {
    const name = hound.callName || hound.registeredName || hound.name || 'Unnamed hound';
    return String(name).replace(/\s*\(\s*sep(?:arate)?\s+[A-Z0-9]{1,3}\s*\)\s*$/i, '').trim() || 'Unnamed hound';
}

function drawColorOrder(color) {
    const order = new Map([
        ['YELLOW', 1],
        ['PINK', 2],
        ['BLUE', 3],
    ]);
    return order.get(clean(color)) || 99;
}

function drawColorForType(hound, type) {
    if (type === 'final') {
        return hound.finalBlanketColor || hound.blanketColor || '';
    }
    if (type === 'bif') {
        return hound.bifBlanketColor || hound.blanketColor || '';
    }
    if (type === 'prelim') {
        return hound.blanketColor || '';
    }
    return hound.tieBreakBlanketColor || hound.bobBlanketColor || hound.blanketColor || '';
}

function applyDrawColorFields(hound, courseNumber, type, color) {
    const code = `${courseNumber}${blanketCode(color)}`;
    const next = {
        ...hound,
        drawPosition: drawColorOrder(color),
        manuallyMoved: true,
    };
    if (type === 'final') {
        return { ...next, blanketColor: color, finalBlanketColor: color, finalCourse: courseNumber, finalCode: code };
    }
    if (type === 'bif') {
        return { ...next, blanketColor: color, bifCourse: courseNumber, bifBlanketColor: color, bifCode: code };
    }
    if (type === 'prelim') {
        return { ...next, blanketColor: color };
    }
    return {
        ...next,
        tieBreakCourse: courseNumber,
        tieBreakBlanketColor: color,
        tieBreakCode: code,
        bobCourse: courseNumber,
        bobBlanketColor: color,
        bobCode: code,
    };
}

function sortDrawHoundsByAssignedColor(hounds, type) {
    return [...hounds].sort((a, b) => {
        const colorA = drawColorForType(a, type) || displayBlanketColor(a);
        const colorB = drawColorForType(b, type) || displayBlanketColor(b);
        const colorDiff = drawColorOrder(colorA) - drawColorOrder(colorB);
        if (colorDiff !== 0) {
            return colorDiff;
        }
        return Number(a.drawPosition || 0) - Number(b.drawPosition || 0);
    });
}

function normalizeDrawHoundsForType(hounds, courseNumber, type) {
    const colors = ['Yellow', 'Pink', 'Blue'];
    return hounds.map((hound, index) => {
        const color = colors[index] || hound.blanketColor || hound.tieBreakBlanketColor || hound.bobBlanketColor || hound.bifBlanketColor || '';
        return { ...applyDrawColorFields(hound, courseNumber, type, color), drawPosition: index + 1 };
    });
}

function normalizeBifDrawColors(draw) {
    if (!draw || !Array.isArray(draw.courses)) {
        return draw || null;
    }
    return {
        ...draw,
        courses: draw.courses.map((course) => {
            const allowedColors = blanketColorsForCourseSize((course.hounds || []).length);
            const used = new Set();
            const hounds = (course.hounds || []).map((hound, index) => {
                const current = drawColorForType(hound, 'bif');
                const isAllowed = allowedColors.some((color) => clean(color) === clean(current));
                const color = isAllowed && !used.has(clean(current))
                    ? allowedColors.find((candidate) => clean(candidate) === clean(current))
                    : allowedColors.find((candidate) => !used.has(clean(candidate))) || allowedColors[index] || '';
                if (color) {
                    used.add(clean(color));
                }
                const code = color ? `${course.number}${blanketCode(color)}` : '';
                return {
                    ...hound,
                    blanketColor: color,
                    bifCourse: course.number,
                    bifBlanketColor: color,
                    bifCode: code,
                    drawPosition: drawColorOrder(color) || index + 1,
                };
            });
            return {
                ...course,
                hounds: sortDrawHoundsByAssignedColor(hounds, 'bif').map((hound, index) => ({
                    ...hound,
                    drawPosition: index + 1,
                })),
            };
        }),
    };
}

function moveHoundWithinDraw(draw, entryId, targetCourseId, type, title) {
    let movedHound = null;
    let sourceLabel = '';
    const coursesWithoutHound = (draw.courses || []).map((course) => {
        const found = (course.hounds || []).find((hound) => hound.entryId === entryId);
        if (found) {
            movedHound = { ...found, manuallyMoved: true };
            sourceLabel = `Course ${course.number}`;
        }
        return {
            ...course,
            hounds: normalizeDrawHoundsForType((course.hounds || []).filter((hound) => hound.entryId !== entryId), course.number, type),
        };
    });

    if (!movedHound) {
        return null;
    }

    let targetLabel = '';
    const courses = coursesWithoutHound.map((course) => {
        if (course.id !== targetCourseId) {
            return course;
        }
        targetLabel = `Course ${course.number}`;
        return {
            ...course,
            hounds: normalizeDrawHoundsForType([...(course.hounds || []), movedHound], course.number, type),
        };
    });

    if (!targetLabel) {
        return null;
    }

    return {
        draw: auditDrawChange({ ...draw, courses }, `Manual edit: moved ${drawHoundName(movedHound)} in ${title} from ${sourceLabel} to ${targetLabel}.`),
        description: `Moved ${drawHoundName(movedHound)} from ${sourceLabel} to ${targetLabel}.`,
    };
}

function changeHoundBlanketWithinDraw(draw, entryId, color, type, title) {
    const nextColor = String(color || '').trim();
    if (!nextColor) {
        return null;
    }

    let changedHound = null;
    let courseLabel = '';
    const courses = (draw.courses || []).map((course) => {
        const target = (course.hounds || []).find((hound) => hound.entryId === entryId);
        if (!target) {
            return course;
        }

        const allowedColors = blanketColorsForCourseSize((course.hounds || []).length);
        if (!allowedColors.some((allowed) => clean(allowed) === clean(nextColor))) {
            return course;
        }

        const oldColor = drawColorForType(target, type) || allowedColors[0];
        changedHound = target;
        courseLabel = `Course ${course.number}`;
        const hounds = (course.hounds || []).map((hound) => {
            if (hound.entryId === entryId) {
                return applyDrawColorFields(hound, course.number, type, nextColor);
            }
            if (clean(drawColorForType(hound, type)) === clean(nextColor)) {
                return applyDrawColorFields(hound, course.number, type, oldColor);
            }
            return hound;
        });

        return {
            ...course,
            hounds: sortDrawHoundsByAssignedColor(hounds, type).map((hound, index) => ({ ...hound, drawPosition: index + 1 })),
        };
    });

    if (!changedHound) {
        return null;
    }

    return {
        draw: auditDrawChange({ ...draw, courses }, `Manual edit: set ${drawHoundName(changedHound)} in ${title} ${courseLabel} to ${nextColor}.`),
        description: `Set ${drawHoundName(changedHound)} to ${nextColor} in ${courseLabel}.`,
    };
}

function renderManualDrawEditor({ key, draw, type, title, onMove, onColorChange }) {
    const panel = document.createElement('div');
    panel.className = 'manual-draw-editor';
    if (manualDrawEditKey !== key || !draw || !Array.isArray(draw.courses)) {
        return panel;
    }

    const note = document.createElement('p');
    note.className = 'field-note';
    note.textContent = 'Manual override mode. Move hounds or assign blankets only when the FTS intentionally needs to override the random draw.';
    panel.appendChild(note);

    draw.courses.forEach((course) => {
        const block = document.createElement('div');
        block.className = 'draw-course';
        const heading = document.createElement('h4');
        heading.textContent = `Course ${course.number}`;
        block.appendChild(heading);
        const list = document.createElement('ul');
        (course.hounds || []).forEach((hound) => {
            const item = document.createElement('li');
            const color = document.createElement('span');
            color.className = `blanket blanket-${clean(displayBlanketColor(hound)).toLowerCase()}`;
            color.textContent = displayBlanketColor(hound) || '';
            const text = document.createElement('span');
            text.textContent = drawHoundName(hound);
            const moveSelect = document.createElement('select');
            moveSelect.className = 'draw-move-select';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Move to...';
            moveSelect.appendChild(defaultOption);
            (draw.courses || []).filter((target) => target.id !== course.id).forEach((target) => {
                const option = document.createElement('option');
                option.value = target.id;
                option.textContent = `${title} - Course ${target.number}`;
                moveSelect.appendChild(option);
            });
            moveSelect.addEventListener('change', () => onMove(hound.entryId, moveSelect.value));
            const colorSelect = document.createElement('select');
            colorSelect.className = 'draw-move-select';
            blanketColorsForCourseSize((course.hounds || []).length).forEach((blanketColor) => {
                const option = document.createElement('option');
                option.value = blanketColor;
                option.textContent = blanketColor;
                colorSelect.appendChild(option);
            });
            colorSelect.value = drawColorForType(hound, type) || displayBlanketColor(hound) || blanketColorsForCourseSize((course.hounds || []).length)[0] || '';
            colorSelect.addEventListener('change', () => {
                if (onColorChange) {
                    onColorChange(hound.entryId, colorSelect.value);
                }
            });
            item.append(color, text, moveSelect, colorSelect);
            list.appendChild(item);
        });
        block.appendChild(list);
        panel.appendChild(block);
    });
    return panel;
}

function renderScorebook(trial) {
    renderMainResultsBook(trial);
    renderScorebookSection('preliminaryScorebook', trial, 'prelim');
    renderFinalsJudgeSheetQueue(trial);
    renderScorebookSection('finalsScorebook', trial, 'finals');
}

const sheetQueueCollapseState = {
    prelim: true,
    finals: true,
};

function prelimJudgeSheetPrintSignature(group) {
    const draw = group || {};
    const courses = Array.isArray(draw.courses) ? draw.courses : [];
    const courseSignature = courses.map((course) => {
        const hounds = Array.isArray(course.hounds) ? course.hounds : [];
        return `${course.number || ''}:${hounds.map((hound) => `${hound.entryId || ''}-${hound.blanketColor || ''}`).join('|')}`;
    }).join(';');
    return `${group && group.id ? group.id : ''}|${draw.createdAt || ''}|${courseSignature}`;
}

function finalsJudgeSheetPrintSignature(group) {
    const draw = group && group.finalDraw ? group.finalDraw : {};
    const courses = Array.isArray(draw.courses) ? draw.courses : [];
    const courseSignature = courses.map((course) => {
        const hounds = Array.isArray(course.hounds) ? course.hounds : [];
        return `${course.number || ''}:${hounds.map((hound) => `${hound.entryId || ''}-${hound.finalBlanketColor || hound.blanketColor || ''}`).join('|')}`;
    }).join(';');
    return `${group && group.id ? group.id : ''}|${draw.createdAt || ''}|${courseSignature}`;
}

function judgeSheetPrintRecords(trial, key) {
    return ((trial && trial.printStatus && trial.printStatus[key]) || {});
}

function prelimJudgeSheetStatus(trial, group) {
    const record = judgeSheetPrintRecords(trial, 'prelimJudgeSheetGroups')[group.id] || {};
    const signature = prelimJudgeSheetPrintSignature(group);
    if (record.signature && record.signature === signature) {
        return { key: 'printed', label: `Printed ${formatTimestamp(record.printedAt)}` };
    }
    if (record.signature) {
        return { key: 'stale', label: 'Needs reprint' };
    }
    return { key: 'ready', label: 'Ready' };
}

function finalsJudgeSheetPrintRecords(trial) {
    return ((trial && trial.printStatus && trial.printStatus.finalJudgeSheetGroups) || {});
}

function finalsJudgeSheetStatus(trial, group) {
    const record = finalsJudgeSheetPrintRecords(trial)[group.id] || {};
    const signature = finalsJudgeSheetPrintSignature(group);
    if (record.signature && record.signature === signature) {
        return { key: 'printed', label: `Printed ${formatTimestamp(record.printedAt)}` };
    }
    if (record.signature) {
        return { key: 'stale', label: 'Needs reprint' };
    }
    return { key: 'ready', label: 'Ready' };
}

function finalsJudgeSheetReadyGroups(trial) {
    const groups = (((trial || {}).preliminaryDraw || {}).groups || []);
    return sortDrawGroupsForPrint(groups, trial || {}).filter((group) => {
        const courses = (((group || {}).finalDraw || {}).courses || []);
        return courses.length > 0 && groupHasFinalHounds(group);
    });
}

function prelimJudgeSheetReadyGroups(trial) {
    const groups = (((trial || {}).preliminaryDraw || {}).groups || []);
    return sortDrawGroupsForPrint(groups, trial || {}).filter((group) => {
        const courses = Array.isArray(group.courses) ? group.courses : [];
        return courses.length > 0 && groupHasPrelimHounds(group);
    });
}

function allReadyPrelimJudgeSheetsPrinted(trial) {
    const readyGroups = prelimJudgeSheetReadyGroups(trial);
    return readyGroups.length > 0 && readyGroups.every((group) => prelimJudgeSheetStatus(trial, group).key === 'printed');
}

function allReadyFinalsJudgeSheetsPrinted(trial) {
    const readyGroups = finalsJudgeSheetReadyGroups(trial);
    return readyGroups.length > 0 && readyGroups.every((group) => finalsJudgeSheetStatus(trial, group).key === 'printed');
}

function renderPrelimJudgeSheetQueue(trial) {
    renderJudgeSheetQueue({
        trial,
        panelId: 'prelimJudgeSheetQueue',
        kind: 'prelim',
        title: 'Preliminary Judge Sheet Queue',
        description: 'Print selected preliminary judge sheets in running order, then reprint only the ones that change.',
        emptyText: 'No preliminary judge sheets are ready yet. Build the preliminary draw and they will appear here.',
        checkboxClass: 'prelim-judge-sheet-check',
        readyGroups: prelimJudgeSheetReadyGroups(trial),
        statusForGroup: (group) => prelimJudgeSheetStatus(trial, group),
        coursesForGroup: (group) => group.courses || [],
        printGroups: printPreliminaryJudgeSheetsForGroups,
        selectedHelp: 'Creates one PDF packet for the checked preliminary judge sheets so you can avoid wasting a blank back side.',
        allHelp: 'Prints every preliminary judge sheet that has not been printed yet, plus any sheet whose draw changed.',
    });
}

function renderFinalsJudgeSheetQueue(trial) {
    renderJudgeSheetQueue({
        trial,
        panelId: 'finalsJudgeSheetQueue',
        kind: 'finals',
        title: 'Finals Judge Sheet Queue',
        description: 'Print selected finals sheets in running order, then reprint only the ones that change.',
        emptyText: 'No finals judge sheets are ready yet. Draw finals for a stake or breed and it will appear here.',
        checkboxClass: 'finals-judge-sheet-check',
        readyGroups: finalsJudgeSheetReadyGroups(trial),
        statusForGroup: (group) => finalsJudgeSheetStatus(trial, group),
        coursesForGroup: (group) => (((group || {}).finalDraw || {}).courses || []),
        printGroups: printFinalsJudgeSheetsForGroups,
        selectedHelp: 'Creates one PDF packet for the checked finals judge sheets so you can avoid wasting a blank back side.',
        allHelp: 'Prints every finals judge sheet that has not been printed yet, plus any sheet whose finals draw changed.',
        extraActions: [{
            text: 'Print Huntmaster Sheet',
            className: 'secondary small report-button',
            help: 'Creates the official finals draw order sheet for the huntmaster from all ready finals draws.',
            disabled: finalsJudgeSheetReadyGroups(trial).length === 0,
            onClick: () => printFinalsHuntmasterSheet(),
        }],
    });
}

function renderJudgeSheetQueue({
    trial,
    panelId,
    kind,
    title: titleText,
    description,
    emptyText,
    checkboxClass,
    readyGroups,
    statusForGroup,
    coursesForGroup,
    printGroups,
    selectedHelp,
    allHelp,
    extraActions = [],
}) {
    const panel = document.getElementById(panelId);
    if (!panel) {
        return;
    }
    panel.innerHTML = '';
    const heading = document.createElement('div');
    heading.className = 'sheet-queue-heading';
    const title = document.createElement('div');
    const unprintedCount = readyGroups.filter((group) => statusForGroup(group).key !== 'printed').length;
    title.innerHTML = `<h3>${titleText}</h3><p>${description} ${readyGroups.length ? `${readyGroups.length} ready, ${unprintedCount} needing print.` : ''}</p>`;
    const actions = document.createElement('div');
    actions.className = 'button-row';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'secondary small';
    toggle.textContent = sheetQueueCollapseState[kind] ? 'Show Queue' : 'Hide Queue';
    toggle.dataset.help = 'Shows or hides the detailed judge sheet queue.';
    toggle.addEventListener('click', () => {
        sheetQueueCollapseState[kind] = !sheetQueueCollapseState[kind];
        renderJudgeSheetQueue({ trial, panelId, kind, title: titleText, description, emptyText, checkboxClass, readyGroups, statusForGroup, coursesForGroup, printGroups, selectedHelp, allHelp, extraActions });
    });

    const printSelected = document.createElement('button');
    printSelected.type = 'button';
    printSelected.className = 'primary small report-button';
    printSelected.textContent = 'Print Selected';
    printSelected.dataset.help = selectedHelp;
    printSelected.disabled = readyGroups.length === 0;
    printSelected.addEventListener('click', () => {
        const selectedIds = [...panel.querySelectorAll(`.${checkboxClass}:checked`)].map((input) => input.value);
        printGroups(selectedIds);
    });

    const printUnprinted = document.createElement('button');
    printUnprinted.type = 'button';
    printUnprinted.className = 'secondary small report-button';
    printUnprinted.textContent = 'Print All';
    printUnprinted.dataset.help = allHelp;
    printUnprinted.disabled = readyGroups.length === 0;
    printUnprinted.addEventListener('click', async () => {
        const groupIds = readyGroups
            .filter((group) => statusForGroup(group).key !== 'printed')
            .map((group) => group.id);
        if (groupIds.length > 0) {
            printGroups(groupIds);
            return;
        }
        const sheetLabel = kind === 'finals' ? 'finals judge sheets' : 'preliminary judge sheets';
        const reprint = await showTrialConfirm({
            title: 'Reprint Judge Sheets',
            eyebrow: sheetLabel,
            message: `All ready ${sheetLabel} have already been printed. Reprint all ${readyGroups.length} ready sheet${readyGroups.length === 1 ? '' : 's'}?`,
            primaryText: 'Reprint All',
        });
        if (reprint) {
            printGroups(readyGroups.map((group) => group.id));
        }
    });

    actions.append(toggle, printSelected, printUnprinted);
    extraActions.forEach((action) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = action.className || 'secondary small';
        button.textContent = action.text || 'Action';
        if (action.help) {
            button.dataset.help = action.help;
        }
        button.disabled = Boolean(action.disabled);
        button.addEventListener('click', () => action.onClick && action.onClick());
        actions.appendChild(button);
    });
    heading.append(title, actions);
    panel.appendChild(heading);

    const body = document.createElement('div');
    body.className = 'sheet-queue-body';
    body.hidden = Boolean(sheetQueueCollapseState[kind]);
    panel.appendChild(body);

    if (readyGroups.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty compact';
        empty.textContent = emptyText;
        body.appendChild(empty);
        return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'table-wrap compact';
    const table = document.createElement('table');
    table.className = 'sheet-queue-table';
    table.innerHTML = '<thead><tr><th>Print</th><th>Order</th><th>Stake</th><th>Courses</th><th>Status</th></tr></thead>';
    const tbody = document.createElement('tbody');
    readyGroups.forEach((group, index) => {
        const status = statusForGroup(group);
        const courses = coursesForGroup(group);
        const tr = document.createElement('tr');
        tr.className = `sheet-queue-row status-${status.key}`;

        const checkCell = document.createElement('td');
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.className = checkboxClass;
        check.value = group.id;
        check.checked = status.key !== 'printed';
        checkCell.appendChild(check);

        tr.appendChild(checkCell);
        tr.appendChild(textCell(String(index + 1)));
        tr.appendChild(textCell(groupTitle(group)));
        tr.appendChild(textCell(`${courses.length} course${courses.length === 1 ? '' : 's'}`));
        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `sheet-status sheet-status-${status.key}`;
        badge.textContent = status.label;
        statusCell.appendChild(badge);
        tr.appendChild(statusCell);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    body.appendChild(wrap);
}

function scoreAnchorSlug(value) {
    return String(value || 'item')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'item';
}

function scoringGroupAnchor(prefix, group) {
    return `score-${prefix}-${scoreAnchorSlug(group.id || groupTitle(group))}`;
}

function scoringRunoffAnchor(item) {
    return `score-runoff-${scoreAnchorSlug(item.id || item.title)}`;
}

function scrollOffset() {
    return ['.topbar', '.sub-tabs', '.workflow-strip']
        .map((selector) => document.querySelector(selector))
        .filter(Boolean)
        .reduce((total, element) => total + element.getBoundingClientRect().height, 0) + 14;
}

function scrollToElement(target, options = {}) {
    if (!target) {
        return;
    }
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - (options.offset ?? scrollOffset()));
    window.scrollTo({ top, behavior: options.behavior || 'smooth' });
}

function scrollToPageTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateReturnTopButton() {
    const button = document.getElementById('returnTopButton');
    if (!button) {
        return;
    }
    button.classList.toggle('visible', window.scrollY > 360);
}

function appendScoreJumpNav(container, items, label = 'Quick scroll') {
    const usableItems = (items || []).filter((item) => item.id && item.label);
    if (usableItems.length < 2) {
        return;
    }

    const nav = document.createElement('div');
    nav.className = 'score-jump-nav';
    const title = document.createElement('span');
    title.textContent = label;
    nav.appendChild(title);
    usableItems.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'secondary small';
        button.textContent = item.label;
        button.dataset.help = `Jump directly to ${item.label} on this scoring page.`;
        button.addEventListener('click', () => {
            const target = document.getElementById(item.id);
            scrollToElement(target);
        });
        nav.appendChild(button);
    });
    container.appendChild(nav);
}

function renderMainResultsBook(trial) {
    const container = document.getElementById('mainResultsBook');
    if (!container) {
        return;
    }
    container.innerHTML = '';
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Build the preliminary draw before results are available.';
        container.appendChild(empty);
        return;
    }

    const summary = document.createElement('div');
    summary.className = 'scorebook-summary';
    const rows = preliminaryScoreRows(draw);
    const prelimEntered = rows.filter((row) => hasScoreValue(row.score) || row.outcome).length;
    const bobCount = Object.values((trial.resultState || {}).bobResultsByEntry || {}).filter((result) => result === 'BOB').length;
    const bifCount = ((trial.resultState || {}).bifEligibleEntryIds || []).length;
    summary.appendChild(summaryItem('Prelim rows', `${prelimEntered}/${rows.length}`, prelimEntered === rows.length ? 'done' : 'todo'));
    summary.appendChild(summaryItem('BOB winners', String(bobCount), bobCount ? 'done' : 'todo'));
    summary.appendChild(summaryItem('BIF eligible', String(bifCount), bifCount ? 'done' : 'todo'));
    container.appendChild(summary);

    const entriesById = new Map((trial.entries || []).map((entry) => [entry.id, entry]));
    const groups = visibleScoreGroups(draw, trial, 'main');
    appendScoreJumpNav(container, groups.map((group) => ({
        id: scoringGroupAnchor('main', group),
        label: groupTitle(group),
    })));
    groups.forEach((group) => {
        const card = document.createElement('div');
        card.className = 'score-group';
        card.id = scoringGroupAnchor('main', group);
        const heading = document.createElement('div');
        heading.className = 'course-group-heading';
        const title = document.createElement('h3');
        title.textContent = groupTitle(group);
        const meta = document.createElement('span');
        meta.textContent = 'Results';
        heading.append(title, meta);
        card.appendChild(heading);

        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        const table = document.createElement('table');
        table.innerHTML = '<thead><tr><th>Prelim #/Clr</th><th>Hound</th><th>Reg #</th><th>Stake</th><th>Prelim J1</th><th>Prelim J2</th><th>Prelim Total</th><th>Final #/Clr</th><th>Final J1</th><th>Final J2</th><th>Final Total</th><th>Combined</th><th>Placement</th><th>Award</th><th>BIF</th></tr></thead>';
        const tbody = document.createElement('tbody');
        [...(group.courses || [])]
            .sort((a, b) => Number(a.number || 0) - Number(b.number || 0))
            .forEach((course) => {
                sortedHoundsByBlanket(course.hounds || []).forEach((hound) => {
                    const tr = document.createElement('tr');
                    const entry = entriesById.get(hound.entryId) || {};
                    const finalDetails = finalDetailsForEntry(group, hound.entryId);
                    const prelimCodeCell = document.createElement('td');
                    const prelimBadge = document.createElement('span');
                    prelimBadge.className = `blanket blanket-${clean(hound.blanketColor).toLowerCase()}`;
                    prelimBadge.textContent = `${course.number || ''}${blanketCode(hound.blanketColor)}`;
                    prelimCodeCell.appendChild(prelimBadge);
                    tr.appendChild(prelimCodeCell);
                    tr.appendChild(textCell(hound.callName || hound.registeredName || 'Unnamed hound'));
                    tr.appendChild(textCell(entry.registrationNumber || hound.registrationNumber || ''));
                    tr.appendChild(textCell(hound.stake || group.stake || ''));
                    tr.appendChild(textCell(hound.prelimJudge1Score || ''));
                    tr.appendChild(textCell(hound.prelimJudge2Score || ''));
                    tr.appendChild(textCell(computedScoreDisplay(hound.prelimScore, hound.prelimOutcome)));
                    const finalCodeCell = document.createElement('td');
                    if (finalDetails.code) {
                        const finalBadge = document.createElement('span');
                        finalBadge.className = `blanket blanket-${clean(finalDetails.color).toLowerCase()}`;
                        finalBadge.textContent = finalDetails.code;
                        finalCodeCell.appendChild(finalBadge);
                    }
                    tr.appendChild(finalCodeCell);
                    tr.appendChild(textCell(finalDetails.judge1 || ''));
                    tr.appendChild(textCell(finalDetails.judge2 || ''));
                    tr.appendChild(textCell(computedScoreDisplay(finalDetails.score, finalDetails.outcome)));
                    tr.appendChild(textCell(finalDetails.combinedScore));
                    tr.appendChild(textCell(finalDetails.placement));
                    tr.appendChild(textCell(bobResultForEntry(trial, hound.entryId)));
                    tr.appendChild(textCell(bifResultForEntry(bifState(trial), hound.entryId)));
                    tbody.appendChild(tr);
                });
            });
        table.appendChild(tbody);
        wrap.appendChild(table);
        card.appendChild(wrap);
        container.appendChild(card);
    });
}

function renderScorebookSection(containerId, trial, mode) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    container.innerHTML = '';
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = mode === 'finals'
            ? 'Build the preliminary draw and complete preliminary scoring before finals.'
            : 'Build the preliminary draw before entering scores.';
        container.appendChild(empty);
        return;
    }

    const summary = document.createElement('div');
    summary.className = 'scorebook-summary';
    const rows = mode === 'finals' ? finalsScoreRows(draw) : preliminaryScoreRows(draw);
    const entered = rows.filter((row) => hasScoreValue(row.score) || row.outcome).length;
    const prelimsLocked = Boolean(trial.scorebook && trial.scorebook.prelimsLocked);
    const finalsLocked = Boolean(trial.scorebook && trial.scorebook.finalsLocked);
    summary.appendChild(summaryItem('Score rows', String(rows.length), 'done'));
    summary.appendChild(summaryItem('Entered', String(entered), entered === rows.length ? 'done' : 'todo'));
    summary.appendChild(summaryItem('Remaining', String(Math.max(0, rows.length - entered)), entered === rows.length ? 'done' : 'todo'));
    summary.appendChild(summaryItem(
        mode === 'finals' ? 'Finals' : 'Prelims',
        mode === 'finals' ? (finalsLocked ? 'Locked' : 'Open') : (prelimsLocked ? 'Locked' : 'Open'),
        mode === 'finals' ? (finalsLocked ? 'done' : 'todo') : (prelimsLocked ? 'done' : 'todo'),
    ));
    container.appendChild(summary);

    const togglePrelimLockButton = document.getElementById('togglePrelimLockButton');
    if (togglePrelimLockButton) {
        togglePrelimLockButton.textContent = prelimsLocked ? 'Unlock Prelims' : 'Lock Prelims';
    }
    const toggleFinalsLockButton = document.getElementById('toggleFinalsLockButton');
    if (toggleFinalsLockButton) {
        toggleFinalsLockButton.textContent = finalsLocked ? 'Unlock Finals' : 'Lock Finals';
    }

    const groups = visibleScoreGroups(draw, trial, mode);
    appendScoreJumpNav(container, groups.map((group) => ({
        id: scoringGroupAnchor(mode, group),
        label: groupTitle(group),
    })));
    groups.forEach((group) => {
        const entriesById = new Map((trial.entries || []).map((entry) => [entry.id, entry]));
        const card = document.createElement('div');
        card.className = 'score-group';
        card.id = scoringGroupAnchor(mode, group);

        const heading = document.createElement('div');
        heading.className = 'course-group-heading';
        const title = document.createElement('h3');
        title.textContent = groupTitle(group);
        const groupRows = (group.courses || []).reduce((total, course) => total + (course.hounds || []).length, 0);
        const meta = document.createElement('span');
        meta.textContent = `${groupRows} score row${groupRows === 1 ? '' : 's'}`;
        heading.append(title, meta);
        const actions = document.createElement('div');
        actions.className = 'button-row';
        const groupActions = scorebookActionsForGroup(group, mode);
        groupActions.forEach((action) => {
            const [label, handler] = Array.isArray(action) ? action : [action.label, action.handler];
            const button = document.createElement('button');
            button.type = 'button';
            button.className = action.className || 'secondary small';
            button.textContent = label;
            if (action.help) {
                button.dataset.help = action.help;
            }
            if (action.disabled && action.blockedMessage) {
                button.classList.add('blocked-action');
                button.setAttribute('aria-disabled', 'true');
                button.dataset.blockedMessage = action.blockedMessage;
            } else if (action.disabled) {
                button.disabled = true;
            }
            button.addEventListener('click', () => {
                if (action.disabled && action.blockedMessage) {
                    showMessage(document.getElementById('scoringMessage'), action.blockedMessage, 'warning');
                    return;
                }
                handler();
            });
            actions.appendChild(button);
        });
        if (groupActions.length > 0) {
            heading.appendChild(actions);
        }
        card.appendChild(heading);

        if (mode === 'prelim') {
            const wrap = document.createElement('div');
            wrap.className = 'table-wrap';
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const header = document.createElement('tr');
            const judgeCount = judgeCountForGroup(trial, group);
            const headers = ['Prelim #/Clr', 'Hound', 'Reg #', 'Stake', 'Prelim J1'];
            if (judgeCount > 1) {
                headers.push('Prelim J2');
            }
            headers.push('Prelim Total', 'Outcome', 'Signed Sheets');
            headers.forEach((label) => {
                const th = document.createElement('th');
                th.textContent = label;
                header.appendChild(th);
            });
            thead.appendChild(header);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            [...(group.courses || [])]
                .sort((a, b) => Number(a.number || 0) - Number(b.number || 0))
                .forEach((course) => {
                    tbody.appendChild(courseHeaderRow(course.number || '', headers.length));
                    sortedHoundsByBlanket(course.hounds || [])
                    .forEach((hound) => {
                        tbody.appendChild(prelimScorebookRow(group, course, hound, prelimsLocked, entriesById.get(hound.entryId) || {}, judgeCount));
                    });
                });

            table.appendChild(tbody);
            wrap.appendChild(table);
            card.appendChild(wrap);
        } else {
            card.appendChild(finalsScoreEntryPanel(group, finalsLocked));
            card.appendChild(tieBreakPanel(group));
            card.appendChild(finalsDrawSummary(group));
        }
        container.appendChild(card);
    });
}

function scorebookActionsForGroup(group, mode) {
    const groupBuildLabel = isQuasiBreedGroup(group) ? 'Build Finals Group' : 'Build Finals Breed';
    const groupSheetLabel = isQuasiBreedGroup(group) ? 'ASFA Group Sheet' : 'ASFA Breed Sheet';
    const stakeDrawn = Boolean(group.finalDraw && Array.isArray(group.finalDraw.courses) && group.finalDraw.courses.length > 0);
    const prelimStatus = prelimCompletionStatusForGroup(group);
    const breedStatus = prelimCompletionStatusForBreed(group.breed);
    if (mode === 'finals') {
        const trial = readForm();
        const finalsLocked = Boolean(trial.scorebook && trial.scorebook.finalsLocked);
        const breedDrawn = finalsBreedOrGroupDrawn(group);
        const groupDrawLabel = isQuasiBreedGroup(group) ? 'Finals Group' : 'Finals Breed';
        return [
            {
                label: stakeDrawn ? 'ReDraw Finals Stake' : 'Draw Finals Stake',
                handler: () => buildFinalsDrawForGroup(group.id),
                className: `secondary small ${stakeDrawn ? 'draw-complete-button' : 'draw-needed-button'}`,
                help: stakeDrawn
                    ? 'Finals have already been drawn for this stake. ReDraw only when something changed.'
                    : 'Draws finals course and blanket colors for this one stake.',
                disabled: finalsLocked,
            },
            {
                label: breedDrawn ? `ReDraw ${groupDrawLabel}` : `Draw ${groupDrawLabel}`,
                handler: () => buildFinalsDrawForBreed(group.breed),
                className: `secondary small ${breedDrawn ? 'draw-complete-button' : 'draw-needed-button'}`,
                help: breedDrawn
                    ? `Finals have already been drawn for this ${isQuasiBreedGroup(group) ? 'group' : 'breed'}. ReDraw only when something changed.`
                    : `Draws finals for every completed stake in this ${isQuasiBreedGroup(group) ? 'group' : 'breed'}.`,
                disabled: finalsLocked,
            },
            {
                label: 'ASFA Stake Sheet',
                handler: () => printAsfaRecordSheet({ groupId: group.id }),
                className: 'secondary small report-button',
            },
            {
                label: groupSheetLabel,
                handler: () => printAsfaRecordSheet({ breed: group.breed }),
                className: 'secondary small report-button',
            },
        ];
    }
    return [
        {
            label: stakeDrawn ? 'ReDraw Finals Stake' : 'Draw Finals Stake',
            handler: () => buildFinalsDrawForGroup(group.id),
            className: `secondary small ${stakeDrawn ? 'draw-complete-button' : 'draw-needed-button'}`,
            help: prelimStatus.complete
                ? (stakeDrawn ? 'Finals have already been drawn for this stake. ReDraw only when something changed.' : 'Draws finals course and blanket colors for this stake.')
                : `Finish prelim scoring for this stake first. ${prelimStatus.remaining} row${prelimStatus.remaining === 1 ? '' : 's'} remaining.`,
            disabled: !prelimStatus.complete,
            blockedMessage: `Cannot draw finals for ${groupTitle(group)} yet. Enter a prelim score or outcome for every hound in this stake. ${prelimStatus.remaining} row${prelimStatus.remaining === 1 ? '' : 's'} remaining.`,
        },
        {
            label: finalsBreedOrGroupDrawn(group) ? `ReDraw ${isQuasiBreedGroup(group) ? 'Finals Group' : 'Finals Breed'}` : `Draw ${isQuasiBreedGroup(group) ? 'Finals Group' : 'Finals Breed'}`,
            handler: () => buildFinalsDrawForBreed(group.breed),
            className: `secondary small ${finalsBreedOrGroupDrawn(group) ? 'draw-complete-button' : 'draw-needed-button'}`,
            help: breedStatus.complete
                ? `Draws finals for every completed stake in this ${isQuasiBreedGroup(group) ? 'group' : 'breed'}.`
                : `Finish prelim scoring for this ${isQuasiBreedGroup(group) ? 'group' : 'breed'} first. ${breedStatus.remaining} row${breedStatus.remaining === 1 ? '' : 's'} remaining.`,
            disabled: !breedStatus.complete,
            blockedMessage: `Cannot draw finals for ${group.breed} yet. Enter prelim scores or outcomes for every hound in this ${isQuasiBreedGroup(group) ? 'group' : 'breed'}. ${breedStatus.remaining} row${breedStatus.remaining === 1 ? '' : 's'} remaining.`,
        },
        {
            label: 'ASFA Stake Sheet',
            handler: () => printAsfaRecordSheet({ groupId: group.id, combineMixedPosting: true }),
            className: 'secondary small report-button',
        },
        {
            label: groupSheetLabel,
            handler: () => printAsfaRecordSheet({ breed: group.breed, combineMixedPosting: true }),
            className: 'secondary small report-button',
        },
        {
            label: 'Finals Judge Sheets',
            handler: () => printFinalsJudgeSheets(group.id),
            className: 'secondary small report-button',
            help: stakeDrawn
                ? 'Prints finals judge sheets for this stake using the finals draw.'
                : 'Draw finals for this stake before printing finals judge sheets.',
            disabled: !stakeDrawn,
            blockedMessage: `Draw finals for ${groupTitle(group)} before printing finals judge sheets.`,
        },
    ];
}

function visibleScoreGroups(draw, trial, mode = 'prelim') {
    return sortDrawGroupsForPrint((draw || {}).groups || [], trial).filter((group) => {
        if (groupScoreRows(group).length > 0) {
            return true;
        }
        return mode === 'finals' && finalsRowsForGroup(group).length > 0;
    });
}

function prelimCompletionStatusForGroup(group) {
    const trial = readForm();
    const rows = prelimScoreRequirementsForGroup(group, trial);
    const complete = rows.filter((row) => row.complete).length;
    return {
        total: rows.length,
        complete: rows.length > 0 && complete === rows.length,
        entered: complete,
        remaining: Math.max(0, rows.length - complete),
    };
}

function prelimCompletionStatusForBreed(breed) {
    const trial = readForm();
    const groups = ((((trial || {}).preliminaryDraw || {}).groups) || [])
        .filter((group) => clean(group.breed) === clean(breed));
    const rows = groups.flatMap((group) => prelimScoreRequirementsForGroup(group, trial));
    const complete = rows.filter((row) => row.complete).length;
    return {
        total: rows.length,
        complete: rows.length > 0 && complete === rows.length,
        entered: complete,
        remaining: Math.max(0, rows.length - complete),
    };
}

function finalsBreedOrGroupDrawn(group) {
    const trial = readForm();
    const groups = (((trial || {}).preliminaryDraw || {}).groups || [])
        .filter((item) => clean(item.breed) === clean(group.breed))
        .filter(groupHasPrelimHounds);
    if (groups.length === 0) {
        return false;
    }
    return groups.every((item) => item.finalDraw && Array.isArray(item.finalDraw.courses) && item.finalDraw.courses.length > 0);
}

function groupHasPrelimHounds(group) {
    return ((group || {}).courses || []).some((course) => ((course || {}).hounds || []).length > 0);
}

function groupHasFinalHounds(group) {
    return ((((group || {}).finalDraw || {}).courses) || []).some((course) => ((course || {}).hounds || []).length > 0);
}

function preliminaryScoreRows(draw) {
    return (draw.groups || []).flatMap((group) => (
        (group.courses || []).flatMap((course) => (
            sortedHoundsByBlanket(course.hounds || []).map((hound) => ({
                group,
                course,
                hound,
                score: hound.prelimScore,
                outcome: hound.prelimOutcome,
            }))
        ))
    ));
}

function finalsScoreRows(draw) {
    return (draw.groups || []).flatMap((group) => (
        finalsRowsForGroup(group).map((row) => ({
            group,
            hound: row.hound,
            score: row.hound.finalScore,
            outcome: row.hound.finalOutcome,
        }))
    ));
}

function groupScoreRows(group) {
    return (group.courses || []).flatMap((course) => (
        sortDrawHoundsByAssignedColor(course.hounds || [], 'prelim').map((hound) => ({
            group,
            course,
            hound,
            score: hound.prelimScore,
            outcome: hound.prelimOutcome,
        }))
    ));
}

function prelimScoreRequirementsForGroup(group, trial = readForm()) {
    const judgeCount = judgeCountForGroup(trial, group);
    return groupScoreRows(group).map((row) => {
        const outcome = Boolean(row.outcome);
        const hasJudge1 = hasScoreValue(row.hound.prelimJudge1Score);
        const hasJudge2 = judgeCount < 2 || hasScoreValue(row.hound.prelimJudge2Score);
        return {
            ...row,
            judgeCount,
            complete: outcome || (hasJudge1 && hasJudge2),
            missing: outcome
                ? []
                : [
                    hasJudge1 ? '' : 'J1',
                    hasJudge2 ? '' : 'J2',
                ].filter(Boolean),
        };
    });
}

function prelimGroupCompleteForFinals(group, trial = readForm()) {
    const rows = prelimScoreRequirementsForGroup(group, trial);
    return rows.length > 0 && rows.every((row) => row.complete);
}

function sortedHoundsByBlanket(hounds) {
    const order = new Map([
        ['YELLOW', 1],
        ['PINK', 2],
        ['BLUE', 3],
    ]);
    return [...hounds].sort((a, b) => {
        const colorA = order.get(clean(displayBlanketColor(a))) || 99;
        const colorB = order.get(clean(displayBlanketColor(b))) || 99;
        if (colorA !== colorB) {
            return colorA - colorB;
        }
        return Number(a.drawPosition || 0) - Number(b.drawPosition || 0);
    });
}

function displayBlanketColor(hound) {
    return hound.bifBlanketColor || hound.tieBreakBlanketColor || hound.bobBlanketColor || hound.finalBlanketColor || hound.blanketColor || '';
}

function finalsDrawSummary(group) {
    const section = document.createElement('div');
    section.className = 'finals-summary';
    const draw = group.finalDraw;
    if (!draw || !Array.isArray(draw.courses) || draw.courses.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'field-note';
        empty.textContent = 'No finals draw built for this stake yet.';
        section.appendChild(empty);
        return section;
    }

    const title = document.createElement('h4');
    title.textContent = `Finals Draw (${formatTimestamp(draw.createdAt)})`;
    const heading = document.createElement('div');
    heading.className = 'course-group-heading';
    heading.append(title, manualDrawToggleButton(`final:${group.id}`));
    section.appendChild(heading);
    const list = document.createElement('ul');
    draw.courses.forEach((course) => {
        sortedHoundsByBlanket(course.hounds || []).forEach((hound) => {
            const item = document.createElement('li');
            item.textContent = `${hound.finalCode} - ${hound.callName || hound.registeredName || 'Unnamed hound'}`;
            list.appendChild(item);
        });
    });
    section.appendChild(list);
    section.appendChild(renderManualDrawEditor({
        key: `final:${group.id}`,
        draw,
        type: 'final',
        title: groupTitle(group),
        onMove: (entryId, targetCourseId) => moveManualFinalDrawHound(group.id, entryId, targetCourseId),
        onColorChange: (entryId, color) => updateManualFinalDrawBlanket(group.id, entryId, color),
    }));
    renderDrawAuditLog(section, draw);
    return section;
}

function finalsScoreEntryPanel(group, finalsLocked = false) {
    const section = document.createElement('div');
    section.className = 'finals-score-panel';
    const draw = group.finalDraw;
    if (!draw || !Array.isArray(draw.courses) || draw.courses.length === 0) {
        return section;
    }

    const title = document.createElement('h4');
    title.textContent = 'Enter Finals Scores';
    section.appendChild(title);

    const status = finalStakeStatus(group);
    const statusLine = document.createElement('p');
    statusLine.className = `finals-status ${status.tone}`;
    statusLine.textContent = status.message;
    section.appendChild(statusLine);

    const trial = readForm();
    const judgeCount = judgeCountForGroup(trial, group);
    const entriesById = new Map((trial.entries || []).map((entry) => [entry.id, entry]));
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const header = document.createElement('tr');
    const headers = ['Final #/Clr', 'Hound', 'Reg #', 'Stake', 'Final J1'];
    if (judgeCount > 1) {
        headers.push('Final J2');
    }
    headers.push('Final Total', 'Outcome', 'Signed Sheets', 'Result');
    headers.forEach((text) => {
        const th = document.createElement('th');
        th.textContent = text;
        header.appendChild(th);
    });
    thead.appendChild(header);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    let lastFinalCourse = '';
    finalsRowsForGroup(group).forEach((row) => {
        const courseNumber = row.course && row.course.number ? String(row.course.number) : '';
        if (courseNumber && courseNumber !== lastFinalCourse) {
            tbody.appendChild(courseHeaderRow(courseNumber, headers.length));
            lastFinalCourse = courseNumber;
        }
        const tr = document.createElement('tr');
        const entry = entriesById.get(row.hound.entryId) || {};
        const codeCell = document.createElement('td');
        const code = document.createElement('span');
        code.className = `blanket blanket-${clean(drawColorForType(row.hound, 'final')).toLowerCase()}`;
        code.textContent = row.code;
        codeCell.appendChild(code);
        tr.appendChild(codeCell);
        tr.appendChild(textCell(row.hound.callName || row.hound.registeredName || 'Unnamed hound'));
        tr.appendChild(textCell(entry.registrationNumber || row.hound.registrationNumber || ''));
        tr.appendChild(textCell(row.hound.stake || group.stake || ''));
        const judge1Cell = document.createElement('td');
        judge1Cell.appendChild(scoreNumberInput(row.hound.finalJudge1Score, 'J1', Boolean(row.hound.finalOutcome) || finalsLocked, (value) => updateFinalResult(group.id, row.hound.entryId, { judge1: value })));
        tr.appendChild(judge1Cell);
        if (judgeCount > 1) {
            const judge2Cell = document.createElement('td');
            judge2Cell.appendChild(scoreNumberInput(row.hound.finalJudge2Score, 'J2', Boolean(row.hound.finalOutcome) || finalsLocked, (value) => updateFinalResult(group.id, row.hound.entryId, { judge2: value })));
            tr.appendChild(judge2Cell);
        }
        tr.appendChild(textCell(computedScoreDisplay(row.hound.finalScore, row.hound.finalOutcome)));
        const outcomeCell = document.createElement('td');
        const outcome = document.createElement('select');
        outcome.className = 'score-outcome';
        scoreOutcomeOptions().forEach(([value, text]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            outcome.appendChild(option);
        });
        outcome.value = row.hound.finalOutcome || '';
        outcome.disabled = finalsLocked;
        outcome.addEventListener('change', () => updateFinalResult(group.id, row.hound.entryId, { outcome: outcome.value }));
        outcomeCell.appendChild(outcome);
        tr.appendChild(outcomeCell);
        tr.appendChild(signedJudgeSheetCell(group, row.hound, 'final', judgeCount));
        tr.appendChild(textCell(row.hound.placement ? `${row.hound.placement} (${row.hound.combinedScore || ''})` : ''));
        if (row.hound.finalOutcome) {
            tr.classList.add('score-row-outcome');
        }
        if (finalsLocked) {
            tr.classList.add('score-row-locked');
        }
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    section.appendChild(wrap);
    return section;
}

function finalStakeStatus(group) {
    const rows = finalsRowsForGroup(group);
    const remaining = rows.filter((row) => !hasScoreValue(row.hound.finalScore) && !row.hound.finalOutcome).length;
    if (remaining > 0) {
        return {
            tone: 'todo',
            message: `${remaining} finals result${remaining === 1 ? '' : 's'} remaining for this stake.`,
        };
    }

    const ties = combinedScoreTies(group);
    if (ties.length > 0) {
        return {
            tone: 'warning',
            message: `Finals complete. Tie resolution needed for combined score${ties.length === 1 ? '' : 's'}: ${ties.join(', ')}.`,
        };
    }

    return {
        tone: 'done',
        message: 'Finals complete for this stake. Placements are ready to print and post.',
    };
}

function finalsRowsForGroup(group) {
    if (!group.finalDraw || !Array.isArray(group.finalDraw.courses)) {
        return [];
    }
    return [...group.finalDraw.courses]
        .sort((a, b) => Number(a.number || 0) - Number(b.number || 0))
        .flatMap((course) => (
            sortDrawHoundsByAssignedColor(course.hounds || [], 'final').map((hound) => ({
                course,
                hound,
                code: hound.finalCode || `${course.number}${blanketCode(drawColorForType(hound, 'final'))}`,
            }))
        ));
}

function combinedScoreTies(group) {
    const totals = new Map();
    finalsRowsForGroup(group).forEach((row) => {
        if (!String(row.hound.placement || '').includes('Tie') || !row.hound.combinedScore) {
            return;
        }
        totals.set(`${row.hound.placement} (${row.hound.combinedScore})`, true);
    });
    return [...totals.keys()].sort((a, b) => Number(b) - Number(a));
}

function tieBreakPanel(group) {
    const panel = document.createElement('div');
    panel.className = 'tie-break-panel';
    const ties = tieBreakGroups(group);
    if (ties.length === 0) {
        const finalsRows = finalsRowsForGroup(group);
        const incompleteFinals = finalsRows.some((row) => !hasScoreValue(row.hound.finalScore) && !row.hound.finalOutcome);
        if (finalsRows.length > 0 && !incompleteFinals) {
            const note = document.createElement('p');
            note.className = 'field-note';
            note.textContent = 'No runoff ties through NBQ for this stake. Build Runoff and Print Runoff appear here when a completed stake has a tie to settle.';
            panel.appendChild(note);
        }
        return panel;
    }

    const title = document.createElement('h4');
    title.textContent = 'Settle Ties';
    panel.appendChild(title);

    ties.forEach((tie) => {
        const block = document.createElement('div');
        block.className = 'tie-break-group';
        const heading = document.createElement('p');
        heading.className = 'finals-status warning';
        heading.textContent = `${tie.label} for combined score ${tie.combinedScore}`;
        block.appendChild(heading);

        const actions = document.createElement('div');
        actions.className = 'button-row';
        const buildButton = document.createElement('button');
        buildButton.type = 'button';
        const tieRunoffDrawn = Boolean(runoffForTie(group, tie));
        buildButton.className = `secondary small ${tieRunoffDrawn ? 'draw-complete-button' : 'draw-needed-button'}`;
        buildButton.textContent = tieRunoffDrawn ? 'ReDraw Runoff' : 'Draw Runoff';
        buildButton.dataset.help = 'Creates a randomized runoff draw for these tied hounds, assigning runoff course and blanket color.';
        buildButton.addEventListener('click', () => buildRunoffDraw(group.id, tie));
        const printButton = document.createElement('button');
        printButton.type = 'button';
        printButton.className = 'secondary small report-button';
        printButton.textContent = 'Print Runoff Judge Sheets';
        printButton.dataset.help = 'Prints judge sheets for this runoff draw.';
        printButton.disabled = !runoffForTie(group, tie);
        printButton.addEventListener('click', () => printRunoffJudgeSheets(group.id, tie));
        actions.append(buildButton, printButton);
        block.appendChild(actions);

        const runoff = runoffForTie(group, tie);
        const rows = runoff ? runoffRows(runoff) : tie.rows;
        rows.forEach((row) => {
            const line = document.createElement('label');
            line.className = 'final-score-entry';
            const code = document.createElement('span');
            code.className = row.hound.tieBreakCode ? `blanket blanket-${clean(row.hound.tieBreakBlanketColor).toLowerCase()}` : 'muted-cell';
            code.textContent = row.hound.tieBreakCode || 'Blank until draw';
            const name = document.createElement('span');
            name.className = 'final-score-hound';
            name.textContent = row.hound.callName || row.hound.registeredName || 'Unnamed hound';
            const judgeCount = judgeCountForGroup(readForm(), group);
            const judge1 = scoreNumberInput(row.hound.tieBreakJudge1Score, 'J1', Boolean(row.hound.tieBreakOutcome), (value) => updateTieBreakResult(group.id, row.hound.entryId, tie.label, { judge1: value }, tie.combinedScore));
            const judge2 = judgeCount > 1 ? scoreNumberInput(row.hound.tieBreakJudge2Score, 'J2', Boolean(row.hound.tieBreakOutcome), (value) => updateTieBreakResult(group.id, row.hound.entryId, tie.label, { judge2: value }, tie.combinedScore)) : null;
            const total = document.createElement('span');
            total.className = 'final-score-total';
            total.textContent = computedScoreDisplay(row.hound.tieBreakScore, row.hound.tieBreakOutcome) || 'Tie';
            const outcome = document.createElement('select');
            outcome.className = 'score-outcome';
            scoreOutcomeOptions().forEach(([value, text]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                outcome.appendChild(option);
            });
            outcome.value = row.hound.tieBreakOutcome || '';
            outcome.addEventListener('change', () => updateTieBreakResult(group.id, row.hound.entryId, tie.label, { outcome: outcome.value }, tie.combinedScore));
            const result = document.createElement('span');
            result.className = 'final-score-result';
            result.textContent = row.hound.tieBreakResolvedPlacement || '';
            line.append(code, name, judge1);
            if (judge2) {
                line.appendChild(judge2);
            }
            line.append(total, outcome, result);
            block.appendChild(line);
        });
        panel.appendChild(block);
    });

    return panel;
}

function tieBreakGroups(group) {
    const groups = new Map();
    const addRow = (row, label, combinedScore) => {
        if (!label || !String(label).includes('Tie') || !combinedScore) {
            return;
        }
        const stakeKey = group.mixedStake ? clean(row.hound.stake || group.stake || '') : '';
        const key = `${label}|${combinedScore}|${stakeKey}`;
        if (!groups.has(key)) {
            groups.set(key, {
                label,
                combinedScore,
                stake: row.hound.stake || group.stake || '',
                rows: [],
            });
        }
        const bucket = groups.get(key);
        if (!bucket.rows.some((existing) => existing.hound.entryId === row.hound.entryId)) {
            bucket.rows.push(row);
        }
    };
    finalsRowsForGroup(group).forEach((row) => {
        const label = String(row.hound.placement || '');
        addRow(row, label, row.hound.combinedScore);
        addRow(row, String(row.hound.tieBreakLabel || ''), row.hound.tieBreakCombinedScore || row.hound.combinedScore);
    });
    return [...groups.values()]
        .filter((tie) => tieNeedsRunoffAction(tie))
        .sort((a, b) => tiePlacementRange(a.label).start - tiePlacementRange(b.label).start);
}

function tieNeedsRunoffAction(tie) {
    return (tie.rows || []).length >= 2;
}

function runoffKeyForTie(tie) {
    return clean(`${tie.label}-${tie.combinedScore}`);
}

function runoffForTie(group, tie) {
    const key = runoffKeyForTie(tie);
    return (group.runoffs || []).find((runoff) => runoff.key === key) || null;
}

function archivedRunoffsForTie(group, tie) {
    const key = runoffKeyForTie(tie);
    return (group.runoffHistory || [])
        .map((runoff, storageIndex) => ({ ...runoff, storageIndex }))
        .filter((runoff) => runoff.key === key);
}

function archiveCurrentRunoffForTie(group, tie) {
    const current = runoffForTie(group, tie);
    if (!current) {
        return group;
    }
    const history = [...(group.runoffHistory || [])];
    const round = history.filter((runoff) => runoff.key === current.key).length + 1;
    history.push({
        ...current,
        archivedAt: new Date().toISOString(),
        round,
    });
    return {
        ...group,
        runoffHistory: history,
    };
}

function runoffRows(runoff) {
    return (runoff.courses || [])
        .slice()
        .sort((a, b) => Number(a.number || 0) - Number(b.number || 0))
        .flatMap((course) => (
            sortedHoundsByBlanket(course.hounds || []).map((hound) => ({
                course,
                hound,
                code: hound.tieBreakCode || `${course.number}${blanketCode(hound.tieBreakBlanketColor || hound.blanketColor)}`,
            }))
        ));
}

function createRunoffDrawFromRows(rows, tie) {
    const hounds = rows
        .filter((row) => !row.hound.tieBreakOutcome)
        .map((row) => ({
            ...row.hound,
            tieBreakLabel: tie.label,
            tieBreakCombinedScore: tie.combinedScore,
            tieBreakJudge1Score: '',
            tieBreakJudge2Score: '',
            tieBreakScore: '',
            tieBreakOutcome: '',
            tieBreakResolvedPlacement: '',
        }));
    if (hounds.length < 2) {
        return null;
    }
    const sizes = courseSizesForEntryCount(hounds.length);
    const courses = sizes.map((size, index) => ({
        id: crypto.randomUUID(),
        number: index + 1,
        capacity: size,
        hounds: [],
    }));
    secureShuffle(hounds).forEach((hound) => {
        chooseCourseForEntry(courses, hound).hounds.push(hound);
    });
    courses.forEach((course) => {
        const colors = blanketColorsForCourseSize(course.hounds.length);
        course.hounds = secureShuffle(course.hounds).map((hound, index) => ({
            ...hound,
            tieBreakCourse: course.number,
            tieBreakBlanketColor: colors[index],
            tieBreakCode: `${course.number}${blanketCode(colors[index])}`,
            drawPosition: index + 1,
        }));
        delete course.capacity;
    });

    return {
        id: crypto.randomUUID(),
        key: runoffKeyForTie(tie),
        label: tie.label,
        combinedScore: tie.combinedScore,
        createdAt: new Date().toISOString(),
        courses,
    };
}

async function buildRunoffDraw(groupId, tie) {
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups)) {
        showMessage(document.getElementById('scoringMessage'), 'Build the finals draw before creating runoffs.', 'warning');
        return;
    }
    const key = runoffKeyForTie(tie);
    const existingGroup = draw.groups.find((group) => group.id === groupId);
    if (!existingGroup) {
        showMessage(document.getElementById('scoringMessage'), 'Could not find that tie group.', 'warning');
        return;
    }
    const existingRunoff = runoffForTie(existingGroup, tie);
    if (existingRunoff) {
        const proceed = await showTrialConfirm({
            title: 'Create Another Runoff',
            eyebrow: tie.label,
            message: `${tie.label} already has a runoff draw. Create another runoff round and keep the previous scores?`,
            primaryText: 'Create Runoff',
        });
        if (!proceed) {
            return;
        }
    }

    const runoff = createRunoffDrawFromRows(tie.rows, tie);

    trial.preliminaryDraw = {
        ...draw,
        groups: draw.groups.map((group) => {
            if (group.id !== groupId) {
                return group;
            }
            const archivedGroup = existingRunoff ? archiveCurrentRunoffForTie(group, tie) : group;
            return {
                ...archivedGroup,
                runoffs: [
                    ...(archivedGroup.runoffs || []).filter((item) => item.key !== key),
                    runoff,
                ],
            };
        }),
    };
    upsertTrial(trial);
    saveTrials();
    showMessage(document.getElementById('scoringMessage'), `Runoff draw built for ${existingGroup.breed} ${existingGroup.stake} ${tie.label}.`, 'success');
    render();
}

function renderRunoffBoard(trial) {
    const board = document.getElementById('runoffBoard');
    if (!board) {
        return;
    }

    if (normalizeTrialDerivedState(trial)) {
        upsertTrial(trial);
        saveTrials();
    }

    board.innerHTML = '';
    const items = collectRunoffItems(trial);
    if (selectedRunoffItemId && !items.some((item) => item.id === selectedRunoffItemId)) {
        selectedRunoffItemId = '';
    }
    renderSelectedRunoffLabel(items);

    if (!trial || !trial.preliminaryDraw || !Array.isArray(trial.preliminaryDraw.groups)) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Build finals and enter final scores before managing runoffs.';
        board.appendChild(empty);
        return;
    }

    if (items.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'No tie runoffs or BOB runs are ready yet.';
        board.appendChild(empty);
        return;
    }

    const runoffRows = items.flatMap((item) => runoffDisplayRows(trial, item));
    const entered = runoffRows.filter((row) => row.placeholder || hasScoreValue(row.score) || row.outcome).length;
    const summary = document.createElement('div');
    summary.className = 'scorebook-summary';
    summary.appendChild(summaryItem('Score rows', String(runoffRows.length), 'done'));
    summary.appendChild(summaryItem('Entered', String(entered), entered === runoffRows.length ? 'done' : 'todo'));
    summary.appendChild(summaryItem('Remaining', String(Math.max(0, runoffRows.length - entered)), entered === runoffRows.length ? 'done' : 'todo'));
    summary.appendChild(summaryItem('Runoffs', `${items.length} run${items.length === 1 ? '' : 's'}`, items.length ? 'done' : 'todo'));
    board.appendChild(summary);
    appendScoreJumpNav(board, items.map((item, index) => ({
        id: scoringRunoffAnchor(item),
        label: `${index + 1}. ${item.title}`,
    })), 'Quick scroll');

    items.forEach((item, index) => {
        const card = document.createElement('article');
        card.className = 'score-group runoff-card';
        card.id = scoringRunoffAnchor(item);
        card.draggable = true;
        card.dataset.runoffItemId = item.id;
        card.classList.toggle('selected-row', item.id === selectedRunoffItemId);
        card.addEventListener('click', (event) => {
            if (event.target.matches('input, select, button')) {
                return;
            }
            selectedRunoffItemId = item.id;
            render();
        });
        card.addEventListener('dragstart', (event) => {
            selectedRunoffItemId = item.id;
            event.dataTransfer.setData('text/plain', item.id);
        });
        card.addEventListener('dragover', (event) => event.preventDefault());
        card.addEventListener('drop', (event) => {
            event.preventDefault();
            moveRunoffItem(event.dataTransfer.getData('text/plain'), item.id);
        });

        const heading = document.createElement('div');
        heading.className = 'course-group-heading';
        if (item.id === selectedRunoffItemId) {
            heading.appendChild(contextualMoveControls({
                upDisabled: index === 0,
                downDisabled: index === items.length - 1,
                onUp: () => moveSelectedRunoffItem(-1),
                onDown: () => moveSelectedRunoffItem(1),
                label: 'Move selected runoff',
            }));
        }
        const title = document.createElement('h3');
        title.textContent = `${index + 1}. ${item.title}`;
        const meta = document.createElement('span');
        meta.textContent = item.subtitle;
        const cardActions = document.createElement('div');
        cardActions.className = 'runoff-card-actions';
        const drawButton = document.createElement('button');
        drawButton.type = 'button';
        const runoffDrawn = Boolean(drawnRunoffForItem(trial, item));
        drawButton.className = `secondary small ${runoffDrawn ? 'draw-complete-button' : 'draw-needed-button'}`;
        drawButton.textContent = item.repeatTie && runoffDrawn
            ? 'Draw Additional Tie'
            : (runoffDrawn ? 'ReDraw This Runoff' : 'Draw This Runoff');
        drawButton.dataset.help = item.repeatTie && runoffDrawn
            ? 'Keeps the scored tied runoff on screen, archives it, and opens a new blank runoff for the still-tied hounds.'
            : 'Randomly assigns this runoff only to course numbers and blanket colors without changing the other runoff draws.';
        drawButton.addEventListener('click', () => drawSingleRunoff(item.id));
        cardActions.appendChild(drawButton);
        const currentRunoffDraw = drawnRunoffForItem(trial, item);
        if (currentRunoffDraw) {
            cardActions.appendChild(manualDrawToggleButton(`runoff:${item.id}`));
        }
        heading.append(title, meta, cardActions);
        card.appendChild(heading);

        const rows = runoffDisplayRows(trial, item);
        const tableWrap = document.createElement('div');
        tableWrap.className = 'table-wrap';
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const header = document.createElement('tr');
        const judgeCount = judgeCountForRunoffItem(trial, item);
        const headers = ['Run #/Clr', 'Hound', 'Stake', 'Reason', 'Runoff J1'];
        if (judgeCount > 1) {
            headers.push('Runoff J2');
        }
        headers.push('Total', 'Outcome', 'Result');
        headers.forEach((label) => {
            const th = document.createElement('th');
            th.textContent = label;
            header.appendChild(th);
        });
        thead.appendChild(header);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        let lastRunoffCourse = '';
        rows.forEach((row) => {
            const courseNumber = row.course && row.course.number ? String(row.course.number) : '';
            if (courseNumber && courseNumber !== lastRunoffCourse) {
                tbody.appendChild(courseHeaderRow(courseNumber, headers.length));
                lastRunoffCourse = courseNumber;
            }
            const tr = document.createElement('tr');
            const code = document.createElement('td');
            if (row.code) {
                const badge = document.createElement('span');
                badge.className = `blanket blanket-${clean(row.color).toLowerCase()}`;
                badge.textContent = row.code;
                code.appendChild(badge);
            } else {
                code.textContent = 'Blank until draw';
                code.className = 'muted-cell';
            }
            tr.appendChild(code);
            const houndCell = textCell(row.name);
            if (row.placeholder) {
                houndCell.classList.add('unresolved-placeholder-cell');
            }
            tr.appendChild(houndCell);
            tr.appendChild(textCell(row.stake));
            tr.appendChild(textCell(row.reason || ''));
            const judge1 = document.createElement('td');
            const judge2 = document.createElement('td');
            const total = document.createElement('td');
            const status = document.createElement('td');
            if (row.placeholder) {
                judge1.className = 'muted-cell unresolved-placeholder-cell';
                judge2.className = 'muted-cell unresolved-placeholder-cell';
                total.className = 'muted-cell unresolved-placeholder-cell';
                judge1.textContent = 'Write in';
                judge2.textContent = 'Write in';
                total.textContent = 'Write in';
                tr.append(judge1, judge2, total);
                status.textContent = 'Write in after tie';
                status.className = 'muted-cell unresolved-placeholder-cell';
                tr.appendChild(status);
                tr.appendChild(textCell(''));
                tbody.appendChild(tr);
                return;
            }
            judge1.appendChild(scoreNumberInput(row.judge1 || '', 'J1', Boolean(row.outcome), (value) => {
                if (row.archived) {
                    updateArchivedTieRunoffScore(item, row.historyIndex, row.entryId, { judge1: value });
                    return;
                }
                updateRunoffScore(item, row.entryId, { judge1: value });
            }));
            if (judgeCount > 1) {
                judge2.appendChild(scoreNumberInput(row.judge2 || '', 'J2', Boolean(row.outcome), (value) => {
                    if (row.archived) {
                        updateArchivedTieRunoffScore(item, row.historyIndex, row.entryId, { judge2: value });
                        return;
                    }
                    updateRunoffScore(item, row.entryId, { judge2: value });
                }));
            }
            total.textContent = computedScoreDisplay(row.score, row.outcome) || '';
            tr.appendChild(judge1);
            if (judgeCount > 1) {
                tr.appendChild(judge2);
            }
            tr.appendChild(total);
            const select = document.createElement('select');
            select.className = 'score-outcome';
            scoreOutcomeOptions().forEach(([value, text]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                select.appendChild(option);
            });
            select.value = row.outcome || '';
            select.addEventListener('change', () => {
                if (row.archived) {
                    updateArchivedTieRunoffScore(item, row.historyIndex, row.entryId, { outcome: select.value });
                    return;
                }
                updateRunoffOutcome(item, row.entryId, select.value);
            });
            status.appendChild(select);
            if (row.forfeitOrder) {
                const order = document.createElement('span');
                order.className = 'forfeit-order-badge';
                order.textContent = `FOR #${row.forfeitOrder}`;
                status.appendChild(order);
            }
            tr.appendChild(status);
            tr.appendChild(textCell(row.result || ''));
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tableWrap.appendChild(table);
        card.appendChild(tableWrap);
        if (currentRunoffDraw) {
            card.appendChild(renderManualDrawEditor({
                key: `runoff:${item.id}`,
                draw: currentRunoffDraw,
                type: 'runoff',
                title: item.title,
                onMove: (entryId, targetCourseId) => moveManualRunoffDrawHound(item.id, entryId, targetCourseId),
                onColorChange: (entryId, color) => updateManualRunoffDrawBlanket(item.id, entryId, color),
            }));
            renderDrawAuditLog(card, currentRunoffDraw);
        }
        board.appendChild(card);
    });
}

function renderBifBieCheck(trial) {
    const panel = document.getElementById('bifBiePanel');
    if (!panel) {
        return;
    }
    panel.innerHTML = '';
    const winners = bobWinnersForTrial(trial);
    const bif = bifState(trial);
    const selectedIds = selectedBifEntryIds(bif);
    const statuses = bif.statusByEntryId || {};
    updateBifDrawButton(bif, winners);

    if (winners.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'No BOB winners are finalized yet.';
        panel.appendChild(empty);
        return;
    }

    const controls = document.createElement('div');
    controls.className = 'scorebook-summary';
    controls.appendChild(summaryItem('BOB winners', String(winners.length), 'done'));
    controls.appendChild(summaryItem('Checked for BIF', String(winners.filter((winner) => selectedIds.has(bifEntryKey(winner.entryId))).length), selectedIds.size ? 'done' : 'todo'));
    controls.appendChild(summaryItem('Not running', String(winners.filter((winner) => statuses[bifEntryKey(winner.entryId)] === 'not_running').length), 'todo'));

    const judgeOptions = uniqueNames([...(trial.judges || []).map((judge) => judge.name), ...masterJudges.map((judge) => judge.name)]);
    controls.appendChild(bifJudgeControl('judge1', 'BIF Judge 1', bif.judge1 || '', judgeOptions));
    controls.appendChild(bifJudgeControl('judge2', 'BIF Judge 2', bif.judge2 || '', judgeOptions));
    panel.appendChild(controls);

    if (!bif.draw && bif.drawInvalidatedReason) {
        const staleNote = document.createElement('p');
        staleNote.className = 'field-note warning';
        staleNote.textContent = bif.drawInvalidatedReason;
        panel.appendChild(staleNote);
    }

    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>BIF Status</th><th>Breed</th><th>Hound</th><th>Stake</th><th>Reg #</th></tr></thead>';
    const tbody = document.createElement('tbody');
    winners.forEach((winner) => {
        const tr = document.createElement('tr');
        const statusCell = document.createElement('td');
        const status = document.createElement('select');
        status.className = 'score-outcome bif-status-select';
        status.dataset.entryId = bifEntryKey(winner.entryId);
        [
            ['', 'Undecided'],
            ['running', 'Running BIF'],
            ['not_running', 'Not running'],
        ].forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            status.appendChild(option);
        });
        status.value = statuses[bifEntryKey(winner.entryId)] || (selectedIds.has(bifEntryKey(winner.entryId)) ? 'running' : '');
        status.addEventListener('change', () => updateBifStatus(winner.entryId, status.value));
        statusCell.appendChild(status);
        tr.appendChild(statusCell);
        tr.appendChild(textCell(displayBreedCode(winner.breed)));
        tr.appendChild(textCell(winner.name));
        tr.appendChild(textCell(winner.stake));
        tr.appendChild(textCell(winner.registrationNumber));
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    panel.appendChild(wrap);
    panel.appendChild(bifDrawTable(trial, winners));
}

function bifState(trial) {
    const stored = ((trial.scorebook || {}).bif || {});
    return {
        selectedEntryIds: [],
        statusByEntryId: {},
        judge1: '',
        judge2: '',
        draw: null,
        ...stored,
        outcomes: normalizeOutcomeKeyMap(stored.outcomes || {}),
        tieRunoff: stored.tieRunoff ? {
            ...stored.tieRunoff,
            outcomes: normalizeOutcomeKeyMap(stored.tieRunoff.outcomes || {}),
        } : stored.tieRunoff,
        tieRunoffs: Array.isArray(stored.tieRunoffs)
            ? stored.tieRunoffs.map((runoff) => ({ ...runoff, outcomes: normalizeOutcomeKeyMap(runoff.outcomes || {}) }))
            : stored.tieRunoffs,
    };
}

function normalizeOutcomeKeyMap(outcomes = {}) {
    return Object.entries(outcomes || {}).reduce((map, [entryId, outcome]) => {
        map[bifEntryKey(entryId)] = outcome;
        return map;
    }, {});
}

function updateBifDrawButton(bif, winners) {
    const button = document.getElementById('buildBifDrawButton');
    if (!button) {
        return;
    }
    const hasCurrentBifDraw = bif && bif.draw;
    const visibleRunning = currentBifRunningEntryIds(bif || {});
    const runningCount = winners.filter((winner) => visibleRunning.has(bifEntryKey(winner.entryId))).length;
    const hasJudge = Boolean((bif.judge1 || '').trim() || (bif.judge2 || '').trim());
    button.className = `secondary small ${hasCurrentBifDraw ? 'draw-complete-button' : 'draw-needed-button'}`;
    button.textContent = hasCurrentBifDraw ? 'ReDraw BIF Draw' : 'Draw BIF Draw';
    button.disabled = winners.length === 0 || runningCount === 0 || !hasJudge;
    button.dataset.help = !hasJudge
        ? 'Assign at least one BIF judge before building the BIF draw.'
        : runningCount === 0
        ? 'Mark one or more BOB winners as Running BIF before building the BIF draw.'
        : 'Randomly assigns the checked BIF hounds to course numbers and blanket colors.';
}

function bifJudgeControl(key, label, value, options) {
    const wrap = document.createElement('label');
    wrap.className = 'inline-control';
    wrap.textContent = label;
    const input = document.createElement('input');
    const listId = `${key}BifJudgeOptions`;
    input.setAttribute('list', listId);
    input.value = value || '';
    input.placeholder = 'Not assigned';
    input.addEventListener('change', () => updateBifJudge(key, input.value));
    let datalist = document.getElementById(listId);
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = listId;
        document.body.appendChild(datalist);
    }
    datalist.innerHTML = '';
    options.forEach((name) => {
        const option = document.createElement('option');
        option.value = name;
        datalist.appendChild(option);
    });
    wrap.appendChild(input);
    return wrap;
}

function bobWinnersForTrial(trial) {
    return bifCandidateHoundsForTrial(trial);
}

function bifCandidateHoundsForTrial(trial) {
    const entriesById = new Map((trial.entries || []).map((entry) => [bifEntryKey(entry.id), entry]));
    const bifEligible = new Set(((trial.resultState || {}).bifEligibleEntryIds || []).map(bifEntryKey));
    const candidatesByEntry = new Map();
    sortDrawGroupsForPrint(((trial.preliminaryDraw || {}).groups || []), trial)
        .flatMap((group) => finalsRowsForGroup(group).map((row) => ({ group, hound: row.hound })))
        .filter((row) => bifEligible.has(bifEntryKey(row.hound.entryId)) || bobResultForEntry(trial, row.hound.entryId) === 'BOB')
        .forEach((row) => {
            const key = bifEntryKey(row.hound.entryId);
            const entry = entriesById.get(key) || {};
            if (isAsfaProvisionalBifEntry(row.hound, entry, row.group)) {
                return;
            }
            candidatesByEntry.set(key, {
                entryId: row.hound.entryId,
                breed: row.group.breed || row.hound.breed || entry.breed || '',
                stake: row.group.stake || row.hound.stake || entry.className || '',
                name: row.hound.callName || row.hound.registeredName || entry.callName || entry.registeredName || 'Unnamed hound',
                registrationNumber: entry.registrationNumber || row.hound.registrationNumber || '',
                hound: {
                    ...row.hound,
                    breed: row.group.breed || row.hound.breed || entry.breed || '',
                    stake: row.group.stake || row.hound.stake || entry.className || '',
                },
            });
        });
    bifEligible.forEach((entryId) => {
        const key = bifEntryKey(entryId);
        if (candidatesByEntry.has(key)) {
            return;
        }
        const entry = entriesById.get(key) || {};
        const breed = runGroupBreedForEntry(entry);
        if (!entry.id || isAsfaProvisionalBifEntry(entry, entry, { breed })) {
            return;
        }
        candidatesByEntry.set(key, {
            entryId: entry.id,
            breed,
            stake: runGroupStakeForEntry(entry),
            name: entry.callName || entry.registeredName || 'Unnamed hound',
            registrationNumber: entry.registrationNumber || '',
            hound: {
                ...entry,
                entryId: entry.id,
                breed,
                stake: runGroupStakeForEntry(entry),
            },
        });
    });
    return [...candidatesByEntry.values()];
}

function isAsfaProvisionalBreed(value) {
    const normalized = clean(value);
    return normalized === 'PROVISIONAL' || asfaProvisionalBreedCodes.includes(normalized);
}

function isAsfaProvisionalBifEntry(hound = {}, entry = {}, group = {}) {
    return isAsfaProvisionalBreed(hound.breed)
        || isAsfaProvisionalBreed(hound.entryBreed)
        || isAsfaProvisionalBreed(entry.breed)
        || isAsfaProvisionalBreed(group.breed);
}

function updateBifStatus(entryId, status) {
    const trial = readForm();
    const bif = bifState(trial);
    const key = bifEntryKey(entryId);
    const selected = selectedBifEntryIds(bif);
    const statuses = { ...(bif.statusByEntryId || {}) };
    if (status === 'running') {
        selected.add(key);
        statuses[key] = 'running';
    } else if (status === 'not_running') {
        selected.delete(key);
        statuses[key] = 'not_running';
    } else {
        selected.delete(key);
        statuses[key] = '';
    }
    trial.scorebook = {
        ...(trial.scorebook || {}),
        bif: {
            ...bif,
            selectedEntryIds: [...selected],
            statusByEntryId: statuses,
            draw: null,
        },
    };
    upsertTrial(trial);
    render();
}

function updateBifJudge(key, value) {
    const trial = readForm();
    const bif = bifState(trial);
    if (value) {
        ensureJudgeInDatabaseAndTrial(value, trial);
    }
    trial.scorebook = {
        ...(trial.scorebook || {}),
        bif: {
            ...bif,
            [key]: value,
        },
    };
    upsertTrial(trial);
    render();
}

function buildBifDraw() {
    const trial = readForm();
    recalculateTrialResults(trial);
    const bif = bifState(trial);
    if (!String(bif.judge1 || '').trim() && !String(bif.judge2 || '').trim()) {
        showMessage(bifMessage, 'Assign at least one BIF judge before drawing BIF.', 'warning');
        return;
    }
    const winnersByEntry = new Map(bifCandidateHoundsForTrial(trial).map((winner) => [bifEntryKey(winner.entryId), winner]));
    const selected = [...currentBifRunningEntryIds(bif)].filter((entryId) => winnersByEntry.has(entryId));
    const hounds = selected
        .map((entryId) => winnersByEntry.get(entryId))
        .map((winner) => ({
            ...winner.hound,
            entryId: winner.entryId,
            callName: winner.name,
            bobStake: winner.stake,
        }));
    if (hounds.length === 0) {
        const visibleSelected = [...currentBifRunningEntryIds(bif)];
        const candidateNames = [...winnersByEntry.values()].map((winner) => winner.name).filter(Boolean);
        showMessage(
            bifMessage,
            visibleSelected.length
                ? `The BIF runners are checked, but they did not match the current BOB winner records. Refresh the page and try Draw BIF again. Candidates: ${candidateNames.join(', ') || 'none'}.`
                : 'Check at least one BOB winner to run in BIF.',
            'warning',
        );
        return;
    }
    const sizes = courseSizesForEntryCount(hounds.length);
    const courses = sizes.map((size, index) => ({
        id: crypto.randomUUID(),
        number: index + 1,
        capacity: size,
        hounds: [],
    }));
    secureShuffle(hounds).forEach((hound) => {
        chooseCourseForEntry(courses, hound).hounds.push(hound);
    });
    courses.forEach((course) => {
        const colors = blanketColorsForCourseSize(course.hounds.length);
        course.hounds = secureShuffle(course.hounds).map((hound, index) => ({
            ...hound,
            blanketColor: colors[index],
            bifCourse: course.number,
            bifBlanketColor: colors[index],
            bifCode: `${course.number}${blanketCode(colors[index])}`,
            drawPosition: index + 1,
        }));
        delete course.capacity;
    });
    trial.scorebook = {
        ...(trial.scorebook || {}),
        bif: {
            ...bif,
            selectedEntryIds: hounds.map((hound) => bifEntryKey(hound.entryId)),
            statusByEntryId: hounds.reduce((next, hound) => {
                next[bifEntryKey(hound.entryId)] = 'running';
                return next;
            }, { ...(bif.statusByEntryId || {}) }),
            drawInvalidatedAt: '',
            drawInvalidatedReason: '',
            drawNeedsRefresh: false,
            draw: normalizeBifDrawColors({
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                courses,
            }),
        },
    };
    upsertTrial(trial);
    saveTrials();
    showMessage(bifMessage, `Built BIF draw for ${hounds.length} hound${hounds.length === 1 ? '' : 's'}.`, 'success');
    render();
}

function runBifDrawFromButton() {
    if (window.__bifDrawClickInProgress) {
        return;
    }
    window.__bifDrawClickInProgress = true;
    try {
        buildBifDraw();
    } catch (error) {
        showMessage(bifMessage, `BIF draw failed: ${error.message}`, 'warning');
    } finally {
        setTimeout(() => {
            window.__bifDrawClickInProgress = false;
        }, 0);
    }
}

function selectedBifEntryIds(bif) {
    return new Set([
        ...(bif.selectedEntryIds || []).map(bifEntryKey),
        ...Object.entries(bif.statusByEntryId || {})
            .filter(([, status]) => status === 'running')
            .map(([entryId]) => bifEntryKey(entryId)),
    ]);
}

function currentBifRunningEntryIds(bif) {
    const selected = selectedBifEntryIds(bif || {});
    document.querySelectorAll('.bif-status-select').forEach((select) => {
        if (select.value === 'running' && select.dataset.entryId) {
            selected.add(select.dataset.entryId);
        }
    });
    return selected;
}

function bifEntryKey(entryId) {
    return String(entryId || '');
}

function bifDrawTable(trial, winners) {
    const bif = bifState(trial);
    const selected = selectedBifEntryIds(bif);
    const bifOutcomes = bif.outcomes || {};
    const judgeCount = bif.judge2 ? 2 : 1;
    const section = document.createElement('div');
    section.className = 'score-group';
    const heading = document.createElement('div');
    heading.className = 'course-group-heading';
    const title = document.createElement('h3');
    title.textContent = bif.draw ? 'BIF Draw' : 'Checked BIF Hounds';
    const meta = document.createElement('span');
    meta.textContent = bif.draw ? 'Randomized course order' : 'Build draw when ready';
    heading.append(title, meta);
    if (bif.draw) {
        heading.appendChild(manualDrawToggleButton('bif:draw'));
    }
    section.appendChild(heading);

    const normalizedDraw = normalizeBifDrawColors(bif.draw);
    const rows = normalizedDraw
        ? (normalizedDraw.courses || []).flatMap((course) => sortedHoundsByBlanket(course.hounds || []).map((hound) => ({ course, hound })))
        : winners.filter((winner) => selected.has(bifEntryKey(winner.entryId))).map((winner) => ({ course: null, hound: winner.hound, winner }));

    if (rows.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'No hounds checked for BIF yet.';
        section.appendChild(empty);
        return section;
    }

    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    const table = document.createElement('table');
    const header = ['Run #/Clr', 'Hound', 'Breed', 'Stake', 'BIF J1'];
    if (judgeCount > 1) {
        header.push('BIF J2');
    }
    header.push('Total', 'Status', 'Result');
    table.innerHTML = `<thead><tr>${header.map((label) => `<th>${label}</th>`).join('')}</tr></thead>`;
    const body = document.createElement('tbody');
    let lastBifCourse = '';
    rows.forEach((row) => {
        const courseNumber = row.course && row.course.number ? String(row.course.number) : '';
        if (courseNumber && courseNumber !== lastBifCourse) {
            body.appendChild(courseHeaderRow(courseNumber, header.length));
            lastBifCourse = courseNumber;
        }
        const entryKey = bifEntryKey(row.hound.entryId);
        const outcome = normalizedBobOutcome(bifOutcomes[entryKey]);
        const tr = document.createElement('tr');
        const code = document.createElement('td');
        const bifColor = row.hound.bifBlanketColor || row.hound.blanketColor || '';
        const bifCode = row.hound.bifCode || (row.course && bifColor ? `${row.course.number}${blanketCode(bifColor)}` : '');
        if (bifCode) {
            const badge = document.createElement('span');
            badge.className = `blanket blanket-${clean(bifColor).toLowerCase()}`;
            badge.textContent = bifCode;
            code.appendChild(badge);
        } else {
            code.textContent = 'Blank until draw';
            code.className = 'muted-cell';
        }
        tr.appendChild(code);
        tr.appendChild(textCell(row.hound.callName || row.hound.registeredName || row.winner?.name || 'Unnamed hound'));
        tr.appendChild(textCell(displayBreedCode(row.hound.breed || row.winner?.breed || '')));
        tr.appendChild(textCell(row.hound.bobStake || row.hound.stake || row.winner?.stake || ''));
        const judge1 = document.createElement('td');
        judge1.appendChild(scoreNumberInput(outcome.judge1 || '', 'J1', Boolean(outcome.value) || !bif.draw, (value) => updateBifScore(entryKey, { judge1: value })));
        tr.appendChild(judge1);
        if (judgeCount > 1) {
            const judge2 = document.createElement('td');
            judge2.appendChild(scoreNumberInput(outcome.judge2 || '', 'J2', Boolean(outcome.value) || !bif.draw, (value) => updateBifScore(entryKey, { judge2: value })));
            tr.appendChild(judge2);
        }
        tr.appendChild(textCell(computedScoreDisplay(outcome.score, outcome.value)));
        const statusCell = document.createElement('td');
        const status = document.createElement('select');
        status.className = 'score-outcome';
        scoreOutcomeOptions().forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            status.appendChild(option);
        });
        status.value = outcome.value || '';
        status.disabled = !bif.draw;
        status.addEventListener('change', () => updateBifScore(entryKey, { outcome: status.value }));
        statusCell.appendChild(status);
        tr.appendChild(statusCell);
        tr.appendChild(textCell(bifResultForEntry(bif, entryKey)));
        body.appendChild(tr);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    section.appendChild(wrap);
    if (bif.draw) {
        section.appendChild(renderManualDrawEditor({
            key: 'bif:draw',
            draw: normalizedDraw,
            type: 'bif',
            title: 'BIF Draw',
            onMove: moveManualBifDrawHound,
            onColorChange: updateManualBifDrawBlanket,
        }));
        renderDrawAuditLog(section, bif.draw);
    }
    const tieSection = renderBifTieRunoffSection(bif);
    if (tieSection) {
        section.appendChild(tieSection);
    }
    return section;
}

function renderBifTieRunoffSection(bif) {
    const tiedIds = bifMainTieEntryIds(bif);
    const tieRunoffs = bifTieRunoffList(bif);
    const tieRunoff = currentBifTieRunoff(bif);
    if (tiedIds.length < 2 && !tieRunoff.draw) {
        return null;
    }

    const section = document.createElement('div');
    section.className = 'score-group';
    const heading = document.createElement('div');
    heading.className = 'course-group-heading';
    const title = document.createElement('h3');
    title.textContent = 'BIF Tie Runoff';
    const meta = document.createElement('span');
    meta.textContent = tieRunoff.draw ? 'Enter tie runoff scores' : 'Draw tied BIF hounds again';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `secondary small ${tieRunoff.draw ? 'draw-complete-button' : 'draw-needed-button'}`;
    button.textContent = tieRunoff.draw ? 'ReDraw BIF Tie Runoff' : 'Draw BIF Tie Runoff';
    button.dataset.help = 'Randomly assigns the tied BIF hounds to a new course and blanket colors.';
    button.addEventListener('click', buildBifTieRunoff);
    heading.append(title, meta, button);
    section.appendChild(heading);

    if (!tieRunoff.draw) {
        const note = document.createElement('p');
        note.className = 'field-note warning';
        note.textContent = 'BIF is tied. Draw the tied hounds again to settle Best in Field.';
        section.appendChild(note);
        section.appendChild(renderPendingBifTieRows(bif, tiedIds));
        return section;
    }

    tieRunoffs.slice(0, -1).forEach((runoff, index) => {
        section.appendChild(renderBifTieRunoffTable(bif, runoff, false, `BIF Tie Runoff ${index + 1}`, index));
    });
    section.appendChild(renderBifTieRunoffTable(bif, tieRunoff, false, `BIF Tie Runoff ${tieRunoffs.length}`, tieRunoffs.length - 1));
    return section;
}

function renderPendingBifTieRows(bif, tiedIds) {
    const section = document.createElement('div');
    section.className = 'table-wrap';
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>Hound</th><th>Breed</th><th>Stake</th><th>BIF Total</th><th>Result</th></tr></thead>';
    const body = document.createElement('tbody');
    const outcomes = bif.outcomes || {};
    const houndsByEntry = new Map(((bif.draw || {}).courses || [])
        .flatMap((course) => course.hounds || [])
        .map((hound) => [bifEntryKey(hound.entryId), hound]));
    tiedIds.forEach((entryId) => {
        const hound = houndsByEntry.get(bifEntryKey(entryId));
        if (!hound) {
            return;
        }
        const outcome = normalizedBobOutcome(outcomes[bifEntryKey(hound.entryId)]);
        const tr = document.createElement('tr');
        tr.appendChild(textCell(hound.callName || hound.registeredName || 'Unnamed hound'));
        tr.appendChild(textCell(displayBreedCode(hound.breed)));
        tr.appendChild(textCell(hound.bobStake || hound.stake || ''));
        tr.appendChild(textCell(computedScoreDisplay(outcome.score, outcome.value)));
        tr.appendChild(textCell('BIF Tie'));
        body.appendChild(tr);
    });
    table.appendChild(body);
    section.appendChild(table);
    return section;
}

function renderBifTieRunoffTable(bif, tieRunoff, readOnly, label, roundIndex = -1) {
    const section = document.createElement('div');
    section.className = readOnly ? 'score-group archived-runoff' : 'score-group';
    const title = document.createElement('h4');
    title.textContent = label;
    section.appendChild(title);
    const draw = normalizeBifDrawColors(tieRunoff.draw);
    const outcomes = tieRunoff.outcomes || {};
    const judgeCount = bif.judge2 ? 2 : 1;
    const rows = (draw.courses || []).flatMap((course) => sortedHoundsByBlanket(course.hounds || []).map((hound) => ({ course, hound })));
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    const table = document.createElement('table');
    const headers = ['Run #/Clr', 'Hound', 'Breed', 'Stake', 'Tie J1'];
    if (judgeCount > 1) {
        headers.push('Tie J2');
    }
    headers.push('Total', 'Status', 'Result');
    table.innerHTML = `<thead><tr>${headers.map((label) => `<th>${label}</th>`).join('')}</tr></thead>`;
    const body = document.createElement('tbody');
    rows.forEach((row) => {
        const entryKey = bifEntryKey(row.hound.entryId);
        const outcome = normalizedBobOutcome(outcomes[entryKey]);
        const tr = document.createElement('tr');
        const code = document.createElement('td');
        const color = row.hound.bifBlanketColor || row.hound.blanketColor || '';
        const codeText = row.hound.bifCode || (row.course && color ? `${row.course.number}${blanketCode(color)}` : '');
        if (codeText) {
            const badge = document.createElement('span');
            badge.className = `blanket blanket-${clean(color).toLowerCase()}`;
            badge.textContent = codeText;
            code.appendChild(badge);
        } else {
            code.textContent = 'Blank until draw';
            code.className = 'muted-cell';
        }
        tr.appendChild(code);
        tr.appendChild(textCell(row.hound.callName || row.hound.registeredName || 'Unnamed hound'));
        tr.appendChild(textCell(displayBreedCode(row.hound.breed)));
        tr.appendChild(textCell(row.hound.bobStake || row.hound.stake || ''));
        const judge1 = document.createElement('td');
        if (readOnly) {
            judge1.textContent = outcome.judge1 || '';
            judge1.className = 'muted-cell';
        } else {
            judge1.appendChild(scoreNumberInput(outcome.judge1 || '', 'J1', Boolean(outcome.value), (value) => updateBifTieScore(entryKey, { judge1: value }, roundIndex)));
        }
        tr.appendChild(judge1);
        if (judgeCount > 1) {
            const judge2 = document.createElement('td');
            if (readOnly) {
                judge2.textContent = outcome.judge2 || '';
                judge2.className = 'muted-cell';
            } else {
                judge2.appendChild(scoreNumberInput(outcome.judge2 || '', 'J2', Boolean(outcome.value), (value) => updateBifTieScore(entryKey, { judge2: value }, roundIndex)));
            }
            tr.appendChild(judge2);
        }
        tr.appendChild(textCell(computedScoreDisplay(outcome.score, outcome.value)));
        const statusCell = document.createElement('td');
        if (readOnly) {
            statusCell.textContent = outcome.value ? scoreOutcomeLabel(outcome.value) : '';
            statusCell.className = 'muted-cell';
        } else {
            const status = document.createElement('select');
            status.className = 'score-outcome';
            scoreOutcomeOptions().forEach(([value, statusLabel]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = statusLabel;
                status.appendChild(option);
            });
            status.value = outcome.value || '';
            status.addEventListener('change', () => updateBifTieScore(entryKey, { outcome: status.value }, roundIndex));
            statusCell.appendChild(status);
        }
        tr.appendChild(statusCell);
        tr.appendChild(textCell(bifTieResultForEntry(bif, row.hound.entryId, tieRunoff)));
        body.appendChild(tr);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    section.appendChild(wrap);
    return section;
}

function moveManualBifDrawHound(entryId, targetCourseId) {
    if (!targetCourseId) {
        return;
    }
    const trial = readForm();
    const bif = bifState(trial);
    if (!bif.draw) {
        return;
    }
    const moved = moveHoundWithinDraw(bif.draw, entryId, targetCourseId, 'bif', 'BIF Draw');
    if (!moved) {
        showMessage(bifMessage, 'Choose a valid BIF course for that hound.', 'warning');
        render();
        return;
    }
    trial.scorebook = {
        ...(trial.scorebook || {}),
        bif: {
            ...bif,
            draw: moved.draw,
        },
    };
    upsertTrial(trial);
    saveTrials();
    showMessage(bifMessage, `Manual BIF draw edit saved: ${moved.description}`, 'success');
    render();
}

function updateManualBifDrawBlanket(entryId, color) {
    const trial = readForm();
    const bif = bifState(trial);
    if (!bif.draw) {
        return;
    }
    const changed = changeHoundBlanketWithinDraw(bif.draw, entryId, color, 'bif', 'BIF Draw');
    if (!changed) {
        showMessage(bifMessage, 'Choose a valid BIF blanket color for that course.', 'warning');
        render();
        return;
    }
    trial.scorebook = {
        ...(trial.scorebook || {}),
        bif: {
            ...bif,
            draw: changed.draw,
        },
    };
    upsertTrial(trial);
    saveTrials();
    showMessage(bifMessage, `Manual BIF blanket change saved: ${changed.description}`, 'success');
    render();
}

function updateBifScore(entryId, changes) {
    const trial = readForm();
    const bif = bifState(trial);
    const entryKey = bifEntryKey(entryId);
    const outcomes = { ...(bif.outcomes || {}) };
    const current = normalizedBobOutcome(outcomes[entryKey]);
    const next = { ...current };
    const judgeCount = bif.judge2 ? 2 : 1;
    if ('judge1' in changes) {
        next.judge1 = String(changes.judge1 || '').trim();
    }
    if ('judge2' in changes) {
        next.judge2 = String(changes.judge2 || '').trim();
    }
    if ('outcome' in changes) {
        next.value = changes.outcome || '';
        if (next.value) {
            next.judge1 = '';
            next.judge2 = '';
            next.score = '';
        }
    } else {
        next.score = computedJudgeTotal(next.judge1, next.judge2, judgeCount);
        if (next.score) {
            next.value = '';
        }
    }
    outcomes[entryKey] = next;
    trial.scorebook = {
        ...(trial.scorebook || {}),
        bif: {
            ...bif,
            outcomes,
        },
    };
    upsertTrial(trial);
    render();
}

async function buildBifTieRunoff() {
    const trial = readForm();
    const bif = bifState(trial);
    const tiedIds = bifMainTieEntryIds(bif);
    const existingRunoffs = bifTieRunoffList(bif);
    const currentRunoff = currentBifTieRunoff(bif);
    const houndsByEntry = new Map(((bif.draw || {}).courses || [])
        .flatMap((course) => course.hounds || [])
        .map((hound) => [bifEntryKey(hound.entryId), hound]));
    const hounds = tiedIds
        .map((entryId) => houndsByEntry.get(bifEntryKey(entryId)))
        .filter(Boolean)
        .map((hound) => ({
            ...hound,
            bifTieSourceCode: hound.bifCode || '',
            bifCode: '',
            bifBlanketColor: '',
            blanketColor: '',
        }));
    if (hounds.length < 2) {
        showMessage(bifMessage, 'BIF does not currently have at least two tied hounds to run off.', 'warning');
        return;
    }
    if (currentRunoff.draw && !bifTieRunoffIsComplete({ tieRunoff: currentRunoff })) {
        const replace = await showTrialConfirm({
            title: 'Replace BIF Tie Runoff',
            eyebrow: 'BIF Tie',
            message: 'Replace the current unscored BIF tie runoff draw?',
            primaryText: 'Replace Draw',
        });
        if (!replace) {
            return;
        }
    }

    const sizes = courseSizesForEntryCount(hounds.length);
    const courses = sizes.map((size, index) => ({
        id: crypto.randomUUID(),
        number: index + 1,
        capacity: size,
        hounds: [],
    }));
    secureShuffle(hounds).forEach((hound) => {
        chooseCourseForEntry(courses, hound).hounds.push(hound);
    });
    courses.forEach((course) => {
        const colors = blanketColorsForCourseSize(course.hounds.length);
        course.hounds = secureShuffle(course.hounds).map((hound, index) => ({
            ...hound,
            blanketColor: colors[index],
            bifCourse: course.number,
            bifBlanketColor: colors[index],
            bifCode: `${course.number}${blanketCode(colors[index])}`,
            drawPosition: index + 1,
        }));
        delete course.capacity;
    });

    const newRunoff = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        sourceEntryIds: tiedIds.map(bifEntryKey),
        outcomes: {},
        draw: normalizeBifDrawColors({
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            courses,
        }),
    };
    const nextTieRunoffs = currentRunoff.draw && bifTieRunoffIsComplete({ tieRunoff: currentRunoff })
        ? [...existingRunoffs, newRunoff]
        : [...existingRunoffs.slice(0, -1), newRunoff];

    trial.scorebook = {
        ...(trial.scorebook || {}),
        bif: {
            ...bif,
            tieRunoff: newRunoff,
            tieRunoffs: nextTieRunoffs,
        },
    };
    upsertTrial(trial);
    saveTrials();
    showMessage(bifMessage, `Built BIF tie runoff for ${hounds.length} hounds.`, 'success');
    render();
}

function updateBifTieScore(entryId, changes, roundIndex = -1) {
    const trial = readForm();
    const bif = bifState(trial);
    const entryKey = bifEntryKey(entryId);
    const tieRunoffs = bifTieRunoffList(bif);
    const targetIndex = roundIndex >= 0 ? roundIndex : Math.max(0, tieRunoffs.length - 1);
    const tieRunoff = tieRunoffs[targetIndex] || currentBifTieRunoff(bif);
    const outcomes = { ...(tieRunoff.outcomes || {}) };
    const current = normalizedBobOutcome(outcomes[entryKey]);
    const next = { ...current };
    const judgeCount = bif.judge2 ? 2 : 1;
    if ('judge1' in changes) {
        next.judge1 = String(changes.judge1 || '').trim();
    }
    if ('judge2' in changes) {
        next.judge2 = String(changes.judge2 || '').trim();
    }
    if ('outcome' in changes) {
        next.value = changes.outcome || '';
        if (next.value) {
            next.judge1 = '';
            next.judge2 = '';
            next.score = '';
        }
    } else {
        next.score = computedJudgeTotal(next.judge1, next.judge2, judgeCount);
        if (next.score) {
            next.value = '';
        }
    }
    outcomes[entryKey] = next;
    trial.scorebook = {
        ...(trial.scorebook || {}),
        bif: {
            ...bif,
            tieRunoff: targetIndex === tieRunoffs.length - 1
                ? { ...tieRunoff, outcomes }
                : currentBifTieRunoff(bif),
            tieRunoffs: tieRunoffs.map((runoff, index) => index === targetIndex ? { ...runoff, outcomes } : runoff),
        },
    };
    upsertTrial(trial);
    render();
}

function bifResultForEntry(bif, entryId) {
    const targetKey = bifEntryKey(entryId);
    const tieResult = bifTieResultForEntry(bif, entryId);
    if (bifTieRunoffIncludesEntry(bif, entryId) && bifTieRunoffIsComplete(bif)) {
        return tieResult;
    }
    if (tieResult) {
        return tieResult;
    }
    const outcomes = bif.outcomes || {};
    const rows = ((bif.draw || {}).courses || [])
        .flatMap((course) => course.hounds || [])
        .map((hound) => {
            const key = bifEntryKey(hound.entryId);
            const outcome = normalizedBobOutcome(outcomes[key]);
            return {
                entryId: key,
                score: hasScoreValue(outcome.score) ? Number(outcome.score) : NaN,
                outcome: outcome.value,
            };
        });
    if (rows.length === 0) {
        return '';
    }
    const scored = rows
        .filter((row) => Number.isFinite(row.score) && !row.outcome)
        .sort((a, b) => b.score - a.score);
    if (scored.length === 0) {
        return scoreOutcomeLabel(normalizedBobOutcome(outcomes[targetKey]).value);
    }
    const topScore = scored[0].score;
    const top = scored.filter((row) => row.score === topScore).map((row) => row.entryId);
    if (top.includes(targetKey)) {
        return top.length > 1 ? 'BIF Tie' : 'BIF';
    }
    return scoreOutcomeLabel(normalizedBobOutcome(outcomes[targetKey]).value);
}

function bifMainTieEntryIds(bif) {
    const outcomes = bif.outcomes || {};
    const rows = ((bif.draw || {}).courses || [])
        .flatMap((course) => course.hounds || [])
        .map((hound) => {
            const key = bifEntryKey(hound.entryId);
            const outcome = normalizedBobOutcome(outcomes[key]);
            return {
                entryId: key,
                score: hasScoreValue(outcome.score) ? Number(outcome.score) : NaN,
                outcome: outcome.value,
            };
        });
    if (rows.length === 0 || rows.some((row) => !Number.isFinite(row.score) && !row.outcome)) {
        return [];
    }
    const scored = rows
        .filter((row) => Number.isFinite(row.score) && !row.outcome)
        .sort((a, b) => b.score - a.score);
    if (scored.length < 2) {
        return [];
    }
    const topScore = scored[0].score;
    return scored.filter((row) => row.score === topScore).map((row) => row.entryId);
}

function bifTieResultForEntry(bif, entryId, tieRunoffOverride = null) {
    const targetKey = bifEntryKey(entryId);
    const tieRunoff = tieRunoffOverride || currentBifTieRunoff(bif);
    const outcomes = tieRunoff.outcomes || {};
    const rows = ((tieRunoff.draw || {}).courses || [])
        .flatMap((course) => course.hounds || [])
        .map((hound) => {
            const key = bifEntryKey(hound.entryId);
            const outcome = normalizedBobOutcome(outcomes[key]);
            return {
                entryId: key,
                score: hasScoreValue(outcome.score) ? Number(outcome.score) : NaN,
                outcome: outcome.value,
            };
        });
    if (rows.length === 0 || !rows.some((row) => row.entryId === targetKey)) {
        return '';
    }
    if (rows.some((row) => !Number.isFinite(row.score) && !row.outcome)) {
        return '';
    }
    const scored = rows
        .filter((row) => Number.isFinite(row.score) && !row.outcome)
        .sort((a, b) => b.score - a.score);
    if (scored.length === 0) {
        return scoreOutcomeLabel(normalizedBobOutcome(outcomes[targetKey]).value);
    }
    const topScore = scored[0].score;
    const top = scored.filter((row) => row.score === topScore).map((row) => bifEntryKey(row.entryId));
    if (top.includes(targetKey)) {
        return top.length > 1 ? 'BIF Tie' : 'BIF';
    }
    return scoreOutcomeLabel(normalizedBobOutcome(outcomes[targetKey]).value);
}

function bifQualifyingMinimum(bif) {
    return placementQualifyingMinimum((bif && bif.judge2) ? 2 : 1);
}

function bifTieRunoffIncludesEntry(bif, entryId) {
    return (currentBifTieRunoff(bif).draw || {}).courses
        ? ((currentBifTieRunoff(bif).draw || {}).courses || [])
            .flatMap((course) => course.hounds || [])
            .some((hound) => bifEntryKey(hound.entryId) === bifEntryKey(entryId))
        : false;
}

function bifTieRunoffIsComplete(bif) {
    const tieRunoff = currentBifTieRunoff(bif);
    const outcomes = tieRunoff.outcomes || {};
    const rows = ((tieRunoff.draw || {}).courses || [])
        .flatMap((course) => course.hounds || [])
        .map((hound) => normalizedBobOutcome(outcomes[bifEntryKey(hound.entryId)]));
    return rows.length > 0 && rows.every((outcome) => hasScoreValue(outcome.score) || outcome.value);
}

function bifTieRunoffList(bif) {
    if (Array.isArray(bif.tieRunoffs) && bif.tieRunoffs.length > 0) {
        return bif.tieRunoffs;
    }
    return bif.tieRunoff && bif.tieRunoff.draw ? [bif.tieRunoff] : [];
}

function currentBifTieRunoff(bif) {
    const runoffs = bifTieRunoffList(bif);
    return runoffs.length ? runoffs[runoffs.length - 1] : (bif.tieRunoff || {});
}

function recalculateTrialResults(trial) {
    if (!trial) {
        return false;
    }
    const before = JSON.stringify({
        groups: (trial.preliminaryDraw || {}).groups || [],
        bobRunoffs: trial.bobRunoffs || [],
        resultState: trial.resultState || {},
        bif: (trial.scorebook || {}).bif || {},
    });

    normalizeFinalPlacementState(trial);
    syncResolvedTiePlaceholders(trial);
    mergeBobRunoffOutcomeFacts(trial);
    normalizeBobRunoffState(trial);
    trial.resultState = buildTrialResultState(trial);
    reconcileBifStateWithBobWinners(trial);

    const after = JSON.stringify({
        groups: (trial.preliminaryDraw || {}).groups || [],
        bobRunoffs: trial.bobRunoffs || [],
        resultState: trial.resultState || {},
        bif: (trial.scorebook || {}).bif || {},
    });
    return before !== after;
}

function reconcileBifStateWithBobWinners(trial) {
    const existingScorebook = trial.scorebook || {};
    const hasExistingBifState = Boolean(existingScorebook.bif);
    const bif = existingScorebook.bif || {};
    if (!trial.resultState || !Array.isArray(trial.resultState.bifEligibleEntryIds)) {
        return;
    }

    const eligible = new Set([
        ...((trial.resultState || {}).bifEligibleEntryIds || []).map(bifEntryKey),
        ...bifCandidateHoundsForTrial(trial).map((candidate) => bifEntryKey(candidate.entryId)),
    ]);
    if (eligible.size === 0 && !hasExistingBifState) {
        return;
    }
    const statuses = {};
    Object.entries(bif.statusByEntryId || {}).forEach(([entryId, status]) => {
        const key = bifEntryKey(entryId);
        if (eligible.has(key)) {
            statuses[key] = status;
        }
    });
    (bif.selectedEntryIds || []).map(bifEntryKey).forEach((key) => {
        if (eligible.has(key) && !(key in statuses)) {
            statuses[key] = 'running';
        }
    });
    const selected = [...eligible].filter((entryId) => statuses[bifEntryKey(entryId)] === 'running');
    const selectedSet = new Set(selected);

    const currentDrawEntryIds = ((bif.draw || {}).courses || [])
        .flatMap((course) => course.hounds || [])
        .map((hound) => bifEntryKey(hound.entryId))
        .filter(Boolean);
    const drawMatchesSelected = bif.draw
        && currentDrawEntryIds.length === selected.length
        && currentDrawEntryIds.every((entryId) => selectedSet.has(entryId));
    const draw = bif.draw ? normalizeBifDrawColors(bif.draw) || bif.draw : null;
    const drawEntrySet = new Set(currentDrawEntryIds);
    const outcomes = {};
    Object.entries(bif.outcomes || {}).forEach(([entryId, outcome]) => {
        const key = bifEntryKey(entryId);
        if (selectedSet.has(key) || drawEntrySet.has(key)) {
            outcomes[key] = outcome;
        }
    });

    const nextBif = {
        ...bif,
        selectedEntryIds: selected,
        statusByEntryId: statuses,
        outcomes,
        draw,
        drawNeedsRefresh: false,
        drawInvalidatedAt: '',
        drawInvalidatedReason: '',
    };
    if (bif.draw && !drawMatchesSelected) {
        nextBif.drawNeedsRefresh = true;
        nextBif.drawInvalidatedAt = new Date().toISOString();
        nextBif.drawInvalidatedReason = 'BOB winners changed after the BIF draw was built. Review the BIF runners and redraw.';
    }

    trial.scorebook = {
        ...(trial.scorebook || {}),
        bif: nextBif,
    };
}

function mergeBobRunoffOutcomeFacts(trial) {
    if (!trial || !Array.isArray(trial.bobRunoffs)) {
        return;
    }
    trial.bobRunoffs = trial.bobRunoffs.map((runoff) => mergeBobRunoffOutcomeFactsIntoRunoff(trial, runoff));
}

function mergeBobRunoffOutcomeFactsIntoRunoff(trial, runoff) {
    const outcomes = (trial.bobRunoffOutcomes || {})[runoff.key] || {};
    return {
        ...runoff,
        courses: (runoff.courses || []).map((course) => ({
            ...course,
            hounds: (course.hounds || []).map((hound) => {
                const outcome = normalizedBobOutcome(outcomes[hound.entryId]);
                if (!outcome.score && !outcome.value) {
                    return hound;
                }
                return {
                    ...hound,
                    bobJudge1Score: outcome.judge1 || '',
                    bobJudge2Score: outcome.judge2 || '',
                    bobScore: outcome.score || '',
                    bobOutcome: outcome.value || '',
                    bobForfeitOrder: outcome.forfeitOrder || '',
                };
            }),
        })),
    };
}

function buildTrialResultState(trial) {
    const bobResultsByEntry = {};
    const bobTieResolvedKeys = new Set();
    const entriesById = new Map((trial.entries || []).map((entry) => [bifEntryKey(entry.id), entry]));
    const houndContextByEntry = new Map();
    (((trial.preliminaryDraw || {}).groups) || []).forEach((group) => {
        finalsRowsForGroup(group).forEach((row) => {
            houndContextByEntry.set(bifEntryKey(row.hound.entryId), { hound: row.hound, group });
        });
        groupScoreRows(group).forEach((row) => {
            if (!houndContextByEntry.has(bifEntryKey(row.hound.entryId))) {
                houndContextByEntry.set(bifEntryKey(row.hound.entryId), { hound: row.hound, group });
            }
        });
    });
    const setBobResult = (entryId, result) => {
        if (!entryId && entryId !== 0) {
            return;
        }
        const current = bobResultsByEntry[entryId] || '';
        if (bobResultPriority(result) >= bobResultPriority(current)) {
            bobResultsByEntry[entryId] = result || '';
        }
    };

    (trial.bobRunoffs || [])
        .filter((runoff) => String(runoff.key || '').startsWith('bobtie:'))
        .forEach((runoff) => {
            const rows = runoffRows(runoff);
            const resolved = rows.some((row) => row.hound.bobResult === 'BOB');
            if (!resolved) {
                return;
            }
            bobTieResolvedKeys.add(String(runoff.key || '').replace(/^bobtie:/, ''));
            rows.forEach((row) => {
                setBobResult(row.hound.entryId, row.hound.bobResult === 'BOB' ? 'BOB' : '');
            });
        });

    (trial.bobRunoffs || [])
        .filter((runoff) => !String(runoff.key || '').startsWith('bobtie:'))
        .forEach((runoff) => {
            const suppressedByResolvedTie = bobTieResolvedKeys.has(runoff.key || '');
            runoffRows(runoff).forEach((row) => {
                if (!row.hound.bobResult) {
                    return;
                }
                if (suppressedByResolvedTie && row.hound.bobResult === 'BOB Tie') {
                    return;
                }
                setBobResult(row.hound.entryId, row.hound.bobResult);
            });
        });

    automaticBobWinnerRows(trial).forEach((row) => {
        setBobResult(row.hound.entryId, 'BOB');
    });

    const bifEligibleEntryIds = Object.entries(bobResultsByEntry)
        .filter(([, result]) => result === 'BOB')
        .filter(([entryId]) => {
            const context = houndContextByEntry.get(bifEntryKey(entryId)) || {};
            return !isAsfaProvisionalBifEntry(context.hound || {}, entriesById.get(bifEntryKey(entryId)) || {}, context.group || {});
        })
        .map(([entryId]) => entryId);

    return {
        bobResultsByEntry,
        bifEligibleEntryIds,
    };
}

function bobResultPriority(result) {
    if (result === 'BOB') {
        return 3;
    }
    if (result === 'BOB Tie') {
        return 2;
    }
    if (result) {
        return 1;
    }
    return 0;
}

function automaticBobWinnerRows(trial) {
    const groups = sortDrawGroupsForPrint(((trial.preliminaryDraw || {}).groups || []), trial);
    const candidatesByBreed = bobStakeCandidatesByBreed(groups);
    const firstTiePlaceholders = firstPlaceTiePlaceholdersByBreed(groups);
    const automatic = [];

    candidatesByBreed.forEach((rows, breedKey) => {
        if (rows.length !== 1 || (firstTiePlaceholders.get(breedKey) || []).length > 0) {
            return;
        }
        automatic.push(rows[0]);
    });

    return automatic;
}

function syncResolvedTiePlaceholders(trial) {
    if (!trial || !trial.preliminaryDraw || !Array.isArray(trial.preliminaryDraw.groups) || !Array.isArray(trial.bobRunoffs)) {
        return false;
    }
    const before = JSON.stringify(trial.bobRunoffs);
    trial.preliminaryDraw.groups.forEach((group) => {
        const labels = new Set();
        finalsRowsForGroup(group).forEach((row) => {
            if (row.hound.tieBreakLabel && row.hound.placement === '1') {
                labels.add(row.hound.tieBreakLabel);
            }
        });
        labels.forEach((label) => syncTieBreakRunoffResults(trial, group, label));
    });
    return before !== JSON.stringify(trial.bobRunoffs);
}

function normalizeBobRunoffState(trial) {
    if (!trial || !Array.isArray(trial.bobRunoffs)) {
        return false;
    }
    const before = JSON.stringify(trial.bobRunoffs);
    trial.bobRunoffs = trial.bobRunoffs.map((runoff) => {
        if (String(runoff.key || '').startsWith('bobtie:')) {
            const outcomes = (trial.bobRunoffOutcomes || {})[runoff.key] || {};
            return resolveBobRunoffResults({
                ...runoff,
                courses: (runoff.courses || []).map((course) => ({
                    ...course,
                    hounds: (course.hounds || []).map((hound) => {
                        const outcome = normalizedBobOutcome(outcomes[hound.entryId]);
                        if (outcome.score || outcome.value) {
                            return {
                                ...hound,
                                bobJudge1Score: outcome.judge1 || '',
                                bobJudge2Score: outcome.judge2 || '',
                                bobScore: outcome.score || '',
                                bobOutcome: outcome.value || '',
                                bobForfeitOrder: outcome.forfeitOrder || '',
                                tieBreakJudge1Score: '',
                                tieBreakJudge2Score: '',
                                tieBreakScore: '',
                                tieBreakOutcome: '',
                            };
                        }
                        return {
                            ...hound,
                            bobJudge1Score: '',
                            bobJudge2Score: '',
                            bobScore: '',
                            bobOutcome: '',
                            tieBreakJudge1Score: '',
                            tieBreakJudge2Score: '',
                            tieBreakScore: '',
                            tieBreakOutcome: '',
                            bobResult: '',
                            bobWinner: false,
                        };
                    }),
                })),
            });
        }
        if (runoffRows(runoff).some((row) => (
            row.hound.bobResult
            || hasScoreValue(row.hound.bobScore || row.hound.tieBreakScore)
            || row.hound.bobOutcome
            || row.hound.tieBreakOutcome
        ))) {
            return resolveBobRunoffResults(runoff);
        }
        return runoff;
    });
    return before !== JSON.stringify(trial.bobRunoffs);
}

function normalizeFinalPlacementState(trial) {
    if (!trial || !trial.preliminaryDraw || !Array.isArray(trial.preliminaryDraw.groups)) {
        return false;
    }
    const before = JSON.stringify(trial.preliminaryDraw.groups);
    trial.preliminaryDraw = {
        ...trial.preliminaryDraw,
        groups: trial.preliminaryDraw.groups.map((group) => (
            group.finalDraw && Array.isArray(group.finalDraw.courses)
                ? recomputeFinalPlacements(group)
                : group
        )),
    };
    return before !== JSON.stringify(trial.preliminaryDraw.groups);
}

function collectRunoffItems(trial) {
    const groups = sortDrawGroupsForPrint(((trial.preliminaryDraw || {}).groups || []), trial);
    const items = [];
    const activeTieItems = [];
    const resolvedTieItems = [];
    groups.forEach((group) => {
        const activeKeys = new Set();
        tieBreakGroups(group).forEach((tie) => {
            const { start } = tiePlacementRange(tie.label);
            const repeatTie = tieNeedsAnotherRunoff(group, tie);
            activeKeys.add(runoffKeyForTie(tie));
            activeTieItems.push({
                id: `tie:${group.id}:${runoffKeyForTie(tie)}`,
                type: 'tie',
                priority: start === 1 ? 1 : 3,
                groupId: group.id,
                group,
                tie,
                repeatTie,
                title: `${groupTitle(group)} ${tie.label}`,
                subtitle: repeatTie ? `Tie remains after runoff score ${tie.combinedScore}. Draw another runoff.` : `Tie runoff for combined score ${tie.combinedScore}`,
            });
        });
        resolvedTieBreakGroups(group, activeKeys).forEach((tie) => {
            const { start } = tiePlacementRange(tie.label);
            resolvedTieItems.push({
                id: `tie:${group.id}:${runoffKeyForTie(tie)}`,
                type: 'tie',
                priority: start === 1 ? 1 : 3,
                groupId: group.id,
                group,
                tie,
                title: `${groupTitle(group)} ${tie.label}`,
                subtitle: `Runoff decision recorded for combined score ${tie.combinedScore}`,
                resolved: true,
            });
        });
    });

    const combinedItems = combinedTieBobRunoffItems(trial, groups, activeTieItems);
    const existingCombinedItems = existingCombinedTieBobRunoffItems(trial, groups, combinedItems);
    const combinedTieIds = new Set([
        ...combinedItems.map((item) => item.tieItem.id),
        ...existingCombinedItems.map((item) => item.tieItem?.id).filter(Boolean),
    ]);
    const combinedTieAliases = new Set([
        ...combinedItems.map(runoffTieAlias),
        ...existingCombinedItems.map(runoffTieAlias),
    ]);
    activeTieItems
        .filter((item) => !combinedTieIds.has(item.id) && !combinedTieAliases.has(runoffTieAlias(item)))
        .forEach((item) => items.push(item));
    resolvedTieItems
        .filter((item) => !combinedTieIds.has(item.id) && !combinedTieAliases.has(runoffTieAlias(item)))
        .forEach((item) => items.push(item));
    combinedItems.forEach((item) => items.push(item));
    existingCombinedItems.forEach((item) => items.push(item));
    bobRunoffItems(trial, groups, [...combinedItems, ...existingCombinedItems]).forEach((item) => items.push(item));
    bobTieRunoffItems(trial).forEach((item) => items.push(item));
    return orderRunoffItems(trial, items);
}

function runoffTieAlias(item) {
    return `${item.groupId || ''}|${clean(item.tie?.label || '')}`;
}

function tieNeedsAnotherRunoff(group, tie) {
    const runoff = runoffForTie(group, tie);
    if (!runoff) {
        return false;
    }
    const rows = runoffRows(runoff);
    return rows.length >= 2 && rows.every((row) => hasScoreValue(row.hound.tieBreakScore) || row.hound.tieBreakOutcome);
}

function bobTieRunoffItems(trial) {
    return (trial.bobRunoffs || [])
        .filter((runoff) => runoffRows(runoff).some((row) => row.hound.bobResult === 'BOB Tie'))
        .map((runoff) => {
            const rows = runoffRows(runoff)
                .filter((row) => row.hound.bobResult === 'BOB Tie')
                .map((row) => ({
                    kind: 'bob',
                    group: { breed: runoff.breed || row.hound.breed || '', stake: row.hound.bobStake || 'BOB' },
                    hound: {
                        ...row.hound,
                        bobJudge1Score: '',
                        bobJudge2Score: '',
                        bobScore: '',
                        tieBreakJudge1Score: '',
                        tieBreakJudge2Score: '',
                        tieBreakScore: '',
                        tieBreakOutcome: '',
                        bobResult: '',
                        bobWinner: false,
                    },
                }));
            if (rows.length < 2) {
                return null;
            }
            const breed = runoff.breed || rows[0]?.hound?.breed || 'Unknown';
            return {
                id: `bobtie:${runoff.key}`,
                type: 'bobTie',
                priority: 2,
                breed,
                rows,
                title: `${breed} BOB Tie`,
                subtitle: `BOB tie runoff for ${rows.length} hounds`,
            };
        })
        .filter(Boolean);
}

function resolvedTieBreakGroups(group, activeKeys = new Set()) {
    const groups = new Map();
    finalsRowsForGroup(group).forEach((row) => {
        const label = String(row.hound.tieBreakLabel || '');
        if (!label) {
            return;
        }
        const combinedScore = row.hound.tieBreakCombinedScore || row.hound.combinedScore || '';
        const key = runoffKeyForTie({ label, combinedScore });
        if (activeKeys.has(key)) {
            return;
        }
        if (!groups.has(key)) {
            groups.set(key, {
                label,
                combinedScore,
                rows: [],
            });
        }
        groups.get(key).rows.push(row);
    });
    return [...groups.values()].sort((a, b) => tiePlacementRange(a.label).start - tiePlacementRange(b.label).start);
}

function combinedTieBobRunoffItems(trial, groups, tieItems) {
    const byBreed = bobStakeCandidatesByBreed(groups);
    return tieItems
        .filter((item) => isFirstPlaceTie(item.tie))
        .map((tieItem) => {
            const breed = tieItem.group.breed || 'Unknown';
            const stakeCandidates = byBreed.get(clean(breed)) || [];
            const otherStakeWinners = stakeCandidates.filter((candidate) => candidate.group.id !== tieItem.group.id);
            const activeTieRows = tieItem.tie.rows.filter((row) => !row.hound.tieBreakOutcome);
            const totalHounds = activeTieRows.length + otherStakeWinners.length;
            if (activeTieRows.length < 2 || otherStakeWinners.length < 1 || totalHounds > 3) {
                return null;
            }
            return {
                id: `combined:${clean(breed)}:${runoffKeyForTie(tieItem.tie)}`,
                type: 'combinedTieBob',
                priority: 1,
                breed,
                groupId: tieItem.groupId,
                group: tieItem.group,
                tie: tieItem.tie,
                tieItem,
                rows: [
                    ...activeTieRows.map((row) => ({
                        kind: 'tie',
                        group: tieItem.group,
                        hound: {
                            ...row.hound,
                            bobStake: tieItem.group.stake,
                        },
                    })),
                    ...otherStakeWinners.map((candidate) => ({
                        kind: 'bob',
                        group: candidate.group,
                        hound: candidate.hound,
                    })),
                ],
                title: `${breed} 1-2 Tie + BOB`,
                subtitle: `${tieItem.tie.label} and BOB scheduled as one ${totalHounds}-hound course`,
            };
        })
        .filter(Boolean);
}

function existingCombinedTieBobRunoffItems(trial, groups, activeCombinedItems = []) {
    const activeIds = new Set(activeCombinedItems.map((item) => item.id));
    return (trial.bobRunoffs || [])
        .filter((runoff) => String(runoff.key || '').startsWith('combined:') && !activeIds.has(runoff.key))
        .map((runoff) => {
            const hounds = runoffRows(runoff).map((row) => row.hound);
            const tieHounds = hounds.filter((hound) => hound.runoffRole === 'tie' || (hound.tieBreakLabel && hound.tieBreakLabel !== 'BOB'));
            const breed = runoff.breed || hounds[0]?.breed || String(runoff.key || '').split(':')[1] || 'Unknown';
            const group = groups.find((item) => clean(item.breed) === clean(breed) && clean(item.stake) === clean(tieHounds[0]?.bobStake || tieHounds[0]?.stake))
                || groups.find((item) => clean(item.breed) === clean(breed))
                || {};
            const tieLabel = runoff.tieLabel || tieHounds[0]?.tieBreakLabel || runoff.label || '1-2 Tie';
            const tieCombinedScore = runoff.tieCombinedScore || tieHounds[0]?.tieBreakCombinedScore || tieHounds[0]?.combinedScore || '';
            const tie = {
                label: tieLabel,
                combinedScore: tieCombinedScore,
                rows: tieHounds.map((hound) => ({ hound })),
            };
            const stableGroupId = runoff.tieGroupId || group.id || '';
            const tieItemId = runoff.tieItemId || (stableGroupId ? `tie:${stableGroupId}:${runoff.tieKey || runoffKeyForTie(tie)}` : '');
            return {
                id: runoff.key,
                type: 'combinedTieBob',
                priority: 1,
                breed,
                groupId: stableGroupId,
                group,
                tie,
                tieItem: tieItemId ? {
                    id: tieItemId,
                } : null,
                rows: hounds.map((hound) => ({
                    kind: hound.runoffRole || (hound.tieBreakLabel && hound.tieBreakLabel !== 'BOB' ? 'tie' : 'bob'),
                    group: hound.runoffRole === 'tie' ? group : (groups.find((item) => clean(item.breed) === clean(breed) && clean(item.stake) === clean(hound.bobStake)) || group),
                    hound,
                })),
                title: `${breed} ${tie.label} + BOB`,
                subtitle: `${tie.label} and BOB scheduled as one course`,
                resolved: true,
            };
        });
}

function isFirstPlaceTie(tie) {
    return tiePlacementRange(tie.label).start === 1;
}

function bobStakeCandidatesByBreed(groups) {
    const breeds = new Map();
    groups.forEach((group) => {
        if (isQuasiBreedGroup(group)) {
            return;
        }
        const winnerRows = bobStakeWinnerRowsForGroup(group);
        if (winnerRows.length === 0) {
            return;
        }
        const breed = group.breed || 'Unknown';
        const key = clean(breed);
        if (!breeds.has(key)) {
            breeds.set(key, []);
        }
        winnerRows.forEach((winner) => {
            const stake = winner.hound.stake || group.stake || '';
            breeds.get(key).push({
                group: group.mixedStake ? { ...group, stake } : group,
                hound: {
                    ...winner.hound,
                    bobStake: stake,
                },
            });
        });
    });
    return breeds;
}

function bobStakeWinnerRowsForGroup(group) {
    const rows = finalsRowsForGroup(group);
    if (rows.length === 0) {
        return [];
    }
    if (group.mixedStake) {
        return mixedStakeWinnerRows(group, rows);
    }

    const placedWinner = rows.find((row) => row.hound.placement === '1');
    if (placedWinner) {
        return [placedWinner];
    }

    const activeRows = rows.filter((row) => !row.hound.finalOutcome);
    const hasFirstPlaceTie = tieBreakGroups(group).some((tie) => isFirstPlaceTie(tie));
    if (activeRows.length === 1 && !hasFirstPlaceTie) {
        return [activeRows[0]];
    }

    return [];
}

function mixedStakeWinnerRows(group, rows) {
    const byStake = new Map();
    rows.forEach((row) => {
        const key = clean(row.hound.stake || group.stake || '');
        if (!key) {
            return;
        }
        if (!byStake.has(key)) {
            byStake.set(key, []);
        }
        byStake.get(key).push(row);
    });
    return [...byStake.values()]
        .map((stakeRows) => stakeRows.find((row) => row.hound.placement === '1'))
        .filter(Boolean);
}

function bobRunoffItems(trial, groups, combinedItems = []) {
    const breeds = bobStakeCandidatesByBreed(groups);
    const combinedBreeds = new Set(combinedItems.map((item) => clean(item.breed)));
    const firstTiePlaceholders = firstPlaceTiePlaceholdersByBreed(groups);

    return [...breeds.entries()]
        .map(([breedKey, rows]) => {
            const placeholders = firstTiePlaceholders.get(breedKey) || [];
            return [breedKey, [...rows, ...placeholders]];
        })
        .filter(([breedKey, rows]) => rows.length > 1 && !combinedBreeds.has(breedKey))
        .map(([breedKey, rows]) => {
            const breed = rows[0]?.group?.breed || breedKey;
            return {
                id: `bob:${clean(breed)}`,
                type: 'bob',
                priority: 2,
                breed,
                rows,
                title: `${breed} BOB`,
                subtitle: `${rows.length} stake winner${rows.length === 1 ? '' : 's'}`,
            };
        });
}

function firstPlaceTiePlaceholdersByBreed(groups) {
    const placeholders = new Map();
    groups.forEach((group) => {
        if (isQuasiBreedGroup(group)) {
            return;
        }
        const tie = tieBreakGroups(group).find((candidate) => isFirstPlaceTie(candidate));
        if (!tie) {
            return;
        }
        if (resolvedTieWinnerForPlaceholder(group, null, tie.label)) {
            return;
        }
        const breed = group.breed || 'Unknown';
        const key = clean(breed);
        if (!placeholders.has(key)) {
            placeholders.set(key, []);
        }
        placeholders.get(key).push({
            group,
            placeholder: true,
            hound: {
                entryId: `placeholder:${group.id}:${runoffKeyForTie(tie)}`,
                callName: `Winner of ${group.stake} ${tie.label}`,
                registeredName: 'Write in after tie is settled',
                breed,
                stake: group.stake,
                bobStake: group.stake,
                isPlaceholder: true,
                tieBreakLabel: tie.label,
                tieBreakCombinedScore: tie.combinedScore,
            },
        });
    });
    return placeholders;
}

function orderRunoffItems(trial, items) {
    const existing = Array.isArray(trial.runoffOrder) ? trial.runoffOrder : [];
    const ids = new Set(items.map((item) => item.id));
    const known = existing.filter((id) => ids.has(id));
    const byId = new Map(items.map((item) => [item.id, item]));
    const remaining = items
        .filter((item) => !known.includes(item.id))
        .sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
        })
        .map((item) => item.id);
    return [...known, ...remaining].map((id) => byId.get(id)).filter(Boolean);
}

function runoffDisplayRows(trial, item) {
    if (item.type === 'tie') {
        const archivedRunoffs = archivedRunoffsForTie(item.group, item.tie);
        const currentRunoff = runoffForTie(item.group, item.tie);
        const runoff = currentRunoff;
        const rows = runoff ? runoffRows(runoff) : item.tie.rows;
        const historyRows = archivedRunoffs
            .flatMap((runoff, historyIndex) => runoffRows(runoff).map((row) => ({
                entryId: row.hound.entryId,
                code: row.hound.tieBreakCode || row.code || '',
                color: row.hound.tieBreakBlanketColor || '',
                name: row.hound.callName || row.hound.registeredName || 'Unnamed hound',
                stake: item.group.stake,
                reason: `${item.tie.label} Run ${runoff.round || historyIndex + 1}`,
                result: row.hound.tieBreakResolvedPlacement || '',
                outcome: row.hound.tieBreakOutcome || '',
                judge1: row.hound.tieBreakJudge1Score || '',
                judge2: row.hound.tieBreakJudge2Score || '',
                score: row.hound.tieBreakScore || '',
                forfeitOrder: row.hound.tieBreakOutcome === 'forfeit' ? row.hound.tieBreakForfeitOrder : '',
                archived: true,
                historyIndex: runoff.storageIndex ?? historyIndex,
            })));
        const activeRows = rows.map((row) => ({
            entryId: row.hound.entryId,
            code: runoff ? (row.hound.tieBreakCode || row.code || '') : '',
            color: runoff ? (row.hound.tieBreakBlanketColor || '') : '',
            name: row.hound.callName || row.hound.registeredName || 'Unnamed hound',
            stake: item.group.stake,
            reason: archivedRunoffs.length ? `${item.tie.label} Run ${archivedRunoffs.length + 1}` : item.tie.label,
            result: runoffTieResultForEntry(trial, row.hound.entryId, row.hound.tieBreakResolvedPlacement || ''),
            outcome: row.hound.tieBreakOutcome || '',
            judge1: row.hound.tieBreakJudge1Score || '',
            judge2: row.hound.tieBreakJudge2Score || '',
            score: row.hound.tieBreakScore || '',
            forfeitOrder: row.hound.tieBreakOutcome === 'forfeit' ? row.hound.tieBreakForfeitOrder : '',
        }));
        return [...historyRows, ...activeRows];
    }

    if (item.type === 'combinedTieBob') {
        const runoff = bobRunoffForItem(trial, item);
        const rows = runoff ? runoffRows(runoff) : item.rows.map((row) => ({ hound: row.hound, code: '', kind: row.kind }));
        const combinedTieReason = `${String(item.tie.label || '').replace(/\s+Tie$/i, '')}-BOB`;
        return rows.map((row) => {
            const kind = row.kind || row.hound.runoffRole || 'bob';
            const tieResult = runoffTieResultForEntry(trial, row.hound.entryId, row.hound.tieBreakResolvedPlacement || '');
            const bobResult = row.hound.bobResult || bobResultForEntry(trial, row.hound.entryId);
            const combinedTieBobWinner = kind === 'tie' && bobResult === 'BOB';
            return {
                entryId: row.hound.entryId,
                code: runoff ? (row.hound.tieBreakCode || row.hound.bobCode || row.code || '') : '',
                color: runoff ? (row.hound.tieBreakBlanketColor || row.hound.bobBlanketColor || '') : '',
                name: row.hound.callName || row.hound.registeredName || 'Unnamed hound',
                stake: row.hound.bobStake || '',
                reason: kind === 'tie' ? combinedTieReason : 'BOB',
                result: kind === 'tie'
                    ? (combinedTieBobWinner ? `${tieResult || '1'} BOB` : tieResult)
                    : bobResult,
                outcome: kind === 'tie' ? (row.hound.tieBreakOutcome || '') : bobOutcomeForItem(trial, item.id, row.hound.entryId),
                judge1: kind === 'tie' ? (row.hound.tieBreakJudge1Score || '') : bobScoreForItem(trial, item.id, row.hound.entryId).judge1,
                judge2: kind === 'tie' ? (row.hound.tieBreakJudge2Score || '') : bobScoreForItem(trial, item.id, row.hound.entryId).judge2,
                score: kind === 'tie' ? (row.hound.tieBreakScore || '') : bobScoreForItem(trial, item.id, row.hound.entryId).score,
                forfeitOrder: kind === 'tie' && row.hound.tieBreakOutcome === 'forfeit'
                    ? row.hound.tieBreakForfeitOrder
                    : (bobOutcomeForItem(trial, item.id, row.hound.entryId) === 'forfeit' ? bobForfeitOrderForItem(trial, item.id, row.hound.entryId) || row.hound.bobForfeitOrder : ''),
            };
        });
    }

    const runoff = bobRunoffForItem(trial, item);
    const rows = runoff ? runoffRows(runoff) : item.rows.map((row) => ({ hound: row.hound, code: '' }));
    return rows.map((row) => ({
        entryId: row.hound.entryId,
        code: runoff ? (row.hound.tieBreakCode || row.hound.bobCode || row.code || '') : '',
        color: runoff ? (row.hound.tieBreakBlanketColor || row.hound.bobBlanketColor || '') : '',
        name: row.hound.callName || row.hound.registeredName || 'Unnamed hound',
        stake: row.hound.bobStake || '',
        reason: row.hound.isPlaceholder ? 'BOB placeholder' : 'BOB',
        result: row.hound.isPlaceholder ? '' : (row.hound.bobResult || bobResultForEntry(trial, row.hound.entryId)),
        outcome: bobOutcomeForItem(trial, item.id, row.hound.entryId),
        judge1: bobScoreForItem(trial, item.id, row.hound.entryId).judge1,
        judge2: bobScoreForItem(trial, item.id, row.hound.entryId).judge2,
        score: bobScoreForItem(trial, item.id, row.hound.entryId).score,
        forfeitOrder: bobOutcomeForItem(trial, item.id, row.hound.entryId) === 'forfeit' ? bobForfeitOrderForItem(trial, item.id, row.hound.entryId) || row.hound.bobForfeitOrder : '',
        placeholder: Boolean(row.hound.isPlaceholder),
    }));
}

function runoffTieResultForEntry(trial, entryId, fallback = '') {
    const result = finalResolvedPlacementForEntry(trial, entryId);
    if (result && !String(result).includes('Tie')) {
        return result;
    }
    return fallback || '';
}

function finalResolvedPlacementForEntry(trial, entryId) {
    const targetKey = String(entryId || '');
    for (const group of ((trial.preliminaryDraw || {}).groups || [])) {
        for (const row of finalsRowsForGroup(group)) {
            if (String(row.hound.entryId || '') === targetKey) {
                return row.hound.tieBreakResolvedPlacement || row.hound.placement || '';
            }
        }
    }
    return '';
}

function bobRunoffForItem(trial, item) {
    return (trial.bobRunoffs || []).find((runoff) => runoff.key === item.id) || null;
}

function drawnRunoffForItem(trial, item) {
    if (item.type === 'tie') {
        return runoffForTie(item.group, item.tie);
    }
    return bobRunoffForItem(trial, item);
}

function undrawnRunoffItems(trial) {
    return collectRunoffItems(trial).filter((item) => {
        const runoff = drawnRunoffForItem(trial, item);
        return !runoff || !Array.isArray(runoff.courses) || runoff.courses.length === 0;
    });
}

function runoffPrintTrial(trial) {
    const items = collectRunoffItems(trial);
    const groups = [];
    const runPlan = [];
    items.forEach((item, index) => {
        const runoff = drawnRunoffForItem(trial, item);
        if (!runoff || !Array.isArray(runoff.courses) || runoff.courses.length === 0) {
            return;
        }
        const breed = `${index + 1}. ${item.type === 'tie' ? groupTitle(item.group) : (item.breed || item.group?.breed || item.title)}`;
        const judgeBreed = item.group?.breed || item.breed || runoff.breed || '';
        const judgeStake = item.type === 'tie'
            ? (item.group?.stake || runoff.stake || '')
            : '';
        const runoffText = item.type === 'tie'
            ? (item.tie?.label || '')
            : (item.type === 'combinedTieBob' ? (item.tie?.label || '') : '');
        const phase = item.type === 'tie'
            ? 'runoff'
            : (item.type === 'combinedTieBob' || item.type === 'bobTie' || item.type === 'bob' ? 'bob' : 'runoff');
        const judges = judgesForRunoffItem(trial, item);
        groups.push({
            id: item.id,
            breed,
            judgeBreed,
            judgeStake,
            stake: item.type === 'tie' ? `${item.tie.label} Runoff` : (item.type === 'combinedTieBob' ? 'BOB + Tie' : (item.type === 'bobTie' ? 'BOB Tie' : 'BOB')),
            phase,
            runoffText,
            mixedStake: item.type !== 'tie',
            manualNote: item.subtitle,
            courses: runoff.courses.map((course) => ({
                ...course,
                hounds: (course.hounds || []).map((hound) => ({
                    ...hound,
                    blanketColor: hound.tieBreakBlanketColor || hound.bobBlanketColor || '',
                    stake: item.type === 'tie'
                        ? (item.tie.label || 'Runoff')
                        : (hound.isPlaceholder ? 'BOB winner write-in' : (hound.runoffRole === 'tie' ? (item.tie.label || 'Runoff') : 'BOB')),
                })),
            })),
        });
        runPlan.push({
            id: `runoff-plan-${item.id}`,
            breed,
            runOrder: index + 1,
            judge1: judges[0] || '',
            judge2: judges[1] || '',
        });
    });
    return {
        ...trial,
        trialName: `${trial.trialName || 'Trial'} Runoffs`,
        preliminaryDraw: {
            id: `runoff-print-${trial.id || crypto.randomUUID()}`,
            phase: 'runoff',
            createdAt: new Date().toISOString(),
            groups,
        },
        runPlan,
    };
}

function judgesForRunoffItem(trial, item) {
    const breed = item.type === 'tie' ? item.group.breed : item.breed;
    const runPlanRow = (trial.runPlan || []).find((row) => clean(row.breed) === clean(breed));
    return [runPlanRow?.judge1, runPlanRow?.judge2].filter((value) => String(value || '').trim());
}

function bobOutcomeForItem(trial, itemId, entryId) {
    return normalizedBobOutcome(((trial.bobRunoffOutcomes || {})[itemId] || {})[entryId]).value;
}

function bobForfeitOrderForItem(trial, itemId, entryId) {
    return normalizedBobOutcome(((trial.bobRunoffOutcomes || {})[itemId] || {})[entryId]).forfeitOrder;
}

function bobScoreForItem(trial, itemId, entryId) {
    const value = (((trial.bobRunoffOutcomes || {})[itemId] || {})[entryId]);
    const normalized = normalizedBobOutcome(value);
    return {
        judge1: normalized.judge1 || '',
        judge2: normalized.judge2 || '',
        score: normalized.score || '',
    };
}

function moveManualRunoffDrawHound(itemId, entryId, targetCourseId) {
    if (!targetCourseId) {
        return;
    }
    const trial = readForm();
    const item = collectRunoffItems(trial).find((candidate) => candidate.id === itemId);
    if (!item) {
        showMessage(runoffMessage, 'Could not find that runoff draw.', 'warning');
        render();
        return;
    }

    let moved = null;
    if (item.type === 'tie') {
        const key = runoffKeyForTie(item.tie);
        trial.preliminaryDraw = {
            ...trial.preliminaryDraw,
            groups: (trial.preliminaryDraw.groups || []).map((group) => {
                if (group.id !== item.groupId) {
                    return group;
                }
                return {
                    ...group,
                    runoffs: (group.runoffs || []).map((runoff) => {
                        if (runoff.key !== key) {
                            return runoff;
                        }
                        moved = moveHoundWithinDraw(runoff, entryId, targetCourseId, 'runoff', item.title);
                        return moved ? moved.draw : runoff;
                    }),
                };
            }),
        };
    } else {
        trial.bobRunoffs = (trial.bobRunoffs || []).map((runoff) => {
            if (runoff.key !== item.id) {
                return runoff;
            }
            moved = moveHoundWithinDraw(runoff, entryId, targetCourseId, 'runoff', item.title);
            return moved ? resolveBobRunoffResults(moved.draw) : runoff;
        });
    }

    if (!moved) {
        showMessage(runoffMessage, 'Choose a valid runoff course for that hound.', 'warning');
        render();
        return;
    }
    upsertTrial(trial);
    saveTrials();
    showMessage(runoffMessage, `Manual runoff draw edit saved: ${moved.description}`, 'success');
    render();
}

function updateManualRunoffDrawBlanket(itemId, entryId, color) {
    const trial = readForm();
    const item = collectRunoffItems(trial).find((candidate) => candidate.id === itemId);
    if (!item) {
        showMessage(runoffMessage, 'Could not find that runoff draw.', 'warning');
        render();
        return;
    }

    let changed = null;
    if (item.type === 'tie') {
        const key = runoffKeyForTie(item.tie);
        trial.preliminaryDraw = {
            ...trial.preliminaryDraw,
            groups: (trial.preliminaryDraw.groups || []).map((group) => {
                if (group.id !== item.groupId) {
                    return group;
                }
                return {
                    ...group,
                    runoffs: (group.runoffs || []).map((runoff) => {
                        if (runoff.key !== key) {
                            return runoff;
                        }
                        changed = changeHoundBlanketWithinDraw(runoff, entryId, color, 'runoff', item.title);
                        return changed ? changed.draw : runoff;
                    }),
                };
            }),
        };
    } else {
        trial.bobRunoffs = (trial.bobRunoffs || []).map((runoff) => {
            if (runoff.key !== item.id) {
                return runoff;
            }
            changed = changeHoundBlanketWithinDraw(runoff, entryId, color, 'runoff', item.title);
            return changed ? resolveBobRunoffResults(changed.draw) : runoff;
        });
    }

    if (!changed) {
        showMessage(runoffMessage, 'Choose a valid runoff blanket color for that course.', 'warning');
        render();
        return;
    }
    upsertTrial(trial);
    saveTrials();
    showMessage(runoffMessage, `Manual runoff blanket change saved: ${changed.description}`, 'success');
    render();
}

function updateRunoffScore(item, entryId, changes) {
    if (item.type === 'tie') {
        updateTieBreakResult(item.groupId, entryId, item.tie.label, changes, item.tie.combinedScore);
        return;
    }
    if (item.type === 'combinedTieBob' && item.tie.rows.some((row) => row.hound.entryId === entryId)) {
        updateTieBreakResult(item.groupId, entryId, item.tie.label, changes, item.tie.combinedScore);
        return;
    }
    updateBobRunoffScore(item.id, entryId, changes, judgeCountForRunoffItem(readForm(), item));
}

function updateRunoffOutcome(item, entryId, outcome) {
    if (item.type === 'tie') {
        updateTieBreakResult(item.groupId, entryId, item.tie.label, { outcome }, item.tie.combinedScore);
        return;
    }
    if (item.type === 'combinedTieBob' && item.tie.rows.some((row) => row.hound.entryId === entryId)) {
        updateTieBreakResult(item.groupId, entryId, item.tie.label, { outcome }, item.tie.combinedScore);
        return;
    }
    updateBobRunoffOutcome(item.id, entryId, outcome);
}

function updateArchivedTieRunoffScore(item, historyIndex, entryId, changes) {
    const trial = readForm();
    if (item.type !== 'tie' || historyIndex < 0) {
        return;
    }
    const judgeCount = judgeCountForRunoffItem(trial, item);
    let updated = false;
    trial.preliminaryDraw = {
        ...trial.preliminaryDraw,
        groups: (trial.preliminaryDraw.groups || []).map((group) => {
            if (group.id !== item.groupId) {
                return group;
            }
            return {
                ...group,
                runoffHistory: (group.runoffHistory || []).map((runoff, index) => {
                    if (index !== historyIndex || runoff.key !== runoffKeyForTie(item.tie)) {
                        return runoff;
                    }
                    return resolveTieRunoffDrawResults({
                        ...runoff,
                        courses: (runoff.courses || []).map((course) => ({
                            ...course,
                            hounds: (course.hounds || []).map((hound) => {
                                if (hound.entryId !== entryId) {
                                    return hound;
                                }
                                updated = true;
                                return applyTieRunoffScoreChanges(hound, changes, judgeCount);
                            }),
                        })),
                    });
                }),
            };
        }),
    };
    if (!updated) {
        showMessage(runoffMessage, 'Could not find that archived runoff score row.', 'warning');
        render();
        return;
    }
    upsertTrial(trial);
    saveTrials();
    render();
}

function applyTieRunoffScoreChanges(hound, changes, judgeCount) {
    const next = { ...hound };
    if ('judge1' in changes) {
        next.tieBreakJudge1Score = String(changes.judge1 || '').trim();
    }
    if ('judge2' in changes) {
        next.tieBreakJudge2Score = String(changes.judge2 || '').trim();
    }
    if ('outcome' in changes) {
        next.tieBreakOutcome = changes.outcome || '';
        if (next.tieBreakOutcome) {
            next.tieBreakJudge1Score = '';
            next.tieBreakJudge2Score = '';
            next.tieBreakScore = '';
        }
    } else {
        next.tieBreakScore = computedJudgeTotal(next.tieBreakJudge1Score, next.tieBreakJudge2Score, judgeCount);
        if (next.tieBreakScore) {
            next.tieBreakOutcome = '';
        }
    }
    next.tieBreakResolvedPlacement = '';
    return next;
}

function resolveTieRunoffDrawResults(runoff) {
    const rows = runoffRows(runoff).map((row) => row.hound);
    const activeRows = rows.filter((hound) => !hound.tieBreakOutcome);
    const outcomeRows = rows.filter((hound) => hound.tieBreakOutcome);
    const complete = rows.length > 0 && (
        rows.every((hound) => hasScoreValue(hound.tieBreakScore) || hound.tieBreakOutcome)
        || (activeRows.length === 1 && outcomeRows.length > 0)
    );
    if (!complete) {
        return {
            ...runoff,
            courses: (runoff.courses || []).map((course) => ({
                ...course,
                hounds: (course.hounds || []).map((hound) => ({ ...hound, tieBreakResolvedPlacement: '' })),
            })),
        };
    }
    const { start, end } = tiePlacementRange(runoff.label);
    const scored = rows
        .filter((hound) => hasScoreValue(hound.tieBreakScore) && !hound.tieBreakOutcome)
        .map((hound) => ({ entryId: hound.entryId, score: Number(hound.tieBreakScore) }))
        .filter((row) => Number.isFinite(row.score))
        .sort((a, b) => b.score - a.score);
    const placements = new Map();
    if (Number.isFinite(start) && Number.isFinite(end)) {
        if (activeRows.length === 1 && scored.length === 0) {
            placements.set(activeRows[0].entryId, start <= 4 ? String(start) : (start === 5 ? 'NBQ' : ''));
            outcomeRows
                .slice()
                .sort((a, b) => compareTieBreakOutcomeRows({ hound: a }, { hound: b }))
                .forEach((hound, index) => {
                    const placementNumber = start + index + 1;
                    if (placementNumber <= 4) {
                        placements.set(hound.entryId, String(placementNumber));
                    } else if (placementNumber === 5) {
                        placements.set(hound.entryId, 'NBQ');
                    }
                });
        }
        let offset = 0;
        while (offset < scored.length) {
            const score = scored[offset].score;
            const same = scored.slice(offset).filter((row) => row.score === score);
            const place = start + offset;
            if (same.length > 1) {
                same.forEach((row) => placements.set(row.entryId, placementTieLabel(place, Math.min(end, place + same.length - 1))));
            } else if (place <= 4) {
                placements.set(scored[offset].entryId, String(place));
            } else if (place === 5) {
                placements.set(scored[offset].entryId, 'NBQ');
            }
            offset += same.length;
        }
    }
    return {
        ...runoff,
        courses: (runoff.courses || []).map((course) => ({
            ...course,
            hounds: (course.hounds || []).map((hound) => ({
                ...hound,
                tieBreakResolvedPlacement: placements.get(hound.entryId) || scoreOutcomeLabel(hound.tieBreakOutcome) || '',
            })),
        })),
    };
}

function updateBobRunoffScore(itemId, entryId, changes, judgeCount = 2) {
    const trial = readForm();
    const existing = trial.bobRunoffOutcomes || {};
    const existingItemOutcomes = existing[itemId] || {};
    const current = normalizedBobOutcome(existingItemOutcomes[entryId]);
    const next = { ...current };
    if ('judge1' in changes) {
        next.judge1 = String(changes.judge1 || '').trim();
    }
    if ('judge2' in changes) {
        next.judge2 = String(changes.judge2 || '').trim();
    }
    next.score = computedJudgeTotal(next.judge1, next.judge2, judgeCount);
    if (next.score) {
        next.value = '';
        next.forfeitOrder = '';
    }
    trial.bobRunoffOutcomes = {
        ...existing,
        [itemId]: {
            ...existingItemOutcomes,
            [entryId]: next,
        },
    };
    trial.bobRunoffs = (trial.bobRunoffs || []).map((runoff) => {
        if (runoff.key !== itemId) {
            return runoff;
        }
        return resolveBobRunoffResults({
            ...runoff,
            courses: (runoff.courses || []).map((course) => ({
                ...course,
                hounds: (course.hounds || []).map((hound) => hound.entryId === entryId ? {
                    ...hound,
                    bobJudge1Score: next.judge1,
                    bobJudge2Score: next.judge2,
                    bobScore: next.score,
                    bobOutcome: '',
                    bobForfeitOrder: '',
                } : hound),
            })),
        });
    });
    upsertTrial(trial);
    render();
}

function updateBobRunoffOutcome(itemId, entryId, outcome) {
    const trial = readForm();
    const existing = trial.bobRunoffOutcomes || {};
    const existingItemOutcomes = existing[itemId] || {};
    const nextOrder = nextBobForfeitOrder(trial, itemId);
    trial.bobRunoffOutcomes = {
        ...existing,
        [itemId]: {
            ...existingItemOutcomes,
            [entryId]: outcome ? {
                value: outcome,
                forfeitOrder: outcome === 'forfeit'
                    ? (typeof existingItemOutcomes[entryId] === 'object' ? existingItemOutcomes[entryId].forfeitOrder : '') || nextOrder
                    : '',
                judge1: '',
                judge2: '',
                score: '',
            } : '',
        },
    };
    trial.bobRunoffs = (trial.bobRunoffs || []).map((runoff) => {
        if (runoff.key !== itemId) {
            return runoff;
        }
        return resolveBobRunoffResults({
            ...runoff,
            courses: (runoff.courses || []).map((course) => ({
                ...course,
                hounds: (course.hounds || []).map((hound) => hound.entryId === entryId ? {
                    ...hound,
                    bobOutcome: outcome || '',
                    bobForfeitOrder: outcome === 'forfeit' ? (hound.bobForfeitOrder || nextOrder) : '',
                    bobJudge1Score: '',
                    bobJudge2Score: '',
                    bobScore: '',
                } : hound),
            })),
        });
    });
    upsertTrial(trial);
    render();
}

function normalizedBobOutcome(value) {
    if (!value) {
        return { value: '', forfeitOrder: '', judge1: '', judge2: '', score: '' };
    }
    if (typeof value === 'object') {
        return {
            value: value.value || '',
            forfeitOrder: value.forfeitOrder || '',
            judge1: value.judge1 || '',
            judge2: value.judge2 || '',
            score: value.score || '',
        };
    }
    return { value, forfeitOrder: '', judge1: '', judge2: '', score: '' };
}

function resolveBobRunoffResults(runoff) {
    const rows = runoffRows(runoff).map((row) => row.hound);
    const activeRows = rows.filter((hound) => !hound.isPlaceholder && !hound.bobOutcome && !hound.tieBreakOutcome);
    const outcomeRows = rows.filter((hound) => !hound.isPlaceholder && (hound.bobOutcome || hound.tieBreakOutcome));
    const complete = rows.length > 0 && (
        rows.every((hound) => hasScoreValue(hound.bobScore || hound.tieBreakScore) || hound.bobOutcome || hound.tieBreakOutcome || hound.isPlaceholder)
        || (activeRows.length === 1 && outcomeRows.length > 0)
    );
    if (!complete) {
        return {
            ...runoff,
            courses: (runoff.courses || []).map((course) => ({
                ...course,
                hounds: (course.hounds || []).map((hound) => ({
                    ...hound,
                    bobResult: hound.isPlaceholder ? 'BOB placeholder' : '',
                    bobWinner: false,
                })),
            })),
        };
    }

    const scored = rows
        .filter((hound) => !hound.isPlaceholder && hasScoreValue(hound.bobScore || hound.tieBreakScore) && !hound.bobOutcome && !hound.tieBreakOutcome)
        .map((hound) => ({
            entryId: hound.entryId,
            score: Number(hound.bobScore || hound.tieBreakScore),
        }))
        .filter((row) => Number.isFinite(row.score))
        .sort((a, b) => b.score - a.score);
    const topScore = scored[0]?.score;
    const topTied = scored.length
        ? scored.filter((row) => row.score === topScore).map((row) => row.entryId)
        : (activeRows.length === 1 ? [activeRows[0].entryId] : []);

    return {
        ...runoff,
        courses: (runoff.courses || []).map((course) => ({
            ...course,
            hounds: (course.hounds || []).map((hound) => {
                if (hound.isPlaceholder) {
                    return { ...hound, bobResult: 'BOB placeholder', bobWinner: false };
                }
                if (topTied.includes(hound.entryId)) {
                    return {
                        ...hound,
                        bobResult: topTied.length > 1 ? 'BOB Tie' : 'BOB',
                        bobWinner: topTied.length === 1,
                    };
                }
                if (hound.bobOutcome || hound.tieBreakOutcome) {
                    return { ...hound, bobResult: scoreOutcomeLabel(hound.bobOutcome || hound.tieBreakOutcome), bobWinner: false };
                }
                return { ...hound, bobResult: '', bobWinner: false };
            }),
        })),
    };
}

function nextBobForfeitOrder(trial, itemId) {
    const orders = [];
    Object.values((trial.bobRunoffOutcomes || {})[itemId] || {}).forEach((value) => {
        const outcome = normalizedBobOutcome(value);
        if (outcome.value === 'forfeit' && Number(outcome.forfeitOrder)) {
            orders.push(Number(outcome.forfeitOrder));
        }
    });
    (trial.bobRunoffs || [])
        .filter((runoff) => runoff.key === itemId)
        .forEach((runoff) => {
            runoffRows(runoff).forEach((row) => {
                if (row.hound.bobOutcome === 'forfeit' && Number(row.hound.bobForfeitOrder)) {
                    orders.push(Number(row.hound.bobForfeitOrder));
                }
            });
        });
    return orders.length ? Math.max(...orders) + 1 : 1;
}

function createBobRunoffDraw(item, trial) {
    const outcomes = (trial.bobRunoffOutcomes || {})[item.id] || {};
    const hounds = item.rows
        .filter((row) => row.kind === 'tie' || row.placeholder || row.hound.isPlaceholder || !normalizedBobOutcome(outcomes[row.hound.entryId]).value)
        .filter((row) => !row.hound.tieBreakOutcome)
        .map((row) => ({
            ...row.hound,
            runoffRole: row.kind || 'bob',
            tieBreakLabel: row.placeholder || row.hound.isPlaceholder
                ? row.hound.tieBreakLabel
                : (item.type === 'combinedTieBob' && row.kind === 'tie' ? item.tie.label : 'BOB'),
            tieBreakCombinedScore: row.placeholder || row.hound.isPlaceholder
                ? row.hound.tieBreakCombinedScore || ''
                : (item.type === 'combinedTieBob' && row.kind === 'tie' ? item.tie.combinedScore || row.hound.combinedScore || '' : ''),
            tieBreakOutcome: '',
            bobJudge1Score: item.type === 'bobTie' ? '' : row.hound.bobJudge1Score || '',
            bobJudge2Score: item.type === 'bobTie' ? '' : row.hound.bobJudge2Score || '',
            bobScore: item.type === 'bobTie' ? '' : row.hound.bobScore || '',
            bobOutcome: item.type === 'bobTie' ? '' : row.hound.bobOutcome || '',
            tieBreakJudge1Score: item.type === 'bobTie' ? '' : row.hound.tieBreakJudge1Score || '',
            tieBreakJudge2Score: item.type === 'bobTie' ? '' : row.hound.tieBreakJudge2Score || '',
            tieBreakScore: item.type === 'bobTie' ? '' : row.hound.tieBreakScore || '',
            bobStake: row.group.stake,
        }));
    if (hounds.length < 2) {
        return null;
    }
    const sizes = courseSizesForEntryCount(hounds.length);
    const courses = sizes.map((size, index) => ({
        id: crypto.randomUUID(),
        number: index + 1,
        capacity: size,
        hounds: [],
    }));
    secureShuffle(hounds).forEach((hound) => {
        chooseCourseForEntry(courses, hound).hounds.push(hound);
    });
    courses.forEach((course) => {
        const colors = blanketColorsForCourseSize(course.hounds.length);
        course.hounds = secureShuffle(course.hounds).map((hound, index) => ({
            ...hound,
            tieBreakCourse: course.number,
            tieBreakBlanketColor: colors[index],
            tieBreakCode: `${course.number}${blanketCode(colors[index])}`,
            bobCourse: course.number,
            bobBlanketColor: colors[index],
            bobCode: `${course.number}${blanketCode(colors[index])}`,
            drawPosition: index + 1,
        }));
        delete course.capacity;
    });
    return {
        id: crypto.randomUUID(),
        key: item.id,
        label: item.type === 'combinedTieBob' ? item.tie.label : 'BOB',
        breed: item.breed,
        tieGroupId: item.type === 'combinedTieBob' ? item.groupId || '' : '',
        tieLabel: item.type === 'combinedTieBob' ? item.tie.label || '' : '',
        tieCombinedScore: item.type === 'combinedTieBob' ? item.tie.combinedScore || '' : '',
        tieKey: item.type === 'combinedTieBob' ? runoffKeyForTie(item.tie) : '',
        tieItemId: item.type === 'combinedTieBob' ? item.tieItem?.id || '' : '',
        createdAt: new Date().toISOString(),
        courses,
    };
}

function redrawAllRunoffs() {
    const trial = readForm();
    const items = collectRunoffItems(trial);
    if (items.length === 0) {
        showMessage(runoffMessage, 'No runoffs or BOB runs are ready to draw.', 'warning');
        return;
    }

    const tieItems = items.filter((item) => item.type === 'tie');
    const bobItems = items.filter((item) => item.type === 'bob' || item.type === 'combinedTieBob' || item.type === 'bobTie');
    const tieDraws = new Map(tieItems
        .map((item) => [item.id, createRunoffDrawFromRows(item.tie.rows, item.tie)])
        .filter(([, runoff]) => runoff));
    const bobDraws = bobItems.map((item) => createBobRunoffDraw(item, trial)).filter(Boolean);
    const replaceBobKeys = new Set(bobItems.flatMap((item) => [
        item.id,
        item.type === 'combinedTieBob' ? `bob:${clean(item.breed)}` : '',
    ].filter(Boolean)));

    trial.preliminaryDraw = {
        ...trial.preliminaryDraw,
        groups: (trial.preliminaryDraw.groups || []).map((group) => {
            const groupTieItems = tieItems.filter((item) => item.groupId === group.id);
            if (groupTieItems.length === 0) {
                return group;
            }
            const replaceKeys = new Set(groupTieItems.map((item) => runoffKeyForTie(item.tie)));
            return {
                ...group,
                runoffs: [
                    ...(group.runoffs || []).filter((runoff) => !replaceKeys.has(runoff.key)),
                    ...groupTieItems.map((item) => tieDraws.get(item.id)).filter(Boolean),
                ],
            };
        }),
    };
    trial.bobRunoffs = [
        ...(trial.bobRunoffs || []).filter((runoff) => !replaceBobKeys.has(runoff.key)),
        ...bobDraws,
    ];
    trial.runoffOrder = items.map((item) => item.id);
    upsertTrial(trial);
    showMessage(runoffMessage, `Redrew ${tieDraws.size + bobDraws.length} runoff run${tieDraws.size + bobDraws.length === 1 ? '' : 's'}.`, 'success');
    render();
}

function drawRunoffsForBreed(breed) {
    const trial = readForm();
    const allItems = collectRunoffItems(trial);
    const items = allItems.filter((item) => clean(item.breed || item.group?.breed || '') === clean(breed));
    if (items.length === 0) {
        return 0;
    }

    const tieItems = items.filter((item) => item.type === 'tie');
    const bobItems = items.filter((item) => item.type === 'bob' || item.type === 'combinedTieBob' || item.type === 'bobTie');
    const tieDraws = new Map(tieItems
        .map((item) => [item.id, createRunoffDrawFromRows(item.tie.rows, item.tie)])
        .filter(([, runoff]) => runoff));
    const bobDraws = bobItems.map((item) => createBobRunoffDraw(item, trial)).filter(Boolean);
    const replaceBobKeys = new Set(bobItems.flatMap((item) => [
        item.id,
        item.type === 'combinedTieBob' ? `bob:${clean(item.breed)}` : '',
    ].filter(Boolean)));

    trial.preliminaryDraw = {
        ...trial.preliminaryDraw,
        groups: (trial.preliminaryDraw.groups || []).map((group) => {
            const groupTieItems = tieItems.filter((item) => item.groupId === group.id);
            if (groupTieItems.length === 0) {
                return group;
            }
            const replaceKeys = new Set(groupTieItems.map((item) => runoffKeyForTie(item.tie)));
            return {
                ...group,
                runoffs: [
                    ...(group.runoffs || []).filter((runoff) => !replaceKeys.has(runoff.key)),
                    ...groupTieItems.map((item) => tieDraws.get(item.id)).filter(Boolean),
                ],
            };
        }),
    };
    trial.bobRunoffs = [
        ...(trial.bobRunoffs || []).filter((runoff) => !replaceBobKeys.has(runoff.key)),
        ...bobDraws,
    ];
    const orderedIds = new Set([...(trial.runoffOrder || []), ...items.map((item) => item.id)]);
    trial.runoffOrder = [...orderedIds];
    upsertTrial(trial);
    saveTrials();
    return tieDraws.size + bobDraws.length;
}

function drawSingleRunoff(itemId) {
    const trial = readForm();
    const items = collectRunoffItems(trial);
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) {
        showMessage(runoffMessage, 'Could not find that runoff to draw.', 'warning');
        return;
    }

    if (item.type === 'tie') {
        const runoff = createRunoffDrawFromRows(item.tie.rows, item.tie);
        if (!runoff) {
            showMessage(runoffMessage, 'That tie does not have enough active hounds to draw.', 'warning');
            return;
        }
        trial.preliminaryDraw = {
            ...trial.preliminaryDraw,
            groups: (trial.preliminaryDraw.groups || []).map((group) => {
                if (group.id !== item.groupId) {
                    return group;
                }
                const replaceKey = runoffKeyForTie(item.tie);
                const archivedGroup = runoffForTie(group, item.tie) ? archiveCurrentRunoffForTie(group, item.tie) : group;
                return {
                    ...archivedGroup,
                    runoffs: [
                        ...(archivedGroup.runoffs || []).filter((existing) => existing.key !== replaceKey),
                        runoff,
                    ],
                };
            }),
        };
    } else {
        const runoff = createBobRunoffDraw(item, trial);
        if (!runoff) {
            showMessage(runoffMessage, 'That runoff does not have enough active hounds to draw.', 'warning');
            return;
        }
        const replaceKeys = new Set([
            item.id,
            item.type === 'combinedTieBob' ? `bob:${clean(item.breed)}` : '',
        ].filter(Boolean));
        trial.bobRunoffs = [
            ...(trial.bobRunoffs || []).filter((existing) => !replaceKeys.has(existing.key)),
            runoff,
        ];
    }

    trial.runoffOrder = items.map((candidate) => candidate.id);
    selectedRunoffItemId = item.id;
    upsertTrial(trial);
    showMessage(runoffMessage, `Drew ${item.title}.`, 'success');
    render();
}

function renderSelectedRunoffLabel(items = []) {
    const label = document.getElementById('selectedRunoffLabel');
    if (!label) {
        return;
    }
    const item = items.find((row) => row.id === selectedRunoffItemId);
    label.textContent = item ? `Selected: ${item.title}` : 'No runoff selected';
}

function moveRunoffItem(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) {
        return;
    }
    const trial = readForm();
    const items = collectRunoffItems(trial);
    const order = items.map((item) => item.id);
    const from = order.indexOf(sourceId);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0) {
        return;
    }
    order.splice(from, 1);
    order.splice(to, 0, sourceId);
    selectedRunoffItemId = sourceId;
    trial.runoffOrder = order;
    upsertTrial(trial);
    render();
}

function moveSelectedRunoffItem(step) {
    if (!selectedRunoffItemId) {
        showMessage(runoffMessage, 'Select a runoff row first.', 'warning');
        return;
    }
    const trial = readForm();
    const items = collectRunoffItems(trial);
    const order = items.map((item) => item.id);
    const index = order.indexOf(selectedRunoffItemId);
    const next = index + step;
    if (index < 0 || next < 0 || next >= order.length) {
        return;
    }
    [order[index], order[next]] = [order[next], order[index]];
    trial.runoffOrder = order;
    upsertTrial(trial);
    render();
}

async function buildFinalsDrawForGroup(groupId) {
    const trial = readForm();
    if (trial.scorebook && trial.scorebook.finalsLocked) {
        showMessage(document.getElementById('scoringMessage'), 'Finals are locked. Unlock finals before drawing or redrawing a finals stake.', 'warning');
        render();
        return;
    }
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups)) {
        showMessage(document.getElementById('scoringMessage'), 'Build the preliminary draw first.', 'warning');
        return;
    }

    const group = draw.groups.find((item) => item.id === groupId);
    if (!group) {
        showMessage(document.getElementById('scoringMessage'), 'Could not find that breed/stake.', 'warning');
        return;
    }

    const rows = groupScoreRows(group);
    const missing = prelimScoreRequirementsForGroup(group, trial).filter((row) => !row.complete);
    if (missing.length > 0) {
        showMessage(document.getElementById('scoringMessage'), `${missing.length} prelim row${missing.length === 1 ? '' : 's'} still need required judge score${missing.length === 1 ? '' : 's'} or an outcome before finals draw.`, 'warning');
        return;
    }
    if (group.finalDraw) {
        const replace = await showTrialConfirm({
            title: 'Replace Finals Draw',
            eyebrow: groupTitle(group),
            message: 'A finals draw already exists. Only rebuild it if something changed. Replace the existing finals draw?',
            primaryText: 'Replace Draw',
        });
        if (!replace) {
            return;
        }
    }

    const eligible = rows
        .filter((row) => hasScoreValue(row.score) && !row.outcome)
        .map((row) => row.hound);

    if (eligible.length === 0) {
        showMessage(document.getElementById('scoringMessage'), 'No eligible hounds remain for finals in this stake.', 'warning');
        return;
    }

    const finalDraw = buildFinalDrawFromHounds(eligible, isQuasiBreedGroup(group));
    trial.preliminaryDraw = {
        ...draw,
        groups: draw.groups.map((item) => item.id === groupId ? {
            ...item,
            finalDraw,
        } : item),
    };
    upsertTrial(trial);
    saveTrials();
    showMessage(document.getElementById('scoringMessage'), `Finals draw built for ${groupTitle(group)}.`, 'success');
    render();
}

async function buildFinalsDrawForBreed(breed) {
    const trial = readForm();
    if (trial.scorebook && trial.scorebook.finalsLocked) {
        showMessage(document.getElementById('scoringMessage'), 'Finals are locked. Unlock finals before drawing or redrawing finals for a breed.', 'warning');
        render();
        return;
    }
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups)) {
        showMessage(document.getElementById('scoringMessage'), 'Build the preliminary draw first.', 'warning');
        return;
    }

    const groups = draw.groups.filter((group) => clean(group.breed) === clean(breed));
    if (groups.length === 0) {
        showMessage(document.getElementById('scoringMessage'), 'Could not find that breed in the draw.', 'warning');
        return;
    }

    const incomplete = groups
        .map((group) => ({
            group,
            missing: prelimScoreRequirementsForGroup(group, trial).filter((row) => !row.complete).length,
        }))
        .filter((row) => row.missing > 0);

    if (incomplete.length > 0) {
        const label = incomplete
            .map((row) => `${row.group.stake}: ${row.missing}`)
            .join(', ');
        showMessage(document.getElementById('scoringMessage'), `Finish scoring this breed before building finals. Missing rows: ${label}.`, 'warning');
        return;
    }
    const existingFinals = groups.filter((group) => group.finalDraw).length;
    if (existingFinals > 0) {
        const replace = await showTrialConfirm({
            title: 'Replace Finals Draws',
            eyebrow: breed,
            message: `${existingFinals} finals draw${existingFinals === 1 ? '' : 's'} already exist for ${breed}. Only rebuild if something changed. Replace existing finals draws for this breed?`,
            primaryText: 'Replace Draws',
        });
        if (!replace) {
            return;
        }
    }

    let builtCount = 0;
    const updatedGroups = draw.groups.map((group) => {
        if (clean(group.breed) !== clean(breed)) {
            return group;
        }

        const eligible = groupScoreRows(group)
            .filter((row) => hasScoreValue(row.score) && !row.outcome)
            .map((row) => row.hound);
        if (eligible.length === 0) {
            return group;
        }

        builtCount += 1;
        return {
            ...group,
            finalDraw: buildFinalDrawFromHounds(eligible, isQuasiBreedGroup(group)),
        };
    });

    if (builtCount === 0) {
        showMessage(document.getElementById('scoringMessage'), 'No eligible hounds remain for finals in that breed.', 'warning');
        return;
    }

    trial.preliminaryDraw = {
        ...draw,
        groups: updatedGroups,
    };
    upsertTrial(trial);
    saveTrials();
    showMessage(document.getElementById('scoringMessage'), `Finals draw built for ${breed}: ${builtCount} stake${builtCount === 1 ? '' : 's'}.`, 'success');
    render();
}

function buildFinalDrawFromHounds(hounds, fillCourses = false) {
    const sizes = courseSizesForEntryCount(hounds.length, fillCourses);
    const courses = sizes.map((size, index) => ({
        id: crypto.randomUUID(),
        number: index + 1,
        capacity: size,
        hounds: [],
    }));

    const orderedHounds = fillCourses ? orderEntriesForSequentialSoloDraw(hounds) : orderEntriesForDraw(hounds);
    if (fillCourses) {
        assignEntriesSequentiallyToCourses(courses, orderedHounds);
    } else {
        orderedHounds.forEach((hound) => {
            chooseCourseForEntry(courses, hound).hounds.push(hound);
        });
    }

    courses.forEach((course) => {
        const colors = blanketColorsForCourseSize(course.hounds.length);
        const orderedCourseHounds = fillCourses ? course.hounds : secureShuffle(course.hounds);
        course.hounds = orderedCourseHounds.map((hound, index) => ({
            ...hound,
            blanketColor: colors[index],
            finalBlanketColor: colors[index],
            drawPosition: index + 1,
            finalCourse: course.number,
            finalCode: `${course.number}${blanketCode(colors[index])}`,
        }));
        delete course.capacity;
    });

    return {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        courses,
    };
}

function moveManualFinalDrawHound(groupId, entryId, targetCourseId) {
    if (!targetCourseId) {
        return;
    }
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups)) {
        return;
    }
    let moved = null;
    trial.preliminaryDraw = {
        ...draw,
        groups: draw.groups.map((group) => {
            if (group.id !== groupId || !group.finalDraw) {
                return group;
            }
            moved = moveHoundWithinDraw(group.finalDraw, entryId, targetCourseId, 'final', groupTitle(group));
            if (!moved) {
                return group;
            }
            return recomputeFinalPlacements({
                ...group,
                finalDraw: moved.draw,
            });
        }),
    };
    if (!moved) {
        showMessage(document.getElementById('scoringMessage'), 'Choose a valid finals course for that hound.', 'warning');
        render();
        return;
    }
    upsertTrial(trial);
    saveTrials();
    showMessage(document.getElementById('scoringMessage'), `Manual finals draw edit saved: ${moved.description}`, 'success');
    render();
}

function updateManualFinalDrawBlanket(groupId, entryId, color) {
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups)) {
        return;
    }
    let changed = null;
    trial.preliminaryDraw = {
        ...draw,
        groups: draw.groups.map((group) => {
            if (group.id !== groupId || !group.finalDraw) {
                return group;
            }
            changed = changeHoundBlanketWithinDraw(group.finalDraw, entryId, color, 'final', groupTitle(group));
            if (!changed) {
                return group;
            }
            return recomputeFinalPlacements({
                ...group,
                finalDraw: changed.draw,
            });
        }),
    };
    if (!changed) {
        showMessage(document.getElementById('scoringMessage'), 'Choose a valid finals blanket color for that course.', 'warning');
        render();
        return;
    }
    upsertTrial(trial);
    saveTrials();
    showMessage(document.getElementById('scoringMessage'), `Manual finals blanket change saved: ${changed.description}`, 'success');
    render();
}

function blanketCode(color) {
    const normalized = clean(color);
    if (normalized === 'YELLOW') {
        return 'Y';
    }
    if (normalized === 'PINK') {
        return 'P';
    }
    if (normalized === 'BLUE') {
        return 'B';
    }
    return normalized.slice(0, 1);
}

function printScoreReport({ groupId = '', breed = '' } = {}) {
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups)) {
        showMessage(document.getElementById('scoringMessage'), 'Build the preliminary draw before printing score reports.', 'warning');
        return;
    }

    let groups = sortDrawGroupsForPrint(draw.groups, trial);
    if (groupId) {
        groups = groups.filter((group) => group.id === groupId);
    } else if (breed) {
        groups = groups.filter((group) => clean(group.breed) === clean(breed));
    }

    if (groups.length === 0) {
        showMessage(document.getElementById('scoringMessage'), 'No score rows found for that report.', 'warning');
        return;
    }

    renderScoreReportPrint(trial, groups, groupId ? 'Stake Score Report' : 'Breed Score Report');
    printSection('scoreReportPrint');
}

function printRibbonReport() {
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        showMessage(mainResultsMessage || document.getElementById('scoringMessage'), 'Build the preliminary draw before printing the ribbon report.', 'warning');
        return;
    }

    const groups = sortRibbonReportGroups(ribbonReportGroupsForPrint(draw.groups), trial, document.getElementById('ribbonReportSort')?.value || 'runningOrder');
    if (groups.length === 0) {
        showMessage(mainResultsMessage || document.getElementById('scoringMessage'), 'No completed results are available for the ribbon report yet.', 'warning');
        return;
    }

    renderRibbonReportPrint(trial, groups, document.getElementById('ribbonPlacementOrder')?.value || 'nbqFirst');
    printSection('scoreReportPrint');
    markTrialGuidePrinted('ribbonReport');
}

async function printAsfaRecordSheet({ groupId = '', breed = '', combineMixedPosting = false } = {}) {
    const message = document.getElementById('scoringMessage');
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        showMessage(message, 'Build the preliminary draw before printing the ASFA record sheet.', 'warning');
        return;
    }

    if (clean(trial.association || 'ASFA') !== 'ASFA') {
        showMessage(message, 'The official record sheet button is set up for ASFA trials first.', 'warning');
        return;
    }

    if (!isLocalServerMode()) {
        showMessage(message, 'Official ASFA record sheets require SQLite/server mode. Start the app with start_field_trial_secretary.ps1.', 'warning');
        return;
    }

    const pdfWindow = window.open('', '_blank');
    try {
        await saveToSQLite();
        const response = await fetch('/api/asfa-record-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial, groupId, breed, combineMixedPosting, layout: getAsfaRecordLayout(), entryLayout: getAsfaEntryLayout(), lciEntryLayout: getAsfaLciEntryLayout() }),
        });

        if (!response.ok) {
            let errorMessage = 'ASFA record sheet could not be created.';
            try {
                const payload = await response.json();
                errorMessage = payload.error || errorMessage;
            } catch {
                // Keep the generic message when the server did not return JSON.
            }
            throw new Error(errorMessage);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
            pdfWindow.location = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.click();
        }
        showMessage(message, 'ASFA record sheet PDF created.', 'success');
        markTrialGuidePrinted('stakeBreedSheets');
    } catch (error) {
        if (pdfWindow) {
            pdfWindow.close();
        }
        showMessage(message, error.message || 'ASFA record sheet could not be created.', 'warning');
    }
}

async function printAsfaRecordPacket() {
    const message = wrapUpMessage || mainResultsMessage || document.getElementById('scoringMessage');
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        showMessage(message, 'Build the preliminary draw before printing the ASFA record packet.', 'warning');
        return;
    }
    if (clean(trial.association || 'ASFA') !== 'ASFA') {
        showMessage(message, 'The full record packet is set up for ASFA trials first.', 'warning');
        return;
    }
    const printed = await openTrialPdf('/api/asfa-record-packet', {
        trial,
        layout: getAsfaRecordLayout(),
        entryLayout: getAsfaEntryLayout(),
        lciEntryLayout: getAsfaLciEntryLayout(),
        secretaryLayout: getAsfaSecretaryLayout(),
    }, message, 'ASFA record packet PDF created.', 'ASFA record packet could not be created.');
    if (printed) {
        markTrialGuidePrinted('asfaRecordPacket');
    }
}

async function printAsfaEntryForms() {
    const message = wrapUpMessage || officialFormsMessage || mainResultsMessage || document.getElementById('scoringMessage');
    const trial = readForm();
    if (clean(trial.association || 'ASFA') !== 'ASFA') {
        showMessage(message, 'The first-time entry forms are set up for ASFA trials first.', 'warning');
        return;
    }
    const count = (trial.entries || []).filter((entry) => entry.firstTime).length;
    if (count === 0) {
        showMessage(message, 'No first-time ASFA entries are marked for this trial.', 'warning');
        return;
    }
    await openTrialPdf('/api/asfa-entry-forms', {
        trial,
        layout: getAsfaEntryLayout(),
        lciLayout: getAsfaLciEntryLayout(),
    }, message, `Created ${count} first-time ASFA entry form${count === 1 ? '' : 's'}.`, 'ASFA first-time entry forms could not be created.');
}

async function printAsfaSecretaryReport() {
    const message = wrapUpSecretaryMessage || wrapUpMessage || mainResultsMessage || document.getElementById('scoringMessage');
    const trial = readForm();
    if (clean(trial.association || 'ASFA') !== 'ASFA') {
        showMessage(message, 'The secretary report button is set up for ASFA trials first.', 'warning');
        return;
    }
    const printed = await openTrialPdf('/api/asfa-secretary-report', {
        trial,
        layout: getAsfaSecretaryLayout(),
    }, message, 'ASFA secretary report PDF created.', 'ASFA secretary report could not be created.');
    if (printed) {
        markTrialGuidePrinted('asfaSecretaryReport');
    }
}

function markPaperworkSubmitted() {
    const trial = readForm();
    if (!trial || !trial.id) {
        showMessage(wrapUpMessage || wrapUpSecretaryMessage, 'Select a trial before marking paperwork submitted.', 'warning');
        return;
    }
    trial.paperworkSubmittedAt = new Date().toISOString();
    upsertTrial(trial);
    saveTrials();
    showMessage(wrapUpMessage || wrapUpSecretaryMessage, 'Paperwork marked submitted to records@asfa.org.', 'success');
    render();
}

async function createFinalTrialArchive() {
    const trial = readForm();
    if (!trial || !trial.id) {
        showMessage(archiveTrialMessage, 'Select a trial before creating a final archive.', 'warning');
        return;
    }
    if (trial.archivedAt) {
        const createAnother = await showTrialConfirm({
            title: 'Create Another Archive',
            eyebrow: 'Archived Trial',
            message: 'This trial is already archived. Create another final archive package?',
            primaryText: 'Create Archive',
        });
        if (!createAnother) {
            return;
        }
    }
    if (!isLocalServerMode()) {
        showMessage(archiveTrialMessage, 'Final archive packages require SQLite/server mode. Start the app with start_field_trial_secretary.ps1.', 'warning');
        return;
    }
    const proceed = await showTrialConfirm({
        title: 'Create Final Archive',
        eyebrow: trial.trialName || 'Trial Archive',
        message: `Create a final archive package for ${trial.trialName || 'this trial'} and lock it against edits?`,
        primaryText: 'Create Archive',
    });
    if (!proceed) {
        return;
    }

    try {
        await saveToSQLite();
        const response = await fetch('/api/trial-archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trial,
                state: makeBackupSnapshot(),
                recordLayout: getAsfaRecordLayout(),
                entryLayout: getAsfaEntryLayout(),
                lciEntryLayout: getAsfaLciEntryLayout(),
                secretaryLayout: getAsfaSecretaryLayout(),
            }),
        });
        if (!response.ok) {
            let errorMessage = 'Final archive package could not be created.';
            try {
                const body = await response.json();
                errorMessage = body.error || errorMessage;
            } catch {
                // Keep the generic failure message when the response is a file/HTML.
            }
            throw new Error(errorMessage);
        }

        const blob = await response.blob();
        const archivePath = response.headers.get('X-Archive-Path') || '';
        const filename = filenameFromContentDisposition(response.headers.get('Content-Disposition')) || `${safeDownloadName(trial.trialName || 'field-trial')}-final-archive.zip`;
        downloadBlob(blob, filename);

        const archivedTrial = {
            ...trial,
            archivedAt: new Date().toISOString(),
            archivePackageName: filename,
            archivePackagePath: archivePath,
            archiveUnlockedAt: '',
        };
        upsertTrial(archivedTrial);
        if (localStorage.getItem(activeKey) === archivedTrial.id) {
            localStorage.removeItem(activeKey);
            setActiveTrialLocked(false);
        }
        selectedTrialId = archivedTrial.id;
        await saveToSQLite();
        showMessage(archiveTrialMessage, `Final archive created and trial locked: ${filename}`, 'success');
        render();
    } catch (error) {
        showMessage(archiveTrialMessage, error.message || 'Final archive package could not be created.', 'warning');
    }
}

async function unlockArchivedTrial() {
    const trial = getSelectedTrial();
    if (!trial) {
        showMessage(archiveTrialMessage, 'Select an archived trial first.', 'warning');
        return;
    }
    if (!trial.archivedAt) {
        showMessage(archiveTrialMessage, 'This trial is not archived.', 'warning');
        return;
    }
    const unlock = await showTrialConfirm({
        title: 'Unlock Archived Trial',
        eyebrow: trial.trialName || 'Archived Trial',
        message: `Unlock ${trial.trialName || 'this trial'} for corrections? It will become editable again.`,
        primaryText: 'Unlock Trial',
    });
    if (!unlock) {
        return;
    }
    const unlocked = {
        ...trial,
        archivedAt: '',
        archiveUnlockedAt: new Date().toISOString(),
    };
    upsertTrial(unlocked);
    showMessage(archiveTrialMessage, 'Archived trial unlocked for corrections.', 'success');
    render();
}

function filenameFromContentDisposition(value) {
    const match = String(value || '').match(/filename="?([^";]+)"?/i);
    return match ? match[1] : '';
}

function safeDownloadName(value) {
    return String(value || 'download').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'download';
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

async function openTrialPdf(endpoint, payload, messageElement, successMessage, failureMessage) {
    if (!isLocalServerMode()) {
        showMessage(messageElement, 'Official PDF reports require SQLite/server mode. Start the app with start_field_trial_secretary.ps1.', 'warning');
        return false;
    }
    const pdfWindow = window.open('', '_blank');
    try {
        await saveToSQLite();
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            let errorMessage = failureMessage;
            try {
                const body = await response.json();
                errorMessage = body.error || errorMessage;
            } catch {
                // Keep the supplied failure message.
            }
            throw new Error(errorMessage);
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
            pdfWindow.location = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.click();
        }
        showMessage(messageElement, successMessage, 'success');
        return true;
    } catch (error) {
        if (pdfWindow) {
            pdfWindow.close();
        }
        showMessage(messageElement, error.message || failureMessage, 'warning');
        return false;
    }
}

async function previewAsfaRecordAlignment() {
    const message = officialFormsMessage;
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        showMessage(message, 'Build a preliminary draw before previewing ASFA record alignment.', 'warning');
        return;
    }
    const group = sortDrawGroupsForPrint(draw.groups, trial)[0];
    if (!group) {
        showMessage(message, 'No ASFA record sheet rows are available to preview.', 'warning');
        return;
    }
    if (!isLocalServerMode()) {
        showMessage(message, 'ASFA record sheet preview requires SQLite/server mode.', 'warning');
        return;
    }

    try {
        await saveToSQLite();
        const response = await fetch('/api/asfa-record-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial, groupId: group.id, layout: getAsfaRecordLayout() }),
        });
        if (!response.ok) {
            let errorMessage = 'ASFA record sheet preview could not be created.';
            try {
                const payload = await response.json();
                errorMessage = payload.error || errorMessage;
            } catch {
                // Keep generic message.
            }
            throw new Error(errorMessage);
        }
        const blob = await response.blob();
        const frame = document.getElementById('asfaRecordAlignmentPreview');
        if (frame) {
            frame.src = URL.createObjectURL(blob);
        }
        showMessage(message, `Previewing ${groupTitle(group)}. Adjust values and preview again.`, 'success');
    } catch (error) {
        showMessage(message, error.message || 'ASFA record sheet preview could not be created.', 'warning');
    }
}

function resetAsfaRecordAlignment() {
    formAlignment.asfaRecordSheet = { ...defaultFormAlignment.asfaRecordSheet };
    saveFormAlignment();
    renderAsfaRecordAlignmentTool(readForm());
    showMessage(officialFormsMessage, 'ASFA record sheet alignment reset to defaults.', 'success');
}

async function previewAsfaEntryAlignment() {
    const message = officialFormsMessage;
    const trial = readForm();
    const firstEntry = (trial.entries || []).find((entry) => entry.firstTime);
    if (!firstEntry) {
        showMessage(message, 'Mark at least one trial entry as first-time before previewing the ASFA entry form.', 'warning');
        return;
    }
    if (!isLocalServerMode()) {
        showMessage(message, 'ASFA entry form preview requires SQLite/server mode.', 'warning');
        return;
    }
    try {
        await saveToSQLite();
        const response = await fetch('/api/asfa-entry-forms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial, entryId: firstEntry.id, layout: getAsfaEntryLayout() }),
        });
        if (!response.ok) {
            let errorMessage = 'ASFA entry form preview could not be created.';
            try {
                const payload = await response.json();
                errorMessage = payload.error || errorMessage;
            } catch {
                // Keep generic message.
            }
            throw new Error(errorMessage);
        }
        const blob = await response.blob();
        const frame = document.getElementById('asfaEntryAlignmentPreview');
        if (frame) {
            frame.src = URL.createObjectURL(blob);
        }
        showMessage(message, `Previewing first-time entry form for ${firstEntry.callName || firstEntry.registeredName || 'hound'}.`, 'success');
    } catch (error) {
        showMessage(message, error.message || 'ASFA entry form preview could not be created.', 'warning');
    }
}

function resetAsfaEntryAlignment() {
    formAlignment.asfaEntryForm = { ...defaultFormAlignment.asfaEntryForm };
    saveFormAlignment();
    renderAsfaEntryAlignmentTool(readForm());
    showMessage(officialFormsMessage, 'ASFA entry form alignment reset to defaults.', 'success');
}

async function previewAsfaLciEntryAlignment() {
    const message = officialFormsMessage;
    const trial = readForm();
    const firstEntry = (trial.entries || []).find((entry) => entry.firstTime && isLciEntry(entry));
    if (!firstEntry) {
        showMessage(message, 'Mark at least one LCI trial entry as first-time before previewing the ASFA LCI entry form.', 'warning');
        return;
    }
    if (!isLocalServerMode()) {
        showMessage(message, 'ASFA LCI entry form preview requires SQLite/server mode.', 'warning');
        return;
    }
    try {
        await saveToSQLite();
        const response = await fetch('/api/asfa-entry-forms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial, entryId: firstEntry.id, layout: getAsfaEntryLayout(), lciLayout: getAsfaLciEntryLayout() }),
        });
        if (!response.ok) {
            let errorMessage = 'ASFA LCI entry form preview could not be created.';
            try {
                const payload = await response.json();
                errorMessage = payload.error || errorMessage;
            } catch {
                // Keep generic message.
            }
            throw new Error(errorMessage);
        }
        const blob = await response.blob();
        const frame = document.getElementById('asfaLciEntryAlignmentPreview');
        if (frame) {
            frame.src = URL.createObjectURL(blob);
        }
        showMessage(message, `Previewing LCI entry form for ${firstEntry.callName || firstEntry.registeredName || 'hound'}.`, 'success');
    } catch (error) {
        showMessage(message, error.message || 'ASFA LCI entry form preview could not be created.', 'warning');
    }
}

function resetAsfaLciEntryAlignment() {
    formAlignment.asfaLciEntryForm = { ...defaultFormAlignment.asfaLciEntryForm };
    saveFormAlignment();
    renderAsfaLciEntryAlignmentTool(readForm());
    showMessage(officialFormsMessage, 'ASFA LCI entry form alignment reset to defaults.', 'success');
}

async function previewAsfaDrawAlignment() {
    const message = officialFormsMessage;
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        showMessage(message, 'Build a preliminary or runoff draw before previewing ASFA draw sheet alignment.', 'warning');
        return;
    }
    if (!isLocalServerMode()) {
        showMessage(message, 'ASFA draw sheet preview requires SQLite/server mode.', 'warning');
        return;
    }
    try {
        await saveToSQLite();
        const response = await fetch('/api/draw-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial, layout: getAsfaDrawLayout(), copies: 1 }),
        });
        if (!response.ok) {
            let errorMessage = 'ASFA draw sheet preview could not be created.';
            try {
                const payload = await response.json();
                errorMessage = payload.error || errorMessage;
            } catch {
                // Keep generic message.
            }
            throw new Error(errorMessage);
        }
        const blob = await response.blob();
        const frame = document.getElementById('asfaDrawAlignmentPreview');
        if (frame) {
            frame.src = URL.createObjectURL(blob);
        }
        showMessage(message, 'Previewing ASFA draw sheet alignment.', 'success');
    } catch (error) {
        showMessage(message, error.message || 'ASFA draw sheet preview could not be created.', 'warning');
    }
}

function resetAsfaDrawAlignment() {
    formAlignment.asfaDrawSheet = { ...defaultFormAlignment.asfaDrawSheet };
    saveFormAlignment();
    renderAsfaDrawAlignmentTool(readForm());
    showMessage(officialFormsMessage, 'ASFA draw sheet alignment reset to defaults.', 'success');
}

async function previewAsfaJudgeAlignment() {
    const message = officialFormsMessage;
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        showMessage(message, 'Build a preliminary draw before previewing ASFA judge sheet alignment.', 'warning');
        return;
    }
    if (!isLocalServerMode()) {
        showMessage(message, 'ASFA judge sheet preview requires SQLite/server mode.', 'warning');
        return;
    }

    try {
        await saveToSQLite();
        const response = await fetch('/api/judge-sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial, layout: getAsfaJudgeLayout() }),
        });
        if (!response.ok) {
            let errorMessage = 'ASFA judge sheet preview could not be created.';
            try {
                const payload = await response.json();
                errorMessage = payload.error || errorMessage;
            } catch {
                // Keep generic message.
            }
            throw new Error(errorMessage);
        }
        const blob = await response.blob();
        const frame = document.getElementById('asfaJudgeAlignmentPreview');
        if (frame) {
            frame.src = URL.createObjectURL(blob);
        }
        showMessage(message, 'Judge sheet preview created. Adjust values and preview again.', 'success');
    } catch (error) {
        showMessage(message, error.message || 'ASFA judge sheet preview could not be created.', 'warning');
    }
}

function resetAsfaJudgeAlignment() {
    formAlignment.asfaJudgeSheet = { ...defaultFormAlignment.asfaJudgeSheet };
    saveFormAlignment();
    renderAsfaJudgeAlignmentTool(readForm());
    showMessage(officialFormsMessage, 'ASFA judge sheet alignment reset to defaults.', 'success');
}

async function previewAsfaSecretaryAlignment() {
    const message = officialFormsMessage;
    const trial = readForm();
    if (!isLocalServerMode()) {
        showMessage(message, 'ASFA secretary report preview requires SQLite/server mode.', 'warning');
        return;
    }
    try {
        await saveToSQLite();
        const response = await fetch('/api/asfa-secretary-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial, layout: getAsfaSecretaryLayout() }),
        });
        if (!response.ok) {
            let errorMessage = 'ASFA secretary report preview could not be created.';
            try {
                const payload = await response.json();
                errorMessage = payload.error || errorMessage;
            } catch {
                // Keep generic message.
            }
            throw new Error(errorMessage);
        }
        const blob = await response.blob();
        const frame = document.getElementById('asfaSecretaryAlignmentPreview');
        if (frame) {
            frame.src = URL.createObjectURL(blob);
        }
        showMessage(message, 'Previewing ASFA Secretary Report. Adjust values and preview again.', 'success');
    } catch (error) {
        showMessage(message, error.message || 'ASFA secretary report preview could not be created.', 'warning');
    }
}

function resetAsfaSecretaryAlignment() {
    formAlignment.asfaSecretaryReport = { ...defaultFormAlignment.asfaSecretaryReport };
    saveFormAlignment();
    renderAsfaSecretaryAlignmentTool(readForm());
    showMessage(officialFormsMessage, 'ASFA secretary report alignment reset to defaults.', 'success');
}

function renderScoreReportPrint(trial, groups, headingText) {
    const heading = document.getElementById('scoreReportHeading');
    const title = document.getElementById('scoreReportTitle');
    const container = document.getElementById('scoreReportGroups');
    if (!heading || !title || !container) {
        return;
    }

    heading.textContent = headingText;
    title.textContent = trialTitle(trial);
    document.getElementById('scoreReportPrint')?.classList.remove('ribbon-report-print');
    container.innerHTML = '';

    groups.forEach((group) => {
        const block = document.createElement('div');
        block.className = 'draw-sheet-group';
        const h3 = document.createElement('h3');
        h3.textContent = groupTitle(group);
        block.appendChild(h3);

        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const header = document.createElement('tr');
        ['Prelim Course', 'Blanket', 'Hound', 'Stake', 'Prelim J1', 'Prelim J2', 'Prelim Total', 'Outcome', 'Finals', 'Final J1', 'Final J2', 'Final Total', 'Combined', 'Placement'].forEach((label) => {
            const th = document.createElement('th');
            th.textContent = label;
            header.appendChild(th);
        });
        thead.appendChild(header);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        scoreReportRows(group).forEach((row) => {
            const tr = document.createElement('tr');
            [
                row.course.number,
                row.hound.blanketColor,
                row.hound.callName || row.hound.registeredName || 'Unnamed hound',
                row.hound.stake || group.stake,
                row.hound.prelimJudge1Score || '',
                row.hound.prelimJudge2Score || '',
                row.hound.prelimScore || '',
                scoreOutcomeLabel(row.hound.prelimOutcome),
                row.finalCode || '',
                row.finalJudge1 || '',
                row.finalJudge2 || '',
                row.finalScore || scoreOutcomeLabel(row.finalOutcome),
                row.combinedScore || '',
                row.placement || '',
            ].forEach((value) => tr.appendChild(textCell(value)));
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        wrap.appendChild(table);
        block.appendChild(wrap);
        container.appendChild(block);
    });
}

function renderRibbonReportPrint(trial, groups, placementOrder = 'nbqFirst') {
    const heading = document.getElementById('scoreReportHeading');
    const title = document.getElementById('scoreReportTitle');
    const container = document.getElementById('scoreReportGroups');
    if (!heading || !title || !container) {
        return;
    }

    heading.textContent = 'Ribbon Report';
    title.textContent = trialTitle(trial);
    document.getElementById('scoreReportPrint')?.classList.add('ribbon-report-print');
    container.innerHTML = '';

    const placementColumns = placementOrder === 'firstFirst'
        ? ['1', '2', '3', '4', 'NBQ']
        : ['NBQ', '4', '3', '2', '1'];

    ribbonBreedBlocks(trial, groups).forEach((breedBlock) => {
        const block = document.createElement('div');
        block.className = 'draw-sheet-group ribbon-report-group';
        const h3 = document.createElement('h3');
        h3.textContent = displayBreedCode(breedBlock.breed);
        block.appendChild(h3);

        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        const table = document.createElement('table');
        table.className = 'ribbon-report-table';
        table.appendChild(ribbonReportColGroup(placementColumns));
        table.innerHTML += `<thead><tr><th class="ribbon-stake-column">Stake</th>${placementColumns.map((column) => `<th class="${ribbonAwardClass(column)}">${ribbonAwardLabel(column)}</th>`).join('')}<th class="ribbon-bob-column">BOB</th></tr></thead>`;
        const tbody = document.createElement('tbody');
        breedBlock.groups.forEach((group) => {
            const placements = ribbonPlacementsForGroup(group);
            const bob = ribbonBobForGroup(trial, group);
            const tr = document.createElement('tr');
            tr.appendChild(ribbonCell(group.stake || groupTitle(group), 'ribbon-stake-cell'));
            placementColumns.forEach((column) => {
                tr.appendChild(ribbonCell(placements[column], `ribbon-award-cell ${ribbonAwardClass(column)}`));
            });
            tr.appendChild(ribbonCell(bob, 'ribbon-bob-cell'));
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);
        block.appendChild(wrap);
        container.appendChild(block);
    });

    renderRibbonBifSection(trial, container);
}

function ribbonReportColGroup(placementColumns) {
    const colgroup = document.createElement('colgroup');
    const stake = document.createElement('col');
    stake.className = 'ribbon-col-stake';
    colgroup.appendChild(stake);
    placementColumns.forEach((column) => {
        const col = document.createElement('col');
        col.className = `ribbon-col-award ${ribbonAwardClass(column)}`;
        colgroup.appendChild(col);
    });
    const bob = document.createElement('col');
    bob.className = 'ribbon-col-bob';
    colgroup.appendChild(bob);
    return colgroup;
}

function ribbonAwardLabel(value) {
    return value === 'NBQ' ? 'NBQ' : `${value}${placementSuffix(value)}`;
}

function placementSuffix(value) {
    return { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th' }[String(value)] || '';
}

function ribbonAwardClass(value) {
    const normalized = String(value || '').toUpperCase();
    return {
        NBQ: 'ribbon-nbq',
        4: 'ribbon-fourth',
        3: 'ribbon-third',
        2: 'ribbon-second',
        1: 'ribbon-first',
    }[normalized] || '';
}

function ribbonCell(value, className = '') {
    const td = textCell(value || '');
    td.className = className;
    return td;
}

function ribbonReportGroupsForPrint(groups = []) {
    return groups.flatMap((group) => {
        if (!group.mixedStake) {
            return [group];
        }

        const stakeKeys = [];
        (group.courses || []).forEach((course) => {
            (course.hounds || []).forEach((hound) => {
                const stake = hound.stake || group.stake || '';
                const key = clean(stake);
                if (key && !stakeKeys.includes(key)) {
                    stakeKeys.push(key);
                }
            });
        });

        return stakeKeys.map((stakeKey) => ({
            ...group,
            id: `${group.id || clean(group.breed)}::ribbon-${stakeKey}`,
            stake: stakeLabelFromGroup(group, stakeKey),
            mixedStake: false,
            courses: (group.courses || []).map((course) => ({
                ...course,
                hounds: (course.hounds || []).filter((hound) => clean(hound.stake || group.stake) === stakeKey),
            })),
            finalDraw: group.finalDraw ? {
                ...group.finalDraw,
                courses: (group.finalDraw.courses || []).map((course) => ({
                    ...course,
                    hounds: (course.hounds || []).filter((hound) => clean(hound.stake || group.stake) === stakeKey),
                })),
            } : group.finalDraw,
        }));
    });
}

function stakeLabelFromGroup(group, stakeKey) {
    for (const course of group.courses || []) {
        for (const hound of course.hounds || []) {
            if (clean(hound.stake || group.stake) === stakeKey) {
                return hound.stake || group.stake || '';
            }
        }
    }
    return group.stake || '';
}

function sortRibbonReportGroups(groups, trial, sortMode) {
    const runOrderByBreed = new Map((trial.runPlan || []).map((row) => [clean(row.breed), Number(row.runOrder || 999)]));
    const sorted = sortDrawGroupsForPrint(groups, trial);
    if (sortMode === 'az' || sortMode === 'za') {
        sorted.sort((a, b) => {
            const breedCompare = String(a.breed || '').localeCompare(String(b.breed || ''), undefined, { numeric: true, sensitivity: 'base' });
            if (breedCompare !== 0) {
                return sortMode === 'za' ? -breedCompare : breedCompare;
            }
            return sortDrawGroupsForPrint([a, b], trial).indexOf(a) - sortDrawGroupsForPrint([a, b], trial).indexOf(b);
        });
        return sorted;
    }
    return sorted.sort((a, b) => {
        const orderA = runOrderByBreed.get(clean(a.breed)) || 999;
        const orderB = runOrderByBreed.get(clean(b.breed)) || 999;
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        return sortDrawGroupsForPrint([a, b], trial).indexOf(a) - sortDrawGroupsForPrint([a, b], trial).indexOf(b);
    });
}

function ribbonBreedBlocks(trial, groups) {
    const blocks = new Map();
    groups.forEach((group) => {
        const breed = group.breed || 'Unknown';
        const key = clean(breed);
        if (!blocks.has(key)) {
            blocks.set(key, { breed, groups: [] });
        }
        blocks.get(key).groups.push(group);
    });
    return [...blocks.values()];
}

function ribbonPlacementsForGroup(group) {
    const placements = { NBQ: '', 4: '', 3: '', 2: '', 1: '' };
    finalsRowsForGroup(group).forEach((row) => {
        const placement = String(row.hound.placement || '').toUpperCase();
        const name = ribbonHoundName(row.hound);
        if (placement === 'NBQ') {
            placements.NBQ = appendRibbonName(placements.NBQ, name);
        }
        ['4', '3', '2', '1'].forEach((key) => {
            if (placement === key) {
                placements[key] = appendRibbonName(placements[key], name);
            }
        });
    });
    return placements;
}

function ribbonBobForGroup(trial, group) {
    const names = finalsRowsForGroup(group)
        .filter((row) => bobResultForEntry(trial, row.hound.entryId) === 'BOB')
        .map((row) => ribbonHoundName(row.hound));
    return names.join(', ');
}

function appendRibbonName(existing, name) {
    return existing ? `${existing}, ${name}` : name;
}

function ribbonHoundName(hound) {
    return hound.callName || hound.registeredName || 'Unnamed hound';
}

function renderRibbonBifSection(trial, container) {
    const bif = bifState(trial);
    const rows = ((bif.draw || {}).courses || [])
        .slice()
        .sort((a, b) => Number(a.number || 0) - Number(b.number || 0))
        .flatMap((course) => sortedHoundsByBlanket(course.hounds || []).map((hound) => ({ course, hound })));

    const block = document.createElement('div');
    block.className = 'draw-sheet-group ribbon-report-group';
    const h3 = document.createElement('h3');
    h3.textContent = 'BIF';
    block.appendChild(h3);

    if (rows.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'No BIF draw has been built yet.';
        block.appendChild(empty);
        container.appendChild(block);
        return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    const table = document.createElement('table');
    table.className = 'ribbon-report-table';
    table.classList.add('ribbon-bif-table');
    table.innerHTML = '<thead><tr><th>Run #/Color</th><th>Hound</th><th>Breed</th><th>Stake</th><th class="ribbon-bif-heading">Result</th></tr></thead>';
    const tbody = document.createElement('tbody');
    rows.forEach((row) => {
        const code = row.hound.bifCode || `${row.course.number}${blanketCode(row.hound.bifBlanketColor)}`;
        const result = bifResultForEntry(bif, row.hound.entryId);
        const tr = document.createElement('tr');
        [
            code,
            ribbonHoundName(row.hound),
            row.hound.breed || '',
            row.hound.bobStake || row.hound.stake || '',
            result,
        ].forEach((value) => tr.appendChild(textCell(value)));
        if (result === 'BIF') {
            tr.classList.add('ribbon-winner-row');
        }
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    block.appendChild(wrap);

    const winner = rows.find((row) => bifResultForEntry(bif, row.hound.entryId) === 'BIF');
    if (winner) {
        const note = document.createElement('p');
        note.className = 'ribbon-winner-note';
        note.textContent = `BIF Winner: ${ribbonHoundName(winner.hound)} (${displayBreedCode(winner.hound.breed)})`;
        block.appendChild(note);
    }
    container.appendChild(block);
}

function scoreReportRows(group) {
    const finalByEntry = new Map();
    if (group.finalDraw && Array.isArray(group.finalDraw.courses)) {
        group.finalDraw.courses.forEach((course) => {
            (course.hounds || []).forEach((hound) => {
                finalByEntry.set(hound.entryId, {
                    code: hound.finalCode || `${course.number}${blanketCode(drawColorForType(hound, 'final'))}`,
                    judge1: hound.finalJudge1Score || '',
                    judge2: hound.finalJudge2Score || '',
                    score: hound.finalScore || '',
                    outcome: hound.finalOutcome || '',
                    combinedScore: hound.combinedScore || '',
                    placement: hound.placement || '',
                });
            });
        });
    }

    return [...(group.courses || [])]
        .sort((a, b) => Number(a.number || 0) - Number(b.number || 0))
        .flatMap((course) => (
            sortedHoundsByBlanket(course.hounds || []).map((hound) => ({
                course,
                hound,
                finalCode: finalByEntry.get(hound.entryId)?.code || '',
                finalJudge1: finalByEntry.get(hound.entryId)?.judge1 || '',
                finalJudge2: finalByEntry.get(hound.entryId)?.judge2 || '',
                finalScore: finalByEntry.get(hound.entryId)?.score || '',
                finalOutcome: finalByEntry.get(hound.entryId)?.outcome || '',
                combinedScore: finalByEntry.get(hound.entryId)?.combinedScore || '',
                placement: finalByEntry.get(hound.entryId)?.placement || '',
            }))
        ));
}

function scoreOutcomeLabel(value) {
    const labels = {
        excused: 'EXC',
        dismissed: 'DIS',
        disqualified: 'DQ',
        forfeit: 'FOR',
        pull: 'PUL',
        no_score: 'NS',
    };
    return labels[value] || '';
}

function scoreOutcomeOptions() {
    return [
        ['', 'OK'],
        ['excused', 'EXC'],
        ['dismissed', 'DIS'],
        ['disqualified', 'DQ'],
        ['forfeit', 'FOR'],
        ['pull', 'PUL'],
        ['no_score', 'NS'],
    ];
}

function outcomeNeedsSignedJudgeSheets(outcome) {
    return ['excused', 'dismissed', 'disqualified'].includes(String(outcome || ''));
}

function signedJudgeSheetsForHound(hound, phase) {
    const key = phase === 'final' ? 'finalSignedJudgeSheets' : 'prelimSignedJudgeSheets';
    return Array.isArray((hound || {})[key]) ? (hound || {})[key] : [];
}

function signedJudgeSheetCell(group, hound, phase, judgeCount) {
    const td = document.createElement('td');
    td.className = 'signed-sheet-cell';
    const outcome = phase === 'final' ? hound.finalOutcome : hound.prelimOutcome;
    if (!outcomeNeedsSignedJudgeSheets(outcome)) {
        td.textContent = '-';
        return td;
    }

    const expected = Math.max(1, Number(judgeCount || 1));
    const documents = signedJudgeSheetsForHound(hound, phase);
    const status = document.createElement('div');
    status.className = documents.length >= expected ? 'signed-sheet-status complete' : 'signed-sheet-status needed';
    status.textContent = `${documents.length}/${expected} signed`;
    td.appendChild(status);

    const links = document.createElement('div');
    links.className = 'signed-sheet-links';
    documents.forEach((documentInfo, index) => {
        const link = documentViewLink(documentInfo);
        link.textContent = `View ${index + 1}`;
        links.appendChild(link);
    });
    if (documents.length) {
        td.appendChild(links);
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,image/*';
    input.multiple = expected > 1;
    input.hidden = true;
    input.addEventListener('change', async () => {
        const files = [...(input.files || [])];
        input.value = '';
        if (!files.length) {
            return;
        }
        if (documents.length + files.length > expected) {
            showMessage(document.getElementById('scoringMessage'), `This result needs ${expected} signed judge sheet${expected === 1 ? '' : 's'}. Remove is not built yet, so do not attach extras.`, 'warning');
            return;
        }
        try {
            const uploaded = [];
            for (const file of files) {
                uploaded.push(await uploadEntryDocumentFile(file, `${phase === 'final' ? 'Final' : 'Prelim'} signed judge sheet`));
            }
            applySignedJudgeSheets(group.id, hound.entryId, phase, [...documents, ...uploaded]);
            showMessage(document.getElementById('scoringMessage'), `Attached ${uploaded.length} signed judge sheet${uploaded.length === 1 ? '' : 's'}.`, 'success');
        } catch (error) {
            showMessage(document.getElementById('scoringMessage'), error.message || 'Could not attach the signed judge sheet.', 'error');
        }
    });
    td.appendChild(input);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = documents.length >= expected ? 'secondary small' : 'primary small';
    button.textContent = documents.length ? 'Add' : 'Insert';
    button.dataset.help = `Attach the signed judge sheet${expected === 1 ? '' : 's'} for this ${scoreOutcomeLabel(outcome)} result.`;
    button.addEventListener('click', () => input.click());
    td.appendChild(button);
    return td;
}

function applySignedJudgeSheets(groupId, entryId, phase, documents) {
    const trial = readForm();
    if (!trial.preliminaryDraw || !Array.isArray(trial.preliminaryDraw.groups)) {
        return;
    }
    const documentIds = documents.map((documentInfo) => documentInfo.id).filter(Boolean);
    trial.preliminaryDraw = {
        ...trial.preliminaryDraw,
        groups: trial.preliminaryDraw.groups.map((group) => {
            if (phase === 'final') {
                if (group.id !== groupId || !group.finalDraw || !Array.isArray(group.finalDraw.courses)) {
                    return group;
                }
                return {
                    ...group,
                    finalDraw: {
                        ...group.finalDraw,
                        courses: group.finalDraw.courses.map((course) => ({
                            ...course,
                            hounds: (course.hounds || []).map((hound) => hound.entryId === entryId
                                ? { ...hound, finalSignedJudgeSheets: documents, finalSignedJudgeSheetIds: documentIds }
                                : hound),
                        })),
                    },
                };
            }
            return {
                ...group,
                courses: (group.courses || []).map((course) => ({
                    ...course,
                    hounds: (course.hounds || []).map((hound) => hound.entryId === entryId
                        ? { ...hound, prelimSignedJudgeSheets: documents, prelimSignedJudgeSheetIds: documentIds }
                        : hound),
                })),
            };
        }),
    };
    upsertTrial(trial);
    saveTrials();
    render();
}

function prelimScorebookRow(group, course, hound, prelimsLocked, entry = {}, judgeCount = 2) {
    const tr = document.createElement('tr');
    const prelimCodeCell = document.createElement('td');
    const blanketLabel = document.createElement('span');
    blanketLabel.className = `blanket blanket-${clean(hound.blanketColor).toLowerCase()}`;
    blanketLabel.textContent = `${course.number || ''}${blanketCode(hound.blanketColor)}`;
    prelimCodeCell.appendChild(blanketLabel);
    tr.appendChild(prelimCodeCell);
    tr.appendChild(textCell(hound.callName || hound.registeredName || 'Unnamed hound'));
    tr.appendChild(textCell(entry.registrationNumber || hound.registrationNumber || ''));
    tr.appendChild(textCell(hound.stake || group.stake || ''));

    const prelimJudge1Cell = document.createElement('td');
    prelimJudge1Cell.appendChild(scoreNumberInput(hound.prelimJudge1Score, 'J1', Boolean(hound.prelimOutcome) || prelimsLocked, (value) => updatePrelimScore(hound.entryId, { judge1: value })));
    tr.appendChild(prelimJudge1Cell);

    if (judgeCount > 1) {
        const prelimJudge2Cell = document.createElement('td');
        prelimJudge2Cell.appendChild(scoreNumberInput(hound.prelimJudge2Score, 'J2', Boolean(hound.prelimOutcome) || prelimsLocked, (value) => updatePrelimScore(hound.entryId, { judge2: value })));
        tr.appendChild(prelimJudge2Cell);
    }

    tr.appendChild(textCell(computedScoreDisplay(hound.prelimScore, hound.prelimOutcome)));

    const outcomeCell = document.createElement('td');
    const outcome = document.createElement('select');
    outcome.className = 'score-outcome';
    scoreOutcomeOptions().forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        outcome.appendChild(option);
    });
    outcome.value = hound.prelimOutcome || '';
    outcome.disabled = prelimsLocked;
    outcome.addEventListener('change', () => updatePrelimScore(hound.entryId, { outcome: outcome.value }));
    outcomeCell.appendChild(outcome);
    tr.appendChild(outcomeCell);
    tr.appendChild(signedJudgeSheetCell(group, hound, 'prelim', judgeCount));

    if (hound.prelimOutcome) {
        tr.classList.add('score-row-outcome');
    }
    if (prelimsLocked) {
        tr.classList.add('score-row-locked');
    }

    return tr;
}

function bobResultForEntry(trial, entryId) {
    const resultStateResult = ((trial.resultState || {}).bobResultsByEntry || {})[entryId];
    if (resultStateResult) {
        return resultStateResult;
    }
    const results = [];
    for (const runoff of (trial.bobRunoffs || [])) {
        for (const row of runoffRows(runoff)) {
            if (row.hound.entryId === entryId && row.hound.bobResult) {
                results.push({
                    result: row.hound.bobResult,
                    runoffKey: runoff.key || '',
                });
            }
        }
    }
    const resolvedBobTieResult = resolvedBobTieResultForEntry(trial, entryId);
    if (resolvedBobTieResult !== null) {
        return resolvedBobTieResult;
    }
    if (results.some((row) => row.result === 'BOB')) {
        return 'BOB';
    }
    if (results.some((row) => row.result === 'BOB Tie')) {
        return 'BOB Tie';
    }
    return (results.find((row) => row.result) || {}).result || resultStateResult || '';
}

function resolvedBobTieResultForEntry(trial, entryId) {
    for (const runoff of (trial.bobRunoffs || [])) {
        if (!String(runoff.key || '').startsWith('bobtie:')) {
            continue;
        }
        const rows = runoffRows(runoff);
        if (!rows.some((row) => row.hound.entryId === entryId)) {
            continue;
        }
        if (!rows.some((row) => row.hound.bobResult === 'BOB')) {
            continue;
        }
        const row = rows.find((candidate) => candidate.hound.entryId === entryId);
        return row && row.hound.bobResult === 'BOB' ? 'BOB' : '';
    }
    return null;
}

function scoreNumberInput(value, placeholder, disabled, onChange) {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.pattern = '[0-9]*';
    input.className = 'score-input';
    input.dataset.scoreColumn = placeholder || '';
    input.dataset.help = 'Enter a whole-point score. Arrow keys move in the direction pressed. Enter moves down. Tab moves to the next score box.';
    input.value = value ?? '';
    input.placeholder = placeholder;
    input.disabled = disabled;
    input._scoreOnChange = onChange;
    input._lastCommittedValue = normalizeScoreInputValue(input.value);
    input.addEventListener('input', () => {
        const whole = normalizeScoreInputValue(input.value);
        if (input.value !== whole) {
            input.value = whole;
        }
    });
    input.addEventListener('change', () => commitScoreInput(input));
    return input;
}

function normalizeScoreInputValue(value) {
    return String(value || '').replace(/\D/g, '');
}

function commitScoreInput(input) {
    if (!input || typeof input._scoreOnChange !== 'function') {
        return false;
    }
    const value = normalizeScoreInputValue(input.value);
    if (input.value !== value) {
        input.value = value;
    }
    if (value === input._lastCommittedValue) {
        return false;
    }
    input._lastCommittedValue = value;
    input._scoreOnChange(value);
    return true;
}

function visibleScoreInputs() {
    return [...document.querySelectorAll('.score-input')]
        .filter((input) => !input.disabled && input.offsetParent !== null);
}

function moveScoreFocus(currentInput, direction) {
    const inputs = visibleScoreInputs();
    const currentIndex = inputs.indexOf(currentInput);
    if (currentIndex === -1 || inputs.length === 0) {
        return false;
    }
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= inputs.length) {
        return false;
    }
    pendingScoreFocusIndex = nextIndex;
    inputs[nextIndex].focus();
    inputs[nextIndex].select();
    requestAnimationFrame(restorePendingScoreFocus);
    return true;
}

function moveScoreFocusSameColumn(currentInput, direction) {
    const column = currentInput.dataset.scoreColumn || currentInput.placeholder || '';
    const inputs = visibleScoreInputs().filter((input) => (input.dataset.scoreColumn || input.placeholder || '') === column);
    const currentIndex = inputs.indexOf(currentInput);
    if (currentIndex === -1 || inputs.length === 0) {
        return false;
    }
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= inputs.length) {
        return false;
    }
    pendingScoreFocusIndex = visibleScoreInputs().indexOf(inputs[nextIndex]);
    inputs[nextIndex].focus();
    inputs[nextIndex].select();
    requestAnimationFrame(restorePendingScoreFocus);
    return true;
}

function moveScoreFocusGrid(currentInput, direction) {
    const table = currentInput.closest('table');
    if (!table) {
        return false;
    }
    const tableInputs = visibleScoreInputs().filter((input) => input.closest('table') === table);
    const positioned = tableInputs.map((input) => {
        const cell = input.closest('td');
        const row = input.closest('tr');
        return {
            input,
            row,
            rowTop: row ? row.getBoundingClientRect().top : 0,
            cellLeft: cell ? cell.getBoundingClientRect().left : 0,
        };
    });
    const current = positioned.find((item) => item.input === currentInput);
    if (!current) {
        return false;
    }

    let target = null;
    if (direction === 'down' || direction === 'up') {
        const sameColumn = positioned
            .filter((item) => item.input !== currentInput && Math.abs(item.cellLeft - current.cellLeft) < 8)
            .filter((item) => direction === 'down' ? item.rowTop > current.rowTop : item.rowTop < current.rowTop)
            .sort((a, b) => direction === 'down' ? a.rowTop - b.rowTop : b.rowTop - a.rowTop);
        target = sameColumn[0] || null;
    } else {
        const sameRow = positioned
            .filter((item) => item.input !== currentInput && item.row === current.row)
            .filter((item) => direction === 'right' ? item.cellLeft > current.cellLeft : item.cellLeft < current.cellLeft)
            .sort((a, b) => direction === 'right' ? a.cellLeft - b.cellLeft : b.cellLeft - a.cellLeft);
        target = sameRow[0] || null;
    }

    if (!target) {
        return false;
    }
    pendingScoreFocusIndex = visibleScoreInputs().indexOf(target.input);
    target.input.focus();
    target.input.select();
    requestAnimationFrame(restorePendingScoreFocus);
    return true;
}

function restorePendingScoreFocus() {
    if (pendingScoreFocusIndex === null) {
        return;
    }
    const inputs = visibleScoreInputs();
    if (inputs.length === 0) {
        pendingScoreFocusIndex = null;
        return;
    }
    const index = Math.min(pendingScoreFocusIndex, inputs.length - 1);
    pendingScoreFocusIndex = null;
    inputs[index].focus();
    inputs[index].select();
}

function computedScoreDisplay(score, outcome) {
    return hasScoreValue(score) ? score : scoreOutcomeLabel(outcome);
}

function computedTwoJudgeTotal(judge1, judge2) {
    const hasJudge1 = hasScoreValue(judge1);
    const hasJudge2 = hasScoreValue(judge2);
    if (!hasJudge1 && !hasJudge2) {
        return '';
    }
    if (!hasJudge1 || !hasJudge2) {
        return '';
    }
    const first = Number(judge1 || 0);
    const second = Number(judge2 || 0);
    if (!Number.isFinite(first) || !Number.isFinite(second)) {
        return '';
    }
    return String(first + second);
}

function computedJudgeTotal(judge1, judge2, judgeCount = 2) {
    if (judgeCount < 2) {
        return hasScoreValue(judge1) && Number.isFinite(Number(judge1)) ? String(Number(judge1)) : '';
    }
    return computedTwoJudgeTotal(judge1, judge2);
}

function finalCodeForEntry(group, entryId) {
    if (!group.finalDraw || !Array.isArray(group.finalDraw.courses)) {
        return '';
    }
    for (const course of group.finalDraw.courses) {
        const hound = (course.hounds || []).find((item) => item.entryId === entryId);
        if (hound) {
            return hound.finalCode || `${course.number}${blanketCode(drawColorForType(hound, 'final'))}`;
        }
    }
    return '';
}

function finalDetailsForEntry(group, entryId) {
    if (!group.finalDraw || !Array.isArray(group.finalDraw.courses)) {
        return { code: '', score: '' };
    }
    for (const course of group.finalDraw.courses) {
        const hound = (course.hounds || []).find((item) => item.entryId === entryId);
        if (hound) {
            return {
                code: hound.finalCode || `${course.number}${blanketCode(drawColorForType(hound, 'final'))}`,
                color: drawColorForType(hound, 'final') || '',
                judge1: hound.finalJudge1Score || '',
                judge2: hound.finalJudge2Score || '',
                score: hound.finalScore ?? '',
                outcome: hound.finalOutcome || '',
                combinedScore: hound.combinedScore || '',
                placement: hound.placement || '',
            };
        }
    }
    return { code: '', color: '', score: '', outcome: '', combinedScore: '', placement: '' };
}

async function updateFinalResult(groupId, entryId, changes) {
    const trial = readForm();
    if (trial.scorebook && trial.scorebook.finalsLocked) {
        showMessage(document.getElementById('scoringMessage'), 'Finals scores are locked. Unlock finals before making a correction.', 'warning');
        render();
        return;
    }
    if (!trial.preliminaryDraw || !Array.isArray(trial.preliminaryDraw.groups)) {
        showMessage(document.getElementById('scoringMessage'), 'Build the finals draw before entering finals scores.', 'warning');
        return;
    }
    let updated = false;
    const targetGroup = trial.preliminaryDraw.groups.find((group) => group.id === groupId);
    const judgeCount = targetGroup ? judgeCountForGroup(trial, targetGroup) : 2;
    const targetBreed = targetGroup ? targetGroup.breed : '';
    const wasBreedComplete = targetBreed ? breedFinalsComplete(trial, targetBreed) : false;
    trial.preliminaryDraw = {
        ...trial.preliminaryDraw,
        groups: trial.preliminaryDraw.groups.map((group) => {
            if (group.id !== groupId || !group.finalDraw || !Array.isArray(group.finalDraw.courses)) {
                return group;
            }
            return {
                ...group,
                finalDraw: {
                    ...group.finalDraw,
                    courses: group.finalDraw.courses.map((course) => ({
                        ...course,
                        hounds: (course.hounds || []).map((hound) => {
                            if (hound.entryId !== entryId) {
                                return hound;
                            }
                            updated = true;
                            const next = { ...hound };
                            if ('score' in changes) {
                                const value = String(changes.score || '').trim();
                                next.finalScore = value;
                                if (value) {
                                    next.finalOutcome = '';
                                }
                            }
                            if ('judge1' in changes) {
                                next.finalJudge1Score = String(changes.judge1 || '').trim();
                                next.finalScore = computedJudgeTotal(next.finalJudge1Score, next.finalJudge2Score, judgeCount);
                                if (next.finalScore) {
                                    next.finalOutcome = '';
                                }
                            }
                            if ('judge2' in changes) {
                                next.finalJudge2Score = String(changes.judge2 || '').trim();
                                next.finalScore = computedJudgeTotal(next.finalJudge1Score, next.finalJudge2Score, judgeCount);
                                if (next.finalScore) {
                                    next.finalOutcome = '';
                                }
                            }
                            if ('outcome' in changes) {
                                next.finalOutcome = changes.outcome || '';
                                if (next.finalOutcome) {
                                    next.finalScore = '';
                                    next.finalJudge1Score = '';
                                    next.finalJudge2Score = '';
                                }
                            }
                            next.finalScoredAt = new Date().toISOString();
                            return next;
                        }),
                    })),
                },
            };
        }),
    };

    if (!updated) {
        showMessage(document.getElementById('scoringMessage'), 'Could not find that hound in the finals draw.', 'warning');
        return;
    }
    let updatedGroup = null;
    trial.preliminaryDraw = {
        ...trial.preliminaryDraw,
        groups: trial.preliminaryDraw.groups.map((group) => {
            if (group.id !== groupId) {
                return group;
            }
            updatedGroup = recomputeFinalPlacements(group);
            return updatedGroup;
        }),
    };
    upsertTrial(trial);
    saveTrials();
    if (updatedGroup) {
        const status = finalStakeStatus(updatedGroup);
        if (status.tone !== 'todo') {
            showMessage(document.getElementById('scoringMessage'), `${updatedGroup.breed} ${updatedGroup.stake}: ${status.message}`, status.tone === 'done' ? 'success' : 'warning');
        }
    }
    if (targetBreed && !wasBreedComplete && breedFinalsComplete(trial, targetBreed)) {
        promptAfterFinalBreedComplete(targetBreed);
        return;
    }
    render();
}

function breedFinalsComplete(trial, breed) {
    const groups = (((trial || {}).preliminaryDraw || {}).groups || [])
        .filter((group) => clean(group.breed) === clean(breed))
        .filter((group) => finalsRowsForGroup(group).length > 0);
    if (groups.length === 0) {
        return false;
    }
    return groups.every((group) => finalsRowsForGroup(group).every((row) => hasScoreValue(row.hound.finalScore) || row.hound.finalOutcome));
}

function promptAfterFinalBreedComplete(breed) {
    showTrialActionModal({
        title: 'Breed Finals Complete',
        eyebrow: breedLabel(breed),
        message: 'All finals scores for this breed are entered. Draw the runoff and BOB blanket colors now so the ASFA breed sheet can be printed with the posted runoff information.',
        primaryText: 'Draw Runoffs & BOB',
        secondaryText: 'Later',
    }).then(async (drawNow) => {
        if (!drawNow) {
            showMessage(document.getElementById('scoringMessage'), `${breedLabel(breed)} finals are complete. Draw runoffs and BOB before printing the breed sheet.`, 'success');
            render();
            return;
        }
        const drawnCount = drawRunoffsForBreed(breed);
        showTrialActionModal({
            title: 'Breed Sheet Ready',
            eyebrow: breedLabel(breed),
            message: drawnCount > 0
                ? `${drawnCount} runoff/BOB run${drawnCount === 1 ? '' : 's'} drawn. Print the ASFA breed sheet now with runoff colors included.`
                : 'No runoff or BOB draw was needed for this breed. Print the ASFA breed sheet now.',
            primaryText: 'Print ASFA Breed Sheet',
            secondaryText: 'Later',
        }).then((printNow) => {
            if (printNow) {
                printAsfaRecordSheet({ breed });
            } else {
                render();
            }
        });
    });
}

function updateTieBreakResult(groupId, entryId, tieLabel, changes, tieCombinedScore = '') {
    const trial = readForm();
    if (!trial.preliminaryDraw || !Array.isArray(trial.preliminaryDraw.groups)) {
        showMessage(document.getElementById('scoringMessage'), 'Build the finals draw before settling ties.', 'warning');
        return;
    }

    let updated = false;
    const nextForfeitOrder = nextTieBreakForfeitOrder(trial, groupId, tieLabel);
    const targetGroup = trial.preliminaryDraw.groups.find((group) => group.id === groupId);
    const judgeCount = targetGroup ? judgeCountForGroup(trial, targetGroup) : 2;
    trial.preliminaryDraw = {
        ...trial.preliminaryDraw,
        groups: trial.preliminaryDraw.groups.map((group) => {
            if (group.id !== groupId || !group.finalDraw || !Array.isArray(group.finalDraw.courses)) {
                return group;
            }
            return {
                ...group,
                finalDraw: {
                    ...group.finalDraw,
                    courses: group.finalDraw.courses.map((course) => ({
                        ...course,
                        hounds: (course.hounds || []).map((hound) => {
                            if (hound.entryId !== entryId) {
                                return hound;
                            }
                            updated = true;
                            const next = {
                                ...hound,
                                tieBreakLabel: tieLabel,
                                tieBreakCombinedScore: tieCombinedScore || hound.tieBreakCombinedScore || hound.combinedScore || '',
                                tieBreakScoredAt: new Date().toISOString(),
                            };
                            if ('judge1' in changes) {
                                next.tieBreakJudge1Score = String(changes.judge1 || '').trim();
                                next.tieBreakScore = computedJudgeTotal(next.tieBreakJudge1Score, next.tieBreakJudge2Score, judgeCount);
                                if (next.tieBreakScore) {
                                    next.tieBreakOutcome = '';
                                    next.tieBreakForfeitOrder = '';
                                }
                            }
                            if ('judge2' in changes) {
                                next.tieBreakJudge2Score = String(changes.judge2 || '').trim();
                                next.tieBreakScore = computedJudgeTotal(next.tieBreakJudge1Score, next.tieBreakJudge2Score, judgeCount);
                                if (next.tieBreakScore) {
                                    next.tieBreakOutcome = '';
                                    next.tieBreakForfeitOrder = '';
                                }
                            }
                            if ('outcome' in changes) {
                                next.tieBreakOutcome = changes.outcome || '';
                                if (next.tieBreakOutcome) {
                                    next.tieBreakJudge1Score = '';
                                    next.tieBreakJudge2Score = '';
                                    next.tieBreakScore = '';
                                }
                                if (next.tieBreakOutcome === 'forfeit') {
                                    next.tieBreakForfeitOrder = next.tieBreakForfeitOrder || nextForfeitOrder;
                                } else {
                                    next.tieBreakForfeitOrder = '';
                                }
                            }
                            return next;
                        }),
                    })),
                },
                runoffs: (group.runoffs || []).map((runoff) => runoff.label !== tieLabel ? runoff : resolveTieRunoffDrawResults({
                    ...runoff,
                    courses: (runoff.courses || []).map((course) => ({
                        ...course,
                        hounds: (course.hounds || []).map((hound) => {
                            if (hound.entryId !== entryId) {
                                return hound;
                            }
                            const next = {
                                ...hound,
                                tieBreakLabel: tieLabel,
                                tieBreakCombinedScore: tieCombinedScore || hound.tieBreakCombinedScore || hound.combinedScore || '',
                                tieBreakScoredAt: new Date().toISOString(),
                            };
                            if ('judge1' in changes) {
                                next.tieBreakJudge1Score = String(changes.judge1 || '').trim();
                                next.tieBreakScore = computedJudgeTotal(next.tieBreakJudge1Score, next.tieBreakJudge2Score, judgeCount);
                                if (next.tieBreakScore) {
                                    next.tieBreakOutcome = '';
                                    next.tieBreakForfeitOrder = '';
                                }
                            }
                            if ('judge2' in changes) {
                                next.tieBreakJudge2Score = String(changes.judge2 || '').trim();
                                next.tieBreakScore = computedJudgeTotal(next.tieBreakJudge1Score, next.tieBreakJudge2Score, judgeCount);
                                if (next.tieBreakScore) {
                                    next.tieBreakOutcome = '';
                                    next.tieBreakForfeitOrder = '';
                                }
                            }
                            if ('outcome' in changes) {
                                next.tieBreakOutcome = changes.outcome || '';
                                if (next.tieBreakOutcome) {
                                    next.tieBreakJudge1Score = '';
                                    next.tieBreakJudge2Score = '';
                                    next.tieBreakScore = '';
                                }
                                if (next.tieBreakOutcome === 'forfeit') {
                                    next.tieBreakForfeitOrder = next.tieBreakForfeitOrder || nextForfeitOrder;
                                } else {
                                    next.tieBreakForfeitOrder = '';
                                }
                            }
                            return next;
                        }),
                    })),
                })),
            };
        }),
    };

    if (!updated) {
        showMessage(document.getElementById('scoringMessage'), 'Could not find that hound in the tie break.', 'warning');
        return;
    }

    let updatedGroup = null;
    trial.preliminaryDraw = {
        ...trial.preliminaryDraw,
        groups: trial.preliminaryDraw.groups.map((group) => {
            if (group.id !== groupId) {
                return group;
            }
            updatedGroup = recomputeFinalPlacements(group);
            return updatedGroup;
        }),
    };
    if (updatedGroup) {
        syncTieBreakRunoffResults(trial, updatedGroup, tieLabel);
    }
    upsertTrial(trial);
    saveTrials();
    if (updatedGroup) {
        const status = finalStakeStatus(updatedGroup);
        if (status.tone !== 'todo') {
            showMessage(document.getElementById('scoringMessage'), `${updatedGroup.breed} ${updatedGroup.stake}: ${status.message}`, status.tone === 'done' ? 'success' : 'warning');
        }
    }
    render();
}

function syncTieBreakRunoffResults(trial, group, tieLabel) {
    const tieRows = finalsRowsForGroup(group).filter((row) => row.hound.tieBreakLabel === tieLabel);
    const tieByEntry = new Map(tieRows.map((row) => [row.hound.entryId, row.hound]));
    const breedKey = `bob:${clean(group.breed)}`;

    trial.bobRunoffs = (trial.bobRunoffs || []).map((runoff) => {
        if (String(runoff.key || '').startsWith('combined:')) {
            return resolveBobRunoffResults({
                ...runoff,
                courses: (runoff.courses || []).map((course) => ({
                    ...course,
                    hounds: (course.hounds || []).map((hound) => {
                        const tieHound = tieByEntry.get(hound.entryId);
                        if (!tieHound || hound.runoffRole !== 'tie') {
                            return hound;
                        }
                        return {
                            ...hound,
                            tieBreakJudge1Score: tieHound.tieBreakJudge1Score || '',
                            tieBreakJudge2Score: tieHound.tieBreakJudge2Score || '',
                            tieBreakScore: tieHound.tieBreakScore || '',
                            tieBreakOutcome: tieHound.tieBreakOutcome || '',
                            tieBreakForfeitOrder: tieHound.tieBreakForfeitOrder || '',
                            tieBreakResolvedPlacement: tieHound.tieBreakResolvedPlacement || '',
                        };
                    }),
                })),
            });
        }

        if (runoff.key !== breedKey) {
            return runoff;
        }

        const winner = resolvedTieWinnerForPlaceholder(group, null, tieLabel);
        return {
            ...runoff,
            courses: (runoff.courses || []).map((course) => ({
                ...course,
                hounds: (course.hounds || []).map((hound) => {
                    if (!isBobTieWinnerSlot(hound, group, tieLabel)) {
                        return hound;
                    }
                    if (!winner) {
                        return hound;
                    }
                    return bobHoundFromTieWinner(winner, hound, group);
                }),
            })),
        };
    });
}

function isBobTieWinnerSlot(hound, group, tieLabel) {
    if (isPlaceholderForTie(hound, group, tieLabel)) {
        return true;
    }
    if (hound.bobSourceGroupId === group.id && hound.bobSourceTieLabel === tieLabel) {
        return true;
    }
    return (
        clean(hound.bobStake) === clean(group.stake)
        && finalsRowsForGroup(group).some((row) => row.hound.entryId === hound.entryId && row.hound.tieBreakLabel === tieLabel)
    );
}

function isPlaceholderForTie(hound, group, tieLabel) {
    if (!hound.isPlaceholder || clean(hound.bobStake) !== clean(group.stake)) {
        return false;
    }
    if (hound.tieBreakLabel === tieLabel) {
        return true;
    }
    return String(hound.entryId || '').startsWith(`placeholder:${group.id}:`);
}

function resolvedTieWinnerForPlaceholder(group, placeholder, tieLabel) {
    const combinedScore = String((placeholder || {}).tieBreakCombinedScore || '');
    return finalsRowsForGroup(group)
        .map((row) => row.hound)
        .find((hound) => (
            hound.placement === '1'
            && (hound.tieBreakLabel === tieLabel || (combinedScore && clean(hound.combinedScore) === clean(combinedScore)))
        )) || null;
}

function bobHoundFromTieWinner(winner, placeholder, group) {
    return {
        ...winner,
        bobStake: group.stake,
        bobSourceGroupId: group.id,
        bobSourceTieLabel: winner.tieBreakLabel || placeholder.bobSourceTieLabel || '',
        runoffRole: 'bob',
        isPlaceholder: false,
        tieBreakLabel: 'BOB',
        tieBreakCombinedScore: '',
        tieBreakJudge1Score: '',
        tieBreakJudge2Score: '',
        tieBreakScore: '',
        tieBreakOutcome: '',
        tieBreakResolvedPlacement: '',
        bobCourse: placeholder.bobCourse || placeholder.tieBreakCourse || '',
        bobBlanketColor: placeholder.bobBlanketColor || placeholder.tieBreakBlanketColor || '',
        bobCode: placeholder.bobCode || placeholder.tieBreakCode || '',
        tieBreakCourse: placeholder.tieBreakCourse || placeholder.bobCourse || '',
        tieBreakBlanketColor: placeholder.tieBreakBlanketColor || placeholder.bobBlanketColor || '',
        tieBreakCode: placeholder.tieBreakCode || placeholder.bobCode || '',
        drawPosition: placeholder.drawPosition || winner.drawPosition || '',
        bobResult: '',
        bobWinner: false,
    };
}

function nextTieBreakForfeitOrder(trial, groupId, tieLabel) {
    const group = ((trial.preliminaryDraw || {}).groups || []).find((item) => item.id === groupId);
    if (!group) {
        return 1;
    }
    const orders = [];
    finalsRowsForGroup(group).forEach((row) => {
        if (row.hound.tieBreakLabel === tieLabel && row.hound.tieBreakOutcome === 'forfeit' && Number(row.hound.tieBreakForfeitOrder)) {
            orders.push(Number(row.hound.tieBreakForfeitOrder));
        }
    });
    (group.runoffs || [])
        .filter((runoff) => runoff.label === tieLabel)
        .forEach((runoff) => {
            runoffRows(runoff).forEach((row) => {
                if (row.hound.tieBreakOutcome === 'forfeit' && Number(row.hound.tieBreakForfeitOrder)) {
                    orders.push(Number(row.hound.tieBreakForfeitOrder));
                }
            });
        });
    return orders.length ? Math.max(...orders) + 1 : 1;
}

function placementNameForNumber(value) {
    const number = Number(value);
    if (number === 5) {
        return 'NBQ';
    }
    return Number.isFinite(number) ? String(number) : '';
}

function placementTieLabel(start, end) {
    const first = Number(start);
    const last = Number(end);
    if (!Number.isFinite(first) || !Number.isFinite(last)) {
        return 'Tie';
    }
    const placements = [];
    for (let place = first; place <= last && place <= 5; place += 1) {
        placements.push(placementNameForNumber(place));
    }
    return `${placements.filter(Boolean).join('-')} Tie`;
}

function placementNumberFromLabel(value) {
    const normalized = clean(value);
    if (normalized === 'NBQ') {
        return 5;
    }
    const number = Number(normalized);
    return Number.isFinite(number) ? number : NaN;
}

function tiePlacementRange(label) {
    const parts = String(label || '').replace(' Tie', '').split('-').filter(Boolean);
    if (parts.length === 0) {
        return { start: NaN, end: NaN };
    }
    return {
        start: placementNumberFromLabel(parts[0]),
        end: placementNumberFromLabel(parts[parts.length - 1]),
    };
}

function recomputeFinalPlacements(group) {
    if (!group.finalDraw || !Array.isArray(group.finalDraw.courses)) {
        return group;
    }

    const finalRows = finalsRowsForGroup(group);
    const incomplete = finalRows.some((row) => !hasScoreValue(row.hound.finalScore) && !row.hound.finalOutcome);
    const prelimByEntry = new Map();
    groupScoreRows(group).forEach((row) => {
        const prelimScore = Number(row.score);
        if (hasScoreValue(row.score) && !row.outcome && Number.isFinite(prelimScore)) {
            prelimByEntry.set(row.hound.entryId, prelimScore);
        }
    });

    const finals = incomplete ? [] : finalRows
        .filter((row) => hasScoreValue(row.hound.finalScore) && !row.hound.finalOutcome && prelimByEntry.has(row.hound.entryId))
        .map((row) => ({
            entryId: row.hound.entryId,
            hound: row.hound,
            total: prelimByEntry.get(row.hound.entryId) + Number(row.hound.finalScore),
        }))
        .filter((row) => Number.isFinite(row.total))
        .sort((a, b) => b.total - a.total);

    const placementByEntry = new Map();
    const qualifyingMinimum = placementQualifyingMinimum(judgeCountForGroup(readForm(), group));
    finalPlacementPartitions(finals, group).forEach((partition) => {
        assignFinalPlacementLabels(partition, placementByEntry, qualifyingMinimum);
    });
    resolveCompletedTieBreaks(finals, placementByEntry);

    return {
        ...group,
        finalDraw: {
            ...group.finalDraw,
            courses: group.finalDraw.courses.map((course) => ({
                ...course,
                hounds: (course.hounds || []).map((hound) => ({
                    ...hound,
                    combinedScore: !incomplete && hasScoreValue(hound.finalScore) && prelimByEntry.has(hound.entryId) && Number.isFinite(Number(hound.finalScore))
                        ? String(prelimByEntry.get(hound.entryId) + Number(hound.finalScore))
                        : '',
                    placement: placementByEntry.get(hound.entryId) || '',
                    tieBreakResolvedPlacement: placementByEntry.get(hound.entryId) && !String(placementByEntry.get(hound.entryId)).includes('Tie')
                        ? placementByEntry.get(hound.entryId)
                        : '',
                })),
            })),
        },
    };
}

function finalPlacementPartitions(finals, group) {
    if (!group.mixedStake) {
        return [finals];
    }
    const partitions = new Map();
    finals.forEach((row) => {
        const stakeKey = clean(row.hound.stake || group.stake || 'Mixed');
        if (!partitions.has(stakeKey)) {
            partitions.set(stakeKey, []);
        }
        partitions.get(stakeKey).push(row);
    });
    return [...partitions.values()];
}

function placementQualifyingMinimum(judgeCount = 1) {
    return Math.max(1, Number(judgeCount || 1)) * 100;
}

function assignFinalPlacementLabels(finals, placementByEntry, qualifyingMinimum = 100) {
    const qualifyingFinals = finals.filter((row) => Number(row.total) >= qualifyingMinimum);
    const totalPositions = new Map();
    qualifyingFinals.forEach((row, index) => {
        if (!totalPositions.has(row.total)) {
            totalPositions.set(row.total, []);
        }
        totalPositions.get(row.total).push(index + 1);
    });

    qualifyingFinals.forEach((row, index) => {
        const positions = totalPositions.get(row.total) || [];
        if (positions.length > 1 && positions[0] <= 5) {
            placementByEntry.set(row.entryId, placementTieLabel(positions[0], positions[positions.length - 1]));
        } else if (index < 4) {
            placementByEntry.set(row.entryId, String(index + 1));
        } else if (index === 4) {
            placementByEntry.set(row.entryId, 'NBQ');
        }
    });
}

function resolveCompletedTieBreaks(finals, placementByEntry) {
    const tieGroups = new Map();
    finals.forEach((row) => {
        const placement = placementByEntry.get(row.entryId) || '';
        if (!placement.includes('Tie')) {
            return;
        }
        const key = `${placement}|${row.total}|${clean(row.hound.stake || '')}`;
        if (!tieGroups.has(key)) {
            tieGroups.set(key, {
                label: placement,
                total: row.total,
                rows: [],
            });
        }
        tieGroups.get(key).rows.push(row);
    });

    tieGroups.forEach((tie) => {
        const activeRows = tie.rows.filter((row) => !row.hound.tieBreakOutcome);
        const outcomeRows = tie.rows
            .filter((row) => row.hound.tieBreakOutcome)
            .sort(compareTieBreakOutcomeRows);
        const complete = tie.rows.every((row) => hasScoreValue(row.hound.tieBreakScore) || row.hound.tieBreakOutcome)
            || (activeRows.length === 1 && outcomeRows.length > 0);
        if (!complete) {
            return;
        }
        const scored = tie.rows
            .filter((row) => hasScoreValue(row.hound.tieBreakScore) && !row.hound.tieBreakOutcome)
            .map((row) => ({
                entryId: row.entryId,
                score: Number(row.hound.tieBreakScore),
            }))
            .filter((row) => Number.isFinite(row.score))
            .sort((a, b) => b.score - a.score);

        const { start, end } = tiePlacementRange(tie.label);
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
            return;
        }

        if (activeRows.length === 1 && scored.length === 0) {
            placementByEntry.set(activeRows[0].entryId, start <= 4 ? String(start) : (start === 5 ? 'NBQ' : ''));
            outcomeRows.forEach((row, index) => {
                const placementNumber = start + index + 1;
                if (placementNumber <= 4) {
                    placementByEntry.set(row.entryId, String(placementNumber));
                } else if (placementNumber === 5) {
                    placementByEntry.set(row.entryId, 'NBQ');
                }
            });
            return;
        }

        let rankOffset = 0;
        while (rankOffset < scored.length) {
            const score = scored[rankOffset].score;
            const sameScoreRows = scored.slice(rankOffset).filter((row) => row.score === score);
            const placementStart = start + rankOffset;
            if (sameScoreRows.length > 1) {
                const placementEnd = Math.min(end, placementStart + sameScoreRows.length - 1);
                sameScoreRows.forEach((row) => placementByEntry.set(row.entryId, placementTieLabel(placementStart, placementEnd)));
                rankOffset += sameScoreRows.length;
                continue;
            }
            const row = scored[rankOffset];
            if (placementStart <= 4) {
                placementByEntry.set(row.entryId, String(placementStart));
            } else if (placementStart === 5) {
                placementByEntry.set(row.entryId, 'NBQ');
            } else {
                placementByEntry.set(row.entryId, '');
            }
            rankOffset += 1;
        }
        outcomeRows.forEach((row, index) => {
            const placementNumber = start + scored.length + index;
            if (placementNumber <= 4) {
                placementByEntry.set(row.entryId, String(placementNumber));
            } else if (placementNumber === 5) {
                placementByEntry.set(row.entryId, 'NBQ');
            }
        });
    });
}

function compareTieBreakOutcomeRows(a, b) {
    if (a.hound.tieBreakOutcome === 'forfeit' && b.hound.tieBreakOutcome === 'forfeit') {
        const orderA = Number(a.hound.tieBreakForfeitOrder || 999);
        const orderB = Number(b.hound.tieBreakForfeitOrder || 999);
        if (orderA !== orderB) {
            return orderB - orderA;
        }
    }
    if (a.hound.tieBreakOutcome === 'forfeit' && b.hound.tieBreakOutcome !== 'forfeit') {
        return 1;
    }
    if (a.hound.tieBreakOutcome !== 'forfeit' && b.hound.tieBreakOutcome === 'forfeit') {
        return -1;
    }
    return String(a.hound.callName || a.hound.registeredName || '').localeCompare(String(b.hound.callName || b.hound.registeredName || ''), undefined, { numeric: true, sensitivity: 'base' });
}

function updatePrelimScore(entryId, changes) {
    const trial = readForm();
    if (!trial.preliminaryDraw || !Array.isArray(trial.preliminaryDraw.groups)) {
        showMessage(document.getElementById('scoringMessage'), 'Build the preliminary draw before entering scores.', 'warning');
        return;
    }
    if (trial.scorebook && trial.scorebook.prelimsLocked) {
        showMessage(document.getElementById('scoringMessage'), 'Preliminary scores are locked. Unlock prelims before making a correction.', 'warning');
        render();
        return;
    }

    const targetGroupBefore = trial.preliminaryDraw.groups.find((group) => (
        (group.courses || []).some((course) => (course.hounds || []).some((hound) => hound.entryId === entryId))
    ));
    const targetGroupId = targetGroupBefore ? targetGroupBefore.id : '';
    const wasComplete = targetGroupBefore ? prelimGroupCompleteForFinals(targetGroupBefore, trial) : false;

    trial.preliminaryDraw = {
        ...trial.preliminaryDraw,
        groups: trial.preliminaryDraw.groups.map((group) => {
            const judgeCount = judgeCountForGroup(trial, group);
            return {
                ...group,
                courses: (group.courses || []).map((course) => ({
                    ...course,
                    hounds: (course.hounds || []).map((hound) => {
                    if (hound.entryId !== entryId) {
                        return hound;
                    }
                    const next = { ...hound };
                    if ('score' in changes) {
                        const value = String(changes.score || '').trim();
                        next.prelimScore = value === '' ? '' : value;
                        if (value) {
                            next.prelimOutcome = '';
                        }
                    }
                    if ('judge1' in changes) {
                        next.prelimJudge1Score = String(changes.judge1 || '').trim();
                        next.prelimScore = computedJudgeTotal(next.prelimJudge1Score, next.prelimJudge2Score, judgeCount);
                        if (next.prelimScore) {
                            next.prelimOutcome = '';
                        }
                    }
                    if ('judge2' in changes) {
                        next.prelimJudge2Score = String(changes.judge2 || '').trim();
                        next.prelimScore = computedJudgeTotal(next.prelimJudge1Score, next.prelimJudge2Score, judgeCount);
                        if (next.prelimScore) {
                            next.prelimOutcome = '';
                        }
                    }
                    if ('outcome' in changes) {
                        next.prelimOutcome = changes.outcome || '';
                        if (next.prelimOutcome) {
                            next.prelimScore = '';
                            next.prelimJudge1Score = '';
                            next.prelimJudge2Score = '';
                        }
                    }
                    if ('notes' in changes) {
                        next.prelimScoreNotes = changes.notes || '';
                    }
                    next.prelimScoredAt = new Date().toISOString();
                    return next;
                    }),
                })),
            };
        }),
    };
    upsertTrial(trial);
    saveTrials();
    const targetGroupAfter = (trial.preliminaryDraw.groups || []).find((group) => group.id === targetGroupId);
    if (targetGroupAfter && !wasComplete && prelimGroupCompleteForFinals(targetGroupAfter, trial) && !targetGroupAfter.finalDraw) {
        promptAfterPrelimStakeComplete(targetGroupAfter);
        return;
    }
    render();
}

function promptAfterPrelimStakeComplete(group) {
    const breed = breedLabel(group.breed || '');
    const stake = group.stake || runGroupStakeForEntry(group) || '';
    showTrialActionModal({
        title: 'Preliminary Scoring Complete',
        eyebrow: `${breed} | ${stake}`,
        message: 'All required preliminary judge scores are entered for this stake. You can draw finals now and then print the score sheet for posting.',
        primaryText: 'Draw Finals',
        secondaryText: 'Not Now',
    }).then(async (drawNow) => {
        const title = `${breed} ${stake}`.trim();
        if (!drawNow) {
            showMessage(document.getElementById('scoringMessage'), `${title} prelim scoring is complete. Draw finals when ready.`, 'success');
            render();
            return;
        }
        await buildFinalsDrawForGroup(group.id);
    });
}

function showTrialActionModal({ title, eyebrow, message, primaryText = 'Continue', secondaryText = 'Cancel', input = null }) {
    return new Promise((resolve) => {
        const existing = document.querySelector('.trial-action-modal-backdrop');
        if (existing) {
            existing.remove();
        }
        const backdrop = document.createElement('div');
        backdrop.className = 'trial-action-modal-backdrop';
        const modal = document.createElement('div');
        modal.className = 'trial-action-modal';

        const eyebrowEl = document.createElement('div');
        eyebrowEl.className = 'trial-action-modal-eyebrow';
        eyebrowEl.textContent = eyebrow || '';
        const titleEl = document.createElement('h2');
        titleEl.textContent = title || 'Ready';
        const messageEl = document.createElement('p');
        messageEl.textContent = message || '';
        let inputEl = null;
        if (input) {
            inputEl = document.createElement('input');
            inputEl.className = 'trial-action-modal-input';
            inputEl.type = input.type || 'text';
            inputEl.value = input.value || '';
            inputEl.placeholder = input.placeholder || '';
            if (input.min !== undefined) {
                inputEl.min = input.min;
            }
            if (input.max !== undefined) {
                inputEl.max = input.max;
            }
            if (input.step !== undefined) {
                inputEl.step = input.step;
            }
        }

        const actions = document.createElement('div');
        actions.className = 'trial-action-modal-actions';
        const secondary = document.createElement('button');
        secondary.type = 'button';
        secondary.className = 'secondary';
        secondary.textContent = secondaryText;
        const primary = document.createElement('button');
        primary.type = 'button';
        primary.textContent = primaryText;
        actions.append(secondary, primary);

        const close = (value) => {
            backdrop.remove();
            resolve(inputEl && value ? inputEl.value : value);
        };
        primary.addEventListener('click', () => close(true));
        secondary.addEventListener('click', () => close(false));
        if (inputEl) {
            inputEl.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    close(true);
                }
                if (event.key === 'Escape') {
                    close(false);
                }
            });
        }
        backdrop.addEventListener('click', (event) => {
            if (event.target === backdrop) {
                close(false);
            }
        });
        modal.append(eyebrowEl, titleEl, messageEl);
        if (inputEl) {
            modal.appendChild(inputEl);
        }
        modal.appendChild(actions);
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        (inputEl || primary).focus();
        if (inputEl) {
            inputEl.select();
        }
    });
}

function showTrialConfirm({ title = 'Confirm Action', eyebrow = 'Please Confirm', message = '', primaryText = 'Continue', secondaryText = 'Cancel' } = {}) {
    return showTrialActionModal({ title, eyebrow, message, primaryText, secondaryText });
}

function showTrialPrompt({ title = 'Input Needed', eyebrow = 'Please Enter', message = '', defaultValue = '', primaryText = 'Continue', secondaryText = 'Cancel', inputType = 'text', min, max, step } = {}) {
    return showTrialActionModal({
        title,
        eyebrow,
        message,
        primaryText,
        secondaryText,
        input: {
            type: inputType,
            value: defaultValue,
            min,
            max,
            step,
        },
    });
}

function markPrelimScoringComplete() {
    const trial = readForm();
    if (!trial.preliminaryDraw || !Array.isArray(trial.preliminaryDraw.groups)) {
        showMessage(document.getElementById('scoringMessage'), 'Build the preliminary draw before marking scores complete.', 'warning');
        return;
    }

    const rows = (trial.preliminaryDraw.groups || []).flatMap((group) => prelimScoreRequirementsForGroup(group, trial));
    const missing = rows.filter((row) => !row.complete);
    if (missing.length > 0) {
        showMessage(document.getElementById('scoringMessage'), `${missing.length} preliminary score row${missing.length === 1 ? '' : 's'} still need required judge scores or an outcome.`, 'warning');
        return;
    }

    trial.scorebook = {
        ...(trial.scorebook || {}),
        prelimComplete: true,
        prelimsLocked: true,
        prelimCompletedAt: new Date().toISOString(),
    };
    upsertTrial(trial);
    saveTrials();
    showMessage(document.getElementById('scoringMessage'), 'Preliminary scores marked complete and locked.', 'success');
    render();
}

function togglePrelimLock() {
    const trial = readForm();
    if (!trial || !trial.id) {
        return;
    }
    trial.scorebook = {
        ...(trial.scorebook || {}),
        prelimsLocked: !(trial.scorebook && trial.scorebook.prelimsLocked),
    };
    upsertTrial(trial);
    saveTrials();
    showMessage(
        document.getElementById('scoringMessage'),
        trial.scorebook.prelimsLocked ? 'Preliminary scores locked.' : 'Preliminary scores unlocked for corrections.',
        trial.scorebook.prelimsLocked ? 'success' : 'warning',
    );
    render();
}

function toggleFinalsLock() {
    const trial = readForm();
    if (!trial || !trial.id) {
        return;
    }
    trial.scorebook = {
        ...(trial.scorebook || {}),
        finalsLocked: !(trial.scorebook && trial.scorebook.finalsLocked),
    };
    upsertTrial(trial);
    saveTrials();
    showMessage(
        document.getElementById('scoringMessage'),
        trial.scorebook.finalsLocked ? 'Finals scores locked.' : 'Finals scores unlocked for corrections.',
        trial.scorebook.finalsLocked ? 'success' : 'warning',
    );
    render();
}

function hasScoreValue(value) {
    return value !== undefined && value !== null && String(value).trim() !== '';
}

function populateAdminPreliminaryScores() {
    const trial = readForm();
    if (!trial || !trial.id) {
        showMessage(adminTestMessage, 'Choose or create a trial before populating scores.', 'warning');
        return;
    }

    if (!trial.preliminaryDraw || !Array.isArray(trial.preliminaryDraw.groups) || trial.preliminaryDraw.groups.length === 0) {
        showMessage(adminTestMessage, 'Build the preliminary draw before populating scores.', 'warning');
        return;
    }

    let scored = 0;
    let outcomes = 0;
    trial.preliminaryDraw = {
        ...trial.preliminaryDraw,
        groups: trial.preliminaryDraw.groups.map((group) => {
            const judgeCount = judgeCountForGroup(trial, group);
            return {
                ...group,
                courses: (group.courses || []).map((course) => ({
                    ...course,
                    hounds: (course.hounds || []).map((hound) => {
                        const outcome = randomAdminScoreOutcome();
                        const next = {
                            ...hound,
                            prelimScoredAt: new Date().toISOString(),
                        };
                        if (outcome) {
                            outcomes += 1;
                            next.prelimJudge1Score = '';
                            next.prelimJudge2Score = '';
                            next.prelimScore = '';
                            next.prelimOutcome = outcome.value;
                            next.prelimScoreNotes = outcome.note;
                        } else {
                            scored += 1;
                            const scores = randomAdminJudgeScores(judgeCount);
                            next.prelimJudge1Score = String(scores.judge1);
                            next.prelimJudge2Score = scores.judge2 === '' ? '' : String(scores.judge2);
                            next.prelimScore = String(scores.total);
                            next.prelimOutcome = '';
                            next.prelimScoreNotes = '';
                        }
                        return next;
                    }),
                })),
            };
        }),
    };
    trial.scorebook = {
        ...(trial.scorebook || {}),
        prelimComplete: false,
        adminScoresPopulatedAt: new Date().toISOString(),
    };
    upsertTrial(trial);
    saveTrials();
    showMessage(adminTestMessage, `Populated ${scored} preliminary score${scored === 1 ? '' : 's'}${outcomes ? ` and ${outcomes} outcome${outcomes === 1 ? '' : 's'}` : ''}.`, 'success');
    switchTab('scoring');
    render();
}

function populateAdminFinalsScores() {
    const trial = readForm();
    if (!trial || !trial.id) {
        showMessage(adminTestMessage, 'Choose or create a trial before populating finals scores.', 'warning');
        return;
    }

    if (!trial.preliminaryDraw || !Array.isArray(trial.preliminaryDraw.groups) || trial.preliminaryDraw.groups.length === 0) {
        showMessage(adminTestMessage, 'Build the preliminary draw before populating finals scores.', 'warning');
        return;
    }

    const groupsWithFinals = trial.preliminaryDraw.groups.filter((group) => group.finalDraw && Array.isArray(group.finalDraw.courses));
    if (groupsWithFinals.length === 0) {
        showMessage(adminTestMessage, 'Build finals draws before populating finals scores.', 'warning');
        return;
    }

    let scored = 0;
    let outcomes = 0;
    trial.preliminaryDraw = {
        ...trial.preliminaryDraw,
        groups: trial.preliminaryDraw.groups.map((group) => {
            if (!group.finalDraw || !Array.isArray(group.finalDraw.courses)) {
                return group;
            }

            const judgeCount = judgeCountForGroup(trial, group);
            const updatedGroup = {
                ...group,
                finalDraw: {
                    ...group.finalDraw,
                    courses: group.finalDraw.courses.map((course) => ({
                        ...course,
                        hounds: (course.hounds || []).map((hound) => {
                            const outcome = randomAdminScoreOutcome();
                            const next = {
                                ...hound,
                                finalScoredAt: new Date().toISOString(),
                            };
                            if (outcome) {
                                outcomes += 1;
                                next.finalJudge1Score = '';
                                next.finalJudge2Score = '';
                                next.finalScore = '';
                                next.finalOutcome = outcome.value;
                            } else {
                                scored += 1;
                                const scores = randomAdminJudgeScores(judgeCount);
                                next.finalJudge1Score = String(scores.judge1);
                                next.finalJudge2Score = scores.judge2 === '' ? '' : String(scores.judge2);
                                next.finalScore = String(scores.total);
                                next.finalOutcome = '';
                            }
                            return next;
                        }),
                    })),
                },
            };
            return recomputeFinalPlacements(updatedGroup);
        }),
    };
    trial.scorebook = {
        ...(trial.scorebook || {}),
        adminFinalScoresPopulatedAt: new Date().toISOString(),
    };
    upsertTrial(trial);
    saveTrials();
    showMessage(adminTestMessage, `Populated ${scored} finals score${scored === 1 ? '' : 's'}${outcomes ? ` and ${outcomes} outcome${outcomes === 1 ? '' : 's'}` : ''}.`, 'success');
    switchTab('scoring');
    render();
}

function randomAdminPrelimScore() {
    // Test scores should feel like a normal trial: clustered around 75 with small movement.
    const centered = 75 + secureRandomInt(7) - 3;
    const occasionalNudge = secureRandomInt(10) === 0 ? secureRandomInt(5) - 2 : 0;
    return clampNumber(centered + occasionalNudge, 68, 82);
}

function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function randomAdminJudgeScores(judgeCount = 2) {
    const judge1 = randomAdminPrelimScore();
    if (judgeCount < 2) {
        return { judge1, judge2: '', total: judge1 };
    }
    const closeOffset = secureRandomInt(7) - 3;
    const rareWiderOffset = secureRandomInt(25) === 0 ? secureRandomInt(5) - 2 : 0;
    const judge2 = clampNumber(judge1 + closeOffset + rareWiderOffset, 68, 82);
    return { judge1, judge2, total: judge1 + judge2 };
}

function judgeCountForGroup(trial, group) {
    const runPlanRow = (trial.runPlan || []).find((row) => clean(row.breed) === clean(group.breed));
    if (!runPlanRow) {
        return 1;
    }
    return [runPlanRow.judge1, runPlanRow.judge2].filter((value) => String(value || '').trim()).length || 1;
}

function judgeCountForBreed(trial, breed) {
    const runPlanRow = (trial.runPlan || []).find((row) => clean(row.breed) === clean(breed));
    if (!runPlanRow) {
        return 1;
    }
    return [runPlanRow.judge1, runPlanRow.judge2].filter((value) => String(value || '').trim()).length || 1;
}

function judgeCountForRunoffItem(trial, item) {
    if (item && item.group) {
        return judgeCountForGroup(trial, item.group);
    }
    return judgeCountForBreed(trial, item ? item.breed : '');
}

function randomAdminScoreOutcome() {
    const roll = secureRandomInt(500);
    if (roll < 2) {
        return { value: 'excused', note: 'Admin test excusal' };
    }
    if (roll < 3) {
        return { value: 'dismissed', note: 'Admin test dismissal' };
    }
    if (roll < 4) {
        return { value: 'disqualified', note: 'Admin test DQ' };
    }
    if (roll < 6) {
        return { value: 'forfeit', note: 'Admin test forfeit' };
    }
    if (roll < 8) {
        return { value: 'pull', note: 'Admin test pull' };
    }
    return null;
}

function formatTimestamp(value) {
    if (!value) {
        return '';
    }
    return new Date(value).toLocaleString();
}

function renderEntryTrialTargets() {
    const container = document.getElementById('entryTrialTargets');
    if (!container) {
        return;
    }

    container.innerHTML = '';

    const targetTrials = getNearbyEntryTargetTrials();

    if (targetTrials.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Create an active trial first.';
        container.appendChild(empty);
        return;
    }

    targetTrials.forEach((trial) => {
        const label = document.createElement('label');
        label.className = 'switch';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = trial.id;
        input.checked = trial.id === getActiveTrialId();

        const text = document.createElement('span');
        text.textContent = `${trial.trialName || 'Untitled trial'} ${formatDateRange(trial.startsOn, trial.endsOn) || ''}${trial.id === getActiveTrialId() ? ' (active)' : ''}`.trim();

        label.append(input, text);
        container.appendChild(label);
    });
}

function buildRunPlanFromEntries() {
    const trial = readForm();
    const entries = trial.entries || [];
    if (entries.length === 0) {
        showMessage(runPlanMessage, 'Enter hounds before building a run plan.', 'warning');
        return;
    }

    trial.runPlan = buildRunPlanRowsForTrial(trial);
    trial.runPlanEntriesFingerprint = entrySetupFingerprint(trial.entries || []);

    upsertTrial(trial);
    showMessage(runPlanMessage, `Built ${trial.runPlan.length} worker sheet row${trial.runPlan.length === 1 ? '' : 's'} from entries.`, 'success');
    render();
}

function buildRunPlanRowsForTrial(trial) {
    const existing = new Map((trial.runPlan || []).map((row) => [runPlanKey(row.breed), row]));
    const rows = groupEntriesForRunPlan(trial.entries || []).map((group, index) => ({
        id: existing.get(group.key)?.id || crypto.randomUUID(),
        breed: group.breed,
        entryCount: group.entries.length,
        runOrder: existing.get(group.key)?.runOrder || index + 1,
        judge1: existing.get(group.key)?.judge1 || '',
        judge2: existing.get(group.key)?.judge2 || '',
        lureOperator: existing.get(group.key)?.lureOperator || '',
        huntmaster: existing.get(group.key)?.huntmaster || '',
    }));
    return applyPremiumJudgeAssignmentsToRunPlan(trial, rows);
}

function groupEntriesForRunPlan(entries) {
    const groups = new Map();
    entries.forEach((entry) => {
        const breed = runGroupBreedForEntry(entry);
        const key = runPlanKey(breed);
        if (!groups.has(key)) {
            groups.set(key, { key, breed, entries: [] });
        }
        groups.get(key).entries.push(entry);
    });

    return Array.from(groups.values()).sort((a, b) => {
        return a.breed.localeCompare(b.breed, undefined, { numeric: true, sensitivity: 'base' });
    });
}

function runPlanKey(breed) {
    return `${breed || ''}`;
}

function canonicalPremiumBreedCode(value) {
    const key = clean(value);
    return asfaPremiumBreedAliases[key] || key;
}

function premiumCodeForRunGroup(breed) {
    const normalized = clean(breed);
    if (normalized === 'SINGLES') {
        return 'SINGLES';
    }
    if (normalized.startsWith('LCI')) {
        return 'LCI';
    }
    if (asfaProvisionalBreedCodes.includes(normalized)) {
        return 'PROV';
    }
    return canonicalPremiumBreedCode(normalized);
}

function asfaEntryEligibilityProblem(hound, className, association = 'ASFA') {
    if (clean(association) !== 'ASFA') {
        return '';
    }
    const breed = clean(hound && hound.breed);
    const stake = clean(className);
    if (isLciClassName(className)) {
        if (!breed.startsWith('LCI')) {
            return `${breedLabel(hound && hound.breed)} is a regular breed hound. LCI entries must use LCI Small, LCI Large, or LCI Sighthound Mix as the hound breed.`;
        }
        return '';
    }
    if (breed.startsWith('LCI')) {
        return '';
    }
    if (asfaRegularBreedCodes.includes(breed)) {
        if (stake === 'PROVISIONAL') {
            return `${breedLabel(hound.breed)} is an ASFA regular breed and should not be entered in Provisional.`;
        }
        return '';
    }
    if (asfaProvisionalBreedCodes.includes(breed)) {
        if (stake === 'PROVISIONAL' || stake === 'SINGLES') {
            return '';
        }
        return `${breedLabel(hound.breed)} is an ASFA provisional breed. Enter it in Provisional or Singles.`;
    }
    return `${breedLabel(hound && hound.breed)} is not currently listed as an ASFA regular or provisional breed for regular stakes.`;
}

function isLciClassName(className) {
    return clean(className).startsWith('LCI');
}

function isLciEntryData(breed, className = '') {
    return clean(breed).startsWith('LCI') || isLciClassName(className);
}

function premiumDayNameForTrial(trial) {
    if (!trial || !trial.startsOn) {
        return '';
    }
    return new Date(`${trial.startsOn}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
}

function parsePremiumJudgeAssignments(text) {
    const lines = String(text || '')
        .replace(/\r/g, '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    const judges = [];
    const assignmentsByDay = {};
    let currentDay = 'All';
    let headers = [];
    let pendingJudge = '';

    lines.forEach((line) => {
        const dayMatch = line.match(/^(Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday)\b/i);
        if (dayMatch) {
            currentDay = dayMatch[1][0].toUpperCase() + dayMatch[1].slice(1).toLowerCase();
            assignmentsByDay[currentDay] = assignmentsByDay[currentDay] || {};
            headers = [];
            pendingJudge = '';
            return;
        }

        const judgeMatch = line.match(/^(.+?)\s+-\s+/);
        if (judgeMatch && !line.toLowerCase().startsWith('judge ')) {
            judges.push(judgeMatch[1].trim());
        }

        const cells = line.includes('\t')
            ? line.split('\t').map((cell) => cell.trim())
            : (clean(line).startsWith('JUDGE')
                ? line.split(/\s+/).map((cell) => cell.trim()).filter(Boolean)
                : line.split(/\s{2,}|,/).map((cell) => cell.trim()).filter(Boolean));
        if (cells.length > 2 && clean(cells[0]) === 'JUDGE') {
            headers = cells.slice(1).map(canonicalPremiumBreedCode);
            assignmentsByDay[currentDay] = assignmentsByDay[currentDay] || {};
            return;
        }

        if (!headers.length) {
            return;
        }

        const hasMarks = cells.slice(1).some((cell) => /^[SX*]$/i.test(cell));
        if (!hasMarks && cells.length <= 2) {
            pendingJudge = pendingJudge ? `${pendingJudge} ${cells.join(' ')}`.trim() : cells.join(' ');
            return;
        }

        const judgeName = pendingJudge ? `${pendingJudge} ${cells[0] || ''}`.trim() : cells[0];
        pendingJudge = '';
        if (!judgeName || cells.length < 2) {
            return;
        }
        judges.push(judgeName);
        cells.slice(1).forEach((mark, index) => {
            if (!/^[SX*]$/i.test(mark)) {
                return;
            }
            const code = headers[index];
            if (!code) {
                return;
            }
            assignmentsByDay[currentDay][code] = assignmentsByDay[currentDay][code] || [];
            assignmentsByDay[currentDay][code].push({ judge: judgeName, mark: mark.toUpperCase() });
        });
    });

    return {
        judges: uniqueNames(judges),
        assignmentsByDay,
    };
}

function premiumAssignmentsForTrialDay(trial) {
    const stored = trial && trial.premiumJudgeAssignments;
    if (!stored || !stored.assignmentsByDay) {
        return {};
    }
    const dayName = premiumDayNameForTrial(trial);
    return stored.assignmentsByDay[dayName]
        || stored.assignmentsByDay.All
        || Object.values(stored.assignmentsByDay)[0]
        || {};
}

function applyPremiumJudgeAssignmentsToRunPlan(trial, rows) {
    const assignments = premiumAssignmentsForTrialDay(trial);
    if (!Object.keys(assignments).length) {
        return rows;
    }
    return rows.map((row) => {
        const code = premiumCodeForRunGroup(row.breed);
        const judges = uniqueNames((assignments[code] || []).map((assignment) => assignment.judge)).slice(0, 2);
        if (judges.length === 0) {
            return row;
        }
        return {
            ...row,
            judge1: judges[0] || row.judge1 || '',
            judge2: judges[1] || '',
            premiumJudgeCode: code,
        };
    });
}

function refreshRunPlanFromPremiumIfLoaded(trial) {
    if (!trial || !trial.premiumJudgeAssignments || !(trial.entries || []).length) {
        return trial;
    }
    return {
        ...trial,
        runPlan: buildRunPlanRowsForTrial(trial),
        runPlanEntriesFingerprint: entrySetupFingerprint(trial.entries || []),
    };
}

function importPremiumJudgeAssignments() {
    const textarea = document.getElementById('premiumJudgeAssignmentsText');
    const text = textarea ? textarea.value : '';
    if (!text.trim()) {
        showMessage(runPlanMessage, 'Paste the premium judge assignment table first.', 'warning');
        return;
    }

    const trial = readForm();
    const parsed = parsePremiumJudgeAssignments(text);
    const assignments = parsed.assignmentsByDay[premiumDayNameForTrial(trial)]
        || parsed.assignmentsByDay.All
        || Object.values(parsed.assignmentsByDay)[0]
        || {};
    if (Object.keys(assignments).length === 0) {
        showMessage(runPlanMessage, 'Could not find a usable judge grid. Try copying the premium table from a spreadsheet or PDF so the blank cells are preserved.', 'warning');
        return;
    }

    trial.premiumJudgeAssignments = {
        importedAt: new Date().toISOString(),
        sourceText: text,
        judges: parsed.judges,
        assignmentsByDay: parsed.assignmentsByDay,
    };
    trial.runPlan = buildRunPlanRowsForTrial(trial);
    trial.runPlanEntriesFingerprint = entrySetupFingerprint(trial.entries || []);
    parsed.judges.forEach((judgeName) => ensureJudgeInDatabaseAndTrial(judgeName, trial));
    upsertTrial(trial);
    saveTrials();
    const assigned = trial.runPlan.filter((row) => row.judge1 || row.judge2).length;
    const dayName = premiumDayNameForTrial(trial);
    const futureNote = (trial.entries || []).length ? '' : ' It will auto-apply as entries are added.';
    showMessage(runPlanMessage, `Saved ${parsed.judges.length} premium judge${parsed.judges.length === 1 ? '' : 's'} and assigned ${assigned} running-order row${assigned === 1 ? '' : 's'}${dayName ? ` for ${dayName}` : ''}.${futureNote}`, 'success');
    render();
}

function applySavedPremiumJudgeAssignments() {
    const trial = readForm();
    if (!trial.premiumJudgeAssignments) {
        showMessage(runPlanMessage, 'Save a premium judge matrix before applying it.', 'warning');
        return;
    }
    if (!(trial.entries || []).length) {
        showMessage(runPlanMessage, 'Premium matrix is saved. It will apply automatically once entries are added.', 'warning');
        return;
    }
    trial.runPlan = buildRunPlanRowsForTrial(trial);
    trial.runPlanEntriesFingerprint = entrySetupFingerprint(trial.entries || []);
    (trial.premiumJudgeAssignments.judges || []).forEach((judgeName) => ensureJudgeInDatabaseAndTrial(judgeName, trial));
    upsertTrial(trial);
    saveTrials();
    const assigned = trial.runPlan.filter((row) => row.judge1 || row.judge2).length;
    showMessage(runPlanMessage, `Applied saved premium matrix to ${assigned} running-order row${assigned === 1 ? '' : 's'}.`, 'success');
    render();
}

async function removeSavedPremiumJudgeAssignments() {
    const trial = readForm();
    if (!trial.premiumJudgeAssignments) {
        showMessage(runPlanMessage, 'No saved premium judge matrix is loaded.', 'warning');
        return;
    }
    const remove = await showTrialConfirm({
        title: 'Remove Premium Matrix',
        eyebrow: 'Judges & Assignments',
        message: 'Remove the saved premium judge matrix from this trial? Existing running-order judge names will stay until you edit or rebuild them.',
        primaryText: 'Remove Matrix',
    });
    if (!remove) {
        return;
    }
    trial.premiumJudgeAssignments = null;
    upsertTrial(trial);
    saveTrials();
    showMessage(runPlanMessage, 'Saved premium judge matrix removed from this trial.', 'success');
    render();
}

function previewPremiumJudgeGridImage(file) {
    const preview = document.getElementById('premiumJudgeGridPreview');
    if (!preview) {
        return;
    }
    preview.innerHTML = '';
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        const image = document.createElement('img');
        image.src = reader.result;
        image.alt = 'Premium judge assignment grid preview';
        const note = document.createElement('p');
        note.className = 'field-note';
        note.textContent = 'Image preview loaded. Automatic OCR for screenshots is the next step; for now, paste table text above so blank cells are preserved.';
        preview.append(image, note);
    };
    reader.readAsDataURL(file);
}

function clearPremiumJudgePasteAndPreview() {
    const textarea = document.getElementById('premiumJudgeAssignmentsText');
    if (textarea) {
        textarea.value = '';
    }
    const input = document.getElementById('premiumJudgeGridImage');
    if (input) {
        input.value = '';
    }
    const preview = document.getElementById('premiumJudgeGridPreview');
    if (preview) {
        preview.innerHTML = '';
    }
}

function renderRunPlan(trial) {
    const body = document.getElementById('runPlanTable');
    if (!body) {
        return;
    }

    renderPremiumJudgeAssignmentStatus(trial);
    body.innerHTML = '';
    const rows = sortedRunPlanRows(trial.runPlan || []);

    if (rows.length === 0) {
        selectedRunPlanRowId = '';
        renderSelectedRunPlanLabel(rows);
        const empty = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 8;
        cell.textContent = 'Build from entries after hounds are entered.';
        empty.appendChild(cell);
        body.appendChild(empty);
        return;
    }

    const judgeOptions = uniqueNames([...(trial.judges || []).map((judge) => judge.name), ...masterJudges.map((judge) => judge.name)]);
    const workerOptions = uniqueNames([...(trial.workers || []).map((worker) => worker.name), ...masterWorkers.map((worker) => worker.name)]);
    if (selectedRunPlanRowId && !rows.some((row) => row.id === selectedRunPlanRowId)) {
        selectedRunPlanRowId = '';
    }
    renderSelectedRunPlanLabel(rows);

    rows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.draggable = true;
        tr.dataset.runPlanId = row.id;
        tr.classList.toggle('selected-row', row.id === selectedRunPlanRowId);
        tr.addEventListener('click', (event) => {
            if (event.target.matches('input, select, button')) {
                return;
            }
            selectedRunPlanRowId = row.id;
            render();
        });
        tr.addEventListener('dragstart', (event) => {
            selectedRunPlanRowId = row.id;
            event.dataTransfer.setData('text/plain', row.id);
        });
        tr.addEventListener('dragover', (event) => {
            event.preventDefault();
        });
        tr.addEventListener('drop', (event) => {
            event.preventDefault();
            moveRunPlanRow(event.dataTransfer.getData('text/plain'), row.id);
        });

        tr.appendChild(runPlanMoveCell(row, index, rows.length));
        tr.appendChild(textCell(index + 1));
        tr.appendChild(textCell(displayBreedCode(row.breed)));
        tr.appendChild(textCell(row.entryCount));
        tr.appendChild(assignmentCell(row, 'judge1', judgeOptions, 'judge'));
        tr.appendChild(assignmentCell(row, 'judge2', judgeOptions, 'judge'));
        tr.appendChild(assignmentCell(row, 'lureOperator', workerOptions, 'Lure Operator'));
        tr.appendChild(assignmentCell(row, 'huntmaster', workerOptions, 'Huntmaster'));
        body.appendChild(tr);
    });
}

function renderPremiumJudgeAssignmentStatus(trial) {
    const status = document.getElementById('premiumJudgeAssignmentsStatus');
    if (!status) {
        return;
    }
    const stored = trial && trial.premiumJudgeAssignments;
    if (!stored) {
        status.textContent = 'No premium judge matrix loaded.';
        return;
    }
    const dayName = premiumDayNameForTrial(trial);
    const assignments = premiumAssignmentsForTrialDay(trial);
    const assignedCodes = Object.keys(assignments).length;
    status.textContent = `Premium matrix loaded ${formatTimestamp(stored.importedAt)} with ${(stored.judges || []).length} judge${(stored.judges || []).length === 1 ? '' : 's'} and ${assignedCodes} assignment column${assignedCodes === 1 ? '' : 's'}${dayName ? ` for ${dayName}` : ''}.`;
}

function runPlanMoveCell(row, index, rowCount) {
    const cell = document.createElement('td');
    cell.className = 'move-cell';
    if (row.id !== selectedRunPlanRowId) {
        return cell;
    }

    cell.appendChild(contextualMoveControls({
        upDisabled: index === 0,
        downDisabled: index === rowCount - 1,
        onUp: () => moveRunPlanRowByStep(row.id, -1),
        onDown: () => moveRunPlanRowByStep(row.id, 1),
        label: `Move ${row.breed}`,
    }));
    return cell;
}

function renderSelectedRunPlanLabel(rows = []) {
    const label = document.getElementById('selectedRunPlanLabel');
    if (!label) {
        return;
    }
    const row = rows.find((item) => item.id === selectedRunPlanRowId);
    label.textContent = row ? `Selected: ${row.breed}` : 'No breed selected';
}

function textCell(value) {
    const td = document.createElement('td');
    td.textContent = value || '';
    return td;
}

function courseHeaderRow(courseNumber, colspan) {
    const tr = document.createElement('tr');
    tr.className = 'score-course-header-row';
    const td = document.createElement('td');
    td.colSpan = colspan;
    td.textContent = `Course ${courseNumber}`;
    tr.appendChild(td);
    return tr;
}

function contextualMoveControls({ upDisabled = false, downDisabled = false, onUp, onDown, label = 'Move selected row' }) {
    const controls = document.createElement('div');
    controls.className = 'context-move-controls';
    controls.setAttribute('aria-label', label);

    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'secondary small icon-button';
    up.textContent = '\u2191';
    up.setAttribute('aria-label', 'Move up');
    up.title = 'Move up';
    up.dataset.help = 'Moves the selected item earlier in the running order.';
    up.disabled = upDisabled;
    up.addEventListener('click', (event) => {
        event.stopPropagation();
        onUp();
    });

    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'secondary small icon-button';
    down.textContent = '\u2193';
    down.setAttribute('aria-label', 'Move down');
    down.title = 'Move down';
    down.dataset.help = 'Moves the selected item later in the running order.';
    down.disabled = downDisabled;
    down.addEventListener('click', (event) => {
        event.stopPropagation();
        onDown();
    });

    controls.append(up, down);
    return controls;
}

function inputCell(row, key, type = 'text') {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.type = type;
    input.value = row[key] || '';
    input.addEventListener('change', () => updateRunPlanField(row.id, key, input.value));
    td.appendChild(input);
    return td;
}

function assignmentCell(row, key, options, role) {
    const td = document.createElement('td');
    const input = document.createElement('input');
    const listId = `${key}Options`;
    input.setAttribute('list', listId);
    input.value = row[key] || '';
    input.placeholder = 'Not assigned';
    input.addEventListener('change', () => updateRunPlanField(row.id, key, input.value, role));

    let datalist = document.getElementById(listId);
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = listId;
        document.body.appendChild(datalist);
    }
    datalist.innerHTML = '';
    options.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        datalist.appendChild(option);
    });

    td.appendChild(input);
    return td;
}

function updateRunPlanField(rowId, key, value, role = '') {
    const trial = readForm();
    trial.runPlan = (trial.runPlan || []).map((row) => row.id === rowId ? { ...row, [key]: key === 'runOrder' ? Number(value) || '' : value } : row);
    if (value && role) {
        if (role === 'judge') {
            ensureJudgeInDatabaseAndTrial(value, trial);
        } else {
            ensureWorkerInDatabaseAndTrial(value, role, trial);
        }
    }
    upsertTrial(trial);
    render();
}

function moveRunPlanRowByStep(rowId, step) {
    const trial = readForm();
    const rows = sortedRunPlanRows(trial.runPlan || []);
    const index = rows.findIndex((row) => row.id === rowId);
    const nextIndex = index + step;
    if (index < 0 || nextIndex < 0 || nextIndex >= rows.length) {
        return;
    }

    const [row] = rows.splice(index, 1);
    rows.splice(nextIndex, 0, row);
    selectedRunPlanRowId = rowId;
    saveRunPlanOrder(trial, rows);
}

function moveRunPlanRow(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) {
        return;
    }

    const trial = readForm();
    const rows = sortedRunPlanRows(trial.runPlan || []);
    const sourceIndex = rows.findIndex((row) => row.id === sourceId);
    const targetIndex = rows.findIndex((row) => row.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) {
        return;
    }

    const [row] = rows.splice(sourceIndex, 1);
    rows.splice(targetIndex, 0, row);
    selectedRunPlanRowId = sourceId;
    saveRunPlanOrder(trial, rows);
}

function moveSelectedRunPlanRow(step) {
    if (!selectedRunPlanRowId) {
        showMessage(runPlanMessage, 'Click a breed row first, then use the arrow buttons.', 'warning');
        return;
    }
    moveRunPlanRowByStep(selectedRunPlanRowId, step);
}

function saveRunPlanOrder(trial, rows) {
    trial.runPlan = rows.map((row, index) => ({
        ...row,
        runOrder: index + 1,
    }));
    upsertTrial(trial);
    render();
}

function sortedRunPlanRows(rows) {
    return [...rows].sort((a, b) => Number(a.runOrder || 0) - Number(b.runOrder || 0));
}

function uniqueNames(values) {
    return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

function ensureJudgeInDatabaseAndTrial(name, trial) {
    const cleanName = clean(name);
    let judge = masterJudges.find((item) => clean(item.name) === cleanName);
    if (!judge) {
        judge = { id: crypto.randomUUID(), name: name.trim(), number: '', email: '', phone: '', createdAt: new Date().toISOString() };
        masterJudges.unshift(judge);
        saveMasterJudges();
    }

    if (!(trial.judges || []).some((row) => row.judgeId === judge.id || clean(row.name) === cleanName)) {
        trial.judges = [...(trial.judges || []), { id: crypto.randomUUID(), judgeId: judge.id, name: judge.name, number: judge.number || '', assignment: 'Running Order' }];
    }
}

function ensureWorkerInDatabaseAndTrial(name, role, trial) {
    const cleanName = clean(name);
    let worker = masterWorkers.find((item) => clean(item.name) === cleanName);
    if (!worker) {
        worker = { id: crypto.randomUUID(), name: name.trim(), email: '', phone: '', notes: '', createdAt: new Date().toISOString() };
        masterWorkers.unshift(worker);
        saveMasterWorkers();
    }

    if (!(trial.workers || []).some((row) => (row.workerId === worker.id || clean(row.name) === cleanName) && row.role === role)) {
        trial.workers = [...(trial.workers || []), { id: crypto.randomUUID(), workerId: worker.id, name: worker.name, role, phone: worker.phone || '' }];
    }
}

function renderPrintableSheets(trial) {
    renderWorkerSheet(trial);
    renderJudgesMap(trial);
    renderRollCallSheet(trial);
    renderDrawSheet(trial);
}

function renderWorkerSheet(trial) {
    document.getElementById('workerSheetTitle').textContent = trialTitle(trial);
    const rows = sortedRunPlanRows(trial.runPlan || []);
    const body = document.getElementById('workerSheetTable');
    body.innerHTML = '';

    if (rows.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 10;
        td.textContent = 'No worker sheet rows yet.';
        tr.appendChild(td);
        body.appendChild(tr);
        return;
    }

    rows.forEach((row) => {
        const tr = document.createElement('tr');
        const stakeRuns = workerSheetStakeRuns(trial, row.breed);
        [
            row.runOrder,
            displayBreedCode(row.breed),
            row.entryCount,
            stakeRuns.mixed,
            stakeRuns.open,
            stakeRuns.fchExc,
            stakeRuns.vet,
            [row.judge1, row.judge2].filter(Boolean).join(' / '),
            row.lureOperator,
            row.huntmaster,
        ].forEach((value) => tr.appendChild(textCell(value)));
        body.appendChild(tr);
    });
}

function workerSheetStakeRuns(trial, breed) {
    const entries = entriesForRunGroupBreed(trial, breed);
    const mixedEligibility = mixedStakeEligibilityForEntries(entries, breed);
    const mixedActive = mixedStakeBreedEnabled(trial, breed) && mixedEligibility.eligible;
    if (mixedActive) {
        return {
            mixed: `${mixedEligibility.stakes.map(displayJudgeMapStake).join('/')} ${formatWorkerSheetRunCount(mixedEligibility.total)}`,
            open: '',
            fchExc: '',
            vet: '',
        };
    }

    const counts = {
        open: 0,
        fchExc: 0,
        vet: 0,
    };
    entries.forEach((entry) => {
        const stake = runGroupStakeForEntry(entry);
        const normalized = clean(stake);
        if (normalized === 'OPEN' || normalized === 'SINGLES') {
            counts.open += 1;
            return;
        }
        if (normalized === 'FIELDCHAMPION' || normalized === 'FCH' || normalized === 'EXCELLENT') {
            counts.fchExc += 1;
            return;
        }
        if (normalized === 'VETERAN') {
            counts.vet += 1;
        }
    });

    return {
        mixed: '',
        open: formatWorkerSheetRunCount(counts.open),
        fchExc: formatWorkerSheetRunCount(counts.fchExc),
        vet: formatWorkerSheetRunCount(counts.vet),
    };
}

function formatWorkerSheetRunCount(count) {
    if (!count) {
        return '';
    }
    return `${courseSizesForEntryCount(count).length}(${count})`;
}

function renderJudgesMap(trial) {
    const title = document.getElementById('judgesMapTitle');
    const body = document.getElementById('judgesMapTable');
    if (!title || !body) {
        return;
    }
    title.textContent = trialTitle(trial);
    body.innerHTML = '';

    const rows = judgesMapRows(trial);
    if (rows.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.textContent = 'No judge map rows yet.';
        tr.appendChild(td);
        body.appendChild(tr);
        return;
    }

    rows.forEach((row) => {
        const tr = document.createElement('tr');
        [
            row.runOrder,
            row.breed,
            row.stake,
            row.entryCount,
            row.courseBreakdown,
            row.judges,
        ].forEach((value) => tr.appendChild(textCell(value)));
        body.appendChild(tr);
    });
}

function judgesMapRows(trial) {
    const runRows = sortedRunPlanRows(trial.runPlan || []);
    return runRows.flatMap((runRow) => {
        const entries = (trial.entries || []).filter((entry) => clean(runGroupBreedForEntry(entry)) === clean(runRow.breed));
        const mixedEligibility = mixedStakeEligibilityForEntries(entries, runRow.breed);
        if (mixedStakeBreedEnabled(trial, runRow.breed) && mixedEligibility.eligible) {
            return [{
                runOrder: runRow.runOrder,
                breed: displayBreedCode(runRow.breed),
                stake: `Mixed (${mixedEligibility.stakes.map(displayJudgeMapStake).join('/')})`,
                entryCount: entries.length,
                courseBreakdown: formatJudgeMapCourseBreakdown(entries.length, false),
                judges: [runRow.judge1, runRow.judge2].filter(Boolean).join(' / '),
            }];
        }
        const stakeMap = new Map();
        entries.forEach((entry) => {
            const stake = runGroupStakeForEntry(entry) || 'Unassigned';
            const key = clean(stake) || 'UNASSIGNED';
            if (!stakeMap.has(key)) {
                stakeMap.set(key, { stake, entries: [] });
            }
            stakeMap.get(key).entries.push(entry);
        });

        return Array.from(stakeMap.values())
            .sort((a, b) => stakeSortOrder(a.stake) - stakeSortOrder(b.stake) || String(a.stake).localeCompare(String(b.stake)))
            .map((stakeRow) => ({
                runOrder: runRow.runOrder,
                breed: displayBreedCode(runRow.breed),
                stake: displayJudgeMapStake(stakeRow.stake),
                entryCount: stakeRow.entries.length,
                courseBreakdown: formatJudgeMapCourseBreakdown(stakeRow.entries.length, isQuasiBreedClass(runRow.breed) || isQuasiBreedClass(stakeRow.stake)),
                judges: [runRow.judge1, runRow.judge2].filter(Boolean).join(' / '),
            }));
    });
}

function stakeSortOrder(stake) {
    const normalized = clean(stake);
    if (normalized === 'OPEN' || normalized === 'SINGLES') {
        return 1;
    }
    if (normalized === 'FIELDCHAMPION' || normalized === 'FCH' || normalized === 'EXCELLENT') {
        return 2;
    }
    if (normalized === 'VETERAN') {
        return 3;
    }
    return 10;
}

function displayJudgeMapStake(stake) {
    const normalized = clean(stake);
    if (normalized === 'FIELDCHAMPION') {
        return 'FCh';
    }
    return stake || '';
}

function formatJudgeMapCourseBreakdown(count, fillCourses = false) {
    if (!count) {
        return '';
    }
    return courseSizesForEntryCount(count, fillCourses)
        .map((size, index) => `${index + 1}(${size})`)
        .join(' ');
}

function renderRollCallSheet(trial) {
    document.getElementById('rollCallTitle').textContent = trialTitle(trial);
    const body = document.getElementById('rollCallTable');
    body.innerHTML = '';
    const rows = sortRollCallEntries(trial.entries || []);

    if (rows.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.textContent = 'No entries yet.';
        tr.appendChild(td);
        body.appendChild(tr);
        return;
    }

    const callNameCounts = rows.reduce((counts, entry) => {
        const key = clean(entry.callName);
        if (key) {
            counts.set(key, (counts.get(key) || 0) + 1);
        }
        return counts;
    }, new Map());

    rows.forEach((entry) => {
        const tr = document.createElement('tr');
        if (entryNeedsDocuments(entry)) {
            tr.classList.add('roll-call-print-needs-documents');
        }
        const check = document.createElement('td');
        check.className = 'roll-call-check-cell';
        const box = document.createElement('span');
        box.className = 'print-checkbox';
        check.appendChild(box);
        tr.appendChild(check);
        const callNameKey = clean(entry.callName);
        const duplicateCallName = callNameKey && callNameCounts.get(callNameKey) > 1;
        const callName = duplicateCallName ? `${entry.callName || 'Unnamed'} (${entry.owner || 'Owner not listed'})` : entry.callName;
        const note = entryNeedsDocuments(entry) ? 'Documentation needed' : '';
        [callName, displayBreedCode(entry.breed), entry.className, note].forEach((value) => tr.appendChild(textCell(value)));
        body.appendChild(tr);
    });
}

function renderDrawSheet(trial) {
    const heading = document.getElementById('drawSheetHeading');
    const title = document.getElementById('drawSheetTitle');
    const template = document.getElementById('drawSheetTemplate');
    const container = document.getElementById('drawSheetGroups');
    if (!heading || !title || !template || !container) {
        return;
    }

    const association = trial.association || 'ASFA';
    const templateInfo = drawSheetTemplateInfo(association);
    heading.textContent = `${association} Draw Order Sheet`;
    title.textContent = trialTitle(trial);
    template.textContent = templateInfo;
    container.innerHTML = '';

    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'No preliminary draw has been built yet.';
        container.appendChild(empty);
        return;
    }

    sortDrawGroupsForPrint(draw.groups, trial).forEach((group) => {
        const block = document.createElement('div');
        block.className = 'draw-sheet-group';

        const heading = document.createElement('h3');
        heading.textContent = groupTitle(group);
        block.appendChild(heading);

        if (group.manualNote) {
            const note = document.createElement('p');
            note.className = 'draw-sheet-note';
            note.textContent = group.manualNote;
            block.appendChild(note);
        }

        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const header = document.createElement('tr');
        ['Course', 'Blanket', 'Hound', 'Breed', 'Stake', 'Owner/Handler', 'Notes'].forEach((label) => {
            const th = document.createElement('th');
            th.textContent = label;
            header.appendChild(th);
        });
        thead.appendChild(header);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        (group.courses || []).forEach((course) => {
            const hounds = [...(course.hounds || [])].sort((a, b) => Number(a.drawPosition || 0) - Number(b.drawPosition || 0));
            if (hounds.length === 0) {
                const tr = document.createElement('tr');
                tr.appendChild(textCell(course.number || ''));
                const td = document.createElement('td');
                td.colSpan = 6;
                td.textContent = 'No hounds in this course.';
                tr.appendChild(td);
                tbody.appendChild(tr);
                return;
            }

            hounds.forEach((hound) => {
                const tr = document.createElement('tr');
                const notes = [
                    group.mixedStake ? 'Mixed stake' : '',
                    hound.manuallyMoved ? 'Manual move' : '',
                ].filter(Boolean).join(' | ');
                [
                    course.number,
                    hound.blanketColor,
                    drawHoundName(hound),
                    hound.breed || group.breed,
                    hound.stake || group.stake,
                    hound.owner || '',
                    notes,
                ].forEach((value) => tr.appendChild(textCell(value)));
                tbody.appendChild(tr);
            });
        });

        table.appendChild(tbody);
        wrap.appendChild(table);
        block.appendChild(wrap);
        container.appendChild(block);
    });
}

function drawSheetTemplateInfo(association) {
    if (association === 'AKC') {
        return 'Template reference: AKC JERSC2 Lure Coursing Draw Order.';
    }
    if (association === 'ASFA') {
        return 'Template reference: ASFA SEC-05 Draw Order.';
    }
    return 'Template reference: AKC/ASFA draw order sheet.';
}

function sortDrawGroupsForPrint(groups, trial) {
    const runOrderByBreed = new Map((trial.runPlan || []).map((row) => [clean(row.breed), Number(row.runOrder || 999)]));
    const stakeOrder = ['Open', 'Excellent', 'Field Champion', 'FCH', 'Veteran', 'Singles', 'LCI'];

    return [...groups].sort((a, b) => {
        const breedOrderA = runOrderByBreed.get(clean(a.breed)) || 999;
        const breedOrderB = runOrderByBreed.get(clean(b.breed)) || 999;
        if (breedOrderA !== breedOrderB) {
            return breedOrderA - breedOrderB;
        }

        const breedCompare = String(a.breed || '').localeCompare(String(b.breed || ''), undefined, { numeric: true, sensitivity: 'base' });
        if (breedCompare !== 0) {
            return breedCompare;
        }

        const stakeA = stakeOrder.findIndex((stake) => clean(stake) === clean(a.stake));
        const stakeB = stakeOrder.findIndex((stake) => clean(stake) === clean(b.stake));
        const normalizedA = stakeA === -1 ? 999 : stakeA;
        const normalizedB = stakeB === -1 ? 999 : stakeB;
        if (normalizedA !== normalizedB) {
            return normalizedA - normalizedB;
        }

        return String(a.stake || '').localeCompare(String(b.stake || ''), undefined, { numeric: true, sensitivity: 'base' });
    });
}

function sortRollCallEntries(entries) {
    const sort = document.getElementById('rollCallSort')?.value || 'breedClass';
    const keysBySort = {
        breedClass: ['breed', 'className', 'callName'],
        callName: ['callName', 'breed', 'className'],
        registeredName: ['registeredName', 'breed', 'className'],
        className: ['className', 'breed', 'callName'],
        entryNumber: ['entryNumber', 'breed', 'className'],
    };
    const keys = keysBySort[sort] || keysBySort.breedClass;
    return [...entries].sort((a, b) => compareByKeys(a, b, keys));
}

function compareByKeys(a, b, keys) {
    for (const key of keys) {
        const result = String(a[key] || '').localeCompare(String(b[key] || ''), undefined, { numeric: true, sensitivity: 'base' });
        if (result !== 0) {
            return result;
        }
    }
    return 0;
}

function trialTitle(trial) {
    return [trial.trialName, formatDateRange(trial.startsOn, trial.endsOn), trial.clubName].filter(Boolean).join(' | ');
}

function printSection(sectionId) {
    document.body.dataset.printSection = sectionId;
    window.print();
    setTimeout(() => {
        delete document.body.dataset.printSection;
    }, 250);
}

function printSectionAndMark(sectionId, guideKey) {
    printSection(sectionId);
    markTrialGuidePrinted(guideKey);
}

async function askDrawSheetCopies(label = 'draw sheets') {
    const answer = await showTrialPrompt({
        title: 'Print Copies',
        eyebrow: label,
        message: `How many copies of the ${label} would you like to create?`,
        defaultValue: '2',
        inputType: 'number',
        min: 1,
        max: 10,
        step: 1,
        primaryText: 'Create PDF',
        secondaryText: 'Cancel',
    });
    if (answer === false) {
        return null;
    }
    const copies = Number.parseInt(answer, 10);
    if (!Number.isFinite(copies) || copies < 1) {
        return 1;
    }
    return Math.min(copies, 10);
}

async function printDrawSheet() {
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        showMessage(rollCallMessage, 'Build the preliminary draw before printing the draw sheet.', 'warning');
        return;
    }

    if (!isLocalServerMode()) {
        showMessage(rollCallMessage, 'Official draw PDFs require SQLite/server mode. Start the app with start_field_trial_secretary.ps1.', 'warning');
        return;
    }
    const copies = await askDrawSheetCopies('preliminary draw sheets');
    if (!copies) {
        return;
    }

    const pdfWindow = window.open('', '_blank');
    try {
        await saveToSQLite();
        const response = await fetch('/api/draw-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial, layout: getAsfaDrawLayout(), copies }),
        });

        if (!response.ok) {
            let message = 'Official draw sheet could not be created.';
            try {
                const payload = await response.json();
                message = payload.error || message;
            } catch {
                // Keep the generic message when the server did not return JSON.
            }
            throw new Error(message);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
            pdfWindow.location = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.click();
        }
        showMessage(rollCallMessage, `Official draw order PDF created (${copies} cop${copies === 1 ? 'y' : 'ies'}).`, 'success');
        markTrialGuidePrinted('prelimDrawSheet');
    } catch (error) {
        if (pdfWindow) {
            pdfWindow.close();
        }
        showMessage(rollCallMessage, error.message || 'Official draw sheet could not be created.', 'warning');
    }
}

async function printJudgeSheets() {
    const trial = readForm();
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        showMessage(rollCallMessage, 'Build the preliminary draw before printing judge sheets.', 'warning');
        return;
    }
    const groups = prelimJudgeSheetReadyGroups(trial)
        .filter((group) => prelimJudgeSheetStatus(trial, group).key !== 'printed')
        .map((group) => group.id);
    return printPreliminaryJudgeSheetsForGroups(groups.length ? groups : prelimJudgeSheetReadyGroups(trial).map((group) => group.id));
}

function markPreliminaryJudgeSheetGroupsPrinted(groupIds) {
    const trial = readForm();
    const ids = new Set(groupIds || []);
    const groups = (((trial.preliminaryDraw || {}).groups || [])).filter((group) => ids.has(group.id));
    if (groups.length === 0) {
        return;
    }
    const existing = getSelectedTrial();
    const printedAt = new Date().toISOString();
    const currentPrintStatus = {
        ...((existing && existing.printStatus) || {}),
        ...(trial.printStatus || {}),
    };
    const groupRecords = {
        ...(currentPrintStatus.prelimJudgeSheetGroups || {}),
    };
    groups.forEach((group) => {
        groupRecords[group.id] = {
            printedAt,
            signature: prelimJudgeSheetPrintSignature(group),
            title: groupTitle(group),
        };
    });
    trial.printStatus = {
        ...currentPrintStatus,
        prelimJudgeSheets: printedAt,
        prelimJudgeSheetGroups: groupRecords,
    };
    upsertTrial(trial);
    render();
}

async function printPreliminaryJudgeSheetsForGroups(groupIds) {
    const trial = readForm();
    const selectedIds = [...new Set((groupIds || []).filter(Boolean))];
    const draw = trial.preliminaryDraw;
    if (!draw || !Array.isArray(draw.groups) || draw.groups.length === 0) {
        showMessage(rollCallMessage, 'Build the preliminary draw before printing judge sheets.', 'warning');
        return;
    }

    if (!isLocalServerMode()) {
        showMessage(rollCallMessage, 'Official judge sheets require SQLite/server mode. Start the app with start_field_trial_secretary.ps1.', 'warning');
        return;
    }
    if (selectedIds.length === 0) {
        showMessage(rollCallMessage, 'Choose at least one preliminary judge sheet to print.', 'warning');
        return;
    }
    const readyGroups = prelimJudgeSheetReadyGroups(trial);
    const selectedGroups = readyGroups.filter((group) => selectedIds.includes(group.id));
    if (selectedGroups.length === 0) {
        showMessage(rollCallMessage, 'Build the preliminary draw before printing the selected judge sheets.', 'warning');
        return;
    }

    const pdfWindow = window.open('', '_blank');
    try {
        await saveToSQLite();
        const response = await fetch('/api/judge-sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trial,
                groupIds: selectedGroups.map((group) => group.id),
                layout: getAsfaJudgeLayout(),
            }),
        });

        if (!response.ok) {
            let message = 'Official judge sheets could not be created.';
            try {
                const payload = await response.json();
                message = payload.error || message;
            } catch {
                // Keep generic message.
            }
            throw new Error(message);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
            pdfWindow.location = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.click();
        }
        showMessage(rollCallMessage, `Official preliminary judge sheets created for ${selectedGroups.length} stake${selectedGroups.length === 1 ? '' : 's'}.`, 'success');
        markPreliminaryJudgeSheetGroupsPrinted(selectedGroups.map((group) => group.id));
    } catch (error) {
        if (pdfWindow) {
            pdfWindow.close();
        }
        showMessage(rollCallMessage, error.message || 'Official judge sheets could not be created.', 'warning');
    }
}

async function printRunoffJudgeSheets(groupId, tie) {
    const trial = readForm();
    if (!isLocalServerMode()) {
        showMessage(document.getElementById('scoringMessage'), 'Runoff judge sheets require SQLite/server mode.', 'warning');
        return;
    }
    const pdfWindow = window.open('', '_blank');
    try {
        await saveToSQLite();
        const response = await fetch('/api/runoff-judge-sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trial,
                groupId,
                runoffKey: runoffKeyForTie(tie),
                layout: getAsfaJudgeLayout(),
            }),
        });

        if (!response.ok) {
            let message = 'Runoff judge sheets could not be created.';
            try {
                const payload = await response.json();
                message = payload.error || message;
            } catch {
                // Keep generic message.
            }
            throw new Error(message);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
            pdfWindow.location = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.click();
        }
        showMessage(document.getElementById('scoringMessage'), 'Runoff judge sheets created.', 'success');
        markTrialGuidePrinted('runoffJudgeSheets');
    } catch (error) {
        if (pdfWindow) {
            pdfWindow.close();
        }
        showMessage(document.getElementById('scoringMessage'), error.message || 'Runoff judge sheets could not be created.', 'warning');
    }
}

async function printRunoffDrawSheet() {
    const trial = readForm();
    const missingDraws = undrawnRunoffItems(trial);
    if (missingDraws.length > 0) {
        showMessage(runoffMessage, `Click Redraw All Runoffs before printing. Missing colors for: ${missingDraws.map((item) => item.title).join(', ')}.`, 'warning');
        return;
    }
    const printTrial = runoffPrintTrial(trial);
    const groups = ((printTrial.preliminaryDraw || {}).groups || []);
    if (groups.length === 0) {
        showMessage(runoffMessage, 'Click Redraw All Runoffs before printing the runoff draw sheet.', 'warning');
        return;
    }
    if (!isLocalServerMode()) {
        showMessage(runoffMessage, 'Runoff draw PDFs require SQLite/server mode.', 'warning');
        return;
    }
    const copies = await askDrawSheetCopies('runoff draw sheets');
    if (!copies) {
        return;
    }

    const pdfWindow = window.open('', '_blank');
    try {
        await saveToSQLite();
        const response = await fetch('/api/draw-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial: printTrial, layout: getAsfaDrawLayout(), copies }),
        });
        if (!response.ok) {
            let message = 'Runoff draw sheet could not be created.';
            try {
                const payload = await response.json();
                message = payload.error || message;
            } catch {
                // Keep generic message.
            }
            throw new Error(message);
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
            pdfWindow.location = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.click();
        }
        showMessage(runoffMessage, `Runoff draw sheet created (${copies} cop${copies === 1 ? 'y' : 'ies'}).`, 'success');
        markTrialGuidePrinted('runoffDrawSheet');
    } catch (error) {
        if (pdfWindow) {
            pdfWindow.close();
        }
        showMessage(runoffMessage, error.message || 'Runoff draw sheet could not be created.', 'warning');
    }
}

function bifDrawPrintTrial(trial) {
    const bif = bifState(trial);
    const draw = bif.draw || {};
    const courses = (draw.courses || []).map((course) => ({
        ...course,
        hounds: (course.hounds || []).map((hound) => ({
            ...hound,
            blanketColor: hound.bifBlanketColor || hound.blanketColor,
            stake: hound.bobStake || hound.stake || 'BOB',
        })),
    }));
    if (courses.length === 0) {
        return null;
    }
    return {
        ...trial,
        preliminaryDraw: {
            id: `bif-draw-${trial.id || ''}`,
            phase: 'bif',
            groups: [{
                id: 'bif-draw-sheet',
                breed: 'BIF',
                stake: 'BIF',
                phase: 'bif',
                runOrder: 1,
                courses,
            }],
        },
    };
}

async function printBifDrawSheet() {
    const trial = readForm();
    const printTrial = bifDrawPrintTrial(trial);
    if (!printTrial) {
        showMessage(bifMessage, 'Draw BIF before printing the BIF draw sheet.', 'warning');
        return;
    }
    const missing = (((bifState(trial).draw || {}).courses) || [])
        .flatMap((course) => course.hounds || [])
        .filter((hound) => !hound.bifBlanketColor && !hound.blanketColor);
    if (missing.length > 0) {
        showMessage(bifMessage, 'Redraw BIF before printing. One or more hounds does not have a blanket color.', 'warning');
        return;
    }
    if (!isLocalServerMode()) {
        showMessage(bifMessage, 'BIF draw PDFs require SQLite/server mode.', 'warning');
        return;
    }
    const copies = await askDrawSheetCopies('BIF draw sheets');
    if (!copies) {
        return;
    }
    const pdfWindow = window.open('', '_blank');
    try {
        await saveToSQLite();
        const response = await fetch('/api/draw-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial: printTrial, layout: getAsfaDrawLayout(), copies }),
        });
        if (!response.ok) {
            let message = 'BIF draw sheet could not be created.';
            try {
                const payload = await response.json();
                message = payload.error || message;
            } catch {
                // Keep generic message.
            }
            throw new Error(message);
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
            pdfWindow.location = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.click();
        }
        showMessage(bifMessage, `BIF draw sheet created (${copies} cop${copies === 1 ? 'y' : 'ies'}).`, 'success');
        markTrialGuidePrinted('bifDrawSheet');
    } catch (error) {
        if (pdfWindow) {
            pdfWindow.close();
        }
        showMessage(bifMessage, error.message || 'BIF draw sheet could not be created.', 'warning');
    }
}

function finalsHuntmasterPrintTrial(trial) {
    const readyGroups = finalsJudgeSheetReadyGroups(trial);
    const groups = readyGroups.map((group) => {
        const finalDraw = group.finalDraw || {};
        return {
            ...group,
            phase: 'final',
            courses: (finalDraw.courses || []).map((course) => ({
                ...course,
                hounds: (course.hounds || []).map((hound) => ({
                    ...hound,
                    blanketColor: hound.finalBlanketColor || hound.blanketColor,
                    stake: hound.stake || group.stake,
                })),
            })),
        };
    }).filter(groupHasPrelimHounds);

    if (groups.length === 0) {
        return null;
    }

    return {
        ...trial,
        preliminaryDraw: {
            ...((trial || {}).preliminaryDraw || {}),
            id: `finals-huntmaster-${trial.id || ''}`,
            phase: 'final',
            groups,
        },
    };
}

async function printFinalsHuntmasterSheet() {
    const trial = readForm();
    const printTrial = finalsHuntmasterPrintTrial(trial);
    if (!printTrial) {
        showMessage(document.getElementById('scoringMessage'), 'Draw finals before printing the finals huntmaster sheet.', 'warning');
        return;
    }
    if (!isLocalServerMode()) {
        showMessage(document.getElementById('scoringMessage'), 'Finals huntmaster PDFs require SQLite/server mode.', 'warning');
        return;
    }
    const copies = await askDrawSheetCopies('finals huntmaster sheets');
    if (!copies) {
        return;
    }

    const pdfWindow = window.open('', '_blank');
    try {
        await saveToSQLite();
        const response = await fetch('/api/draw-sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial: printTrial, layout: getAsfaDrawLayout(), copies }),
        });
        if (!response.ok) {
            let message = 'Finals huntmaster sheet could not be created.';
            try {
                const payload = await response.json();
                message = payload.error || message;
            } catch {
                // Keep generic message.
            }
            throw new Error(message);
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
            pdfWindow.location = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.click();
        }
        showMessage(document.getElementById('scoringMessage'), `Finals huntmaster sheet created (${copies} cop${copies === 1 ? 'y' : 'ies'}).`, 'success');
        markTrialGuidePrinted('finalHuntmasterSheet');
    } catch (error) {
        if (pdfWindow) {
            pdfWindow.close();
        }
        showMessage(document.getElementById('scoringMessage'), error.message || 'Finals huntmaster sheet could not be created.', 'warning');
    }
}

function markFinalsJudgeSheetGroupsPrinted(groupIds) {
    const trial = readForm();
    const ids = new Set(groupIds || []);
    const groups = (((trial.preliminaryDraw || {}).groups || [])).filter((group) => ids.has(group.id));
    if (groups.length === 0) {
        return;
    }
    const existing = getSelectedTrial();
    const printedAt = new Date().toISOString();
    const currentPrintStatus = {
        ...((existing && existing.printStatus) || {}),
        ...(trial.printStatus || {}),
    };
    const groupRecords = {
        ...(currentPrintStatus.finalJudgeSheetGroups || {}),
    };
    groups.forEach((group) => {
        groupRecords[group.id] = {
            printedAt,
            signature: finalsJudgeSheetPrintSignature(group),
            title: groupTitle(group),
        };
    });
    trial.printStatus = {
        ...currentPrintStatus,
        finalJudgeSheets: printedAt,
        finalJudgeSheetGroups: groupRecords,
    };
    upsertTrial(trial);
    render();
}

async function printFinalsJudgeSheets(groupId) {
    return printFinalsJudgeSheetsForGroups([groupId]);
}

async function printFinalsJudgeSheetsForGroups(groupIds) {
    const trial = readForm();
    const selectedIds = [...new Set((groupIds || []).filter(Boolean))];
    if (!isLocalServerMode()) {
        showMessage(document.getElementById('scoringMessage'), 'Finals judge sheets require SQLite/server mode.', 'warning');
        return;
    }
    if (selectedIds.length === 0) {
        showMessage(document.getElementById('scoringMessage'), 'Choose at least one finals judge sheet to print.', 'warning');
        return;
    }
    const readyGroups = finalsJudgeSheetReadyGroups(trial);
    const selectedGroups = readyGroups.filter((group) => selectedIds.includes(group.id));
    if (selectedGroups.length === 0) {
        showMessage(document.getElementById('scoringMessage'), 'Draw finals for the selected stake before printing finals judge sheets.', 'warning');
        return;
    }

    const pdfWindow = window.open('', '_blank');
    try {
        await saveToSQLite();
        const response = await fetch('/api/finals-judge-sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trial,
                groupId: selectedGroups[0].id,
                groupIds: selectedGroups.map((group) => group.id),
                layout: getAsfaJudgeLayout(),
            }),
        });

        if (!response.ok) {
            let message = 'Finals judge sheets could not be created.';
            try {
                const payload = await response.json();
                message = payload.error || message;
            } catch {
                // Keep generic message.
            }
            throw new Error(message);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
            pdfWindow.location = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.click();
        }
        showMessage(document.getElementById('scoringMessage'), `Finals judge sheets created for ${selectedGroups.length} stake${selectedGroups.length === 1 ? '' : 's'}.`, 'success');
        markFinalsJudgeSheetGroupsPrinted(selectedGroups.map((group) => group.id));
    } catch (error) {
        if (pdfWindow) {
            pdfWindow.close();
        }
        showMessage(document.getElementById('scoringMessage'), error.message || 'Finals judge sheets could not be created.', 'warning');
    }
}

async function printBifJudgeSheets() {
    const trial = readForm();
    const bif = bifState(trial);
    if (!isLocalServerMode()) {
        showMessage(bifMessage, 'BIF judge sheets require SQLite/server mode.', 'warning');
        return;
    }
    if (!bif.draw || !Array.isArray(bif.draw.courses) || bif.draw.courses.length === 0) {
        showMessage(bifMessage, 'Draw BIF before printing BIF judge sheets.', 'warning');
        return;
    }
    const normalizedDraw = normalizeBifDrawColors(bif.draw);
    const missingColors = (normalizedDraw.courses || [])
        .flatMap((course) => course.hounds || [])
        .filter((hound) => !drawColorForType(hound, 'bif'));
    if (missingColors.length > 0) {
        showMessage(bifMessage, 'Redraw BIF before printing judge sheets. One or more hounds does not have a blanket color.', 'warning');
        return;
    }

    const printTrial = {
        ...trial,
        scorebook: {
            ...(trial.scorebook || {}),
            bif: {
                ...bif,
                draw: normalizedDraw,
            },
        },
    };
    const pdfWindow = window.open('', '_blank');
    try {
        await saveToSQLite();
        const response = await fetch('/api/bif-judge-sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial: printTrial, layout: getAsfaJudgeLayout() }),
        });

        if (!response.ok) {
            let message = 'BIF judge sheets could not be created.';
            try {
                const payload = await response.json();
                message = payload.error || message;
            } catch {
                // Keep generic message.
            }
            throw new Error(message);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
            pdfWindow.location = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.click();
        }
        showMessage(bifMessage, 'BIF judge sheets created.', 'success');
        markTrialGuidePrinted('bifJudgeSheets');
    } catch (error) {
        if (pdfWindow) {
            pdfWindow.close();
        }
        showMessage(bifMessage, error.message || 'BIF judge sheets could not be created.', 'warning');
    }
}

async function printAllRunoffJudgeSheets() {
    const trial = readForm();
    const missingDraws = undrawnRunoffItems(trial);
    if (missingDraws.length > 0) {
        showMessage(runoffMessage, `Click Redraw All Runoffs before printing judge sheets. Missing colors for: ${missingDraws.map((item) => item.title).join(', ')}.`, 'warning');
        return;
    }
    const printTrial = runoffPrintTrial(trial);
    const groups = ((printTrial.preliminaryDraw || {}).groups || []);
    if (groups.length === 0) {
        showMessage(runoffMessage, 'Click Redraw All Runoffs before printing runoff judge sheets.', 'warning');
        return;
    }
    if (!isLocalServerMode()) {
        showMessage(runoffMessage, 'Runoff judge sheet PDFs require SQLite/server mode.', 'warning');
        return;
    }

    const pdfWindow = window.open('', '_blank');
    try {
        await saveToSQLite();
        const response = await fetch('/api/judge-sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trial: printTrial, layout: getAsfaJudgeLayout() }),
        });
        if (!response.ok) {
            let message = 'Runoff judge sheets could not be created.';
            try {
                const payload = await response.json();
                message = payload.error || message;
            } catch {
                // Keep generic message.
            }
            throw new Error(message);
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
            pdfWindow.location = url;
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.click();
        }
        showMessage(runoffMessage, 'Runoff judge sheets created.', 'success');
        markTrialGuidePrinted('runoffJudgeSheets');
    } catch (error) {
        if (pdfWindow) {
            pdfWindow.close();
        }
        showMessage(runoffMessage, error.message || 'Runoff judge sheets could not be created.', 'warning');
    }
}

function createAdminTestTrial() {
    const requested = Number(document.getElementById('adminTestDogCount').value) || 50;
    const dogCount = Math.max(30, Math.min(80, requested));
    const requestedGroups = Number(document.getElementById('adminTestGroupCount')?.value) || 8;
    const groupCount = Math.max(1, Math.min(14, requestedGroups));
    const trialDate = document.getElementById('adminTestDate').value || new Date().toISOString().slice(0, 10);
    const association = document.getElementById('adminTestAssociation').value || 'ASFA';
    const useImported = document.getElementById('adminTestUseImportedHounds').checked;

    const judges = ensureAdminTestJudges();
    const workers = ensureAdminTestWorkers();

    const plan = adminBreedPlan.length ? adminBreedPlan : buildRandomAdminBreedPlan(dogCount, groupCount);
    const entries = createAdminTestEntries(plan, useImported, association);
    const classes = uniqueNames(plan.map((row) => adminEntryClassForPlan(row)));

    const trial = {
        id: crypto.randomUUID(),
        trialName: `Admin Test Trial ${trialDate}`,
        association,
        clubName: 'Admin Test Club',
        eventNumber: 'TEST',
        startsOn: trialDate,
        endsOn: trialDate,
        trialType: 'all_breed',
        specialtyBreed: '',
        region: '1',
        singlesOffered: true,
        lciOffered: true,
        priorityDate: false,
        locationName: 'Test Field',
        nearestCity: 'Test City',
        locationAddress: '100 Test Field Road',
        locationCity: 'Test City',
        locationState: 'PA',
        closingAt: `${trialDate}T07:00`,
        rollCallAt: '08:00',
        secretaryName: 'Admin Test Secretary',
        secretaryEmail: 'secretary@example.com',
        trialChair: 'Admin Test Chair',
        fieldClerk: 'Admin Test Field Clerk',
        classesOffered: classes,
        breedsOffered: deriveBreedsFromEntries(entries),
        documentsReady: ['Premium', 'Entry forms', 'Running order', 'Score sheets'],
        entries,
        judges,
        workers,
        rollCallSort: 'breedClass',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    trial.runPlan = buildAdminRunPlan(trial);
    trial.runPlanEntriesFingerprint = entrySetupFingerprint(trial.entries || []);
    trials.unshift(trial);
    selectedTrialId = trial.id;
    saveTrials();

    if (document.getElementById('adminTestSetActive').checked) {
        localStorage.setItem(activeKey, trial.id);
        queueSQLiteSave();
    }

    const planSource = adminBreedPlan.length ? 'custom test plan' : `${plan.length} random breed/stake groups`;
    showMessage(adminTestMessage, `Created ${trial.trialName} with ${entries.length} dogs from ${planSource}, ${trial.runPlan.length} breeds, ${judges.length} judges, and ${workers.length} workers.`, 'success');
    switchTab('rollcall');
    render();
}

function buildRandomAdminBreedPlan(totalDogs, requestedGroups) {
    const breedCodes = breedOptions
        .map(([value]) => value)
        .filter((value) => asfaRegularBreedCodes.includes(clean(value)));
    const normalStakes = ['Open', 'Field Champion', 'Veteran'];
    const candidates = [
        ...breedCodes.flatMap((breed) => normalStakes.map((className) => ({ breed, className }))),
        { breed: 'Singles', className: 'Singles' },
        ...lciDivisions.flatMap((breed) => lciStakes.map((className) => ({ breed, className }))),
    ];
    const groupCount = Math.max(1, Math.min(requestedGroups || 8, candidates.length, totalDogs));
    const chosen = secureShuffle(candidates).slice(0, groupCount);
    const counts = distributeAdminTestDogs(totalDogs, groupCount);
    return chosen.map((row, index) => ({
        id: crypto.randomUUID(),
        breed: row.breed,
        className: row.className,
        count: counts[index],
    }));
}

function distributeAdminTestDogs(totalDogs, groupCount) {
    const counts = Array.from({ length: groupCount }, () => 1);
    let remaining = Math.max(0, totalDogs - groupCount);
    let index = 0;
    while (remaining > 0) {
        const add = Math.min(remaining, secureRandomInt(5) + 1);
        counts[index % groupCount] += add;
        remaining -= add;
        index += 1;
    }
    return secureShuffle(counts);
}

function buildFallbackAdminBreedPlan(totalDogs) {
    const rows = [
        { breed: 'WH', className: 'Open' },
        { breed: 'BZ', className: 'Open' },
        { breed: 'SA', className: 'Field Champion' },
        { breed: 'Singles', className: 'Singles' },
        { breed: 'LCI Small', className: 'Open' },
        { breed: 'LCI Large', className: 'Excellent' },
        { breed: 'LCI Sighthound Mix', className: 'Veteran' },
    ];
    const plan = [];
    let remaining = totalDogs;
    let index = 0;
    while (remaining > 0) {
        const count = Math.min(remaining, index % 2 === 0 ? 7 : 5);
        const row = rows[index % rows.length];
        plan.push({
            id: crypto.randomUUID(),
            breed: row.breed,
            className: row.className,
            count,
        });
        remaining -= count;
        index += 1;
    }
    return plan;
}

function createAdminTestEntries(plan, useImported, association) {
    const seed = useImported && Array.isArray(window.ASFA_RECENT_HOUNDS) && window.ASFA_RECENT_HOUNDS.length
        ? window.ASFA_RECENT_HOUNDS
        : [];
    const usedKeys = new Set();
    const entries = [];

    plan.forEach((row) => {
        const sourceBreed = adminSourceBreedForPlan(row);
        const entryClass = adminEntryClassForPlan(row);
        const breedHounds = pickAdminHoundsForBreed(seed, sourceBreed, Number(row.count) || 0, usedKeys);
        breedHounds.forEach((hound) => {
            const normalized = normalizeAdminHound(hound, entries.length, lciDivisions.includes(row.breed) ? row.breed : sourceBreed);
            ensureAdminHoundInDatabase(normalized);
            entries.push(buildAdminTrialEntry(normalized, entryClass, entries.length + 1, association));
        });
    });

    saveMasterHounds();
    return entries;
}

function adminEntryClassForPlan(row) {
    if (lciDivisions.includes(row.breed)) {
        return lciStakes.includes(row.className) ? row.className : 'Open';
    }
    if (clean(row.breed) === 'SINGLES') {
        return 'Singles';
    }
    return row.className || 'Open';
}

function adminSourceBreedForPlan(row) {
    if (lciDivisions.includes(row.breed)) {
        return row.breed;
    }
    if (clean(row.breed) === 'SINGLES') {
        return 'WH';
    }
    return row.breed || '';
}

function adminFallbackBreedForClass(className) {
    const lci = parseLciClass(className);
    if (!lci) {
        return '';
    }
    if (clean(lci.division) === 'LCISMALL') {
        return 'IG';
    }
    if (clean(lci.division) === 'LCILARGE') {
        return 'WH';
    }
    return 'OTHER';
}

function pickAdminHoundsForBreed(seed, breed, count, usedKeys) {
    const matches = seed
        .filter((hound) => hound.breed === breed)
        .filter((hound) => {
            const key = clean(hound.registrationNumber || hound.id || hound.registeredName || hound.callName);
            return key && !usedKeys.has(key);
        });
    const picked = pickSpread(matches, Math.min(count, matches.length));
    picked.forEach((hound) => usedKeys.add(clean(hound.registrationNumber || hound.id || hound.registeredName || hound.callName)));

    const fallbackCount = count - picked.length;
    if (fallbackCount <= 0) {
        return picked;
    }

    const fallback = Array.from({ length: fallbackCount }, (_, index) => buildFallbackHoundForBreed(breed, usedKeys.size + index + 1));
    fallback.forEach((hound) => usedKeys.add(clean(hound.registrationNumber)));
    return [...picked, ...fallback];
}

function buildFallbackHoundForBreed(breed, index) {
    const names = ['Dash', 'Swift', 'River', 'Echo', 'Flame', 'Raven', 'Piper', 'Scout', 'Lyric', 'Comet', 'Sage', 'Juno'];
    return {
        callName: `${names[index % names.length]} ${index}`,
        registeredName: `Admin Test ${names[index % names.length]} ${index}`,
        breed,
        registrationNumber: `AT${String(index).padStart(5, '0')}`,
        owner: `Owner ${Math.floor(index / 2) + 1}`,
        testData: true,
    };
}

function ensureAdminHoundInDatabase(hound) {
    const exists = masterHounds.some((item) => item.id === hound.id || (clean(item.registrationNumber) && clean(item.registrationNumber) === clean(hound.registrationNumber)));
    if (!exists) {
        masterHounds.unshift(hound);
    }
}

function buildAdminTrialEntry(hound, className, entryIndex, association) {
    return normalizeLciEntryShape({
        id: crypto.randomUUID(),
        houndId: hound.id,
        callName: hound.callName,
        registeredName: hound.registeredName,
        breed: hound.breed,
        registrationNumber: hound.registrationNumber,
        registry: hound.registry || association,
        registrationType: hound.registrationType || 'Test',
        registrationVerificationStatus: hound.registrationVerificationStatus || 'not_checked',
        className,
        handler: hound.owner || `Handler ${entryIndex}`,
        owner: hound.owner || '',
        ownerEmail: hound.ownerEmail || '',
        ownerPhone: hound.ownerPhone || '',
        entryNumber: String(entryIndex).padStart(3, '0'),
        firstTime: false,
        certRequired: false,
        ownerSeparationRequested: false,
        ownerSeparationGroup: '',
        additionalKennel: false,
        additionalBreeder: false,
        additionalBench: false,
        infoChanged: false,
        dismissedLastSix: false,
        signatureName: hound.owner || '',
        rollCallStatus: '',
        rollCallNotes: '',
    });
}

function getAdminTestHounds(count, useImported) {
    const seed = useImported && Array.isArray(window.ASFA_RECENT_HOUNDS) && window.ASFA_RECENT_HOUNDS.length
        ? window.ASFA_RECENT_HOUNDS
        : buildFallbackHounds(count);
    const chosen = pickSpread(seed, count).map((hound, index) => normalizeAdminHound(hound, index));

    chosen.forEach((hound) => {
        const exists = masterHounds.some((item) => item.id === hound.id || (clean(item.registrationNumber) && clean(item.registrationNumber) === clean(hound.registrationNumber)));
        if (!exists) {
            masterHounds.unshift(hound);
        }
    });
    saveMasterHounds();
    return chosen;
}

function normalizeAdminHound(hound, index, forcedBreed = '') {
    const breed = forcedBreed || hound.breed || breedOptions[(index % (breedOptions.length - 1)) + 1][0];
    const registrationNumber = hound.registrationNumber || `TEST${String(index + 1).padStart(4, '0')}`;
    return {
        ...hound,
        id: hound.id || `admin-hound-${breed}-${index + 1}`,
        callName: hound.callName || `Test Dog ${index + 1}`,
        registeredName: hound.registeredName || `Admin Test Hound ${index + 1}`,
        breed,
        registrationNumber,
        registry: hound.registry || 'Test Registry',
        registrationType: hound.registrationType || 'Test',
        registrationDisplay: formatRegistration(hound.registry || 'Test Registry', registrationNumber, hound.registrationType || 'Test'),
        owner: hound.owner || `Owner ${index + 1}`,
        registrationVerificationStatus: hound.registrationVerificationStatus || 'not_checked',
        createdAt: hound.createdAt || new Date().toISOString(),
        testData: Boolean(hound.testData),
    };
}

function addAdminBreedPlanRow() {
    const breed = document.getElementById('adminPlanBreed').value;
    const className = document.getElementById('adminPlanClass').value;
    const count = Math.max(1, Math.min(40, Number(document.getElementById('adminPlanCount').value) || 1));

    if (!breed) {
        showMessage(adminTestMessage, 'Choose a run group or breed for the test group.', 'warning');
        return;
    }

    adminBreedPlan.push({
        id: crypto.randomUUID(),
        breed,
        className,
        count,
    });
    showMessage(adminTestMessage, `Added ${count} ${adminPlanGroupLabel(breed)} ${className} hounds to the test plan.`, 'success');
    renderAdminBreedPlan();
}

function deleteSelectedAdminTrial() {
    const select = document.getElementById('adminDeleteTrial');
    const trialId = select && select.value;
    deleteTrialById(trialId, adminTestMessage);
}

function deleteSelectedSetupTrial() {
    deleteTrialById(selectedTrialId, formMessage);
}

async function deleteTrialById(trialId, messageElement) {
    const trial = trials.find((item) => item.id === trialId);
    if (!trial) {
        showMessage(messageElement, 'Choose a trial to delete.', 'warning');
        return;
    }

    const deleteTrial = await showTrialConfirm({
        title: 'Delete Trial',
        eyebrow: trial.trialName || 'Untitled trial',
        message: `Are you sure you want to delete "${trial.trialName || 'Untitled trial'}"? It can be recovered from Tools until five newer trial deletions replace it.`,
        primaryText: 'Delete Trial',
    });
    if (!deleteTrial) {
        return;
    }

    deletedTrials = [
        {
            id: crypto.randomUUID(),
            deletedAt: new Date().toISOString(),
            trial: { ...trial },
        },
        ...(Array.isArray(deletedTrials) ? deletedTrials : []),
    ].slice(0, 5);
    trials = trials.filter((item) => item.id !== trialId);
    if (selectedTrialId === trialId) {
        selectedTrialId = trials[0] ? trials[0].id : '';
    }
    if (localStorage.getItem(activeKey) === trialId) {
        if (selectedTrialId) {
            localStorage.setItem(activeKey, selectedTrialId);
        } else {
            localStorage.removeItem(activeKey);
        }
        setActiveTrialLocked(false);
        queueSQLiteSave();
    }
    saveDeletedTrials();
    saveTrials();
    showMessage(messageElement, 'Trial deleted. It can be recovered from Tools.', 'success');
    render();
}

function restoreDeletedTrial(recordId) {
    const record = (deletedTrials || []).find((item) => item.id === recordId);
    if (!record || !record.trial) {
        showMessage(adminTestMessage, 'Deleted trial record not found.', 'warning');
        return;
    }
    const trial = {
        ...record.trial,
        id: trials.some((item) => item.id === record.trial.id) ? crypto.randomUUID() : record.trial.id,
        trialId: '',
        updatedAt: new Date().toISOString(),
    };
    trial.trialId = trial.id;
    trials.unshift(trial);
    deletedTrials = deletedTrials.filter((item) => item.id !== recordId);
    selectedTrialId = trial.id;
    saveDeletedTrials();
    saveTrials();
    showMessage(adminTestMessage, `Restored "${trial.trialName || 'Untitled trial'}".`, 'success');
    render();
}

function buildFallbackHounds(count) {
    const names = ['Dash', 'Swift', 'River', 'Echo', 'Flame', 'Raven', 'Piper', 'Scout', 'Lyric', 'Comet', 'Sage', 'Juno'];
    const testBreeds = breedOptions
        .map(([value]) => value)
        .filter((value) => asfaRegularBreedCodes.includes(clean(value)));
    return Array.from({ length: count }, (_, index) => ({
        callName: `${names[index % names.length]} ${index + 1}`,
        registeredName: `Admin Test ${names[index % names.length]} ${index + 1}`,
        breed: testBreeds[index % testBreeds.length],
        registrationNumber: `AT${String(index + 1).padStart(5, '0')}`,
        owner: `Owner ${index + 1}`,
    }));
}

function pickSpread(items, count) {
    if (items.length <= count) {
        return [...items];
    }

    const result = [];
    const step = Math.max(1, Math.floor(items.length / count));
    for (let i = 0; result.length < count && i < items.length; i += step) {
        result.push(items[i]);
    }
    return result.slice(0, count);
}

function ensureAdminTestJudges() {
    const names = ['Jordan Blake', 'Morgan Ellis', 'Casey Hart', 'Taylor Reed'];
    return names.map((name, index) => {
        let judge = masterJudges.find((item) => clean(item.name) === clean(name));
        if (!judge) {
            judge = { id: crypto.randomUUID(), name, number: `J${index + 101}`, email: '', phone: '', createdAt: new Date().toISOString(), testData: true };
            masterJudges.unshift(judge);
        }
        return { id: crypto.randomUUID(), judgeId: judge.id, name: judge.name, number: judge.number, assignment: 'Admin Test' };
    });
}

function ensureAdminTestWorkers() {
    const workers = [
        ['Alex Parker', 'Huntmaster'],
        ['Jamie Quinn', 'Lure Operator'],
        ['Robin Sloan', 'Lure Operator'],
        ['Drew Lane', 'Field Clerk'],
        ['Avery Stone', 'Roll Call'],
        ['Riley Fox', 'Paddock'],
    ];

    const rows = workers.map(([name, role]) => {
        let worker = masterWorkers.find((item) => clean(item.name) === clean(name));
        if (!worker) {
            worker = { id: crypto.randomUUID(), name, email: '', phone: '', notes: '', createdAt: new Date().toISOString(), testData: true };
            masterWorkers.unshift(worker);
        }
        return { id: crypto.randomUUID(), workerId: worker.id, name: worker.name, role, phone: worker.phone || '' };
    });
    saveMasterJudges();
    saveMasterWorkers();
    return rows;
}

function isGeneratedAdminTestHound(hound) {
    if (hound.testData === true) {
        return true;
    }
    const registration = String(hound.registrationNumber || '').trim().toUpperCase();
    const registeredName = String(hound.registeredName || '').trim().toUpperCase();
    const testRegistration = /^AT\d{5}$/.test(registration) || /^TEST\d{4}$/.test(registration);
    return testRegistration
        && registeredName.startsWith('ADMIN TEST ')
        && clean(hound.registrationType || '') === 'TEST';
}

function isGeneratedAdminTestJudge(judge) {
    if (judge.testData === true) {
        return true;
    }
    const legacyJudges = new Map([
        ['J101', 'JORDANBLAKE'],
        ['J102', 'MORGANELLIS'],
        ['J103', 'CASEYHART'],
        ['J104', 'TAYLORREED'],
    ]);
    const number = String(judge.number || '').trim().toUpperCase();
    return legacyJudges.get(number) === clean(judge.name || '');
}

function isGeneratedAdminTestWorker(worker) {
    if (worker.testData === true) {
        return true;
    }
    const legacyNames = new Set([
        'ALEXPARKER',
        'JAMIEQUINN',
        'ROBINSLOAN',
        'DREWLANE',
        'AVERYSTONE',
        'RILEYFOX',
    ]);
    return legacyNames.has(clean(worker.name || ''))
        && !String(worker.email || '').trim()
        && !String(worker.phone || '').trim()
        && !String(worker.notes || '').trim();
}

async function removeAdminTestRecords() {
    const testHounds = masterHounds.filter(isGeneratedAdminTestHound);
    const testJudges = masterJudges.filter(isGeneratedAdminTestJudge);
    const testWorkers = masterWorkers.filter(isGeneratedAdminTestWorker);
    const total = testHounds.length + testJudges.length + testWorkers.length;

    if (!total) {
        showMessage(adminTestMessage, 'No generated test hounds, judges, or workers were found in the reusable databases.', 'success');
        return;
    }

    const confirmed = await showTrialConfirm({
        title: 'Remove Test Database Records',
        eyebrow: 'Reusable database cleanup',
        message: `Remove ${testHounds.length} test hound${testHounds.length === 1 ? '' : 's'}, ${testJudges.length} test judge${testJudges.length === 1 ? '' : 's'}, and ${testWorkers.length} test worker${testWorkers.length === 1 ? '' : 's'}? Existing trials and their results will not be changed.`,
        primaryText: 'Remove Test Records',
    });
    if (!confirmed) {
        return;
    }

    masterHounds = masterHounds.filter((hound) => !isGeneratedAdminTestHound(hound));
    masterJudges = masterJudges.filter((judge) => !isGeneratedAdminTestJudge(judge));
    masterWorkers = masterWorkers.filter((worker) => !isGeneratedAdminTestWorker(worker));
    saveMasterHounds();
    saveMasterJudges();
    saveMasterWorkers();
    showMessage(adminTestMessage, `Removed ${testHounds.length} test hounds, ${testJudges.length} test judges, and ${testWorkers.length} test workers. Existing trials were preserved.`, 'success');
    render();
}

function buildAdminRunPlan(trial) {
    const groups = groupEntriesForRunPlan(trial.entries);
    const judges = trial.judges.map((judge) => judge.name);
    const lureOperators = trial.workers.filter((worker) => worker.role === 'Lure Operator').map((worker) => worker.name);
    const huntmaster = trial.workers.find((worker) => worker.role === 'Huntmaster')?.name || '';

    return groups.map((group, index) => ({
        id: crypto.randomUUID(),
        breed: group.breed,
        entryCount: group.entries.length,
        runOrder: index + 1,
        judge1: judges[index % judges.length] || '',
        judge2: judges[(index + 1) % judges.length] || '',
        lureOperator: lureOperators[index % lureOperators.length] || '',
        huntmaster,
    }));
}

function getActiveTrialId() {
    return localStorage.getItem(activeKey) || selectedTrialId || '';
}

function getNearbyEntryTargetTrials() {
    const activeId = getActiveTrialId();
    const activeTrial = trials.find((trial) => trial.id === activeId);
    const anchorDate = activeTrial ? parseTrialDate(activeTrial.startsOn || activeTrial.endsOn) : null;

    if (!anchorDate) {
        return activeTrial ? [activeTrial] : [];
    }

    return trials
        .filter((trial) => {
            const trialDate = parseTrialDate(trial.startsOn || trial.endsOn);
            if (!trialDate) {
                return trial.id === activeId;
            }

            return Math.abs(daysBetween(anchorDate, trialDate)) <= 2;
        })
        .sort((a, b) => String(a.startsOn || '').localeCompare(String(b.startsOn || '')));
}

function parseTrialDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(a, b) {
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.round((b.getTime() - a.getTime()) / dayMs);
}

function filterHounds(rows) {
    const search = clean(document.getElementById('houndDatabaseSearch').value);
    if (!search) {
        return rows;
    }

    return rows.filter((hound) => houndMatchesSearch(hound, search));
}

function renderHoundDatabaseCount(visible, total) {
    const count = document.getElementById('houndDatabaseCount');
    const search = document.getElementById('houndDatabaseSearch').value.trim();
    if (!count) {
        return;
    }

    count.textContent = search ? `${visible} of ${total} hounds` : `${total} hounds`;
}

function houndMatchesSearch(hound, search) {
    return [
        hound.callName,
        hound.registeredName,
        hound.registrationNumber,
        hound.alternateRegistrationNumber,
        hound.owner,
        hound.ownerEmail,
        hound.ownerPhone,
        hound.ownerCity,
        hound.ownerState,
        hound.ownerCountry,
    ].some((value) => clean(value).includes(search));
}

function renderRows(tableId, rows, keys, options = {}) {
    const body = document.getElementById(tableId);
    body.innerHTML = '';
    setupSortableHeaders(tableId, keys, options);
    const sortedRows = sortRows(tableId, rows);

    if (sortedRows.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = keys.length + (options.actions ? 1 : 0);
        emptyCell.textContent = 'No rows yet.';
        emptyRow.appendChild(emptyCell);
        body.appendChild(emptyRow);
        return;
    }

    sortedRows.forEach((row) => {
        const tr = document.createElement('tr');
        if (row.rowClass) {
            String(row.rowClass).split(/\s+/).filter(Boolean).forEach((className) => tr.classList.add(className));
        }
        if (row.id) {
            tr.dataset.rowId = row.id;
        }
        keys.forEach((key) => {
            const td = document.createElement('td');
            td.textContent = row[key] || '';
            tr.appendChild(td);
        });
        if (options.actions) {
            const td = document.createElement('td');
            td.className = 'row-actions';

            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'text-button';
            edit.textContent = 'Edit';
            edit.addEventListener('click', () => {
                if (options.actions === 'entries') {
                    editTrialEntry(row.id);
                }
                if (options.actions === 'hounds') {
                    editMasterHound(row.id);
                }
            });

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'text-button danger';
            remove.textContent = 'Remove';
            remove.addEventListener('click', () => {
                if (options.actions === 'entries') {
                    removeTrialEntry(row.id);
                }
                if (options.actions === 'hounds') {
                    removeMasterHound(row.id);
                }
                if (options.actions === 'masterJudges') {
                    removeMasterJudge(row.id);
                }
                if (options.actions === 'masterWorkers') {
                    removeMasterWorker(row.id);
                }
                if (options.actions === 'trialJudges') {
                    removeTrialJudge(row.id);
                }
                if (options.actions === 'trialWorkers') {
                    removeTrialWorker(row.id);
                }
            });

            if (options.actions === 'entries' || options.actions === 'hounds') {
                td.append(edit);
            }
            if (options.actions === 'entries' && entryDocumentLinks(row).length > 0) {
                const docs = document.createElement('button');
                docs.type = 'button';
                docs.className = 'text-button';
                docs.textContent = 'Docs';
                docs.addEventListener('click', () => {
                    entryDocumentLinks(row).forEach((documentInfo) => {
                        window.open(`/api/document/${encodeURIComponent(documentInfo.id)}`, '_blank', 'noopener');
                    });
                });
                td.append(docs);
            }
            td.append(remove);
            tr.appendChild(td);
        }
        body.appendChild(tr);
    });
}

function setupSortableHeaders(tableId, keys, options = {}) {
    const table = document.getElementById(tableId).closest('table');
    const headers = Array.from(table.querySelectorAll('thead th'));
    const sortableKeys = [...keys];
    if (options.actions) {
        sortableKeys.push('');
    }

    headers.forEach((header, index) => {
        const key = sortableKeys[index];
        header.textContent = header.textContent.replace(/\s+[â–²â–¼]$/, '');

        if (!key) {
            header.classList.remove('sortable');
            header.title = '';
            header.onclick = null;
            return;
        }

        header.classList.add('sortable');
        header.title = 'Sort by this column';

        const sort = tableSort[tableId];
        if (sort && sort.key === key) {
            header.textContent = `${header.textContent} ${sort.direction === 'asc' ? 'â–²' : 'â–¼'}`;
        }

        header.onclick = () => {
            const current = tableSort[tableId];
            tableSort[tableId] = {
                key,
                direction: current && current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
            };
            render();
        };
    });
}

function sortRows(tableId, rows) {
    const sort = tableSort[tableId];
    if (!sort || !sort.key) {
        return [...rows];
    }

    return [...rows].sort((a, b) => {
        const av = String(a[sort.key] || '').toUpperCase();
        const bv = String(b[sort.key] || '').toUpperCase();
        const result = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
        return sort.direction === 'asc' ? result : -result;
    });
}

function renderHoundSearchOptions() {
    const options = document.getElementById('houndSearchOptions');
    const search = clean(document.getElementById('entryHoundSearch').value);
    options.innerHTML = '';

    if (!search) {
        return;
    }

    masterHounds
        .filter((hound) => houndMatchesSearch(hound, search))
        .slice(0, 50)
        .forEach((hound) => {
            const option = document.createElement('option');
            option.value = houndLabel(hound);
            options.appendChild(option);
        });
}

function renderPeopleSearchOptions() {
    const judgeOptions = document.getElementById('judgeSearchOptions');
    const workerOptions = document.getElementById('workerSearchOptions');
    judgeOptions.innerHTML = '';
    workerOptions.innerHTML = '';

    masterJudges.forEach((judge) => {
        const option = document.createElement('option');
        option.value = personLabel(judge, 'number');
        judgeOptions.appendChild(option);
    });

    masterWorkers.forEach((worker) => {
        const option = document.createElement('option');
        option.value = personLabel(worker);
        workerOptions.appendChild(option);
    });
}

function readCheckedValues(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map((item) => item.value);
}

function writeCheckedValues(containerId, values = []) {
    const selected = new Set(containerId === 'classOptions' ? expandClassOptions(values) : values);
    document.querySelectorAll(`#${containerId} input`).forEach((item) => {
        item.checked = selected.has(item.value);
    });
}

function getSelectedTrial() {
    return trials.find((trial) => trial.id === selectedTrialId);
}

function getSelectedArray(key) {
    const trial = getSelectedTrial();
    return trial && Array.isArray(trial[key]) ? trial[key] : [];
}

function updateSelectedTrialList(key, row) {
    const trial = readForm();
    const problem = validateTrialBasics(trial);
    if (problem) {
        showMessage(formMessage, problem, 'warning');
        return;
    }

    trial[key] = [...(Array.isArray(trial[key]) ? trial[key] : []), row];
    upsertTrial(trial);
    render();
}

function addMasterHoundFromForm(source = 'master') {
    const prefix = source === 'entry' ? 'entry' : 'master';
    const primaryRegistry = getFormValue(`${prefix}Registry`);
    const primaryRegType = getFormValue(`${prefix}RegType`);
    const altRegistry = getFormValue(`${prefix}AltRegistry`);
    const altRegNumber = getFormValue(`${prefix}AltRegNumber`);
    const existing = source === 'master' && editingHoundId ? masterHounds.find((item) => item.id === editingHoundId) : null;
    let hound = {
        ...(existing || {}),
        id: existing ? existing.id : crypto.randomUUID(),
        callName: getFormValue(`${prefix}CallName`),
        registeredName: getFormValue(`${prefix}RegName`),
        breed: getFormValue(`${prefix}Breed`),
        registrationNumber: getFormValue(`${prefix}RegNumber`),
        registry: primaryRegistry,
        registrationType: primaryRegType,
        registrationDisplay: formatRegistration(primaryRegistry, getFormValue(`${prefix}RegNumber`), primaryRegType),
        alternateRegistry: altRegistry,
        alternateRegistrationNumber: altRegNumber,
        alternateRegistrationDisplay: formatRegistration(altRegistry, altRegNumber, ''),
        registrationVerificationStatus: 'not_checked',
        alternateVerificationStatus: altRegNumber ? 'not_checked' : '',
        sex: getFormValue(`${prefix}Sex`),
        dob: getFormValue(`${prefix}Dob`),
        owner: getFormValue(`${prefix}Owner`),
        ownerEmail: getFormValue(`${prefix}OwnerEmail`),
        ownerPhone: getFormValue(`${prefix}OwnerPhone`),
        ownerAddress: getFormValue(`${prefix}OwnerAddress`),
        ownerCity: getFormValue(`${prefix}OwnerCity`),
        ownerState: getFormValue(`${prefix}OwnerState`),
        ownerPostalCode: getFormValue(`${prefix}OwnerPostalCode`),
        ownerCountry: getFormValue(`${prefix}OwnerCountry`),
        breeder: getFormValue(`${prefix}Breeder`),
        sire: getFormValue(`${prefix}Sire`),
        dam: getFormValue(`${prefix}Dam`),
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    hound = normalizeLciHoundShape(hound);

    const cleanReg = clean(hound.registrationNumber);
    const cleanAltReg = clean(hound.alternateRegistrationNumber);
    if (!hound.callName && !hound.registeredName) {
        showMessage(source === 'entry' ? entryMessage : masterHoundMessage, 'Call name or registered name is required.', 'warning');
        return null;
    }

    if (!hound.breed) {
        showMessage(source === 'entry' ? entryMessage : masterHoundMessage, 'Breed is required.', 'warning');
        return null;
    }

    const duplicate = (cleanReg || cleanAltReg) && masterHounds.find((item) => {
        if (item.id === hound.id) {
            return false;
        }
        const knownNumbers = [item.registrationNumber, item.alternateRegistrationNumber].map(clean);
        return (cleanReg && knownNumbers.includes(cleanReg)) || (cleanAltReg && knownNumbers.includes(cleanAltReg));
    });
    if (duplicate) {
        showMessage(source === 'entry' ? entryMessage : masterHoundMessage, 'A hound with that registration number is already in the hound database.', 'warning');
        return duplicate;
    }

    if (existing) {
        masterHounds = masterHounds.map((item) => item.id === hound.id ? hound : item);
        updateTrialEntriesForHound(hound);
        editingHoundId = '';
        document.getElementById('addMasterHoundButton').textContent = 'Save Hound';
    } else {
        masterHounds.unshift(hound);
    }
    saveMasterHounds();
    showMessage(source === 'entry' ? entryMessage : masterHoundMessage, existing ? 'Hound updated.' : 'Hound saved to the database.', 'success');
    return hound;
}

function getFormValue(id) {
    const field = document.getElementById(id);
    return field ? String(field.value || '').trim() : '';
}

function importAsfaRecentHounds() {
    const seed = Array.isArray(window.ASFA_RECENT_HOUNDS) ? window.ASFA_RECENT_HOUNDS : [];
    if (seed.length === 0) {
        showMessage(masterHoundMessage, 'No ASFA import data was found.', 'warning');
        return;
    }

    const existingKeys = new Set(masterHounds.map((hound) => String(hound.legacyHoundKey || hound.id || '')));
    const existingRegs = new Set();
    masterHounds.forEach((hound) => {
        [hound.registrationNumber, hound.alternateRegistrationNumber].forEach((number) => {
            const cleaned = clean(number);
            if (cleaned) {
                existingRegs.add(cleaned);
            }
        });
    });

    const additions = [];
    let skipped = 0;

    seed.forEach((hound) => {
        const legacyKey = String(hound.legacyHoundKey || '');
        const reg = clean(hound.registrationNumber);

        if ((legacyKey && existingKeys.has(legacyKey)) || (reg && existingRegs.has(reg))) {
            skipped += 1;
            return;
        }

        existingKeys.add(legacyKey);
        if (reg) {
            existingRegs.add(reg);
        }

        additions.push({
            ...hound,
            registrationDisplay: formatRegistration(hound.registry, hound.registrationNumber, hound.registrationType),
            alternateRegistrationDisplay: formatRegistration(hound.alternateRegistry, hound.alternateRegistrationNumber, ''),
        });
    });

    if (additions.length === 0) {
        showMessage(masterHoundMessage, `No new hounds imported. ${skipped} already existed.`, 'warning');
        return;
    }

    const previous = masterHounds;
    masterHounds = [...additions, ...masterHounds];

    try {
        saveMasterHounds();
    } catch {
        masterHounds = previous;
        showMessage(masterHoundMessage, 'The browser did not have enough local storage for the full ASFA import. We should move this import into SQLite next.', 'warning');
        return;
    }

    showMessage(masterHoundMessage, `Imported ${additions.length} ASFA hounds from the last five years. Skipped ${skipped} already in the database.`, 'success');
    render();
}

function editMasterHound(houndId) {
    const hound = masterHounds.find((item) => item.id === houndId);
    if (!hound) {
        showMessage(masterHoundMessage, 'Hound not found.', 'warning');
        return;
    }

    editingHoundId = houndId;
    document.getElementById('masterCallName').value = hound.callName || '';
    document.getElementById('masterRegName').value = hound.registeredName || '';
    document.getElementById('masterBreed').value = hound.breed || '';
    document.getElementById('masterRegNumber').value = hound.registrationNumber || '';
    document.getElementById('masterRegistry').value = hound.registry || '';
    document.getElementById('masterRegType').value = hound.registrationType || '';
    document.getElementById('masterAltRegistry').value = hound.alternateRegistry || '';
    document.getElementById('masterAltRegNumber').value = hound.alternateRegistrationNumber || '';
    document.getElementById('masterSex').value = hound.sex || '';
    document.getElementById('masterDob').value = hound.dob || '';
    document.getElementById('masterOwner').value = hound.owner || '';
    document.getElementById('masterOwnerEmail').value = hound.ownerEmail || '';
    document.getElementById('masterOwnerPhone').value = hound.ownerPhone || '';
    document.getElementById('masterOwnerAddress').value = hound.ownerAddress || '';
    document.getElementById('masterOwnerCity').value = hound.ownerCity || '';
    document.getElementById('masterOwnerState').value = hound.ownerState || '';
    document.getElementById('masterOwnerPostalCode').value = hound.ownerPostalCode || '';
    document.getElementById('masterOwnerCountry').value = hound.ownerCountry || '';
    document.getElementById('masterBreeder').value = hound.breeder || '';
    document.getElementById('masterSire').value = hound.sire || '';
    document.getElementById('masterDam').value = hound.dam || '';
    document.getElementById('addMasterHoundButton').textContent = 'Update Hound';
    switchTab('hounds');
    showMessage(masterHoundMessage, 'Editing hound. Make changes, then click Update Hound.', 'warning');
}

function removeMasterHound(houndId) {
    const usedInTrials = trials.some((trial) => (trial.entries || []).some((entry) => entry.houndId === houndId));
    if (usedInTrials) {
        showMessage(masterHoundMessage, 'This hound is entered in at least one trial. Remove the trial entries before deleting the hound record.', 'warning');
        return;
    }

    const before = masterHounds.length;
    masterHounds = masterHounds.filter((hound) => hound.id !== houndId);
    if (masterHounds.length === before) {
        showMessage(masterHoundMessage, 'Hound not found.', 'warning');
        return;
    }

    if (editingHoundId === houndId) {
        clearMasterHoundForm();
    }

    saveMasterHounds();
    showMessage(masterHoundMessage, 'Hound removed from the database.', 'success');
    render();
}

function updateTrialEntriesForHound(hound) {
    trials = trials.map((trial) => ({
        ...trial,
        entries: (trial.entries || []).map((entry) => {
            if (entry.houndId !== hound.id) {
                return entry;
            }

            const usingPrimary = !entry.registrationNumber || clean(entry.registrationNumber) === clean(hound.registrationNumber);
            const registration = usingPrimary
                ? { number: hound.registrationNumber, registry: hound.registry, type: hound.registrationType, verificationStatus: hound.registrationVerificationStatus }
                : { number: hound.alternateRegistrationNumber || entry.registrationNumber, registry: hound.alternateRegistry || entry.registry, type: entry.registrationType, verificationStatus: hound.alternateVerificationStatus || entry.registrationVerificationStatus };

            return {
                ...entry,
                callName: hound.callName,
                registeredName: hound.registeredName,
                breed: hound.breed,
                owner: hound.owner || entry.owner || '',
                ownerEmail: hound.ownerEmail || entry.ownerEmail || '',
                ownerPhone: hound.ownerPhone || entry.ownerPhone || '',
                registrationNumber: registration.number,
                registry: registration.registry,
                registrationType: registration.type,
                registrationVerificationStatus: registration.verificationStatus,
            };
        }),
        updatedAt: new Date().toISOString(),
    }));
    saveTrials();
}

function clearMasterHoundForm() {
    editingHoundId = '';
    clearValues(['masterCallName', 'masterRegName', 'masterRegNumber', 'masterAltRegNumber', 'masterDob', 'masterOwner', 'masterOwnerEmail', 'masterOwnerPhone', 'masterOwnerAddress', 'masterOwnerCity', 'masterOwnerState', 'masterOwnerPostalCode', 'masterOwnerCountry', 'masterBreeder', 'masterSire', 'masterDam']);
    document.getElementById('masterBreed').value = '';
    document.getElementById('masterSex').value = '';
    document.getElementById('masterRegistry').value = '';
    document.getElementById('masterRegType').value = '';
    document.getElementById('masterAltRegistry').value = '';
    document.getElementById('addMasterHoundButton').textContent = 'Save Hound';
}

function getAsfaRecentCount() {
    return Array.isArray(window.ASFA_RECENT_HOUNDS) ? window.ASFA_RECENT_HOUNDS.length : 0;
}

async function addTrialEntry() {
    let hound = getSelectedEntryHound();
    let createdHoundFromEntry = false;

    if (!hound) {
        hound = addMasterHoundFromForm('entry');
        createdHoundFromEntry = Boolean(hound);
    }

    if (!hound) {
        return;
    }

    const className = document.getElementById('entryClass').value;
    if (!className) {
        showMessage(entryMessage, 'Choose a class before adding the entry.', 'warning');
        return;
    }
    const entryBreed = document.getElementById('entryBreed')?.value.trim() || '';
    if (lciDivisions.includes(entryBreed) && hound.breed !== entryBreed) {
        hound = {
            ...hound,
            breed: entryBreed,
            updatedAt: new Date().toISOString(),
        };
        masterHounds = masterHounds.map((item) => item.id === hound.id ? hound : item);
        saveMasterHounds();
    }

    if (document.getElementById('entryOwnerSeparation').checked && !document.getElementById('entryOwnerSeparationGroup').value.trim()) {
        document.getElementById('entryOwnerSeparationGroup').value = suggestOwnerSeparationGroup();
    }

    if (createdHoundFromEntry) {
        renderEntryRegistrationOptions(hound);
    }
    const selectedRegistration = parseRegistrationChoice(document.getElementById('entryRegistrationUsed').value, hound);
    let documentResult;
    try {
        documentResult = await collectManualEntryDocuments(className);
    } catch (error) {
        showMessage(entryMessage, error.message || 'Could not upload the entry paperwork.', 'warning');
        return;
    }
    if (!documentResult.ok) {
        const proceed = await showTrialConfirm({
            title: 'Paperwork Needed',
            eyebrow: 'First-Time Entry',
            message: `${documentResult.message} Save this entry anyway and mark the paperwork as needed?`,
            primaryText: 'Save With Paperwork Needed',
        });
        if (!proceed) {
            showMessage(entryMessage, 'Entry not saved. Upload the required paperwork or confirm the override to save it as needed.', 'warning');
            return;
        }
        documentResult = {
            ok: true,
            documents: [],
            registrationCert: null,
            coursingCert: null,
            overrideMissingDocuments: true,
            missingDocumentMessage: documentResult.message,
        };
    }

    const currentTrial = readForm();
    const problem = validateTrialBasics(currentTrial);
    if (problem) {
        showMessage(entryMessage, problem, 'warning');
        return;
    }
    const eligibilityProblem = asfaEntryEligibilityProblem(hound, className, currentTrial.association);
    if (eligibilityProblem) {
        showMessage(entryMessage, eligibilityProblem, 'warning');
        return;
    }

    upsertTrial(currentTrial);

    if (editingEntryId) {
        const updatedEntryId = editingEntryId;
        const entry = buildTrialEntry(hound, selectedRegistration, className, editingEntryId, documentResult);
        let updated = false;
        let added = 0;
        let skipped = 0;
        const targetIds = getEntryTargetTrialIds();

        trials = trials.map((trial) => {
            if (trial.id === selectedTrialId) {
                return refreshRunPlanFromPremiumIfLoaded({
                    ...trial,
                    entries: (trial.entries || []).map((row) => {
                        if (row.id !== editingEntryId) {
                            return row;
                        }
                        updated = true;
                        const mergedEntry = {
                            ...row,
                            ...entry,
                            rollCallStatus: row.rollCallStatus || entry.rollCallStatus || '',
                            rollCallNotes: row.rollCallNotes || entry.rollCallNotes || '',
                            ownerSeparationRequested: entry.ownerSeparationRequested,
                            ownerSeparationGroup: entry.ownerSeparationGroup,
                        };
                        return preserveEntryDocumentsOnEdit(row, mergedEntry);
                    }),
                    ownerSeparationReviewedAt: '',
                    updatedAt: new Date().toISOString(),
                });
            }

            if (!targetIds.includes(trial.id)) {
                return trial;
            }

            const entries = Array.isArray(trial.entries) ? trial.entries : [];
            const duplicate = entries.find((row) => isSameEntry(row, hound, selectedRegistration, className));
            if (duplicate) {
                skipped += 1;
                return trial;
            }

            added += 1;
            return refreshRunPlanFromPremiumIfLoaded({
                ...trial,
                entries: [...entries, buildTrialEntry(hound, selectedRegistration, className, crypto.randomUUID(), documentResult)],
                ownerSeparationReviewedAt: '',
                updatedAt: new Date().toISOString(),
            });
        });

        saveTrials();
        clearEntryForm();
        showMessage(
            entryMessage,
            updated ? `Entry updated.${added ? ` Added to ${added} other trial${added === 1 ? '' : 's'}.` : ''}${skipped ? ` ${skipped} duplicate skipped.` : ''}` : 'Entry was not found to update.',
            updated ? 'success' : 'warning'
        );
        render();
        if (updated) {
            scrollToEntryRow(updatedEntryId);
        }
        return;
    }

    const targetIds = getEntryTargetTrialIds();
    if (targetIds.length === 0) {
        showMessage(entryMessage, 'Select at least one nearby trial to add this entry to.', 'warning');
        return;
    }

    let added = 0;
    let skipped = 0;

    trials = trials.map((trial) => {
        if (!targetIds.includes(trial.id)) {
            return trial;
        }

        const entries = Array.isArray(trial.entries) ? trial.entries : [];
        const duplicate = entries.find((entry) => isSameEntry(entry, hound, selectedRegistration, className));

        if (duplicate) {
            skipped += 1;
            return trial;
        }

        added += 1;
        return refreshRunPlanFromPremiumIfLoaded({
            ...trial,
            entries: [...entries, buildTrialEntry(hound, selectedRegistration, className, crypto.randomUUID(), documentResult)],
            ownerSeparationReviewedAt: '',
            updatedAt: new Date().toISOString(),
        });
    });

    saveTrials();
    clearEntryForm();
    showMessage(entryMessage, `Entry added to ${added} trial${added === 1 ? '' : 's'}. ${skipped ? `${skipped} duplicate skipped.` : ''}`, added ? 'success' : 'warning');
    render();
}

function preserveEntryDocumentsOnEdit(existing, updated) {
    if ((updated.documentRecords || []).length || (updated.documentIds || []).length) {
        return updated;
    }
    return {
        ...updated,
        firstTimeDocuments: existing.firstTimeDocuments || [],
        documentRecords: existing.documentRecords || [],
        documentIds: existing.documentIds || [],
        registrationCertDocumentId: existing.registrationCertDocumentId || '',
        registrationCertFileName: existing.registrationCertFileName || '',
        coursingCertDocumentId: existing.coursingCertDocumentId || '',
        coursingCertFileName: existing.coursingCertFileName || '',
        documentStatus: existing.documentStatus || updated.documentStatus || '',
        documentStorageStatus: existing.documentStorageStatus || updated.documentStorageStatus || '',
        needsDocumentUpload: existing.needsDocumentUpload || updated.needsDocumentUpload || false,
        missingDocumentOverride: existing.missingDocumentOverride || updated.missingDocumentOverride || false,
        missingDocumentOverrideAt: existing.missingDocumentOverrideAt || updated.missingDocumentOverrideAt || '',
        missingDocumentMessage: existing.missingDocumentMessage || updated.missingDocumentMessage || '',
    };
}

function copyCurrentTrialSetup() {
    const source = readForm();
    const problem = validateTrialBasics(source);
    if (problem) {
        showMessage(formMessage, problem, 'warning');
        return;
    }

    const newName = document.getElementById('copyTrialName').value.trim() || `${source.trialName} Copy`;
    const startsOn = document.getElementById('copyStartsOn').value || addDays(source.startsOn, 1);
    const endsOn = document.getElementById('copyEndsOn').value || startsOn;

    if (!startsOn) {
        showMessage(formMessage, 'Choose a new start date for the copied trial.', 'warning');
        return;
    }

    upsertTrial(source);

    const copied = {
        ...source,
        id: crypto.randomUUID(),
        trialName: newName,
        eventNumber: '',
        startsOn,
        endsOn,
        entries: [],
        runPlan: [],
        judges: document.getElementById('copyJudges').checked ? cloneRows(source.judges) : [],
        workers: document.getElementById('copyWorkers').checked ? cloneRows(source.workers) : [],
        documentsReady: document.getElementById('copyDocuments').checked ? [...(source.documentsReady || [])] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    trials.unshift(copied);
    selectedTrialId = copied.id;
    saveTrials();
    clearValues(['copyTrialName', 'copyStartsOn', 'copyEndsOn']);
    showMessage(formMessage, `Copied setup to ${copied.trialName}. Entries were left empty.`, 'success');
    render();
}

function cloneRows(rows = []) {
    return rows.map((row) => ({
        ...row,
        id: crypto.randomUUID(),
    }));
}

function addDays(dateString, days) {
    if (!dateString) {
        return '';
    }

    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

function getEntryTargetTrialIds() {
    return Array.from(document.querySelectorAll('#entryTrialTargets input:checked')).map((input) => input.value);
}

function buildTrialEntry(hound, selectedRegistration, className, id = crypto.randomUUID(), documentResult = null) {
    const firstTime = document.getElementById('entryFirstTime').checked;
    const certRequired = document.getElementById('entryCertRequired').checked || firstTime;
    const documentRecords = documentResult && Array.isArray(documentResult.documents) ? documentResult.documents : [];
    const registrationCert = documentResult && documentResult.registrationCert ? documentResult.registrationCert : null;
    const coursingCert = documentResult && documentResult.coursingCert ? documentResult.coursingCert : null;
    const missingDocumentOverride = Boolean(documentResult && documentResult.overrideMissingDocuments);
    const entryBreed = document.getElementById('entryBreed')?.value.trim() || hound.breed;
    return normalizeLciEntryShape({
        id,
        houndId: hound.id,
        callName: hound.callName,
        registeredName: hound.registeredName,
        breed: entryBreed,
        registrationNumber: selectedRegistration.number,
        registry: selectedRegistration.registry,
        registrationType: selectedRegistration.type,
        registrationVerificationStatus: selectedRegistration.verificationStatus,
        className,
        handler: document.getElementById('entryHandler').value.trim(),
        owner: hound.owner || '',
        ownerEmail: hound.ownerEmail || '',
        ownerPhone: hound.ownerPhone || '',
        ownerAddress: hound.ownerAddress || '',
        ownerCity: hound.ownerCity || '',
        ownerState: hound.ownerState || '',
        ownerPostalCode: hound.ownerPostalCode || '',
        ownerCountry: hound.ownerCountry || '',
        sex: hound.sex || '',
        dob: hound.dob || '',
        breeder: hound.breeder || '',
        sire: hound.sire || '',
        dam: hound.dam || '',
        entryNumber: document.getElementById('entryNumber').value.trim(),
        firstTime,
        certRequired,
        firstTimeDocuments: documentRecords.map((document) => document.fileName).filter(Boolean),
        documentRecords,
        documentIds: documentRecords.map((document) => document.id).filter(Boolean),
        registrationCertDocumentId: registrationCert ? registrationCert.id : '',
        registrationCertFileName: registrationCert ? registrationCert.fileName : '',
        coursingCertDocumentId: coursingCert ? coursingCert.id : '',
        coursingCertFileName: coursingCert ? coursingCert.fileName : '',
        documentStatus: certRequired ? (documentRecords.length ? 'received' : 'needed') : '',
        documentStorageStatus: documentRecords.length ? 'stored' : '',
        needsDocumentUpload: certRequired && documentRecords.length === 0,
        missingDocumentOverride,
        missingDocumentOverrideAt: missingDocumentOverride ? new Date().toISOString() : '',
        missingDocumentMessage: missingDocumentOverride ? (documentResult.missingDocumentMessage || '') : '',
        ownerSeparationRequested: document.getElementById('entryOwnerSeparation').checked,
        ownerSeparationGroup: document.getElementById('entryOwnerSeparation').checked
            ? document.getElementById('entryOwnerSeparationGroup').value.trim().toUpperCase()
            : '',
        additionalKennel: document.getElementById('entryAdditionalKennel')?.checked || false,
        additionalBreeder: document.getElementById('entryAdditionalBreeder')?.checked || false,
        additionalBench: document.getElementById('entryAdditionalBench')?.checked || false,
        infoChanged: document.getElementById('entryInfoChanged')?.checked || false,
        dismissedLastSix: document.getElementById('entryDismissedLastSix')?.checked || false,
        signatureName: hound.owner || '',
        rollCallStatus: '',
        rollCallNotes: '',
    });
}

async function collectManualEntryDocuments(className) {
    const firstTime = document.getElementById('entryFirstTime').checked;
    const certRequired = document.getElementById('entryCertRequired').checked || firstTime;
    const registrationFile = document.getElementById('entryRegistrationCertFile')?.files?.[0] || null;
    const coursingFile = document.getElementById('entryCoursingCertFile')?.files?.[0] || null;
    const selectedBreed = document.getElementById('entryBreed')?.value || '';
    const needsCoursingCert = firstTime && !isQuasiBreedClass(className) && !isLciEntryData(selectedBreed, className);
    const trial = getSelectedTrial();
    const existingEntry = editingEntryId && trial
        ? (trial.entries || []).find((entry) => entry.id === editingEntryId)
        : null;
    const hasExistingRegistrationCert = Boolean(existingEntry && (existingEntry.registrationCertDocumentId || (existingEntry.documentIds || []).length));
    const hasExistingCoursingCert = Boolean(existingEntry && existingEntry.coursingCertDocumentId);

    if (!certRequired && !registrationFile && !coursingFile) {
        return { ok: true, documents: [] };
    }
    if (firstTime && !registrationFile && !hasExistingRegistrationCert) {
        return { ok: false, message: 'Attach the registration certificate for this first-time entry.' };
    }
    if (needsCoursingCert && !coursingFile && !hasExistingCoursingCert) {
        return { ok: false, message: 'Attach the coursing certification for this first-time regular breed entry.' };
    }
    if (!isLocalServerMode() && (registrationFile || coursingFile)) {
        return { ok: false, message: 'Document uploads require SQLite/server mode. Start the app with start_field_trial_secretary.ps1.' };
    }

    const uploaded = [];
    let registrationCert = null;
    let coursingCert = null;
    if (registrationFile) {
        registrationCert = await uploadEntryDocumentFile(registrationFile, 'Registration certificate');
        uploaded.push(registrationCert);
    }
    if (coursingFile) {
        coursingCert = await uploadEntryDocumentFile(coursingFile, 'Coursing certification');
        uploaded.push(coursingCert);
    }
    return { ok: true, documents: uploaded, registrationCert, coursingCert };
}

async function uploadEntryDocumentFile(file, source) {
    const contentBase64 = await readFileBase64(file);
    if (!contentBase64) {
        throw new Error(`Could not read ${file.name}.`);
    }
    const payload = await apiRequest('/api/document', {
        method: 'POST',
        body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            contentBase64,
            source,
        }),
    });
    return payload.document;
}

function buildImportedTrialEntry(hound, imported, id = crypto.randomUUID()) {
    const lciParts = normalizeImportedLciParts(imported.breed, imported.className);
    const entryBreed = lciParts ? lciParts.breed : hound.breed;
    const entryClass = lciParts ? lciParts.className : (imported.className || 'Open');
    const entryDates = imported.entryDates && imported.entryDates.length
        ? imported.entryDates
        : parseImportedEntryDates(imported.trialDates);
    const registration = imported.registrationNumber
        ? {
            number: imported.registrationNumber,
            registry: imported.registry || hound.registry || '',
            type: imported.registrationType || hound.registrationType || '',
            verificationStatus: 'not_checked',
        }
        : parseRegistrationChoice('', hound);
    const documents = uniqueNames([...(imported.documents || []), ...(imported.attachmentNames || [])]);
    const documentRecords = Array.isArray(imported.uploadedDocuments) ? imported.uploadedDocuments : [];
    const firstTime = Boolean(imported.firstTime);
    const certRequired = Boolean(imported.certRequired || firstTime);

    return normalizeLciEntryShape({
        id,
        houndId: hound.id,
        callName: hound.callName,
        registeredName: hound.registeredName,
        breed: entryBreed,
        registrationNumber: registration.number || '',
        registry: registration.registry || '',
        registrationType: registration.type || '',
        registrationVerificationStatus: registration.verificationStatus || 'not_checked',
        className: entryClass,
        handler: imported.handler || imported.owner || hound.owner || '',
        owner: imported.owner || hound.owner || '',
        ownerEmail: imported.ownerEmail || hound.ownerEmail || '',
        ownerPhone: imported.ownerPhone || hound.ownerPhone || '',
        ownerAddress: imported.ownerAddress || hound.ownerAddress || '',
        ownerCity: imported.ownerCity || hound.ownerCity || '',
        ownerState: imported.ownerState || hound.ownerState || '',
        ownerPostalCode: imported.ownerPostalCode || hound.ownerPostalCode || '',
        ownerCountry: imported.ownerCountry || hound.ownerCountry || '',
        sex: imported.sex || hound.sex || '',
        dob: imported.dob || hound.dob || '',
        breeder: imported.breeder || hound.breeder || '',
        sire: imported.sire || hound.sire || '',
        dam: imported.dam || hound.dam || '',
        entryNumber: imported.entryNumber || '',
        trialDates: imported.trialDates || '',
        entryDates,
        normalizedEntryDates: normalizedImportedEntryDates(entryDates.join ? entryDates.join(', ') : imported.trialDates),
        firstTime,
        certRequired,
        ownerSeparationRequested: false,
        ownerSeparationGroup: '',
        additionalKennel: Boolean(imported.additionalKennel),
        additionalBreeder: Boolean(imported.additionalBreeder),
        additionalBench: Boolean(imported.additionalBench),
        infoChanged: Boolean(imported.infoChanged),
        dismissedLastSix: Boolean(imported.dismissedLastSix),
        signatureName: imported.owner || hound.owner || '',
        rollCallStatus: '',
        rollCallNotes: '',
        importedFrom: imported.importSource || 'Entry import',
        importedAt: new Date().toISOString(),
        importReviewStatus: 'reviewed',
        firstTimeDocuments: documents,
        documentRecords,
        documentIds: documentRecords.map((document) => document.id).filter(Boolean),
        documentStatus: certRequired ? (documents.length ? 'received' : 'needed') : '',
        documentStorageStatus: documentRecords.length ? 'stored' : (documents.length ? 'name_only' : ''),
        needsDocumentUpload: certRequired && documents.length === 0,
        jotformRaw: imported.raw || '',
    });
}

function renderJotformTargetTrialOptions() {
    const select = document.getElementById('jotformTargetTrial');
    if (!select) {
        return;
    }

    const current = select.value || selectedTrialId;
    select.innerHTML = '';
    trials.forEach((trial) => {
        const option = document.createElement('option');
        option.value = trial.id;
        option.textContent = [trial.trialName || 'Untitled trial', trial.startsOn].filter(Boolean).join(' | ');
        select.appendChild(option);
    });

    if (trials.some((trial) => trial.id === current)) {
        select.value = current;
    } else if (selectedTrialId) {
        select.value = selectedTrialId;
    }
}

function renderEntryImportTemplateOptions() {
    const select = document.getElementById('entryImportTemplateSelect');
    if (!select) {
        return;
    }
    const current = select.value;
    select.innerHTML = '';
    const auto = document.createElement('option');
    auto.value = '';
    auto.textContent = 'Auto-detect / Jotform';
    select.appendChild(auto);
    entryImportTemplates.forEach((template) => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        select.appendChild(option);
    });
    if (entryImportTemplates.some((template) => template.id === current)) {
        select.value = current;
    }
}

function renderEntryImportMapping() {
    const wrap = document.getElementById('entryImportMappingWrap');
    const body = document.getElementById('entryImportMappingTable');
    if (!wrap || !body) {
        return;
    }
    wrap.hidden = currentImportHeaders.length === 0;
    body.innerHTML = '';
    if (currentImportHeaders.length === 0) {
        return;
    }

    entryImportFieldDefinitions.forEach((field) => {
        const row = document.createElement('tr');
        const label = document.createElement('td');
        label.textContent = field.label;
        const pickerCell = document.createElement('td');
        const select = document.createElement('select');
        select.dataset.importField = field.key;
        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = 'Not imported';
        select.appendChild(blank);
        currentImportHeaders.forEach((header) => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            select.appendChild(option);
        });
        select.value = currentImportMapping[field.key] || '';
        select.addEventListener('change', () => {
            currentImportMapping[field.key] = select.value;
        });
        pickerCell.appendChild(select);
        row.append(label, pickerCell);
        body.appendChild(row);
    });
}

function inferEntryImportMapping(headers) {
    const mapping = {};
    entryImportFieldDefinitions.forEach((field) => {
        const found = headers.find((header) => {
            const cleanedHeader = clean(header);
            return field.aliases.some((alias) => cleanedHeader === clean(alias) || cleanedHeader.includes(clean(alias)));
        });
        if (found) {
            mapping[field.key] = found;
        }
    });
    return mapping;
}

function applySelectedEntryImportTemplate() {
    const templateId = document.getElementById('entryImportTemplateSelect')?.value || '';
    const template = entryImportTemplates.find((item) => item.id === templateId);
    if (!template) {
        currentImportMapping = inferEntryImportMapping(currentImportHeaders);
    } else {
        currentImportMapping = { ...(template.mapping || {}) };
    }
    renderEntryImportMapping();
    if (currentImportRows.length) {
        applyEntryImportMapping();
    }
}

function saveCurrentEntryImportTemplate() {
    if (currentImportHeaders.length === 0) {
        showMessage(entryImportMessageElement(), 'Preview a CSV or mapped import before saving a mapping template.', 'warning');
        return;
    }
    const name = document.getElementById('entryImportTemplateName')?.value.trim() || `Import Template ${entryImportTemplates.length + 1}`;
    const existing = entryImportTemplates.find((template) => clean(template.name) === clean(name));
    const template = {
        id: existing ? existing.id : crypto.randomUUID(),
        name,
        mapping: { ...currentImportMapping },
        updatedAt: new Date().toISOString(),
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };
    entryImportTemplates = existing
        ? entryImportTemplates.map((item) => item.id === existing.id ? template : item)
        : [...entryImportTemplates, template];
    saveEntryImportTemplates();
    renderEntryImportTemplateOptions();
    document.getElementById('entryImportTemplateSelect').value = template.id;
    showMessage(entryImportMessageElement(), `Saved import mapping template "${name}".`, 'success');
}

function entryImportMessageElement() {
    return document.getElementById('jotformImportSummary') || entryMessage;
}

function renderJotformImportPreview() {
    const body = document.getElementById('jotformImportPreviewTable');
    if (!body) {
        return;
    }

    body.innerHTML = '';
    if (stagedJotformEntries.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 13;
        cell.textContent = 'No Jotform entries previewed yet.';
        row.appendChild(cell);
        body.appendChild(row);
        return;
    }

    stagedJotformEntries.forEach((item, index) => {
        const row = document.createElement('tr');
        const docs = uniqueNames([...(item.documents || []), ...(item.attachmentNames || [])]);
        const notes = [];
        if (!item.className) {
            notes.push('Stake/class missing; imports as Open unless edited later.');
        }
        if (!item.breed) {
            notes.push('Breed missing.');
        }
        if (item.firstTime && docs.length === 0) {
            notes.push('First-time docs needed.');
        }
        if (!item.match) {
            notes.push('Will create hound.');
        }

        [
            item.sourceName || 'Pasted text',
            '',
            '',
            item.callName || '',
            item.registeredName || '',
            item.breed || '',
            item.trialDates || '',
            formatRegistration(item.registry, item.registrationNumber, item.registrationType),
            item.className || 'Open',
            item.owner || '',
            item.firstTime ? 'Yes' : '',
            docs.length ? docs.join(', ') : '',
            notes.join(' '),
        ].forEach((value, columnIndex) => {
            const cell = document.createElement('td');
            if (columnIndex === 1) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = item.selected !== false;
                checkbox.dataset.jotformIndex = String(index);
                checkbox.addEventListener('change', (event) => {
                    stagedJotformEntries[index].selected = event.target.checked;
                });
                cell.appendChild(checkbox);
            } else if (columnIndex === 2) {
                cell.appendChild(buildJotformHoundChoice(index));
            } else {
                cell.textContent = value;
            }
            row.appendChild(cell);
        });
        body.appendChild(row);
    });
}

function buildJotformHoundChoice(index) {
    const item = stagedJotformEntries[index];
    const select = document.createElement('select');
    select.className = 'small-select';
    const newOption = document.createElement('option');
    newOption.value = 'new';
    newOption.textContent = 'Create new hound';
    select.appendChild(newOption);

    const suggestions = suggestedHoundsForImport(item);
    suggestions.forEach((hound) => {
        const option = document.createElement('option');
        option.value = hound.id;
        option.textContent = houndLabel(hound);
        select.appendChild(option);
    });

    const divider = document.createElement('option');
    divider.disabled = true;
    divider.textContent = 'â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€';
    select.appendChild(divider);

    masterHounds
        .filter((hound) => !suggestions.some((suggestion) => suggestion.id === hound.id))
        .sort((a, b) => String(a.callName || a.registeredName || '').localeCompare(String(b.callName || b.registeredName || ''), undefined, { sensitivity: 'base' }))
        .forEach((hound) => {
            const option = document.createElement('option');
            option.value = hound.id;
            option.textContent = houndLabel(hound);
            select.appendChild(option);
        });

    select.value = item.match ? item.match.id : 'new';
    select.addEventListener('change', (event) => chooseJotformHoundForRow(index, event.target.value));
    return select;
}

function suggestedHoundsForImport(item) {
    const suggestions = [];
    const add = (hound) => {
        if (hound && !suggestions.some((candidate) => candidate.id === hound.id)) {
            suggestions.push(hound);
        }
    };
    add(item.match);
    const reg = clean(item.registrationNumber);
    if (reg) {
        masterHounds.forEach((hound) => {
            if ([hound.registrationNumber, hound.alternateRegistrationNumber].map(clean).includes(reg)) {
                add(hound);
            }
        });
    }
    const call = clean(item.callName);
    if (call) {
        masterHounds.forEach((hound) => {
            if (clean(hound.callName) === call) {
                add(hound);
            }
        });
    }
    return suggestions;
}

function chooseJotformHoundForRow(index, houndId) {
    const item = stagedJotformEntries[index];
    if (!item) {
        return;
    }
    if (houndId === 'new') {
        stagedJotformEntries[index] = {
            ...item,
            match: null,
            matchType: '',
        };
        renderJotformImportPreview();
        return;
    }

    const hound = masterHounds.find((candidate) => candidate.id === houndId);
    if (!hound) {
        return;
    }
    stagedJotformEntries[index] = hydrateImportedEntryFromHound(item, hound, 'manual choice');
    renderJotformImportPreview();
}

async function previewJotformImport() {
    const text = document.getElementById('jotformImportText')?.value || '';
    const files = Array.from(document.getElementById('jotformImportFiles')?.files || []);
    stagedJotformFiles = files;
    const csvFiles = files.filter((file) => /\.csv$/i.test(file.name));
    const textLooksCsv = text.trim() && text.includes(',') && text.split(/\r?\n/).length > 1;
    if (csvFiles.length || textLooksCsv) {
        await previewMappedEntryImport(text, files, csvFiles, textLooksCsv);
        return;
    }

    currentImportHeaders = [];
    currentImportRows = [];
    currentImportMapping = {};
    const textFiles = files.filter((file) => /\.(txt|eml|json|html?)$/i.test(file.name));
    const nonTextFiles = files.filter((file) => !textFiles.includes(file));
    const parsed = [];

    if (text.trim()) {
        parseJotformImportText(text).forEach((item) => {
            parsed.push({
                ...item,
                sourceName: 'Pasted text',
                sourceFileIndexes: nonTextFiles.map((file) => files.indexOf(file)).filter((index) => index >= 0),
                attachmentNames: nonTextFiles.map((file) => file.name),
            });
        });
    }

    const fileText = await Promise.all(textFiles.map(async (file) => ({ file, text: await readTextFile(file) })));
    fileText.forEach(({ file, text: fileBody }) => {
        parseJotformImportText(fileBody).forEach((item) => {
            const fileIndex = files.indexOf(file);
            parsed.push({
                ...item,
                sourceName: file.name,
                sourceFileIndexes: fileIndex >= 0 ? [fileIndex] : [],
                attachmentNames: [file.name],
            });
        });
    });

    stagedJotformEntries = parsed.map((item) => {
        const match = matchImportedHound(item);
        return hydrateImportedEntryFromHound({
            ...item,
            selected: true,
        }, match.hound, match.type);
    });

    renderJotformImportPreview();
    const summary = document.getElementById('jotformImportSummary');
    const needingDocs = stagedJotformEntries.filter((item) => item.firstTime && uniqueNames([...(item.documents || []), ...(item.attachmentNames || [])]).length === 0).length;
    showMessage(
        summary || entryMessage,
        stagedJotformEntries.length
            ? `Previewed ${stagedJotformEntries.length} entr${stagedJotformEntries.length === 1 ? 'y' : 'ies'}. ${needingDocs ? `${needingDocs} first-time entr${needingDocs === 1 ? 'y needs' : 'ies need'} documentation.` : 'First-time documentation was found or not required.'}`
            : 'No recognizable Jotform entries were found. Paste the email body with labels like Call Name, Registered Name, Breed, Registration, Stake, and Owner.',
        stagedJotformEntries.length ? 'success' : 'warning'
    );
}

async function previewMappedEntryImport(text, files, csvFiles, textLooksCsv) {
    const rows = [];
    if (textLooksCsv) {
        parseCsvText(text).forEach((row) => {
            rows.push({
                ...row,
                __sourceName: 'Pasted CSV',
                __sourceFileIndexes: files.map((file, index) => index).filter((index) => !/\.csv$/i.test(files[index].name)),
            });
        });
    }

    const csvText = await Promise.all(csvFiles.map(async (file) => ({ file, text: await readTextFile(file) })));
    csvText.forEach(({ file, text: fileBody }) => {
        const fileIndex = files.indexOf(file);
        parseCsvText(fileBody).forEach((row) => {
            rows.push({
                ...row,
                __sourceName: file.name,
                __sourceFileIndexes: fileIndex >= 0 ? [fileIndex] : [],
            });
        });
    });

    currentImportRows = rows;
    currentImportHeaders = uniqueNames(rows.flatMap((row) => Object.keys(row).filter((key) => !key.startsWith('__'))));
    const templateId = document.getElementById('entryImportTemplateSelect')?.value || '';
    const template = entryImportTemplates.find((item) => item.id === templateId);
    currentImportMapping = template ? { ...(template.mapping || {}) } : inferEntryImportMapping(currentImportHeaders);
    renderEntryImportMapping();
    applyEntryImportMapping();
}

function applyEntryImportMapping() {
    if (currentImportRows.length === 0) {
        showMessage(entryImportMessageElement(), 'Preview a CSV import before applying a mapping.', 'warning');
        return;
    }

    stagedJotformEntries = currentImportRows.map((row) => {
        const item = normalizeMappedImportRow(row);
        const match = matchImportedHound(item);
        return hydrateImportedEntryFromHound(item, match.hound, match.type);
    });
    renderJotformImportPreview();
    const mappedCount = Object.values(currentImportMapping).filter(Boolean).length;
    showMessage(
        document.getElementById('jotformImportSummary') || entryMessage,
        `Previewed ${stagedJotformEntries.length} row${stagedJotformEntries.length === 1 ? '' : 's'} with ${mappedCount} mapped field${mappedCount === 1 ? '' : 's'}. Adjust mapping if needed, then Apply Mapping.`,
        stagedJotformEntries.length ? 'success' : 'warning'
    );
}

function normalizeMappedImportRow(row) {
    const pick = (key) => {
        const source = currentImportMapping[key];
        return source ? String(row[source] || '').trim() : '';
    };
    const sourceFileIndexes = Array.isArray(row.__sourceFileIndexes) ? row.__sourceFileIndexes : [];
    const rawBreed = pick('breed');
    const rawClassName = pick('className');
    const lciParts = normalizeImportedLciParts(rawBreed, rawClassName);
    return {
        callName: pick('callName'),
        registeredName: pick('registeredName'),
        breed: lciParts ? lciParts.breed : normalizeImportedBreed(rawBreed),
        trialDates: pick('trialDates'),
        registrationNumber: pick('registrationNumber'),
        registry: pick('registry') || inferRegistry(pick('registrationType'), pick('registrationNumber')),
        registrationType: pick('registrationType'),
        className: lciParts ? lciParts.className : normalizeImportedClass(rawClassName),
        handler: pick('handler'),
        owner: pick('owner'),
        ownerEmail: pick('ownerEmail'),
        ownerPhone: pick('ownerPhone'),
        entryNumber: pick('entryNumber'),
        firstTime: parseYesNo(pick('firstTime')),
        certRequired: parseYesNo(pick('certRequired')),
        importSource: 'Mapped CSV import',
        sourceName: row.__sourceName || 'CSV row',
        sourceFileIndexes,
        attachmentNames: sourceFileIndexes.map((index) => stagedJotformFiles[index]?.name).filter(Boolean),
        selected: true,
        raw: JSON.stringify(row),
    };
}

function parseCsvText(text) {
    const rows = csvToArrays(text);
    if (rows.length < 2) {
        return [];
    }
    const headers = rows[0].map((header, index) => String(header || `Column ${index + 1}`).trim() || `Column ${index + 1}`);
    return rows.slice(1)
        .filter((row) => row.some((value) => String(value || '').trim()))
        .map((row) => {
            const object = {};
            headers.forEach((header, index) => {
                object[header] = row[index] || '';
            });
            return object;
        });
}

function csvToArrays(text) {
    const rows = [];
    let row = [];
    let value = '';
    let quoted = false;
    const source = String(text || '').replace(/^\uFEFF/, '');
    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        const next = source[index + 1];
        if (char === '"' && quoted && next === '"') {
            value += '"';
            index += 1;
            continue;
        }
        if (char === '"') {
            quoted = !quoted;
            continue;
        }
        if (char === ',' && !quoted) {
            row.push(value);
            value = '';
            continue;
        }
        if ((char === '\n' || char === '\r') && !quoted) {
            if (char === '\r' && next === '\n') {
                index += 1;
            }
            row.push(value);
            rows.push(row);
            row = [];
            value = '';
            continue;
        }
        value += char;
    }
    row.push(value);
    rows.push(row);
    return rows;
}

function hydrateImportedEntryFromHound(item, hound, matchType) {
    if (!hound) {
        return {
            ...item,
            match: null,
            matchType: '',
        };
    }
    const lciParts = normalizeImportedLciParts(item.breed, item.className);
    return {
        ...item,
        breed: lciParts ? lciParts.breed : (item.breed || hound.breed || ''),
        className: lciParts ? lciParts.className : item.className,
        callName: item.callName || hound.callName || '',
        registeredName: item.registeredName || hound.registeredName || '',
        owner: item.owner || hound.owner || '',
        ownerEmail: item.ownerEmail || hound.ownerEmail || '',
        ownerPhone: item.ownerPhone || hound.ownerPhone || '',
        match: hound,
        matchType,
    };
}

function readTextFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => resolve('');
        reader.readAsText(file);
    });
}

function readFileBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.includes(',') ? result.split(',', 2)[1] : result);
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
    });
}

async function uploadJotformDocuments(files) {
    if (!isLocalServerMode() || files.length === 0) {
        return [];
    }

    const uploaded = [];
    for (const file of files) {
        const contentBase64 = await readFileBase64(file);
        if (!contentBase64) {
            continue;
        }
        const payload = await apiRequest('/api/document', {
            method: 'POST',
            body: JSON.stringify({
                fileName: file.name,
                mimeType: file.type || 'application/octet-stream',
                contentBase64,
                source: 'Entry import',
            }),
        });
        if (payload.document) {
            uploaded.push(payload.document);
        }
    }
    return uploaded;
}

function parseJotformImportText(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) {
        return [];
    }

    const jsonEntries = parseJotformJson(trimmed);
    if (jsonEntries.length) {
        return jsonEntries;
    }

    return splitJotformBlocks(trimmed)
        .map(parseJotformBlock)
        .filter((item) => item.callName || item.registeredName || item.registrationNumber);
}

function parseJotformJson(text) {
    try {
        const value = JSON.parse(text);
        const rows = Array.isArray(value) ? value : [value];
        return rows
            .map((row) => parseJotformFlatObject(flattenJotformObject(row)))
            .filter((item) => item.callName || item.registeredName || item.registrationNumber);
    } catch {
        return [];
    }
}

function flattenJotformObject(value, prefix = '', output = {}) {
    Object.entries(value || {}).forEach(([key, fieldValue]) => {
        const label = prefix ? `${prefix} ${key}` : key;
        if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
            flattenJotformObject(fieldValue, label, output);
            return;
        }
        output[label] = Array.isArray(fieldValue) ? fieldValue.join(', ') : String(fieldValue || '');
    });
    return output;
}

function parseJotformFlatObject(fields) {
    const pairs = Object.entries(fields || {}).map(([label, value]) => ({ label, value }));
    return normalizeJotformPairs(pairs, JSON.stringify(fields));
}

function splitJotformBlocks(text) {
    const normalized = text.replace(/\r/g, '');
    if ((normalized.match(/\n\s*Submission ID\s*:/gi) || []).length > 1) {
        return normalized.split(/\n(?=\s*Submission ID\s*:)/gi).filter((block) => block.trim());
    }
    if ((normalized.match(/\n\s*(?:Call Name|Dog Call Name|Hound Call Name)\s*:/gi) || []).length > 1) {
        return normalized.split(/\n(?=\s*(?:Call Name|Dog Call Name|Hound Call Name)\s*:)/gi).filter((block) => block.trim());
    }
    return [normalized];
}

function parseJotformBlock(block) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const pairs = [];
    lines.forEach((line, index) => {
        const colon = line.match(/^([^:]{2,90})\s*:\s*(.+)$/);
        if (colon) {
            pairs.push({ label: colon[1], value: colon[2] });
            return;
        }
        const inlinePair = extractInlineJotformPair(line);
        if (inlinePair) {
            pairs.push(inlinePair);
            return;
        }
        if (isKnownJotformLabel(line) && lines[index + 1]) {
            pairs.push({ label: line, value: lines[index + 1] });
            return;
        }
        const previous = pairs[pairs.length - 1];
        if (previous && shouldAppendJotformContinuation(previous.label, line)) {
            previous.value = `${previous.value} ${line}`.trim();
        }
    });
    return normalizeJotformPairs(pairs, block);
}

function shouldAppendJotformContinuation(label, line) {
    if (!/date|full name of dog|registered name|address|owner|sire|dam|breeder/i.test(label)) {
        return false;
    }
    if (isKnownJotformLabel(line) || /^https?:\/\//i.test(line) || /^you can edit/i.test(line)) {
        return false;
    }
    return line.length < 180;
}

function extractInlineJotformPair(line) {
    const labels = [
        'Name of Owner\'s Agent/Handler (if any) at Trial',
        'Is this hound entered in Open, Veterans or Provisional as a First Time Entry?',
        'Is this a first-time entry in an ASFA trial? If so, a copy of the official Registration of this hound must accompany this entry unless NGA.',
        'Signature of owner or agent duly authorized to make this entry',
        'Please Separate My Entries',
        'Actual Owner (s)',
        'Registration Number',
        'Registration Type',
        'Sighthound Stakes',
        'Full Name of Dog',
        'Date of Birth',
        'Phone Number',
        'Call Name',
        'Breeder',
        'Breed',
        'Email',
        'Date',
        'Sire',
        'Dam',
        'Sex',
    ];
    const cleanedLine = String(line || '').trim();
    const found = labels.find((label) => cleanedLine.toUpperCase().startsWith(label.toUpperCase()));
    if (!found) {
        return null;
    }
    const value = cleanedLine.slice(found.length).replace(/^[:\s-]+/, '').trim();
    return value ? { label: found, value } : null;
}

function isKnownJotformLabel(label) {
    return /^date\b|date of birth|dob\b|call name|registered name|full name of dog|breed|registration|reg #|stake|class|owner|actual owner|handler|address|city|state|zip|postal|country|phone|email|sex\b|sire\b|dam\b|breeder\b|signature|first time|certificate|attachment|document|entry number/i.test(label);
}

function normalizeJotformPairs(pairs, raw) {
    const value = (...patterns) => {
        const found = pairs.find((pair) => patterns.some((pattern) => pattern.test(pair.label)));
        return found ? String(found.value || '').trim() : '';
    };
    const registryLabel = pairs.find((pair) => /akc|asfa|registry|registration/i.test(pair.label))?.label || '';
    const registrationNumber = value(/^registration\s*(number|#)$/i, /^reg\s*#/i, /^akc\s*(number|#)$/i, /^asfa\s*(number|#)$/i);
    const registrationType = value(/registration\s*type/i);
    const registry = value(/^registry$/i) || inferRegistry(`${registryLabel} ${registrationType}`, registrationNumber);
    const firstTime = parseYesNo(value(/first\s*time/i, /first\s*time\s*entry/i));
    const certRequired = parseYesNo(value(/cert/i, /registration\s*certificate/i, /documentation/i));
    const documents = pairs
        .filter((pair) => /attachment|document|certificate|file/i.test(pair.label))
        .flatMap((pair) => String(pair.value || '').split(/[,;]+/).map((item) => item.trim()).filter(Boolean));
    const rawBreed = value(/^breed$/i, /hound\s*breed/i, /dog\s*breed/i);
    const rawClassName = value(/sighthound\s*stakes/i, /stake/i, /^class$/i, /stake\s*\/\s*class/i);
    const lciParts = normalizeImportedLciParts(rawBreed, rawClassName);

    const callName = cleanImportedEntryField(value(/call\s*name/i, /dog\s*name/i, /hound\s*name/i));
    const registeredName = cleanImportedRegisteredName(value(/registered\s*name/i, /registration\s*name/i, /full\s*name\s*of\s*dog/i), callName);
    const owner = cleanImportedEntryField(value(/^owner$/i, /owner\s*name/i, /actual\s*owner/i));

    return {
        callName,
        registeredName,
        breed: lciParts ? lciParts.breed : normalizeImportedBreed(rawBreed),
        trialDates: value(/^date$/i, /trial\s*date/i),
        registrationNumber,
        registry,
        registrationType,
        className: lciParts ? lciParts.className : normalizeImportedClass(rawClassName),
        handler: cleanImportedEntryField(value(/handler/i)),
        owner,
        ownerEmail: cleanImportedEntryField(value(/owner.*email/i, /^email$/i)),
        ownerPhone: cleanImportedEntryField(value(/owner.*phone/i, /^phone$/i)),
        ownerAddress: cleanImportedEntryField(value(/^address$/i, /owner.*address/i, /actual.*address/i)),
        ownerCity: cleanImportedEntryField(value(/^city$/i, /owner.*city/i)),
        ownerState: cleanImportedEntryField(value(/^state$/i, /owner.*state/i)),
        ownerPostalCode: cleanImportedEntryField(value(/^zip$/i, /postal/i, /zip.*code/i)),
        ownerCountry: cleanImportedEntryField(value(/^country$/i)),
        sex: cleanImportedEntryField(value(/^sex$/i)),
        dob: cleanImportedEntryField(value(/date\s*of\s*birth/i, /^dob$/i, /^birth\s*date$/i)),
        breeder: cleanImportedEntryField(value(/^breeder$/i)),
        sire: cleanImportedEntryField(value(/^sire$/i)),
        dam: cleanImportedEntryField(value(/^dam$/i)),
        entryNumber: value(/entry\s*(number|#)/i),
        firstTime,
        certRequired: certRequired || firstTime,
        documents,
        importSource: 'Jotform email',
        raw,
    };
}

function cleanImportedRegisteredName(value, callName = '') {
    let text = cleanImportedEntryField(value);
    return text;
}

function cleanImportedEntryField(value) {
    let text = String(value || '').replace(/\s+/g, ' ').trim();
    text = text.replace(/\s+\b(?:Address|Add\.?|Phone|Email|E-mail|City|State|Zip|Postal)\b\.?:?\s*$/i, '').trim();
    return dedupeImportedRepeatedPhrase(text);
}

function dedupeImportedRepeatedPhrase(value) {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (words.length && words.length % 2 === 0) {
        const midpoint = words.length / 2;
        const first = words.slice(0, midpoint).join(' ').toLowerCase();
        const second = words.slice(midpoint).join(' ').toLowerCase();
        if (first === second) {
            return words.slice(0, midpoint).join(' ');
        }
    }
    return String(value || '').trim();
}

function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseImportedEntryDates(value) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) {
        return [];
    }
    const monthRange = text.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})\s*(?:-|â€“|&|and|,)\s*(\d{1,2}),?\s+(\d{4})\b/i);
    if (monthRange) {
        const month = monthRange[1];
        const startDay = Number(monthRange[2]);
        const endDay = Number(monthRange[3]);
        const year = monthRange[4];
        const low = Math.min(startDay, endDay);
        const high = Math.max(startDay, endDay);
        return Array.from({ length: high - low + 1 }, (_, index) => `${month} ${low + index}, ${year}`);
    }
    const matches = text.match(/\b(?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)?,?\s*(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b/gi);
    if (matches && matches.length) {
        return matches.map((match) => match.replace(/^(?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?),?\s+/i, '').trim());
    }
    const isoMatches = text.match(/\b\d{4}-\d{1,2}-\d{1,2}\b/g);
    if (isoMatches && isoMatches.length) {
        return isoMatches;
    }
    const slashMatches = text.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g);
    if (slashMatches && slashMatches.length) {
        return slashMatches;
    }
    return [text];
}

function normalizedImportedEntryDates(value) {
    return uniqueNames(parseImportedEntryDates(value).map(normalizeImportDate).filter(Boolean));
}

function normalizeImportDate(value) {
    const text = String(value || '').trim();
    if (!text) {
        return '';
    }
    const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) {
        return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
    }
    const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (slash) {
        const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
        return `${year}-${slash[1].padStart(2, '0')}-${slash[2].padStart(2, '0')}`;
    }
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }
    return '';
}

function entryDatesLabel(entry, trial) {
    if (Array.isArray(entry.entryDates) && entry.entryDates.length) {
        return entry.entryDates.join(', ');
    }
    if (entry.trialDates) {
        return entry.trialDates;
    }
    if (trial && trial.startsOn && trial.endsOn && trial.endsOn !== trial.startsOn) {
        return `${trial.startsOn} to ${trial.endsOn}`;
    }
    return trial && trial.startsOn ? trial.startsOn : '';
}

function entryTrialMembershipLabel(entry) {
    const memberships = [];
    trials
        .filter((trial) => !trial.archivedAt)
        .forEach((trial) => {
            const entries = Array.isArray(trial.entries) ? trial.entries : [];
            const match = entries.find((candidate) => sameHoundEntry(candidate, entry));
            if (!match) {
                return;
            }
            const date = trial.startsOn || entryDatesLabel(match, trial);
            const name = trial.trialName || 'Untitled trial';
            memberships.push([name, date, match.className].filter(Boolean).join(' | '));
        });
    return memberships.join('; ');
}

function entryDocumentLinks(entry) {
    const links = [];
    if (entry.registrationCertDocumentId) {
        links.push({
            id: entry.registrationCertDocumentId,
            label: `Registration: ${entry.registrationCertFileName || 'certificate'}`,
        });
    }
    if (entry.coursingCertDocumentId) {
        links.push({
            id: entry.coursingCertDocumentId,
            label: `Coursing: ${entry.coursingCertFileName || 'certification'}`,
        });
    }
    if (links.length === 0 && Array.isArray(entry.documentRecords)) {
        entry.documentRecords.forEach((documentRecord, index) => {
            if (documentRecord.id) {
                links.push({
                    id: documentRecord.id,
                    label: documentRecord.fileName || `Document ${index + 1}`,
                });
            }
        });
    }
    if (links.length === 0 && Array.isArray(entry.documentIds)) {
        entry.documentIds.forEach((documentId, index) => {
            if (documentId) {
                links.push({
                    id: documentId,
                    label: `Document ${index + 1}`,
                });
            }
        });
    }
    return links;
}

function entryDocumentLabel(entry) {
    const links = entryDocumentLinks(entry);
    if (links.length > 0) {
        return `${links.length} attached`;
    }
    if (entryNeedsDocuments(entry)) {
        return entry.missingDocumentOverride ? 'Needed - override' : 'Needed';
    }
    return '';
}

function entryNeedsDocuments(entry) {
    if (!entry) {
        return false;
    }
    const required = Boolean(entry.firstTime || entry.certRequired || entry.needsDocumentUpload || entry.documentStatus === 'needed');
    if (!required) {
        return false;
    }
    return entryDocumentLinks(entry).length === 0;
}

function documentViewLink(documentInfo) {
    const link = document.createElement('a');
    link.href = `/api/document/${encodeURIComponent(documentInfo.id)}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = documentInfo.label;
    return link;
}

function sameHoundEntry(a, b) {
    if (a.houndId && b.houndId && a.houndId === b.houndId) {
        return true;
    }
    const aReg = clean(a.registrationNumber);
    const bReg = clean(b.registrationNumber);
    if (aReg && bReg && aReg === bReg) {
        return true;
    }
    return clean(a.callName) && clean(a.callName) === clean(b.callName) && clean(a.breed) === clean(b.breed);
}

function parseYesNo(value) {
    return /^(yes|y|true|checked|on|1|required|attached|submitted)$/i.test(String(value || '').trim());
}

function inferRegistry(label, number) {
    if (/asfa/i.test(label)) {
        return 'ASFA';
    }
    if (/akc/i.test(label)) {
        return 'AKC';
    }
    return '';
}

function normalizeImportedBreed(value) {
    const cleaned = clean(value);
    const lci = normalizeImportedLciParts(value, '');
    if (lci) {
        return lci.breed;
    }
    const found = breedOptions.find(([code, label]) => cleaned === clean(code) || cleaned === clean(label));
    return found ? found[0] : String(value || '').trim();
}

function normalizeImportedClass(value) {
    const cleaned = clean(value);
    if (!cleaned) {
        return '';
    }
    const lci = normalizeImportedLciParts('', value);
    if (lci) {
        return lci.className;
    }
    const allClasses = [...defaultClassOptions, ...lciClassOptions, ...lciStakes];
    const found = allClasses.find((className) => clean(className) === cleaned || cleaned.includes(clean(className)));
    return found || String(value || '').trim();
}

function normalizeImportedLciParts(breedValue, classValue) {
    const source = `${breedValue || ''} ${classValue || ''}`;
    const cleaned = clean(source);
    const cleanBreed = clean(breedValue);
    const cleanClass = clean(classValue);
    const knownLciBreed = lciDivisions.find((division) => clean(division) === cleanBreed || cleanBreed.includes(clean(division)));
    if (!cleaned.includes('LCI') && !knownLciBreed) {
        return null;
    }
    let breed = knownLciBreed || '';
    if (cleaned.includes('SMALL') || cleaned.includes('SM')) {
        breed = 'LCI Small';
    } else if (cleaned.includes('LARGE') || cleaned.includes('LG')) {
        breed = 'LCI Large';
    } else if (cleaned.includes('SIGHTHOUNDMIX') || cleaned.includes('SHMIX') || cleaned.includes('SH')) {
        breed = 'LCI Sighthound Mix';
    }
    let className = '';
    if (cleaned.includes('VETERAN') || cleaned.includes('VET')) {
        className = 'Veteran';
    } else if (cleaned.includes('EXCELLENT') || cleaned.includes('EXC')) {
        className = 'Excellent';
    } else if (cleaned.includes('OPEN')) {
        className = 'Open';
    }
    if (!breed && lciDivisions.some((division) => cleaned.includes(clean(division)))) {
        breed = lciDivisions.find((division) => cleaned.includes(clean(division))) || '';
    }
    if (!className && lciStakes.some((stake) => cleaned.includes(clean(stake)) || cleanClass === clean(stake))) {
        className = lciStakes.find((stake) => cleaned.includes(clean(stake)) || cleanClass === clean(stake)) || '';
    }
    if (!breed) {
        return null;
    }
    return { breed, className: className || 'Open' };
}

function matchImportedHound(imported) {
    const reg = clean(imported.registrationNumber);
    if (reg) {
        const byReg = masterHounds.find((hound) => [hound.registrationNumber, hound.alternateRegistrationNumber].map(clean).includes(reg));
        if (byReg) {
            return { hound: byReg, type: 'registration' };
        }
    }

    const registeredName = clean(imported.registeredName);
    if (registeredName) {
        const byRegisteredName = masterHounds.find((hound) => clean(hound.registeredName) === registeredName);
        if (byRegisteredName) {
            return { hound: byRegisteredName, type: 'registered name' };
        }
    }

    const callName = clean(imported.callName);
    const breed = clean(imported.breed);
    if (callName && breed) {
        const byCallAndBreed = masterHounds.find((hound) => clean(hound.callName) === callName && clean(hound.breed) === breed);
        if (byCallAndBreed) {
            return { hound: byCallAndBreed, type: 'call name + breed' };
        }
        if (normalizeImportedLciParts(imported.breed, imported.className)) {
            const callMatches = masterHounds.filter((hound) => clean(hound.callName) === callName);
            if (callMatches.length === 1) {
                return { hound: callMatches[0], type: 'call name + LCI' };
            }
        }
    }

    return { hound: null, type: '' };
}

function createHoundFromImportedEntry(imported) {
    const existing = matchImportedHound(imported).hound;
    if (existing) {
        const lciParts = normalizeImportedLciParts(imported.breed, imported.className);
        if (lciParts && existing.breed !== lciParts.breed) {
            const updated = {
                ...existing,
                breed: lciParts.breed,
                updatedAt: new Date().toISOString(),
            };
            masterHounds = masterHounds.map((hound) => hound.id === existing.id ? updated : hound);
            return updated;
        }
        return existing;
    }

    const now = new Date().toISOString();
    const hound = normalizeLciHoundShape({
        id: crypto.randomUUID(),
        callName: imported.callName || imported.registeredName || 'Imported Hound',
        registeredName: imported.registeredName || imported.callName || '',
        breed: imported.breed || '',
        registrationNumber: imported.registrationNumber || '',
        registry: imported.registry || '',
        registrationType: imported.registrationType || '',
        registrationDisplay: formatRegistration(imported.registry, imported.registrationNumber, imported.registrationType),
        alternateRegistry: '',
        alternateRegistrationNumber: '',
        alternateRegistrationDisplay: '',
        registrationVerificationStatus: 'not_checked',
        alternateVerificationStatus: '',
        sex: '',
        dob: '',
        owner: imported.owner || '',
        ownerEmail: imported.ownerEmail || '',
        ownerPhone: imported.ownerPhone || '',
        ownerAddress: '',
        ownerCity: '',
        ownerState: '',
        ownerPostalCode: '',
        ownerCountry: '',
        breeder: '',
        sire: '',
        dam: '',
        importedFrom: imported.importSource || 'Entry import',
        createdAt: now,
        updatedAt: now,
    });
    masterHounds.unshift(hound);
    return hound;
}

async function importStagedJotformEntries() {
    const targetId = document.getElementById('jotformTargetTrial')?.value || selectedTrialId;
    const target = trials.find((trial) => trial.id === targetId);
    const selected = stagedJotformEntries.filter((item) => item.selected !== false);
    if (!target) {
        showMessage(entryImportMessageElement(), 'Choose a target trial before importing Jotform entries.', 'warning');
        return;
    }
    if (selected.length === 0) {
        showMessage(entryImportMessageElement(), 'Preview and select at least one Jotform entry to import.', 'warning');
        return;
    }
    const incomplete = selected.filter((item) => !item.breed || (!item.callName && !item.registeredName && !item.registrationNumber));
    if (incomplete.length > 0) {
        showMessage(entryImportMessageElement(), `Fix or uncheck ${incomplete.length} import row${incomplete.length === 1 ? '' : 's'} missing breed or hound identification before importing.`, 'warning');
        return;
    }

    let createdHounds = 0;
    let addedEntries = 0;
    let skipped = 0;
    let needsDocs = 0;
    const houndsBefore = masterHounds.length;
    const importedEntries = [];
    for (const item of selected) {
        const sourceFiles = (item.sourceFileIndexes || [])
            .map((fileIndex) => stagedJotformFiles[fileIndex])
            .filter(Boolean);
        let uploadedDocuments = [];
        try {
            uploadedDocuments = await uploadJotformDocuments(sourceFiles);
        } catch (error) {
            showMessage(entryImportMessageElement(), `Document upload failed for ${item.sourceName || item.callName || 'one import row'}, so the import was stopped before changing trial entries: ${error.message}`, 'warning');
            return;
        }
        item.uploadedDocuments = uploadedDocuments;
        const hound = item.match || createHoundFromImportedEntry(item);
        if (!item.match && hound) {
            item.match = hound;
        }
        const entry = buildImportedTrialEntry(hound, item);
        if (entry.needsDocumentUpload) {
            needsDocs += 1;
        }
        importedEntries.push({ hound, entry, imported: item });
    }
    createdHounds = masterHounds.length - houndsBefore;

    const targetNames = new Set();
    trials = trials.map((trial) => {
        const entriesForTrial = importedEntries.filter(({ entry }) => importEntryTargetsTrial(entry, trial, target.id));
        if (entriesForTrial.length === 0) {
            return trial;
        }
        let entries = Array.isArray(trial.entries) ? [...trial.entries] : [];
        entriesForTrial.forEach(({ hound, entry }) => {
            const duplicate = entries.find((row) => isSameEntry(row, hound, {
                number: entry.registrationNumber,
                registry: entry.registry,
                type: entry.registrationType,
            }, entry.className));
            if (duplicate) {
                skipped += 1;
                return;
            }
            entries.push({
                ...entry,
                id: crypto.randomUUID(),
            });
            addedEntries += 1;
            targetNames.add(trial.trialName || 'Untitled trial');
        });
        return refreshRunPlanFromPremiumIfLoaded({
            ...trial,
            entries,
            updatedAt: new Date().toISOString(),
        });
    });

    selectedTrialId = target.id;
    saveMasterHounds();
    saveTrials();
    render();
    showMessage(
        entryImportMessageElement(),
        `Imported ${addedEntries} entr${addedEntries === 1 ? 'y' : 'ies'} to ${targetNames.size ? [...targetNames].join(', ') : target.trialName || 'the trial'}. Created ${createdHounds} hound${createdHounds === 1 ? '' : 's'}. ${skipped ? `${skipped} duplicate skipped. ` : ''}${needsDocs ? `${needsDocs} first-time entr${needsDocs === 1 ? 'y needs' : 'ies need'} documentation uploaded/tracked.` : ''}`,
        addedEntries ? 'success' : 'warning'
    );
}

function importEntryTargetsTrial(entry, trial, fallbackTargetId) {
    const dates = normalizedEntryDatesForImport(entry);
    if (dates.length === 0) {
        return trial.id === fallbackTargetId;
    }
    return dates.some((date) => trialIncludesDate(trial, date));
}

function normalizedEntryDatesForImport(entry) {
    if (Array.isArray(entry.normalizedEntryDates) && entry.normalizedEntryDates.length) {
        return entry.normalizedEntryDates;
    }
    if (Array.isArray(entry.entryDates) && entry.entryDates.length) {
        return uniqueNames(entry.entryDates.map(normalizeImportDate).filter(Boolean));
    }
    return normalizedImportedEntryDates(entry.trialDates || '');
}

function trialIncludesDate(trial, date) {
    if (!date || !trial) {
        return false;
    }
    const start = normalizeImportDate(trial.startsOn || '');
    const end = normalizeImportDate(trial.endsOn || trial.startsOn || '');
    if (!start) {
        return false;
    }
    return date >= start && date <= (end || start);
}

function isSameEntry(entry, hound, selectedRegistration, className) {
    const sameHound = entry.houndId && hound.id
        ? entry.houndId === hound.id
        : clean(entry.registrationNumber) && clean(entry.registrationNumber) === clean(selectedRegistration.number);

    return sameHound && entry.className === className;
}

function entryHoundFieldIds() {
    return [
        'entryHoundSearch',
        'entryCallName',
        'entryRegName',
        'entryRegNumber',
        'entryAltRegNumber',
        'entryOwner',
        'entryOwnerEmail',
        'entryOwnerPhone',
        'entryDob',
        'entryOwnerAddress',
        'entryOwnerCity',
        'entryOwnerState',
        'entryOwnerPostalCode',
        'entryOwnerCountry',
        'entryBreeder',
        'entrySire',
        'entryDam',
        'entryHandler',
        'entryNumber',
    ];
}

function clearEntryForm() {
    editingEntryId = '';
    selectedEntryHoundId = '';
    clearValues(entryHoundFieldIds());
    document.getElementById('entryClass').value = '';
    document.getElementById('entryBreed').value = '';
    document.getElementById('entryRegistry').value = '';
    document.getElementById('entryRegType').value = '';
    document.getElementById('entryAltRegistry').value = '';
    document.getElementById('entryAlternateRegistration').open = false;
    document.getElementById('entryOwnerInformation').open = false;
    document.getElementById('entryDetails').open = false;
    document.getElementById('entrySex').value = '';
    document.getElementById('entryFirstTime').checked = false;
    document.getElementById('entryCertRequired').checked = false;
    document.getElementById('entryAdditionalKennel').checked = false;
    document.getElementById('entryAdditionalBreeder').checked = false;
    document.getElementById('entryAdditionalBench').checked = false;
    document.getElementById('entryInfoChanged').checked = false;
    document.getElementById('entryDismissedLastSix').checked = false;
    document.getElementById('entryRegistrationCertFile').value = '';
    document.getElementById('entryCoursingCertFile').value = '';
    updateEntryDocumentNote(null);
    document.getElementById('entryOwnerSeparation').checked = false;
    document.getElementById('entryOwnerSeparationGroup').value = '';
    toggleOwnerSeparationGroupField();
    renderEntryRegistrationOptions(null);
    renderEntryHoundSearchStatus();
    document.getElementById('addEntryButton').textContent = 'Add Entry';
    renderEntryEditBanner(null);
}

function renderEntryEditBanner(entry) {
    const banner = document.getElementById('entryEditBanner');
    if (!banner) {
        return;
    }

    banner.hidden = !entry;
    if (!entry) {
        document.getElementById('entryEditTitle').textContent = 'Editing entry';
        document.getElementById('entryEditDetails').textContent = '';
        return;
    }

    document.getElementById('entryEditTitle').textContent = `Editing ${entry.callName || entry.registeredName || 'entry'}`;
    document.getElementById('entryEditDetails').textContent = [entry.breed, entry.className, entry.registrationNumber].filter(Boolean).join(' | ');
}

function focusEntryEditor(entry) {
    renderEntryEditBanner(entry);
    const banner = document.getElementById('entryEditBanner');
    if (banner) {
        scrollToElement(banner, { offset: scrollOffset() + 18 });
    }
    setTimeout(() => {
        document.getElementById('entryClass').focus();
    }, 250);
}

function scrollToEntryRow(entryId) {
    setTimeout(() => {
        const row = document.querySelector(`#entriesTable tr[data-row-id="${entryId}"]`);
        if (!row) {
            return;
        }

        scrollToElement(row, { offset: scrollOffset() + 28 });
        row.classList.add('row-flash');
        setTimeout(() => row.classList.remove('row-flash'), 1800);
    }, 100);
}

function editTrialEntry(entryId) {
    const trial = getSelectedTrial();
    const entry = normalizeLciEntryShape(trial && (trial.entries || []).find((row) => row.id === entryId));
    if (!entry) {
        showMessage(entryMessage, 'Entry not found.', 'warning');
        return;
    }

    editingEntryId = entryId;
    selectedEntryHoundId = entry.houndId || '';
    document.getElementById('entryHoundSearch').value = [entry.callName, entry.registeredName, entry.registrationNumber].filter(Boolean).join(' | ');
    document.getElementById('entryCallName').value = entry.callName || '';
    document.getElementById('entryRegName').value = entry.registeredName || '';
    document.getElementById('entryBreed').value = entry.breed || '';
    document.getElementById('entryRegNumber').value = entry.registrationNumber || '';
    const hound = entry.houndId ? masterHounds.find((item) => item.id === entry.houndId) : null;
    fillEntryHoundFields(isLciEntryData(entry.breed, entry.className) ? entry : (hound || entry));
    document.getElementById('entryClass').value = entry.className || document.getElementById('entryClass').value;
    document.getElementById('entryHandler').value = entry.handler || '';
    document.getElementById('entryNumber').value = entry.entryNumber || '';
    document.getElementById('entryFirstTime').checked = Boolean(entry.firstTime);
    document.getElementById('entryCertRequired').checked = Boolean(entry.certRequired);
    document.getElementById('entryAdditionalKennel').checked = Boolean(entry.additionalKennel);
    document.getElementById('entryAdditionalBreeder').checked = Boolean(entry.additionalBreeder);
    document.getElementById('entryAdditionalBench').checked = Boolean(entry.additionalBench);
    document.getElementById('entryInfoChanged').checked = Boolean(entry.infoChanged);
    document.getElementById('entryDismissedLastSix').checked = Boolean(entry.dismissedLastSix);
    document.getElementById('entryRegistrationCertFile').value = '';
    document.getElementById('entryCoursingCertFile').value = '';
    updateEntryDocumentNote(entry);
    document.getElementById('entryOwnerSeparation').checked = Boolean(entry.ownerSeparationRequested);
    document.getElementById('entryOwnerSeparationGroup').value = entry.ownerSeparationGroup || '';
    toggleOwnerSeparationGroupField();
    renderEntryRegistrationOptions(getSelectedEntryHound());
    renderEntryHoundSearchStatus();
    document.getElementById('addEntryButton').textContent = 'Update Entry';
    switchTab('entries');
    showMessage(entryMessage, 'Editing entry. Make changes, then click Update Entry.', 'warning');
    focusEntryEditor(entry);
}

function updateEntryDocumentNote(entry) {
    const note = document.getElementById('entryFirstTimeDocsNote');
    if (!note) {
        return;
    }
    note.innerHTML = '';
    if (!entry) {
        note.textContent = 'Attach first-time entry paperwork here. LCI and Singles need the registration certificate only; regular breed stakes also need the coursing certification.';
        return;
    }
    const documents = entryDocumentLinks(entry);
    if (documents.length === 0) {
        note.textContent = 'No first-time documents are attached yet. Choose files before updating if this entry needs paperwork.';
        return;
    }
    note.append('Attached documents: ');
    documents.forEach((documentInfo, index) => {
        if (index > 0) {
            note.append(' | ');
        }
        note.appendChild(documentViewLink(documentInfo));
    });
    note.append('. Choose a new file only if replacing or adding paperwork.');
}

function removeTrialEntry(entryId) {
    const trial = getSelectedTrial();
    if (!trial) {
        return;
    }

    const entries = trial.entries || [];
    const nextEntries = entries.filter((row) => row.id !== entryId);
    if (nextEntries.length === entries.length) {
        showMessage(entryMessage, 'Entry not found.', 'warning');
        return;
    }

    trials = trials.map((item) => item.id === trial.id ? { ...item, entries: nextEntries, updatedAt: new Date().toISOString() } : item);
    saveTrials();
    if (editingEntryId === entryId) {
        clearEntryForm();
    }
    showMessage(entryMessage, 'Entry removed from this trial.', 'success');
    render();
}

function addMasterJudgeFromForm(source = 'master') {
    const judge = {
        id: crypto.randomUUID(),
        name: document.getElementById(source === 'master' ? 'masterJudgeName' : 'judgeName').value.trim(),
        number: document.getElementById(source === 'master' ? 'masterJudgeNumber' : 'judgeNumber').value.trim(),
        email: source === 'master' ? document.getElementById('masterJudgeEmail').value.trim() : '',
        phone: source === 'master' ? document.getElementById('masterJudgePhone').value.trim() : '',
        createdAt: new Date().toISOString(),
    };

    if (!judge.name) {
        showMessage(source === 'master' ? masterJudgeMessage : formMessage, 'Judge name is required.', 'warning');
        return null;
    }

    const duplicate = masterJudges.find((item) => {
        return clean(item.number) && clean(item.number) === clean(judge.number)
            || clean(item.name) === clean(judge.name);
    });

    if (duplicate) {
        showMessage(source === 'master' ? masterJudgeMessage : formMessage, 'That judge is already in the judge database.', 'warning');
        return duplicate;
    }

    masterJudges.unshift(judge);
    saveMasterJudges();
    showMessage(source === 'master' ? masterJudgeMessage : formMessage, 'Judge saved to the database.', 'success');
    return judge;
}

function addMasterWorkerFromForm(source = 'master') {
    const worker = {
        id: crypto.randomUUID(),
        name: document.getElementById(source === 'master' ? 'masterWorkerName' : 'workerName').value.trim(),
        email: source === 'master' ? document.getElementById('masterWorkerEmail').value.trim() : '',
        phone: document.getElementById(source === 'master' ? 'masterWorkerPhone' : 'workerPhone').value.trim(),
        notes: source === 'master' ? document.getElementById('masterWorkerNotes').value.trim() : '',
        createdAt: new Date().toISOString(),
    };

    if (!worker.name) {
        showMessage(source === 'master' ? masterWorkerMessage : formMessage, 'Worker name is required.', 'warning');
        return null;
    }

    const duplicate = masterWorkers.find((item) => {
        const samePhone = clean(item.phone) && clean(item.phone) === clean(worker.phone);
        const sameEmail = clean(item.email) && clean(item.email) === clean(worker.email);
        return clean(item.name) === clean(worker.name) && (samePhone || sameEmail || (!worker.phone && !worker.email));
    });

    if (duplicate) {
        showMessage(source === 'master' ? masterWorkerMessage : formMessage, 'That worker is already in the worker database.', 'warning');
        return duplicate;
    }

    masterWorkers.unshift(worker);
    saveMasterWorkers();
    showMessage(source === 'master' ? masterWorkerMessage : formMessage, 'Worker saved to the database.', 'success');
    return worker;
}

async function removeMasterJudge(judgeId) {
    const judge = masterJudges.find((item) => item.id === judgeId);
    if (!judge) {
        showMessage(masterJudgeMessage, 'Judge record not found.', 'warning');
        return;
    }

    const trialCount = trials.filter((trial) =>
        (trial.judges || []).some((item) => item.judgeId === judgeId || clean(item.name) === clean(judge.name))
        || (trial.runPlan || []).some((item) => [item.judge1, item.judge2].some((name) => clean(name) === clean(judge.name)))
    ).length;
    const confirmed = await showTrialConfirm({
        title: 'Remove Judge From Database',
        eyebrow: judge.name || 'Judge',
        message: `${judge.name || 'This judge'} is referenced by ${trialCount} existing trial${trialCount === 1 ? '' : 's'}. Remove this person from the reusable Judge Database? Existing trial assignments, scores, and reports will remain unchanged.`,
        primaryText: 'Remove Judge',
    });
    if (!confirmed) {
        return;
    }

    masterJudges = masterJudges.filter((item) => item.id !== judgeId);
    saveMasterJudges();
    showMessage(masterJudgeMessage, `${judge.name} was removed from the Judge Database. Existing trials were preserved.`, 'success');
    render();
}

async function removeMasterWorker(workerId) {
    const worker = masterWorkers.find((item) => item.id === workerId);
    if (!worker) {
        showMessage(masterWorkerMessage, 'Worker record not found.', 'warning');
        return;
    }

    const trialCount = trials.filter((trial) =>
        (trial.workers || []).some((item) => item.workerId === workerId || clean(item.name) === clean(worker.name))
        || (trial.runPlan || []).some((item) =>
            [item.lureOperator, item.huntmaster].some((name) => clean(name) === clean(worker.name))
        )
    ).length;
    const confirmed = await showTrialConfirm({
        title: 'Remove Worker From Database',
        eyebrow: worker.name || 'Worker',
        message: `${worker.name || 'This worker'} is referenced by ${trialCount} existing trial${trialCount === 1 ? '' : 's'}. Remove this person from the reusable Worker Database? Existing trial assignments and reports will remain unchanged.`,
        primaryText: 'Remove Worker',
    });
    if (!confirmed) {
        return;
    }

    masterWorkers = masterWorkers.filter((item) => item.id !== workerId);
    saveMasterWorkers();
    showMessage(masterWorkerMessage, `${worker.name} was removed from the Worker Database. Existing trials were preserved.`, 'success');
    render();
}

async function removeTrialJudge(rowId) {
    const trial = getSelectedTrial();
    const judge = (trial?.judges || []).find((item) => item.id === rowId);
    if (!trial || !judge) {
        showMessage(masterJudgeMessage, 'Trial judge assignment not found.', 'warning');
        return;
    }

    const runPlanCount = (trial.runPlan || []).filter((row) =>
        [row.judge1, row.judge2].some((name) => clean(name) === clean(judge.name))
    ).length;
    const confirmed = await showTrialConfirm({
        title: 'Remove Judge From This Trial',
        eyebrow: judge.name || 'Trial judge',
        message: `Remove ${judge.name || 'this judge'} from "${trial.trialName || 'this trial'}"? ${runPlanCount ? `The judge will also be cleared from ${runPlanCount} Running Order assignment${runPlanCount === 1 ? '' : 's'} for this trial. ` : ''}The reusable Judge Database and every other trial will remain unchanged.`,
        primaryText: 'Remove From Trial',
    });
    if (!confirmed) {
        return;
    }

    const nextTrial = {
        ...trial,
        judges: (trial.judges || []).filter((item) => item.id !== rowId),
        runPlan: (trial.runPlan || []).map((row) => ({
            ...row,
            judge1: clean(row.judge1) === clean(judge.name) ? '' : row.judge1,
            judge2: clean(row.judge2) === clean(judge.name) ? '' : row.judge2,
        })),
        updatedAt: new Date().toISOString(),
    };
    trials = trials.map((item) => item.id === trial.id ? nextTrial : item);
    saveTrials();
    showMessage(masterJudgeMessage, `${judge.name} was removed from this trial. Other trials and the Judge Database were preserved.`, 'success');
    render();
}

async function removeTrialWorker(rowId) {
    const trial = getSelectedTrial();
    const worker = (trial?.workers || []).find((item) => item.id === rowId);
    if (!trial || !worker) {
        showMessage(masterWorkerMessage, 'Trial worker assignment not found.', 'warning');
        return;
    }

    const runPlanCount = (trial.runPlan || []).filter((row) =>
        [row.lureOperator, row.huntmaster].some((name) => clean(name) === clean(worker.name))
    ).length;
    const confirmed = await showTrialConfirm({
        title: 'Remove Worker From This Trial',
        eyebrow: worker.name || 'Trial worker',
        message: `Remove ${worker.name || 'this worker'} as ${worker.role || 'a worker'} from "${trial.trialName || 'this trial'}"? ${runPlanCount ? `This person will also be cleared from ${runPlanCount} matching Running Order assignment${runPlanCount === 1 ? '' : 's'} for this trial. ` : ''}The reusable Worker Database and every other trial will remain unchanged.`,
        primaryText: 'Remove From Trial',
    });
    if (!confirmed) {
        return;
    }

    const nextTrial = {
        ...trial,
        workers: (trial.workers || []).filter((item) => item.id !== rowId),
        runPlan: (trial.runPlan || []).map((row) => ({
            ...row,
            lureOperator: clean(row.lureOperator) === clean(worker.name) ? '' : row.lureOperator,
            huntmaster: clean(row.huntmaster) === clean(worker.name) ? '' : row.huntmaster,
        })),
        updatedAt: new Date().toISOString(),
    };
    trials = trials.map((item) => item.id === trial.id ? nextTrial : item);
    saveTrials();
    showMessage(masterWorkerMessage, `${worker.name} was removed from this trial. Other trials and the Worker Database were preserved.`, 'success');
    render();
}

function addTrialJudge() {
    let judge = findJudgeFromSearch();

    if (!judge) {
        judge = addMasterJudgeFromForm('trial');
    }

    if (!judge) {
        return;
    }

    const trial = readForm();
    const problem = validateTrialBasics(trial);
    if (problem) {
        showMessage(formMessage, problem, 'warning');
        return;
    }

    const assignment = document.getElementById('judgeAssignment').value.trim();
    const judges = Array.isArray(trial.judges) ? trial.judges : [];
    const duplicate = judges.find((row) => row.judgeId === judge.id && row.assignment === assignment);
    if (duplicate) {
        showMessage(formMessage, 'That judge is already assigned to this trial with that assignment.', 'warning');
        return;
    }

    trial.judges = [...judges, {
        id: crypto.randomUUID(),
        judgeId: judge.id,
        name: judge.name,
        number: judge.number,
        assignment,
    }];
    upsertTrial(trial);
    clearValues(['judgeSearch', 'judgeName', 'judgeNumber', 'judgeAssignment']);
    showMessage(formMessage, 'Judge assigned to trial.', 'success');
    render();
}

function addTrialWorker() {
    let worker = findWorkerFromSearch();

    if (!worker) {
        worker = addMasterWorkerFromForm('trial');
    }

    if (!worker) {
        return;
    }

    const trial = readForm();
    const problem = validateTrialBasics(trial);
    if (problem) {
        showMessage(formMessage, problem, 'warning');
        return;
    }

    const role = document.getElementById('workerRole').value.trim();
    const workers = Array.isArray(trial.workers) ? trial.workers : [];
    const duplicate = workers.find((row) => row.workerId === worker.id && row.role === role);
    if (duplicate) {
        showMessage(formMessage, 'That worker is already assigned to that role for this trial.', 'warning');
        return;
    }

    trial.workers = [...workers, {
        id: crypto.randomUUID(),
        workerId: worker.id,
        name: worker.name,
        role,
        phone: worker.phone,
    }];
    upsertTrial(trial);
    clearValues(['workerSearch', 'workerName', 'workerPhone']);
    showMessage(formMessage, 'Worker assigned to trial.', 'success');
    render();
}

function getSelectedEntryHound() {
    if (!selectedEntryHoundId) {
        return null;
    }
    return masterHounds.find((hound) => hound.id === selectedEntryHoundId) || null;
}

function findHoundFromSearch() {
    const searchValue = document.getElementById('entryHoundSearch').value.trim();
    if (!searchValue) {
        return null;
    }

    const searchClean = clean(searchValue);
    return masterHounds.find((hound) => {
        return clean(houndLabel(hound)) === searchClean
            || clean(hound.registrationNumber) === searchClean
            || clean(hound.alternateRegistrationNumber) === searchClean
            || clean(hound.callName) === searchClean
            || clean(hound.registeredName) === searchClean;
    }) || null;
}

function matchingEntryHounds() {
    const search = clean(document.getElementById('entryHoundSearch')?.value || '');
    if (!search) {
        return [];
    }
    return masterHounds.filter((hound) => houndMatchesSearch(hound, search));
}

function renderEntryHoundSearchStatus(message = '') {
    const status = document.getElementById('entryHoundSearchStatus');
    if (!status) {
        return;
    }
    if (message) {
        status.textContent = message;
        return;
    }
    const selected = getSelectedEntryHound();
    if (selected) {
        status.textContent = `Selected: ${houndLabel(selected)}. Editing the fields below will update the entry from this hound record.`;
        return;
    }
    const search = document.getElementById('entryHoundSearch')?.value.trim() || '';
    if (!search) {
        status.textContent = 'Search first, then choose a hound from the suggestions or enter a new hound below.';
        return;
    }
    const matches = matchingEntryHounds();
    status.textContent = matches.length
        ? `${matches.length} possible match${matches.length === 1 ? '' : 'es'} found. Choose one from the suggestions, then click Use Selected Hound.`
        : 'No matching hound found. Click Enter New Hound or fill out the hound information below.';
}

function handleEntryHoundSearchInput() {
    selectedEntryHoundId = '';
    renderHoundSearchOptions();
    renderEntryRegistrationOptions(null);
    renderEntryHoundSearchStatus();
}

function selectEntryHoundFromSearch() {
    const hound = findHoundFromSearch();
    if (!hound) {
        selectedEntryHoundId = '';
        renderEntryRegistrationOptions(null);
        renderEntryHoundSearchStatus('No exact hound selected. Choose a suggestion from the search box, or click Enter New Hound.');
        return;
    }
    selectedEntryHoundId = hound.id;
    document.getElementById('entryHoundSearch').value = houndLabel(hound);
    fillEntryHoundFields(hound);
    renderEntryRegistrationOptions(hound);
    renderEntryHoundSearchStatus();
    document.getElementById('trialEntryFields')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => document.getElementById('entryClass')?.focus({ preventScroll: true }), 350);
}

function startNewEntryHound() {
    selectedEntryHoundId = '';
    clearValues([
        'entryHoundSearch',
        'entryCallName',
        'entryRegName',
        'entryRegNumber',
        'entryAltRegNumber',
        'entryOwner',
        'entryOwnerEmail',
        'entryOwnerPhone',
        'entryDob',
        'entryOwnerAddress',
        'entryOwnerCity',
        'entryOwnerState',
        'entryOwnerPostalCode',
        'entryOwnerCountry',
        'entryBreeder',
        'entrySire',
        'entryDam',
    ]);
    document.getElementById('entryBreed').value = '';
    document.getElementById('entryClass').value = '';
    document.getElementById('entryRegistry').value = '';
    document.getElementById('entryRegType').value = '';
    document.getElementById('entryAltRegistry').value = '';
    document.getElementById('entryAlternateRegistration').open = false;
    document.getElementById('entryOwnerInformation').open = false;
    document.getElementById('entryDetails').open = false;
    document.getElementById('entrySex').value = '';
    renderEntryRegistrationOptions(null);
    renderEntryHoundSearchStatus('New hound mode. Fill out the hound, owner, and entry details below, then add the entry.');
    document.getElementById('entryCallName')?.focus();
}
function fillEntryHoundFields(hound) {
    if (!hound) {
        return;
    }
    document.getElementById('entryCallName').value = hound.callName || '';
    document.getElementById('entryRegName').value = hound.registeredName || '';
    document.getElementById('entryBreed').value = hound.breed || '';
    renderClassOptions(getSelectedTrial());
    document.getElementById('entryRegNumber').value = hound.registrationNumber || '';
    document.getElementById('entryRegistry').value = hound.registry || '';
    document.getElementById('entryRegType').value = hound.registrationType || '';
    document.getElementById('entryAltRegistry').value = hound.alternateRegistry || '';
    document.getElementById('entryAltRegNumber').value = hound.alternateRegistrationNumber || '';
    document.getElementById('entryAlternateRegistration').open = false;
    document.getElementById('entryOwnerInformation').open = false;
    document.getElementById('entryDetails').open = false;
    document.getElementById('entrySex').value = hound.sex || '';
    document.getElementById('entryDob').value = hound.dob || '';
    document.getElementById('entryOwner').value = hound.owner || '';
    document.getElementById('entryOwnerEmail').value = hound.ownerEmail || '';
    document.getElementById('entryOwnerPhone').value = hound.ownerPhone || '';
    document.getElementById('entryOwnerAddress').value = hound.ownerAddress || '';
    document.getElementById('entryOwnerCity').value = hound.ownerCity || '';
    document.getElementById('entryOwnerState').value = hound.ownerState || '';
    document.getElementById('entryOwnerPostalCode').value = hound.ownerPostalCode || '';
    document.getElementById('entryOwnerCountry').value = hound.ownerCountry || '';
    document.getElementById('entryBreeder').value = hound.breeder || '';
    document.getElementById('entrySire').value = hound.sire || '';
    document.getElementById('entryDam').value = hound.dam || '';
}

function findJudgeFromSearch() {
    const searchValue = document.getElementById('judgeSearch').value.trim();
    if (!searchValue) {
        return null;
    }

    const searchClean = clean(searchValue);
    return masterJudges.find((judge) => {
        return clean(personLabel(judge, 'number')) === searchClean
            || clean(judge.number) === searchClean
            || clean(judge.name) === searchClean;
    }) || null;
}

function findWorkerFromSearch() {
    const searchValue = document.getElementById('workerSearch').value.trim();
    if (!searchValue) {
        return null;
    }

    const searchClean = clean(searchValue);
    return masterWorkers.find((worker) => {
        return clean(personLabel(worker)) === searchClean
            || clean(worker.phone) === searchClean
            || clean(worker.email) === searchClean
            || clean(worker.name) === searchClean;
    }) || null;
}

function fillJudgeFromSearch() {
    const judge = findJudgeFromSearch();
    if (!judge) {
        return;
    }

    document.getElementById('judgeName').value = judge.name || '';
    document.getElementById('judgeNumber').value = judge.number || '';
}

function fillWorkerFromSearch() {
    const worker = findWorkerFromSearch();
    if (!worker) {
        return;
    }

    document.getElementById('workerName').value = worker.name || '';
    document.getElementById('workerPhone').value = worker.phone || '';
}

function houndLabel(hound) {
    return [hound.callName, hound.registeredName, hound.registrationNumber, hound.alternateRegistrationNumber, hound.breed]
        .filter(Boolean)
        .join(' | ');
}

function renderEntryRegistrationOptions(hound) {
    const select = document.getElementById('entryRegistrationUsed');
    if (!select) {
        return;
    }

    select.innerHTML = '';
    const registrations = getHoundRegistrations(hound);
    if (registrations.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Registration used';
        select.appendChild(option);
        return;
    }

    registrations.forEach((registration, index) => {
        const option = document.createElement('option');
        option.value = JSON.stringify(registration);
        option.textContent = `${registration.registry || 'Registry'} ${registration.number}${registration.type ? ` (${registration.type})` : ''}`;
        select.appendChild(option);
        if (index === 0) {
            select.value = option.value;
        }
    });
}

function getHoundRegistrations(hound) {
    if (!hound) {
        const number = document.getElementById('entryRegNumber').value.trim();
        return number ? [{ registry: '', number, type: '', verificationStatus: 'not_checked' }] : [];
    }

    return [
        {
            registry: hound.registry || '',
            number: hound.registrationNumber || '',
            type: hound.registrationType || '',
            verificationStatus: hound.registrationVerificationStatus || 'not_checked',
        },
        {
            registry: hound.alternateRegistry || '',
            number: hound.alternateRegistrationNumber || '',
            type: '',
            verificationStatus: hound.alternateVerificationStatus || 'not_checked',
        },
    ].filter((registration) => registration.number);
}

function parseRegistrationChoice(value, hound) {
    if (value) {
        try {
            return JSON.parse(value);
        } catch {
            // Fall through to hound/default data.
        }
    }

    const fallback = getHoundRegistrations(hound)[0];
    return fallback || {
        registry: '',
        number: document.getElementById('entryRegNumber').value.trim(),
        type: '',
        verificationStatus: 'not_checked',
    };
}

function formatRegistration(registry, number, type) {
    return [registry, number].filter(Boolean).join(' ') + (type ? ` (${type})` : '');
}

function personLabel(person, secondaryKey = 'phone') {
    return [person.name, person[secondaryKey], person.email]
        .filter(Boolean)
        .join(' | ');
}

function clean(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '');
}

function isQuasiBreedClass(value) {
    const normalized = clean(value);
    return normalized === 'SINGLES' || normalized.startsWith('LCI');
}

function isLciEntry(entry) {
    return isLciEntryData(entry && entry.breed, entry && entry.className);
}

function parseLciClass(value) {
    const label = String(value || '').trim();
    const division = lciDivisions.find((candidate) => clean(label).startsWith(clean(candidate)));
    if (!division) {
        return null;
    }
    const remainder = label.slice(division.length).trim();
    const stake = lciStakes.find((candidate) => clean(candidate) === clean(remainder)) || 'Open';
    return { division, stake };
}

function normalizeLciEntries(entries = []) {
    return (Array.isArray(entries) ? entries : []).map(normalizeLciEntryShape);
}

function normalizeLciEntryShape(entry) {
    if (!entry || typeof entry !== 'object') {
        return entry;
    }
    const parts = normalizeImportedLciParts(entry.breed, entry.className) || parseLciClass(entry.className);
    if (!parts && !clean(entry.breed).startsWith('LCI')) {
        return entry;
    }
    const breed = parts ? (parts.breed || parts.division) : entry.breed;
    const className = parts
        ? (parts.className || parts.stake || 'Open')
        : (lciStakes.find((stake) => clean(stake) === clean(entry.className)) || 'Open');
    if (entry.breed === breed && entry.className === className) {
        return entry;
    }
    return {
        ...entry,
        breed,
        className,
    };
}

function normalizeLciHoundShape(hound) {
    if (!hound || typeof hound !== 'object') {
        return hound;
    }
    const parts = normalizeImportedLciParts(hound.breed, '');
    if (!parts || hound.breed === parts.breed) {
        return hound;
    }
    return {
        ...hound,
        breed: parts.breed,
    };
}

function runGroupBreedForEntry(entry) {
    if (clean(entry.breed).startsWith('LCI')) {
        return lciDivisions.find((division) => clean(division) === clean(entry.breed)) || entry.breed;
    }
    const lci = parseLciClass(entry.className);
    if (lci) {
        return lci.division;
    }
    if (clean(entry.className) === 'LCI') {
        return 'LCI';
    }
    if (clean(entry.className) === 'SINGLES') {
        return 'Singles';
    }
    return entry.breed || 'Unknown';
}

function runGroupStakeForEntry(entry) {
    if (clean(entry.breed).startsWith('LCI')) {
        return lciStakes.find((stake) => clean(stake) === clean(entry.className)) || entry.className || 'Open';
    }
    const lci = parseLciClass(entry.className);
    if (lci) {
        return lci.stake;
    }
    if (clean(entry.className) === 'LCI') {
        return 'Open';
    }
    if (clean(entry.className) === 'SINGLES') {
        return 'Singles';
    }
    return entry.className || 'Unassigned';
}

function isQuasiBreedGroup(group) {
    return isQuasiBreedClass(group.breed) || isQuasiBreedClass(group.stake);
}

function groupTitle(group) {
    if (isQuasiBreedGroup(group)) {
        if (clean(group.breed) === 'SINGLES') {
            return `${group.breed}${group.mixedStake ? ' (Mixed)' : ''}`;
        }
        if (clean(group.breed).startsWith('LCI')) {
            return `${group.breed} - ${group.stake || 'Open'}${group.mixedStake ? ' (Mixed)' : ''}`;
        }
        return `${group.breed}${group.mixedStake ? ' (Mixed)' : ''}`;
    }
    return `${breedDisplayCode(group.breed)} - ${group.stake}${group.mixedStake ? ' (Mixed Stake)' : ''}`;
}

function clearValues(ids) {
    ids.forEach((id) => {
        document.getElementById(id).value = '';
    });
}

function showMessage(element, text, tone) {
    if (!element) {
        return;
    }
    element.textContent = text;
    element.className = `form-message ${tone || ''}`;
}

function clearMessages() {
    [formMessage, entryMessage, masterHoundMessage, masterJudgeMessage, masterWorkerMessage, runPlanMessage, rollCallMessage, runoffMessage, bifMessage, mainResultsMessage, wrapUpMessage, wrapUpSecretaryMessage, archiveTrialMessage, adminTestMessage, officialFormsMessage].forEach((element) => {
        if (!element) {
            return;
        }
        element.textContent = '';
        element.className = 'form-message';
    });
}

function switchTab(tab) {
    const legacyAdminTabs = {
        hounds: 'Hound DB',
        people: 'Judges & Workers',
        paperwork: 'Paperwork',
        admintest: 'Tools',
    };
    if (legacyAdminTabs[tab]) {
        currentAdminPage = legacyAdminTabs[tab];
        tab = 'admin';
    }
    currentTab = tab;
    document.querySelectorAll('[data-tab]').forEach((section) => {
        section.hidden = section.dataset.tab !== tab;
    });
    document.querySelectorAll('.tab-button').forEach((button) => {
        button.classList.toggle('active', button.dataset.tabTarget === tab);
    });
    if (tab === 'scoring') {
        renderScoringPages();
    }
    if (tab === 'wrapup') {
        renderWrapUpPages();
    }
    if (tab === 'admin') {
        renderAdminPages();
    }
    renderSubTabs(tab);
}

function renderSubTabs(tab) {
    if (!subTabs) {
        return;
    }
    subTabs.innerHTML = '';
    if (tab === 'admin') {
        renderAdminSubTabs();
        return;
    }
    const sections = [...document.querySelectorAll(`.form-section[data-tab="${tab}"]`)]
        .filter((section) => ['scoring', 'wrapup'].includes(tab) || !section.hidden);
    sections.forEach((section, index) => {
        const heading = section.querySelector('h2, h3');
        if (!heading) {
            return;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sub-tab-button';
        button.textContent = heading.textContent;
        const status = guideStatusForSubTab(tab, heading.textContent);
        if (status) {
            button.classList.add(`guide-${status}`);
        }
        button.addEventListener('click', () => {
            if (tab === 'scoring') {
                currentScoringPage = heading.textContent;
                renderScoringPages();
                renderSubTabs(tab);
                return;
            }
            if (tab === 'wrapup') {
                currentWrapUpPage = heading.textContent;
                renderWrapUpPages();
                renderSubTabs(tab);
                return;
            }
            [...subTabs.querySelectorAll('.sub-tab-button')].forEach((item) => {
                item.classList.remove('active');
                item.removeAttribute('aria-current');
            });
            button.classList.add('active');
            button.setAttribute('aria-current', 'page');
            scrollToElement(section);
        });
        subTabs.appendChild(button);
        if (
            (tab === 'scoring' && heading.textContent === currentScoringPage)
            || (tab === 'wrapup' && heading.textContent === currentWrapUpPage)
            || (!['scoring', 'wrapup'].includes(tab) && index === 0)
        ) {
            button.classList.add('active');
            button.setAttribute('aria-current', 'page');
        }
    });
}

function renderAdminSubTabs() {
    if (!adminPageTabs.includes(currentAdminPage)) {
        currentAdminPage = adminPageTabs[0];
    }
    adminPageTabs.forEach((page) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sub-tab-button';
        button.textContent = page;
        button.addEventListener('click', () => {
            currentAdminPage = page;
            renderAdminPages();
            renderSubTabs('admin');
        });
        if (page === currentAdminPage) {
            button.classList.add('active');
            button.setAttribute('aria-current', 'page');
        }
        subTabs.appendChild(button);
    });
}

function renderScoringPages() {
    const sections = [...document.querySelectorAll('.form-section[data-tab="scoring"]')];
    if (!sections.some((section) => section.querySelector('h2, h3')?.textContent === currentScoringPage)) {
        currentScoringPage = 'Prelim Scoring';
    }
    sections.forEach((section) => {
        const heading = section.querySelector('h2, h3');
        section.hidden = heading ? heading.textContent !== currentScoringPage : true;
    });
}

function renderWrapUpPages() {
    const sections = [...document.querySelectorAll('.form-section[data-tab="wrapup"]')];
    if (!sections.some((section) => section.querySelector('h2, h3')?.textContent === currentWrapUpPage)) {
        currentWrapUpPage = 'ASFA Secretary Report';
    }
    sections.forEach((section) => {
        const heading = section.querySelector('h2, h3');
        section.hidden = heading ? heading.textContent !== currentWrapUpPage : true;
    });
    renderPaperworkSubmittedStatus(getSelectedTrial());
    renderTrialArchiveStatus(getSelectedTrial());
}

function wrapUpPageGuideStatus(page, trial) {
    if (!trial || !printStatus(trial, 'ribbonReport')) {
        return 'blocked';
    }
    const statuses = trialWrapUpGuideSteps(trial)
        .filter((step) => step.wrapUpPage === page)
        .map((step) => step.status);
    return guideStatusFromList(statuses) || 'blocked';
}

function guideStatusForSubTab(tab, headingText) {
    if (!tab || tab === 'admin') {
        return '';
    }
    if (tab === 'wrapup') {
        return wrapUpPageGuideStatus(headingText, getSelectedTrial());
    }
    const steps = trialGuideSteps(getSelectedTrial());
    const matches = steps.filter((step) => {
        if (step.tab !== tab) {
            return false;
        }
        if (tab === 'scoring') {
            return step.scoringPage === headingText || step.sectionTitle === headingText;
        }
        return step.sectionTitle === headingText;
    }).map((step) => step.status);
    return guideStatusFromList(matches);
}

function guideStatusFromList(statuses = []) {
    if (!statuses.length) {
        return '';
    }
    if (statuses.some((status) => status === 'attention')) {
        return 'attention';
    }
    if (statuses.some((status) => status === 'ready')) {
        return 'ready';
    }
    if (statuses.every((status) => status === 'done')) {
        return 'done';
    }
    return 'blocked';
}

function renderPaperworkSubmittedStatus(trial) {
    const container = document.getElementById('paperworkSubmittedStatus');
    if (!container) {
        return;
    }
    container.innerHTML = '';
    const paragraph = document.createElement('p');
    if (!trial) {
        paragraph.textContent = 'Select a trial to see submission status.';
    } else if (trial.paperworkSubmittedAt) {
        paragraph.innerHTML = `<strong>Submitted:</strong> ${formatTimestamp(trial.paperworkSubmittedAt)}. Next step is to archive the completed trial.`;
    } else {
        paragraph.innerHTML = 'After printing and reviewing the ASFA record packet, submit paperwork to <strong>records@asfa.org</strong>, then mark it submitted here.';
    }
    container.appendChild(paragraph);
}

function renderTrialArchiveStatus(trial) {
    if (!archiveTrialStatus) {
        return;
    }
    archiveTrialStatus.innerHTML = '';
    const paragraph = document.createElement('p');
    if (!trial) {
        paragraph.textContent = 'Select a trial to see archive status.';
        archiveTrialStatus.appendChild(paragraph);
        return;
    }
    if (trial.archivedAt) {
        paragraph.innerHTML = `<strong>Archived:</strong> ${formatTimestamp(trial.archivedAt)}. This trial is read-only until unlocked.`;
        archiveTrialStatus.appendChild(paragraph);
        if (trial.archivePackageName || trial.archivePackagePath) {
            const details = document.createElement('p');
            details.textContent = [trial.archivePackageName, trial.archivePackagePath].filter(Boolean).join(' | ');
            archiveTrialStatus.appendChild(details);
        }
        return;
    }
    paragraph.textContent = trial.archiveUnlockedAt
        ? `Unlocked for corrections on ${formatTimestamp(trial.archiveUnlockedAt)}. Create a new final archive after corrections are complete.`
        : 'Not archived yet. Create the final archive package when all reports and results are complete.';
    archiveTrialStatus.appendChild(paragraph);
}

function applyArchiveReadOnlyMode(trial) {
    const archived = Boolean(trial && trial.archivedAt);
    document.body.classList.toggle('trial-archived', archived);
    document.querySelectorAll('#trialForm input, #trialForm select, #trialForm textarea, #trialForm button').forEach((control) => {
        const allowed = control.dataset.archiveAllowed === 'true'
            || control.id === 'showArchivedTrials'
            || control.id === 'newTrialButton'
            || control.id === 'setSelectedActiveButton'
            || control.id === 'deleteSelectedSetupTrialButton'
            || control.closest('#trialList')
            || control.closest('#deletedTrialsTable')
            || control.classList.contains('report-button');
        if (archived && !allowed) {
            if (!control.disabled) {
                control.dataset.archiveDisabledByLock = 'true';
                control.disabled = true;
            }
            return;
        }
        if (!archived && control.dataset.archiveDisabledByLock === 'true') {
            control.disabled = false;
            delete control.dataset.archiveDisabledByLock;
        }
    });
}

function renderAdminPages() {
    if (!adminPageTabs.includes(currentAdminPage)) {
        currentAdminPage = adminPageTabs[0];
    }
    document.querySelectorAll('[data-tab="admin"][data-admin-page]').forEach((section) => {
        section.hidden = section.dataset.adminPage !== currentAdminPage;
    });
}

async function initializeResilientStorage() {
    try {
        const backup = await readBrowserSafetyBackup();
        if (backup && trials.length === 0 && Array.isArray(backup.data?.trials) && backup.data.trials.length > 0) {
            const restore = await showTrialConfirm({
                title: 'Restore Safety Backup',
                eyebrow: 'Trial Data Empty',
                message: `Trial data looks empty, but a browser safety backup from ${formatTimestamp(backup.exportedAt)} was found. Restore it now?`,
                primaryText: 'Restore Backup',
            });
            if (restore) {
                applyBackupSnapshot(backup);
                showMessage(storageSafetyMessage || adminTestMessage, 'Restored browser safety backup.', 'success');
                render();
                return;
            }
        }
        await writeBrowserSafetyBackup();
    } catch {
        // Safety backup is best-effort; exported JSON remains the portable backup.
    }
}

function render() {
    normalizeSelectedTrialForArchiveFilter();
    renderTrialList();
    renderActiveBadge();
    renderSaveStatus();
    renderDatabaseIntegrityStatus();

    const selected = trials.find((trial) => trial.id === selectedTrialId);
    if (selected && recalculateTrialResults(selected)) {
        saveTrials();
    }
    renderTrialGuide(selected || null);
    renderWorkflowStrip(selected || null);
    writeForm(selected || null);
    switchTab(currentTab);
    applyArchiveReadOnlyMode(selected || null);
    requestAnimationFrame(restorePendingScoreFocus);
}

function normalizeSelectedTrialForArchiveFilter() {
    const showArchived = Boolean(showArchivedTrials && showArchivedTrials.checked);
    const selected = trials.find((trial) => trial.id === selectedTrialId);
    if (!showArchived && selected && selected.archivedAt) {
        const firstActiveTrial = trials.find((trial) => !trial.archivedAt);
        selectedTrialId = firstActiveTrial ? firstActiveTrial.id : '';
    }
}

function formatDateRange(start, end) {
    if (!start && !end) {
        return '';
    }

    if (start && end && start !== end) {
        return `${start} to ${end}`;
    }

    return start || end;
}

form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveCurrentTrial();
});

newTrialButton.addEventListener('click', startNewTrial);

setActiveButton.addEventListener('click', () => {
    const trial = saveCurrentTrial({ silent: true });
    if (trial) {
        setActiveTrial(trial.id);
        showMessage(formMessage, 'Active trial set.', 'success');
    }
});

setSelectedActiveButton?.addEventListener('click', toggleSelectedActiveTrialLock);
deleteSelectedSetupTrialButton?.addEventListener('click', deleteSelectedSetupTrial);

document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', () => switchTab(button.dataset.tabTarget));
});

document.getElementById('buildBifDrawButton')?.addEventListener('click', (event) => {
    event.preventDefault();
    runBifDrawFromButton();
});

document.addEventListener('click', (event) => {
    const bifDrawButton = event.target.closest('#buildBifDrawButton');
    if (!bifDrawButton) {
        return;
    }
    event.preventDefault();
    runBifDrawFromButton();
});

document.addEventListener('keydown', (event) => {
    if (!event.target.matches('.score-input')) {
        return;
    }
    const currentInput = event.target;
    if (event.key === 'Tab') {
        const moved = moveScoreFocus(currentInput, event.shiftKey ? -1 : 1);
        if (moved) {
            event.preventDefault();
        }
        commitScoreInput(currentInput);
        return;
    }
    if (event.key === 'Enter' || event.key === 'ArrowDown') {
        moveScoreFocusGrid(currentInput, 'down');
        event.preventDefault();
        commitScoreInput(currentInput);
        return;
    }
    if (event.key === 'ArrowUp') {
        moveScoreFocusGrid(currentInput, 'up');
        event.preventDefault();
        commitScoreInput(currentInput);
        return;
    }
    if (event.key === 'ArrowRight') {
        moveScoreFocusGrid(currentInput, 'right');
        event.preventDefault();
        commitScoreInput(currentInput);
        return;
    }
    if (event.key === 'ArrowLeft') {
        moveScoreFocusGrid(currentInput, 'left');
        event.preventDefault();
        commitScoreInput(currentInput);
    }
});

document.addEventListener('mouseover', (event) => {
    const helpTarget = event.target.closest('button, [data-help]');
    if (!helpTarget) {
        return;
    }
    const help = helpTarget.dataset.help || helpForButton(helpTarget);
    if (help) {
        setWorkflowHelp('Help:', help);
    }
});

document.addEventListener('mouseout', (event) => {
    const helpTarget = event.target.closest('button, [data-help]');
    if (!helpTarget || helpTarget.contains(event.relatedTarget)) {
        return;
    }
    restoreWorkflowHelp();
});

document.addEventListener('focusin', (event) => {
    const helpTarget = event.target.closest('button, [data-help]');
    const help = helpTarget ? (helpTarget.dataset.help || helpForButton(helpTarget)) : '';
    if (help) {
        setWorkflowHelp('Help:', help);
    }
});

document.addEventListener('focusout', (event) => {
    if (event.target.closest('button, [data-help]')) {
        restoreWorkflowHelp();
    }
});

document.getElementById('addMasterHoundButton').addEventListener('click', () => {
    const hound = addMasterHoundFromForm('master');
    if (hound) {
        clearMasterHoundForm();
        render();
    }
});

document.getElementById('importAsfaHoundsButton').addEventListener('click', importAsfaRecentHounds);

document.getElementById('addMasterJudgeButton').addEventListener('click', () => {
    const judge = addMasterJudgeFromForm('master');
    if (judge) {
        clearValues(['masterJudgeName', 'masterJudgeNumber', 'masterJudgeEmail', 'masterJudgePhone']);
        render();
    }
});

document.getElementById('addMasterWorkerButton').addEventListener('click', () => {
    const worker = addMasterWorkerFromForm('master');
    if (worker) {
        clearValues(['masterWorkerName', 'masterWorkerEmail', 'masterWorkerPhone', 'masterWorkerNotes']);
        render();
    }
});

document.getElementById('entryHoundSearch').addEventListener('input', handleEntryHoundSearchInput);
document.getElementById('selectEntryHoundButton')?.addEventListener('click', selectEntryHoundFromSearch);
document.getElementById('newEntryHoundButton')?.addEventListener('click', startNewEntryHound);
document.getElementById('entryBreed').addEventListener('change', () => renderClassOptions(getSelectedTrial()));
document.getElementById('entryRegNumber').addEventListener('input', () => renderEntryRegistrationOptions(getSelectedEntryHound()));
document.getElementById('entryOwnerSeparation').addEventListener('change', toggleOwnerSeparationGroupField);
document.getElementById('entryOwnerSeparationGroup').addEventListener('input', (event) => {
    event.target.value = event.target.value.toUpperCase();
});
document.getElementById('houndDatabaseSearch').addEventListener('input', render);
document.getElementById('addEntryButton').addEventListener('click', addTrialEntry);
document.getElementById('parseJotformImportButton')?.addEventListener('click', () => {
    previewJotformImport().catch((error) => {
        showMessage(entryImportMessageElement(), `Jotform preview failed: ${error.message}`, 'warning');
    });
});
document.getElementById('applyEntryImportMappingButton')?.addEventListener('click', () => {
    document.querySelectorAll('#entryImportMappingTable select[data-import-field]').forEach((select) => {
        currentImportMapping[select.dataset.importField] = select.value;
    });
    applyEntryImportMapping();
});
document.getElementById('saveEntryImportTemplateButton')?.addEventListener('click', saveCurrentEntryImportTemplate);
document.getElementById('entryImportTemplateSelect')?.addEventListener('change', applySelectedEntryImportTemplate);
document.getElementById('importJotformEntriesButton')?.addEventListener('click', () => {
    importStagedJotformEntries().catch((error) => {
        showMessage(entryImportMessageElement(), `Jotform import failed: ${error.message}`, 'warning');
    });
});
document.getElementById('cancelEntryEditButton').addEventListener('click', () => {
    clearEntryForm();
    showMessage(entryMessage, 'Entry edit canceled.', 'warning');
});
document.getElementById('copyTrialButton').addEventListener('click', copyCurrentTrialSetup);
document.getElementById('buildRunPlanButton').addEventListener('click', buildRunPlanFromEntries);
document.getElementById('importPremiumJudgesButton')?.addEventListener('click', importPremiumJudgeAssignments);
document.getElementById('applyPremiumJudgesButton')?.addEventListener('click', applySavedPremiumJudgeAssignments);
document.getElementById('removePremiumJudgesButton')?.addEventListener('click', removeSavedPremiumJudgeAssignments);
document.getElementById('clearPremiumJudgesButton')?.addEventListener('click', clearPremiumJudgePasteAndPreview);
document.getElementById('premiumJudgeGridImage')?.addEventListener('change', (event) => previewPremiumJudgeGridImage(event.target.files?.[0] || null));
document.getElementById('moveSelectedRunPlanUpButton')?.addEventListener('click', () => moveSelectedRunPlanRow(-1));
document.getElementById('moveSelectedRunPlanDownButton')?.addEventListener('click', () => moveSelectedRunPlanRow(1));
document.getElementById('rollCallSort').addEventListener('change', () => {
    const trial = readForm();
    upsertTrial(trial);
    render();
});
document.getElementById('rollCallAllPresent').addEventListener('change', (event) => setAllRollCallPresent(event.target.checked));
document.getElementById('autoOwnerSeparationButton').addEventListener('click', autoMarkOwnerSeparationGroups);
document.getElementById('buildPreliminaryDrawButton').addEventListener('click', buildPreliminaryDraw);
document.getElementById('returnTopButton')?.addEventListener('click', scrollToPageTop);
window.addEventListener('scroll', updateReturnTopButton, { passive: true });
window.addEventListener('resize', updateReturnTopButton);
document.getElementById('printWorkerSheetButton').addEventListener('click', () => printSectionAndMark('workerSheetPrint', 'workerSheet'));
document.getElementById('printJudgesMapButton')?.addEventListener('click', () => printSection('judgesMapPrint'));
document.getElementById('printRollCallButton').addEventListener('click', () => printSectionAndMark('rollCallPrint', 'rollCallSheet'));
document.getElementById('markSeparationReviewedButton')?.addEventListener('click', markOwnerSeparationReviewed);
document.getElementById('printDrawSheetButton').addEventListener('click', printDrawSheet);
document.getElementById('printJudgeSheetsButton').addEventListener('click', printJudgeSheets);
document.getElementById('markScoringCompleteButton').addEventListener('click', markPrelimScoringComplete);
document.getElementById('togglePrelimLockButton').addEventListener('click', togglePrelimLock);
document.getElementById('toggleFinalsLockButton')?.addEventListener('click', toggleFinalsLock);
document.getElementById('printRibbonReportButton')?.addEventListener('click', printRibbonReport);
document.getElementById('printAsfaEntryFormsButton')?.addEventListener('click', printAsfaEntryForms);
document.getElementById('printAsfaRecordPacketButton')?.addEventListener('click', printAsfaRecordPacket);
document.getElementById('printAsfaSecretaryReportButton')?.addEventListener('click', printAsfaSecretaryReport);
document.getElementById('markPaperworkSubmittedButton')?.addEventListener('click', markPaperworkSubmitted);
document.getElementById('createFinalArchiveButton')?.addEventListener('click', createFinalTrialArchive);
document.getElementById('unlockArchivedTrialButton')?.addEventListener('click', unlockArchivedTrial);
showArchivedTrials?.addEventListener('change', renderTrialList);
[
    'secretaryPerCapitaRate',
    'secretarySpecialBreederCount',
    'secretarySpecialKennelCount',
    'secretarySpecialBenchCount',
    'secretaryCheckAmount',
    'secretaryPaypalAmount',
    'secretaryPaypalTransactionId',
].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => {
        const trial = readForm();
        upsertTrial(trial);
        saveTrials();
        renderSecretaryFeeSummary(trial);
        renderTrialGuide(trial);
        if (currentTab === 'wrapup') {
            renderSubTabs('wrapup');
        }
    });
    document.getElementById(id)?.addEventListener('change', () => {
        const trial = readForm();
        upsertTrial(trial);
        saveTrials();
        renderSecretaryFeeSummary(trial);
        renderTrialGuide(trial);
        if (currentTab === 'wrapup') {
            renderSubTabs('wrapup');
        }
    });
});
document.getElementById('redrawAllRunoffsButton').addEventListener('click', redrawAllRunoffs);
document.getElementById('printRunoffDrawSheetButton').addEventListener('click', printRunoffDrawSheet);
document.getElementById('printAllRunoffJudgeSheetsButton').addEventListener('click', printAllRunoffJudgeSheets);
document.getElementById('printBifDrawSheetButton')?.addEventListener('click', printBifDrawSheet);
document.getElementById('printBifJudgeSheetsButton')?.addEventListener('click', printBifJudgeSheets);
document.getElementById('moveSelectedRunoffUpButton')?.addEventListener('click', () => moveSelectedRunoffItem(-1));
document.getElementById('moveSelectedRunoffDownButton')?.addEventListener('click', () => moveSelectedRunoffItem(1));
document.getElementById('adminPlanBreed')?.addEventListener('change', populateAdminPlanClassSelect);
document.getElementById('addAdminPlanRowButton').addEventListener('click', addAdminBreedPlanRow);
document.getElementById('createAdminTestTrialButton').addEventListener('click', createAdminTestTrial);
document.getElementById('populateAdminScoresButton').addEventListener('click', populateAdminPreliminaryScores);
document.getElementById('populateAdminFinalsScoresButton').addEventListener('click', populateAdminFinalsScores);
document.getElementById('removeAdminTestRecordsButton')?.addEventListener('click', removeAdminTestRecords);
document.getElementById('deleteSelectedTrialButton').addEventListener('click', deleteSelectedAdminTrial);
document.getElementById('restoreBrowserBackupButton').addEventListener('click', restoreBrowserSafetyBackup);
document.getElementById('createSQLiteBackupButton').addEventListener('click', createSQLiteBackup);
document.getElementById('saveBackupRetentionButton')?.addEventListener('click', saveBackupRetention);
document.getElementById('restoreSQLiteBackupButton')?.addEventListener('click', restoreSQLiteBackup);
sqliteBackupSelect?.addEventListener('change', updateSQLiteBackupDetails);
document.getElementById('refreshSQLiteBackupsButton')?.addEventListener('click', () => refreshSQLiteBackupList());
document.getElementById('buildPortablePackageButton')?.addEventListener('click', buildPortablePackage);
document.getElementById('refreshPortableStatusButton')?.addEventListener('click', () => refreshPortableStatus(true));
document.getElementById('createTransferPackageButton')?.addEventListener('click', createTransferPackage);
document.getElementById('createProgramUpdatePackageButton')?.addEventListener('click', createProgramUpdatePackage);
document.getElementById('restoreTransferAppFilesButton')?.addEventListener('click', () => document.getElementById('restoreTransferAppFilesInput')?.click());
document.getElementById('restoreTransferAppFilesInput')?.addEventListener('change', (event) => {
    restoreTransferAppFiles(event.target.files?.[0] || null);
    event.target.value = '';
});
document.getElementById('restartServerButton')?.addEventListener('click', restartAppServer);
document.getElementById('exitAppButton')?.addEventListener('click', exitAppServer);
document.getElementById('exitAppToolsButton')?.addEventListener('click', exitAppServer);
document.getElementById('goToArchiveTrialButton')?.addEventListener('click', goToArchiveTrialSection);
document.getElementById('exportDataBackupButton').addEventListener('click', exportDataBackup);
document.getElementById('importDataBackupButton').addEventListener('click', () => document.getElementById('importDataBackupFile').click());
document.getElementById('importDataBackupFile').addEventListener('change', (event) => {
    importDataBackup(event.target.files[0]);
    event.target.value = '';
});
document.getElementById('officialFormsAssociation').addEventListener('change', () => renderOfficialForms(getSelectedTrial()));
document.getElementById('previewAsfaRecordAlignmentButton').addEventListener('click', previewAsfaRecordAlignment);
document.getElementById('resetAsfaRecordAlignmentButton').addEventListener('click', resetAsfaRecordAlignment);
document.getElementById('previewAsfaEntryAlignmentButton')?.addEventListener('click', previewAsfaEntryAlignment);
document.getElementById('resetAsfaEntryAlignmentButton')?.addEventListener('click', resetAsfaEntryAlignment);
document.getElementById('previewAsfaLciEntryAlignmentButton')?.addEventListener('click', previewAsfaLciEntryAlignment);
document.getElementById('resetAsfaLciEntryAlignmentButton')?.addEventListener('click', resetAsfaLciEntryAlignment);
document.getElementById('previewAsfaDrawAlignmentButton')?.addEventListener('click', previewAsfaDrawAlignment);
document.getElementById('resetAsfaDrawAlignmentButton')?.addEventListener('click', resetAsfaDrawAlignment);
document.getElementById('previewAsfaJudgeAlignmentButton').addEventListener('click', previewAsfaJudgeAlignment);
document.getElementById('resetAsfaJudgeAlignmentButton').addEventListener('click', resetAsfaJudgeAlignment);
document.getElementById('previewAsfaSecretaryAlignmentButton')?.addEventListener('click', previewAsfaSecretaryAlignment);
document.getElementById('resetAsfaSecretaryAlignmentButton')?.addEventListener('click', resetAsfaSecretaryAlignment);
document.getElementById('judgeSearch').addEventListener('input', fillJudgeFromSearch);
document.getElementById('workerSearch').addEventListener('input', fillWorkerFromSearch);

document.getElementById('addJudgeButton').addEventListener('click', addTrialJudge);
document.getElementById('addWorkerButton').addEventListener('click', addTrialWorker);

async function startApp() {
    startStartupSplashAnimation();
    await loadAppVersion();
    populateBreedSelects();
    renderSaveStatus();
    await loadFromSQLiteIfAvailable();
    refreshDatabaseIntegrityStatus();
    render();
    updateReturnTopButton();
    initializeResilientStorage();
    hideStartupSplash();
}

window.addEventListener('pagehide', flushSQLiteSaveBeforeClose);
window.addEventListener('beforeunload', flushSQLiteSaveBeforeClose);

startApp();

