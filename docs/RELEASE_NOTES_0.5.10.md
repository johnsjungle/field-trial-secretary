# HALO v0.5.10

Fixes mixed-stake draws and AKC paperwork, and adds a way to post only updated runoff record sheets.

- The preliminary draw's **Mixed stake course** checkbox combines eligible stakes into one course instead of changing only the label. Turning it off separates the stakes again. Scored prelims and existing finals/runoff results are protected from this regrouping.
- Mixed stakes stay together when building finals by stake or breed. Older trials with separately drawn stakes marked as mixed can build a combined finals course without changing their saved preliminary courses or scores. Hounds retain their individual stakes for placements.
- AKC judge sheets explicitly identify **Veteran** and list the stakes in mixed courses.
- AKC record sheets show drawn BOB course/blanket codes before runoff scores are entered, including combined first-place tie/BOB courses. Completed BOB results print alongside the draw code.
- **Run Offs Scoring > Print Updated Record Sheets Only** creates a PDF for affected stakes changed since their last record-sheet PDF was generated. It skips unrelated stakes and JC/QC sheets, and includes current placements and runoff results. Unresolved ties remain marked as ties. Failed PDF requests remain pending for retry.
- Score or outcome corrections affecting existing placements display a **Reset Placements** reminder. Resetting remains a manual decision; no automatic runoff reset was added. The reminder explains that resetting clears the stake's tie runoff scores, forfeits, and blanket assignments while keeping prelim and finals scores.
- Mixed-stake record sheets retain preliminary scores, finals scores, and individual placements, including older trials whose mixed finals were drawn separately from prelims.

Installing the update preserves the local trial database. Reprint affected paperwork to apply the report fixes; do not rebuild a scored trial just to refresh its paperwork. Set mixed courses before preliminary scoring, and review the existing confirmation before replacing any finals draw.

Finals and runoff blankets remain separate assignments. A finals blanket correction does not change a runoff blanket. This release does not claim a fix for the unconfirmed Borzoi blanket report.

Available for Windows, Apple Silicon Mac, Intel Mac, and Ubuntu (AppImage and Debian package). Mac installers use the existing Developer ID signing and Apple notarization workflow.

Use **Admin > Updates & Versions** to install the update. New installations contain a blank starter database template and no live trial database.
