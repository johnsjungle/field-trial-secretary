# HALO v0.5.0

Adds broader trial preparation tools, filled paperwork previews, and stronger backup and regression testing.

- Adds an option to prepare the running order, judges, and workers for every eligible breed before late entries arrive, while keeping unused breeds off printed worker sheets and judges maps.
- Adds paid or unpaid status as an optional column on roll call sheets.
- Adds filled AKC and ASFA test-paperwork packets with enough sample hounds and courses to expose alignment problems on later pages.
- Adds a built-in full system test that checks major workflows, generated paperwork, database safety, and update metadata without changing the active trial.
- Improves premium-list judge assignment imports from Markdown tables and stacked grid images.
- Simplifies Admin Tools backup and restore options and allows a complete HALO SQLite database from another computer to be selected for restoration.
- Fixes the Create SQLite Backup, backup settings, and SQLite restore actions that could report **Failed to fetch**.
- Keeps Windows portable, Ubuntu AppImage and Debian, and signed and notarized Apple Silicon and Intel macOS installers in the same release.

Existing installations can install this release from **Admin > Updates & Versions**. HALO backs up the database, replaces program files, and restarts while preserving trial data.
