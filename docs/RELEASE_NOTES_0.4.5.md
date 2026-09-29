# Field Trial Secretary v0.4.5 beta

Restores final trial archiving and improves SQLite reliability on Windows.

- Adds the missing `/api/trial-archive` server route used by **Create Final Archive & Lock Trial**.
- Creates and downloads the final ZIP with the SQLite backup, trial data, full application-state snapshot, README, and applicable report files.
- Returns readable archive errors to the application instead of falling through to an unsupported server request.
- Closes SQLite connections deterministically after saves, backups, integrity checks, Undo operations, and stored-document access, preventing database files from remaining locked on Windows.
- Adds regression coverage for successful archive creation, ZIP contents, invalid archive requests, and unrelated API routes.

Includes the safe first-run database setup and one-click verified updater introduced in v0.4.4.