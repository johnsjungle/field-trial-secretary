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

## macOS Build

The GitHub Actions workflow in `.github/workflows/build-macos.yml` builds
separate Apple Silicon and Intel disk images. In GitHub, open **Actions**,
choose **Build macOS Application**, and select **Run workflow**. When both
jobs finish, download the two DMG artifacts from the workflow run.

The Mac application keeps its live SQLite database and backups outside the
application bundle at:

```text
~/Library/Application Support/Field Trial Secretary
```

This means replacing the application with a newer build does not replace the
trial database. The current builds use ad-hoc signing for testing. Public
distribution will require an Apple Developer ID certificate and notarization.
