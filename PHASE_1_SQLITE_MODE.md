# Phase 1 SQLite Mode

Phase 1 adds a local SQLite-backed app mode.

## Start The App

Run this from PowerShell in the project folder:

```powershell
.\start_field_trial_secretary.ps1
```

Then open:

```text
http://127.0.0.1:8765/
```

Do not use `file:///.../app/index.html` for trial-day production work once SQLite mode is available. The file version still works as a fallback prototype, but SQLite mode is safer.

## Moving Existing Browser Prototype Data Into SQLite

If you already entered data using `file:///.../app/index.html`, do this once:

1. Open the old `file:///.../app/index.html` page.
2. Go to Admin Test > Backup & Transfer.
3. Click Export Data Backup.
4. Start SQLite mode with `start_field_trial_secretary.ps1`.
5. Open `http://127.0.0.1:8765/`.
6. Go to Admin Test > Backup & Transfer.
7. Click Import Data Backup and choose the JSON file.

The old file-page browser storage and the new local-server browser storage are separate, so this export/import step matters.

## Data Location

SQLite database:

```text
data/field_trial_secretary.sqlite
```

Automatic database backups:

```text
backups/database/
```

The app also still keeps browser safety backups and JSON export/import.

## Trial Day Routine

1. Start with `start_field_trial_secretary.ps1`.
2. Use `http://127.0.0.1:8765/`.
3. Use Admin Test > Backup & Transfer > Create SQLite Backup after major milestones.
4. Also use Export Data Backup for a portable JSON copy.
