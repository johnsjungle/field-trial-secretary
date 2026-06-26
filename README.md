# Field Trial Secretary

Offline-first field trial secretary application for setting up lure coursing trials, entering hounds, managing workers and judges, drawing courses, scoring, and producing ASFA/AKC paperwork.

## Run Locally

Start the local server:

```powershell
.\start_field_trial_secretary.ps1
```

Then open:

```text
http://127.0.0.1:8765/
```

## Data Safety

The live SQLite database, backups, portable builds, generated PDFs, and logs are intentionally excluded from GitHub. Keep trial-day data in local backups or a portable package, not in the repository.

## Portable Build

Create a portable package with:

```powershell
.\build_portable_package.ps1
```
