# HALO v0.4.10 beta

Corrects AKC scoresheet placements and makes non-scoring hound statuses clear on official record sheets.

- Uses the correct AKC qualifying minimum of 50 points per judge, so valid one-judge totals such as 6573 retain and print their placements.
- Prints AKC event numbers and placements as static PDF content so they remain visible in PDF viewers and on paper.
- Reads older saved event-number field names and clearly marks an event number as not entered when the trial has none.
- Keeps hounds marked unavailable before the draw on the AKC and ASFA record sheets.
- Prints LAME, ABSENT, IN SEASON, BREED DQ, SCRATCHED, EXCUSED, DISMISSED, DISQUALIFIED, FORFEIT, PULL, and NO SCORE outcomes instead of leaving rows blank.
- Corrects starter counts so hounds unavailable before the draw are not counted as starters.
- Keeps Windows portable, Ubuntu AppImage and Debian, and signed and notarized Apple Silicon and Intel macOS installers in the same release.

Existing installations can install this release from **Admin > Updates & Versions**. HALO backs up the database, replaces program files, and restarts while preserving trial data.
