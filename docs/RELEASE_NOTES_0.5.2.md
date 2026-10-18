# HALO v0.5.2

Fixes runoff paperwork after withdrawals and adds a clearer way to mark a hound unable to run after preliminaries without losing its preliminary score.

- Removes hounds marked forfeit, lame, pulled, excused, dismissed, or disqualified from runoff judging and huntmaster paperwork.
- Uses the current edited runoff draw, including manual blanket and course assignments, when printing runoff paperwork.
- Omits runoff courses that no longer have at least two eligible hounds.
- Adds a separate **Finals Status** control after preliminary scoring so the preliminary score remains recorded while the hound is excluded from the final draw.
- Removes a newly unavailable hound from an existing unscored final draw and normalizes the remaining course assignments.
- Prevents a status change from silently deleting an entered final or runoff result; the existing result must be cleared first.
- Prints the post-preliminary status in the final section of AKC and ASFA record sheets.
- Treats a stake whose finalists are all withdrawn as complete without requiring an empty final draw.
- Adds a clear **No Eligible Finalists** state and updates contextual help for system testing and database backup and restore.
- Keeps Windows portable, Ubuntu AppImage and Debian, and signed and notarized Apple Silicon and Intel macOS installers in the same release.

Existing installations can install this release from **Admin > Updates & Versions**. HALO backs up the database, replaces program files, and restarts while preserving trial data.
