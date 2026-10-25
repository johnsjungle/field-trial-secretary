# HALO v0.5.7

Corrects ASFA results and record sheets after a hound changes stakes between preliminary and final scoring.

- Moves the hound's row from the original stake section to the corrected stake section on the on-screen Results page.
- Prints the hound and its completed preliminary score under the corrected stake instead of the original preliminary stake.
- Finds the hound's final course, blanket color, judge scores, final total, combined total, and placement in the corrected stake.
- Supports corrections made with the new **Finals Stake** control and older/manual corrections where the trial entry stake was changed directly.
- Keeps the original preliminary draw and scoring history intact.
- Updates the built-in system test so a Windows-only release is validated correctly.
- Publishes a Windows package for this release. macOS and Ubuntu packages will follow separately.

Existing Windows installations can install this release from **Admin > Updates & Versions**. HALO backs up the database, replaces program files, and restarts while preserving trial data.
