# Lure Coursing Forms Research

Research date: 2026-06-16

This is the working source list for the print/fill forms we need before building draw, scoring, forfeits, ties, excusals, dismissals, and final result submission.

## Build Direction

Use the official PDF as the visual print template and place generated text over it. That gives the field trial secretary the correct printed look and size without manually recreating association artwork, logos, or form layout.

For offline use, the app should keep a local copy of each form template after the user installs or imports it. The data we generate should remain separate from the template so form revisions can be swapped later.

Local template PDFs have been installed under:

| Association | Folder |
| --- | --- |
| ASFA | `app/templates/asfa/` |
| AKC | `app/templates/akc/` |

## ASFA Sources

Primary forms page:
https://www.asfa.org/trial.htm

Relevant ASFA forms found:

| Use | Form | Revision | Source |
| --- | --- | --- | --- |
| Judge sheet | Judging Form | Rev 04-01-26 | https://www.asfa.org/forms/SEC-02--Judging%20Form.pdf |
| Posted score / record sheet | ASFA Record Sheet | Rev 03-02 | https://www.asfa.org/forms/SEC01--RecordSheet.pdf |
| Draw order | Draw Order, SEC-05 | Rev 08-01 | https://www.asfa.org/forms/SEC-05--DrawOrder3upACoD.pdf |
| Trial secretary report | FTS Report / Field Trial Secretary Report | New 3-26 | https://www.asfa.org/docs/REC%2025--FIELD%20TRIAL%20SECRETARY%20REPORT.pdf |
| Hound certification | Hound Certification Form | Rev 01/21 | https://www.asfa.org/forms/SEC-06--Hound%20Certification%20%281%29.pdf |
| LCI registration | EF-A LCI Registration Form | Rev 08-24 | https://www.asfa.org/forms/EF-A-LCI-Registration%20Form--08-2024.pdf |
| LCI entry | EF-A-LCI Entry Form | Rev 08-24 | https://www.asfa.org/forms/EF-A-LCI-Entry%20Form--08-2024.pdf |
| Standard entry | Entry Form ID-EF-A | Rev 6/26 | linked from ASFA Trial Forms page |
| Electronic records | Electronic Submission of Records | current page link | https://www.asfa.org/forms/Electronic%20Submission%20of%20Records.pdf |

ASFA scoring rules to encode:

| Program | Categories | Penalties | Notes |
| --- | --- | --- | --- |
| Regular ASFA | Enthusiasm 15, Follow 15, Speed 25, Agility 25, Endurance 20; total 100 | Pre-slip 1-10 per judge; course delay 1-10 per judge | Whole-number scoring only. Two runs: preliminary and final. |
| ASFA LCI | Same 100-point category scale | Course delay 1-10 per judge | One or two judges allowed. Dogs run individually. Qualifying score is 50 percent of possible combined score. |

ASFA result states to model:

| State | Needs in app |
| --- | --- |
| No-course | Course can be rerun; penalties may carry differently depending on penalty type. |
| Excused | Reason required; preliminary excusal blocks final run. |
| Dismissed | Reason required; counts differently than excused when computing points. |
| Disqualified | Aggressor/fighting reason required; needs future reinstatement tracking. |
| Forfeit / withdraw | Needed for ties, Best of Breed, and runoffs. |
| Tie / runoff | Must support random runoff course draw, runoff score, and unresolved/forfeited ties. |

Important ASFA implementation note:
ASFA's website copyright notice says site material may not be reproduced without written permission. The practical approach is to let clubs use official public PDFs as templates and overlay event data for printing. If we bundle ASFA forms inside a distributed app, we should confirm permission.

## AKC Sources

Primary AKC lure coursing page:
https://www.akc.org/sports/coursing/lure-coursing/

AKC downloadable forms page:
https://www.akc.org/downloadable-forms/

Relevant AKC forms found:

| Use | Form | Form code / Revision | Source |
| --- | --- | --- | --- |
| Judge sheet | AKC Lure Coursing Judges Sheet | JERSC1 (5/18) | https://www.akc.org/wp-content/uploads/2022/03/JERSC1_518-New-Logo.pdf |
| Posted score / result sheet | Lure Coursing Scoresheet | JERSC3 (4/22) | https://www.akc.org/wp-content/uploads/2022/04/JERSC3-4.22-fillable.pdf |
| Single stake score sheet | Lure Coursing Scoresheet - Single Stake Scoresheet | JERSC7 (5/18) | https://www.akc.org/wp-content/uploads/2022/04/JERSC7_0518-Fillable.pdf |
| Draw order | Lure Coursing Draw Order Sheet | linked on AKC forms page | https://images.akc.org/pdf/JERSC2.pdf |
| Event secretary report | Lure Coursing, Herding, Earthdog Events and Stand-Alone Farm Dog Certified Tests Event Secretary's Report | JFSEC2 (10/25) | https://images.akc.org/pdf/JFSEC2.pdf |
| Judge book directions | AKC Coursing Judges Book Directions | IEJDG1 | https://images.akc.org/pdf/IEJDG1.pdf |
| QC / JC test record | Qualified Courser / Junior Courser Test Record Sheet | linked on AKC forms page | https://www.akc.org/wp-content/uploads/2022/04/JERSC6_518-fillable.pdf |
| Lure coursing entry | Lure Coursing / CAT / FCAT Entry Form | linked on AKC forms page | https://images.akc.org/pdf/entry_form_lure_coursing.pdf |

AKC scoring rules to encode:

| Program | Categories | Penalties | Notes |
| --- | --- | --- | --- |
| AKC regular lure coursing | Overall Ability 10, Follow 10, Speed 10, Agility 10, Endurance 10; total 50 | Pre-slip 1-5; course delay 1-5 | Judge sheet has yellow, pink, and blue columns. |
| AKC score posting | Preliminary, final, combined, runoff, BOB/BIF fields | Needs placement/qualifying output | Scoresheet includes registration number, registered name, call name, course/blanket, judges, and final placements. |

AKC result states to model:

| State | Needs in app |
| --- | --- |
| Failure to run | Total score is zero on judge sheet. |
| Excused | Reason and blanket color needed. |
| Dismissed | Interference reason and blanket color needed. |
| Disqualified | Fighting/aggressor reason and blanket color needed. |
| Runoff | Needs separate score/runoff result fields. |
| BOB/BIF | Needs separate course and result tracking. |

## Proposed Data Model Additions

Add these concepts before implementing draw/scoring:

| Table / object | Purpose |
| --- | --- |
| `form_templates` | Association, form code, revision, paper size, source URL, local file path, active flag. |
| `trial_courses` | Trial, breed, stake/class, phase, course number, run order, judge assignments, status. |
| `course_hounds` | Course, entry, blanket color, position, draw seed/order. |
| `judge_scores` | Course hound, judge, category scores, penalties, total, decision. |
| `result_decisions` | Excused, dismissed, disqualified, forfeit, withdrawn, no-course, reason, notes, official time. |
| `posted_results` | Breed/stake posting rows for preliminary, final, combined, runoff, placement, BOB/BIF. |

## Implementation Order

1. Add a Paperwork > Official Forms area with ASFA/AKC form catalog, source links, revision labels, and template status.
2. Add a PDF-template print engine that can print one official form with overlaid trial data.
3. Start with the judge sheets because they drive the data model for scores and penalties.
4. Add posted score sheets after courses/draw exist, because those depend on preliminary/final/runoff sequencing.
5. Add submission/report forms last, once result states and fee/count logic are trustworthy.
