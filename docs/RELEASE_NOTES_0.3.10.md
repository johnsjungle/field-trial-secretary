# Field Trial Secretary v0.3.10 beta

Released September 11, 2026. Changes since v0.3.9.

## Specialty stakes

- Added independent Kennel and Breeder partnerships between two distinct same-breed hounds, with shared names for reports.
- Bench entries are reported as Dual Champion stakes.
- Added specialty catalog lists under Admin/Catalog and specialty results under Main Results. Pair totals use preliminary and final scores; incomplete pairs remain pending.

## BIF and Best in Event

- Added an explicit BIF/BIE event selector. BIE can collect BOB winners from multiple saved trial days and additional individually selected qualifiers, with source-day information and duplicate registration checks.
- Added two-dog courses, configurable course capacity, like-breed grouping, additional empty courses, and manual setup before random drawing.
- Optional elimination mode selects clear course winners from completed scores, supports manual winner decisions for ties/byes, advances winners to drawn or manually arranged rounds, and retains previous rounds with judges, scores, colors, and advancement history.
- Moved elimination advancement controls beneath the scores. Three remaining winners can run a three-dog final; the final winner is explicitly confirmed.
- Corrected BIE judge-sheet printing and prevented duplicate Windows app servers from serving outdated reports.

## Testing tools

- Added Kennel, Breeder, and Bench checkboxes to test-trial creation, including named same-breed pairs.
- Added BIF/BIE score population, including the current tie round. Runoff score population fills existing draws without replacing posted colors.
- Score tools require editable test trials. Previous elimination rounds are preserved.

## Draws, scoring, and reports

- Corrected AKC Field Champion/FCH/FC split eligibility to match Specials; corrected regional threshold lookup for abbreviated breeds.
- Corrected AKC judge-sheet split-letter positions and Special selection for Field Champion record sheets.
- Added stake/flight labels beside AKC draw-order course numbers. Runoff sheets now circle the actual breed, retain the original stake/flight, and place tie descriptions below the hound names.
- Recognize SD/DH and Scottish Deerhound aliases consistently, displaying SD; improved other breed alias handling in imports and reports.
- Runoff controls distinguish initial draws from redraws, warn before replacing posted assignments, default to keeping the existing draw, and protect existing draws during automatic breed processing.

## Reliability and navigation

- SQLite remains available when the optional browser cache exceeds its storage quota.
- Main menus, submenus, and workflow information remain visible while scrolling. Trial Guide shares the submenu row; active trial, database status, and Exit sit on the main menu bar.
- Mac builds retain recovery installers before notarization and have longer notarization timeouts.

## Updating

Download the package for Windows, Apple Silicon, or Intel. Back up your trial database before updating and close the previous app instance. Keep your existing database; public installer builds contain no live trial data. Refresh browser tabs after replacing the app.

Existing draws are preserved. Rebuild a test draw to apply corrected splitting; reprint paperwork to apply report fixes. BIE elimination remains optional; enabling it is not required for standard BIE events.
