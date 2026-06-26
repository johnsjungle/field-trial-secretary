# Field Trial Secretary Application Plan

## Goal

Build an offline-first application for lure coursing field trial secretaries to manage entries, documents, scoring, posted results, prizes, and post-trial submissions for AKC and ASFA events.

The application should be easy to run from a field trial laptop without internet access, while still taking advantage of online verification or imports when available.

## Recommended Technical Direction

Use a local application backed by SQLite for version one.

Why SQLite:

- Works fully offline.
- Stores the entire trial database in one portable file.
- Easy to back up before, during, and after a trial.
- Reliable enough for real event data.
- Supports structured exports for PDF, CSV, Excel, AKC, and ASFA workflows.
- Avoids requiring a server, cloud login, or internet connection at the event.

Recommended application shape:

- Local web application running on the secretary's computer.
- SQLite database file per season, club, or trial weekend.
- Browser-based interface for fast data entry, scoring, and report generation.
- Later option to package as a Windows desktop app if needed.

Good implementation candidates:

- Laravel + SQLite: strong forms, imports, PDFs, authentication, and reporting.
- Python/FastAPI + SQLite: lightweight and script-friendly.
- .NET + SQLite: strong Windows desktop packaging.

Decision: start with SQLite, while keeping the application code organized so the database can move to PostgreSQL later if multi-user, hosted, or club-wide features become important.

Current recommendation: start with Laravel + SQLite if PHP is available, because it is productive for data-heavy admin tools and can later be packaged or run locally.

## Core Users

Primary user:

- Field Trial Secretary

Secondary users:

- Trial chair
- Huntmaster or field committee
- Scorekeepers
- Exhibitors viewing posted results

## Core Workflow

### Before Trial

1. Create a trial.
2. Define association, club, location, dates, stakes, breeds, judges, and trial officials.
3. Import entries from spreadsheet, CSV, online form export, or manual entry.
4. Flag first-time entries.
5. Attach registration certificates, cert documents, or eligibility paperwork.
6. Verify registration numbers where possible.
7. Build running orders by breed, stake, and course.
8. Print or export check-in sheets, score sheets, running orders, and inspection lists.

### During Trial

1. Check dogs in.
2. Mark absent, excused, dismissed, disqualified, or withdrawn dogs.
3. Enter judge scores by run.
4. Calculate totals, placements, points, qualifiers, and runoff needs.
5. Post results by breed and stake during the trial.
6. Track cert/first-time status and missing documents.
7. Produce quick reports for the field committee.

### After Trial

1. Finalize results.
2. Generate prize list.
3. Generate catalog-style final results.
4. Export PDF result packets.
5. Export AKC submission package.
6. Export ASFA submission package.
7. Archive the trial database and attached documents.

## First Version Scope

The first working version should handle:

- Trial setup.
- Dog and owner records.
- Entry import from CSV.
- Manual entry editing.
- Document attachment tracking.
- First-time entry tracking.
- Stakes and breeds.
- Scores for prelim, final, and runoff.
- Placements and basic result reports.
- Prize report.
- PDF export.
- CSV export.

Online registration verification should be designed as an optional service, not as a requirement for running the trial.

Judge phone or tablet score entry should be treated as a phase two or phase three feature. The version-one score model should still record enough information to support it later:

- Which judge entered or submitted a score.
- Which run the score belongs to.
- When the score was submitted.
- Whether the score was entered directly by the secretary or received from a judge device.
- Whether the secretary reviewed and accepted the score.

## Important Offline Rule

Any feature that uses internet access must fail gracefully.

Example:

- If AKC/ASFA verification is unavailable, the dog should be saved with status `verification_pending`.
- The secretary should be able to continue all trial work.
- The app should show a clear list of items needing verification later.

## Key Design Principle

The app should behave like a calm checklist during a stressful event.

Every trial should have a dashboard showing:

- Entries received.
- First-time entries.
- Missing certificates.
- Unverified registration numbers.
- Dogs checked in.
- Scores entered.
- Results ready to post.
- Reports ready to export.

## Data Model Draft

Main entities:

- Clubs
- Trials
- Trial days
- Associations
- Stakes
- Breeds
- Dogs
- Owners
- Handlers
- Entries
- Entry documents
- Registration verifications
- Judges
- Runs
- Scores
- Placements
- Awards
- Exports

## Entry Statuses

Suggested statuses:

- entered
- checked_in
- absent
- withdrawn
- excused
- dismissed
- disqualified
- completed

## Document Statuses

Suggested statuses:

- not_required
- required_missing
- uploaded
- reviewed
- included_in_submission

## Verification Statuses

Suggested statuses:

- not_checked
- verified
- failed
- pending
- manual_override

## Open Decisions

1. Should the first build be a local browser app or a packaged Windows desktop app?
2. Should one database file contain all trials, or should each trial weekend have its own file?
3. Which import source matters first: Jotform, Google Forms, Excel, CSV, or another entry service?
4. What exact AKC and ASFA submission formats are required?
5. Do we need multi-user entry during the trial, or is one secretary laptop enough for version one?

## Proposed Build Order

1. Build the SQLite schema and seed tables for associations, stakes, and common statuses.
2. Build trial setup screens.
3. Build dog, owner, and entry management.
4. Build CSV import with review-before-save.
5. Build first-time entry and certificate tracking.
6. Build score entry screens.
7. Build placements and posting reports.
8. Build prize report.
9. Build PDF export.
10. Build AKC/ASFA export adapters.
11. Add optional online registration verification.
12. Add optional judge phone/tablet score entry.

## Future Judge Device Scoring

A later version could allow each judge to enter scores from a phone or tablet after each course.

Preferred phase-two approach:

- The secretary laptop remains the source of truth.
- The app starts a local network scoring page during the trial.
- Judges connect by phone or tablet over the local Wi-Fi network.
- Each judge gets a simple score screen for their assigned course.
- Submitted scores go into a review queue.
- The secretary can accept, correct, or reject submitted scores.

This should not require internet access. It would only require the judge device and secretary computer to be on the same local network.

If we later need cloud scoring, the same review queue concept can be reused with a hosted database.
