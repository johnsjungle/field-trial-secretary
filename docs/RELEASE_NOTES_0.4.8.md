# HALO v0.4.8 beta

Adds native Ubuntu packages and restores reliable document uploads used during entry and trial processing.

- Adds a self-contained Ubuntu AppImage for portable use on supported x86_64 systems.
- Adds an Ubuntu/Debian `.deb` installer with an application-menu launcher.
- Includes Ubuntu downloads in HALO's Updates & Versions page and update selection.
- Restores uploads for entry documents.
- Restores signed judge-sheet uploads for excused, dismissed, and disqualified hounds.
- Stores uploaded file contents in a dedicated table while preserving existing entry-to-document relationships and trial data.
- Migrates documents created by the earlier blob-storage layout when encountered.
- Rejects oversized or malformed uploads with a clear response instead of a browser “Failed to fetch” error.
- Keeps Windows portable and signed, notarized Apple Silicon and Intel macOS installers in the same release.

This release includes all HALO trial-management, JC/QC, BIF/BIE, multi-field, printing, updating, and archive improvements from v0.4.7 and earlier.
