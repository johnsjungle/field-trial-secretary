# HALO v0.5.9

Corrects AKC Specials reporting and the stake order in end-of-trial record packets.

- Includes Specials and Special entries in worker-sheet run counts instead of leaving their stake column blank while counting them in the breed total.
- Labels the worker-sheet column **Specials** for AKC trials; ASFA retains **Fch/Exc**.
- Orders alphabetical record packets **Open, Specials, Veteran**, matching the corrected draw-sheet order.
- Supports legacy champion-stake aliases in report sorting and AKC judge-sheet stake marks.
- Adds Admin full-system checks and regression tests covering Specials counts, print order, imports, draws, judges maps, huntmaster sheets, scoring, placements, results, ribbons, catalogs, and official record sheets.

Existing entries and draws do not need rebuilding to use these report fixes. Reprint the affected sheets after updating.

Available for Windows, Apple Silicon Mac, Intel Mac, and Ubuntu (AppImage and Debian package). Mac installers are Developer ID signed and Apple notarized.

Use **Admin > Updates & Versions** to install the update. HALO backs up and preserves trial data while replacing program files and restarting. New installations contain a blank starter database template and no live trial database.
