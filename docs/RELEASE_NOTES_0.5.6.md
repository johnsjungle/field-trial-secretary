# HALO v0.5.6

Adds a safe way to correct a hound's stake after preliminary scoring and improves Windows startup reliability.

- Adds a **Finals Stake** selector to each preliminary scoring row.
- Preserves completed preliminary course assignments, blanket colors, judge scores, and totals when correcting the stake.
- Places the hound in the corrected stake when drawing finals for the breed.
- Calculates combined totals and placements in the corrected stake.
- Prints the hound and its preliminary score under the corrected stake on the official record sheet.
- Prevents a stake correction from discarding existing finals or runoff results.
- Fixes a startup error that could leave HALO on the loading screen when an existing trial contained preliminary scores.
- Updates the Windows launcher to open an already-running local copy instead of attempting to start a conflicting second server.
- Refreshes the browser script address so Windows installations do not reuse the broken cached startup script.
- Publishes a Windows package for this release. macOS and Ubuntu packages will follow separately.

Existing Windows installations can install this release from **Admin > Updates & Versions**. HALO backs up the database, replaces program files, and restarts while preserving trial data.
