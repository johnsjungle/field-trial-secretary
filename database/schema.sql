PRAGMA foreign_keys = ON;

CREATE TABLE associations (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL
);

CREATE TABLE clubs (
    id INTEGER PRIMARY KEY,
    association_id INTEGER REFERENCES associations(id),
    name TEXT NOT NULL,
    secretary_name TEXT,
    secretary_email TEXT,
    secretary_phone TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trials (
    id INTEGER PRIMARY KEY,
    club_id INTEGER NOT NULL REFERENCES clubs(id),
    association_id INTEGER NOT NULL REFERENCES associations(id),
    name TEXT NOT NULL,
    event_number TEXT,
    sanction_number TEXT,
    trial_type TEXT NOT NULL DEFAULT 'all_breed',
    specialty_breed_id INTEGER REFERENCES breeds(id),
    region TEXT,
    priority_date INTEGER NOT NULL DEFAULT 0,
    singles_offered INTEGER NOT NULL DEFAULT 0,
    lci_offered INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 0,
    location_name TEXT,
    location_address TEXT,
    location_city TEXT,
    location_state TEXT,
    nearest_major_city TEXT,
    premium_due_date TEXT,
    closing_at TEXT,
    roll_call_at TEXT,
    inspection_at TEXT,
    first_course_at TEXT,
    starts_on TEXT NOT NULL,
    ends_on TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'setup',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trial_officials (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    person_id INTEGER REFERENCES people(id),
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT
);

CREATE TABLE trial_days (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    trial_date TEXT NOT NULL,
    weather_notes TEXT,
    field_notes TEXT
);

CREATE TABLE breeds (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL
);

CREATE TABLE stakes (
    id INTEGER PRIMARY KEY,
    association_id INTEGER REFERENCES associations(id),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE (association_id, code)
);

CREATE TABLE people (
    id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    kennel_name TEXT,
    email TEXT,
    phone TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dogs (
    id INTEGER PRIMARY KEY,
    legacy_hound_key INTEGER UNIQUE,
    call_name TEXT NOT NULL,
    registered_name TEXT,
    breed_id INTEGER REFERENCES breeds(id),
    sex TEXT,
    date_of_birth TEXT,
    date_of_birth_unknown INTEGER NOT NULL DEFAULT 0,
    registration_number TEXT,
    registration_number_clean TEXT,
    registration_body TEXT,
    conformation_prefix TEXT,
    performance_suffix TEXT,
    asfa_title TEXT,
    current_points INTEGER,
    q1st_count INTEGER,
    q2nd_count INTEGER,
    initial_trial_date TEXT,
    last_trial_date TEXT,
    lifetime_points INTEGER,
    lifetime_trial_count INTEGER,
    lifetime_first_count INTEGER,
    lifetime_second_count INTEGER,
    lifetime_third_count INTEGER,
    lifetime_fourth_count INTEGER,
    lifetime_nbq_count INTEGER,
    breeder TEXT,
    sire TEXT,
    dam TEXT,
    is_first_time_entry INTEGER NOT NULL DEFAULT 0,
    is_disqualified INTEGER NOT NULL DEFAULT 0,
    is_dismissed INTEGER NOT NULL DEFAULT 0,
    is_ineligible INTEGER NOT NULL DEFAULT 0,
    is_inactive INTEGER NOT NULL DEFAULT 0,
    is_pending INTEGER NOT NULL DEFAULT 0,
    is_void INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dogs_registration_number_clean ON dogs (registration_number_clean);

CREATE TABLE dog_registration_numbers (
    id INTEGER PRIMARY KEY,
    dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    registration_number TEXT NOT NULL,
    registration_number_clean TEXT NOT NULL,
    registry TEXT,
    registration_type TEXT,
    source TEXT,
    is_primary INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    verification_status TEXT NOT NULL DEFAULT 'not_checked',
    verification_provider TEXT,
    verified_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (dog_id, registration_number_clean)
);

CREATE INDEX idx_dog_registration_numbers_clean ON dog_registration_numbers (registration_number_clean);

CREATE TABLE dog_people (
    id INTEGER PRIMARY KEY,
    dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    is_primary_contact INTEGER NOT NULL DEFAULT 0,
    UNIQUE (dog_id, person_id, role)
);

CREATE TABLE entries (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    trial_day_id INTEGER REFERENCES trial_days(id),
    dog_id INTEGER NOT NULL REFERENCES dogs(id),
    stake_id INTEGER NOT NULL REFERENCES stakes(id),
    handler_id INTEGER REFERENCES people(id),
    entry_number TEXT,
    running_order INTEGER,
    status TEXT NOT NULL DEFAULT 'entered',
    first_time_entry_at_trial INTEGER NOT NULL DEFAULT 0,
    certificate_required INTEGER NOT NULL DEFAULT 0,
    certificate_status TEXT NOT NULL DEFAULT 'not_required',
    registration_verification_status TEXT NOT NULL DEFAULT 'not_checked',
    roll_call_status TEXT NOT NULL DEFAULT 'not_checked',
    roll_call_notes TEXT,
    owner_separation_requested INTEGER NOT NULL DEFAULT 0,
    owner_separation_group TEXT,
    import_batch_id INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (trial_id, dog_id, stake_id, trial_day_id)
);

CREATE TABLE entry_documents (
    id INTEGER PRIMARY KEY,
    entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'uploaded',
    included_in_submission INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registration_verifications (
    id INTEGER PRIMARY KEY,
    dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    dog_registration_number_id INTEGER REFERENCES dog_registration_numbers(id) ON DELETE SET NULL,
    association_id INTEGER REFERENCES associations(id),
    registration_number TEXT NOT NULL,
    status TEXT NOT NULL,
    checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_summary TEXT,
    raw_response_path TEXT
);

CREATE TABLE dog_disciplinary_clearances (
    id INTEGER PRIMARY KEY,
    dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    clearance_date TEXT NOT NULL,
    recertification_date TEXT,
    approval_authority TEXT NOT NULL,
    approved_by TEXT,
    revoked_at TEXT,
    revoke_reason TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE judges (
    id INTEGER PRIMARY KEY,
    person_id INTEGER REFERENCES people(id),
    name TEXT NOT NULL,
    association_number TEXT,
    email TEXT,
    phone TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    notes TEXT
);

CREATE TABLE worker_people (
    id INTEGER PRIMARY KEY,
    person_id INTEGER REFERENCES people(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trial_judges (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    judge_id INTEGER NOT NULL REFERENCES judges(id),
    stake_id INTEGER REFERENCES stakes(id),
    breed_id INTEGER REFERENCES breeds(id),
    assignment_notes TEXT
);

CREATE TABLE trial_worker_roles (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE trial_workers (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    person_id INTEGER REFERENCES people(id),
    role_id INTEGER REFERENCES trial_worker_roles(id),
    role_name TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    assigned_day TEXT,
    notes TEXT
);

CREATE TABLE trial_classes (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    breed_id INTEGER REFERENCES breeds(id),
    stake_id INTEGER REFERENCES stakes(id),
    class_name TEXT NOT NULL,
    offered INTEGER NOT NULL DEFAULT 1,
    entry_limit INTEGER,
    field_name TEXT,
    notes TEXT
);

CREATE TABLE trial_run_assignments (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    breed_id INTEGER REFERENCES breeds(id),
    breed_code TEXT,
    run_order INTEGER,
    entry_count INTEGER NOT NULL DEFAULT 0,
    judge_1_id INTEGER REFERENCES judges(id),
    judge_2_id INTEGER REFERENCES judges(id),
    lure_operator_worker_id INTEGER REFERENCES trial_workers(id),
    huntmaster_worker_id INTEGER REFERENCES trial_workers(id),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trial_checklist_items (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'needed',
    due_at TEXT,
    notes TEXT
);

CREATE TABLE runs (
    id INTEGER PRIMARY KEY,
    entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    run_type TEXT NOT NULL,
    run_order INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    run_at TEXT,
    notes TEXT
);

CREATE TABLE scores (
    id INTEGER PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    judge_id INTEGER REFERENCES judges(id),
    category TEXT,
    score_value REAL NOT NULL,
    source TEXT NOT NULL DEFAULT 'secretary_entry',
    review_status TEXT NOT NULL DEFAULT 'accepted',
    submitted_at TEXT,
    reviewed_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE judge_score_sessions (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    judge_id INTEGER NOT NULL REFERENCES judges(id),
    session_name TEXT NOT NULL,
    access_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT
);

CREATE TABLE placements (
    id INTEGER PRIMARY KEY,
    entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    placement INTEGER,
    total_score REAL,
    qualified INTEGER NOT NULL DEFAULT 0,
    points_awarded REAL,
    award_label TEXT,
    notes TEXT
);

CREATE TABLE import_batches (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER REFERENCES trials(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_filename TEXT,
    imported_by TEXT,
    imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'reviewing',
    notes TEXT
);

CREATE TABLE exports (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'created',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE form_templates (
    id INTEGER PRIMARY KEY,
    association_id INTEGER REFERENCES associations(id),
    form_code TEXT NOT NULL,
    form_name TEXT NOT NULL,
    form_use TEXT NOT NULL,
    revision_label TEXT,
    source_url TEXT NOT NULL,
    local_template_path TEXT,
    paper_size TEXT NOT NULL DEFAULT 'letter',
    orientation TEXT NOT NULL DEFAULT 'portrait',
    active INTEGER NOT NULL DEFAULT 1,
    permission_notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (association_id, form_code, revision_label)
);

CREATE TABLE generated_forms (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    form_template_id INTEGER NOT NULL REFERENCES form_templates(id),
    output_path TEXT,
    generated_for TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE trial_courses (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    breed_id INTEGER REFERENCES breeds(id),
    stake_id INTEGER REFERENCES stakes(id),
    course_phase TEXT NOT NULL,
    course_number INTEGER,
    run_order INTEGER,
    judge_1_id INTEGER REFERENCES judges(id),
    judge_2_id INTEGER REFERENCES judges(id),
    lure_operator_worker_id INTEGER REFERENCES trial_workers(id),
    huntmaster_worker_id INTEGER REFERENCES trial_workers(id),
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE course_hounds (
    id INTEGER PRIMARY KEY,
    trial_course_id INTEGER NOT NULL REFERENCES trial_courses(id) ON DELETE CASCADE,
    entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    blanket_color TEXT,
    draw_position INTEGER,
    course_position INTEGER,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    UNIQUE (trial_course_id, entry_id)
);

CREATE TABLE judge_scores (
    id INTEGER PRIMARY KEY,
    course_hound_id INTEGER NOT NULL REFERENCES course_hounds(id) ON DELETE CASCADE,
    judge_id INTEGER REFERENCES judges(id),
    scoring_system TEXT NOT NULL,
    enthusiasm_score REAL,
    follow_score REAL,
    speed_score REAL,
    agility_score REAL,
    endurance_score REAL,
    overall_ability_score REAL,
    pre_slip_penalty REAL NOT NULL DEFAULT 0,
    course_delay_penalty REAL NOT NULL DEFAULT 0,
    total_score REAL,
    score_status TEXT NOT NULL DEFAULT 'pending',
    submitted_at TEXT,
    reviewed_at TEXT,
    notes TEXT
);

CREATE TABLE result_decisions (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    entry_id INTEGER REFERENCES entries(id) ON DELETE CASCADE,
    trial_course_id INTEGER REFERENCES trial_courses(id) ON DELETE SET NULL,
    decision_type TEXT NOT NULL,
    blanket_color TEXT,
    reason TEXT,
    official_time TEXT,
    reported_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE posted_results (
    id INTEGER PRIMARY KEY,
    trial_id INTEGER NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    breed_id INTEGER REFERENCES breeds(id),
    stake_id INTEGER REFERENCES stakes(id),
    preliminary_score REAL,
    final_score REAL,
    combined_score REAL,
    runoff_score REAL,
    placement INTEGER,
    qualified INTEGER NOT NULL DEFAULT 0,
    award_label TEXT,
    points_awarded REAL,
    result_status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO associations (code, name) VALUES
    ('AKC', 'American Kennel Club'),
    ('ASFA', 'American Sighthound Field Association');

INSERT INTO trial_worker_roles (code, name, sort_order) VALUES
    ('secretary', 'Field Trial Secretary', 10),
    ('chair', 'Trial Chair', 20),
    ('huntmaster', 'Huntmaster', 30),
    ('field_clerk', 'Field Clerk', 40),
    ('lure_operator', 'Lure Operator', 50),
    ('inspection', 'Inspection Committee', 60),
    ('roll_call', 'Roll Call', 70),
    ('paddock', 'Paddock', 80),
    ('scorekeeper', 'Scorekeeper', 90),
    ('equipment', 'Equipment', 100);

INSERT INTO form_templates (association_id, form_code, form_name, form_use, revision_label, source_url, local_template_path, permission_notes) VALUES
    ((SELECT id FROM associations WHERE code = 'ASFA'), 'SEC-02', 'Judging Form', 'Judge sheet', 'Rev 04-01-26', 'https://www.asfa.org/forms/SEC-02--Judging%20Form.pdf', 'templates/asfa/SEC-02-Judging-Form-Rev-04-01-26.pdf', 'Use official PDF as template; confirm permission before bundling in distributed app.'),
    ((SELECT id FROM associations WHERE code = 'ASFA'), 'SEC-01', 'ASFA Record Sheet', 'Posted scores / record sheet', 'Rev 03-02', 'https://www.asfa.org/forms/SEC01--RecordSheet.pdf', 'templates/asfa/SEC-01-Record-Sheet-Rev-03-02.pdf', 'Use official PDF as template; confirm permission before bundling in distributed app.'),
    ((SELECT id FROM associations WHERE code = 'ASFA'), 'SEC-05', 'Draw Order', 'Draw order', 'Rev 08-01', 'https://www.asfa.org/forms/SEC-05--DrawOrder3upACoD.pdf', 'templates/asfa/SEC-05-Draw-Order-Rev-08-01.pdf', 'Use official PDF as template; confirm permission before bundling in distributed app.'),
    ((SELECT id FROM associations WHERE code = 'ASFA'), 'REC-25', 'Field Trial Secretary Report', 'Secretary report', 'New 3-26', 'https://www.asfa.org/docs/REC%2025--FIELD%20TRIAL%20SECRETARY%20REPORT.pdf', 'templates/asfa/REC-25-Field-Trial-Secretary-Report-New-03-26.pdf', 'Use official PDF as template; confirm permission before bundling in distributed app.'),
    ((SELECT id FROM associations WHERE code = 'ASFA'), 'SEC-06', 'Hound Certification Form', 'Certification', 'Rev 01-21', 'https://www.asfa.org/forms/SEC-06--Hound%20Certification%20%281%29.pdf', 'templates/asfa/SEC-06-Hound-Certification-Rev-01-21.pdf', 'Use official PDF as template; confirm permission before bundling in distributed app.'),
    ((SELECT id FROM associations WHERE code = 'AKC'), 'JERSC1', 'Lure Coursing Judges Sheet', 'Judge sheet', '5-18', 'https://www.akc.org/wp-content/uploads/2022/03/JERSC1_518-New-Logo.pdf', 'templates/akc/JERSC1-Lure-Coursing-Judges-Sheet-5-18.pdf', 'Use official PDF as template.'),
    ((SELECT id FROM associations WHERE code = 'AKC'), 'JERSC3', 'Lure Coursing Scoresheet', 'Posted scores / results', '4-22', 'https://www.akc.org/wp-content/uploads/2022/04/JERSC3-4.22-fillable.pdf', 'templates/akc/JERSC3-Lure-Coursing-Scoresheet-4-22.pdf', 'Use official PDF as template.'),
    ((SELECT id FROM associations WHERE code = 'AKC'), 'JERSC7', 'Single Stake Scoresheet', 'Single stake posted scores', '5-18', 'https://www.akc.org/wp-content/uploads/2022/04/JERSC7_0518-Fillable.pdf', 'templates/akc/JERSC7-Single-Stake-Scoresheet-5-18.pdf', 'Use official PDF as template.'),
    ((SELECT id FROM associations WHERE code = 'AKC'), 'JERSC2', 'Lure Coursing Draw Order Sheet', 'Draw order', 'Current PDF', 'https://images.akc.org/pdf/JERSC2.pdf', 'templates/akc/JERSC2-Lure-Coursing-Draw-Order.pdf', 'Use official PDF as template.'),
    ((SELECT id FROM associations WHERE code = 'AKC'), 'JFSEC2', 'Event Secretary Report', 'Secretary report', '10-25', 'https://images.akc.org/pdf/JFSEC2.pdf', 'templates/akc/JFSEC2-Event-Secretary-Report-10-25.pdf', 'Use official PDF as template.'),
    ((SELECT id FROM associations WHERE code = 'AKC'), 'IEJDG1', 'Coursing Judges Book Directions', 'Judge book directions', 'Current PDF', 'https://images.akc.org/pdf/IEJDG1.pdf', 'templates/akc/IEJDG1-Coursing-Judges-Book-Directions.pdf', 'Use official PDF as reference.');
