# Field Trial Secretary v0.4.1 beta

Adds split-stake overrides under Roll Call > Advanced: Split Stakes.

- AKC: override the number of dogs required for a five-point major for a breed in the current trial.
- ASFA: override the minimum dogs per flight for a breed in the current trial. Automatic defaults remain 20 hounds to split, at least 10 per flight, distributed evenly.
- Each override requires a reason and records change history. Reset to Automatic restores the association defaults.
- Controls show the threshold and resulting split sizes, including below-threshold stakes.
- Overrides persist with the trial and do not affect other breeds, trials or associations.
- Settings lock when preliminary scoring starts. Changing settings leaves an existing draw intact and flags it for rebuilding before scoring.

Retains the v0.4.0 verified program updater. Packaged v0.4.0 users can check for updates, prepare v0.4.1, then choose Install and Restart. Users on earlier versions must install manually once. Back up the database before manual installation.
