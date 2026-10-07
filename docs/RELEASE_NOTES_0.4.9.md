# HALO v0.4.9 beta

Prevents accidental duplicate hounds during entry import and improves AKC trial paperwork.

- Flags imported entries that are not marked first-time when they do not exactly match the current hound database.
- Suggests likely existing hounds for one-character or transposed registration errors, similar registered names, and matching call names.
- Requires the secretary to select an existing hound or explicitly confirm a new record before importing a questionable entry.
- Keeps likely matches as suggestions so HALO never silently merges two hounds.
- Includes registration certificates in the final trial packet even when the entry is not marked first-time.
- Restores printing first-time entry forms from Trial Wrap.
- Identifies the placement being decided on AKC runoff judging sheets.
- Prints placements, pending ties, and tie-course blanket draws on AKC score sheets after final scoring.
- Prints the event number, trial secretary, and trial chair on AKC score sheets.
- Prevents double printing on the AKC secretary report.
- Keeps Windows portable, Ubuntu AppImage and Debian, and signed and notarized Apple Silicon and Intel macOS installers in the same release.

Existing installations can install this release from **Admin > Updates & Versions**. HALO backs up the database, replaces program files, and restarts while preserving trial data.
