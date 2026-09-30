# Field Trial Secretary

Offline-first field trial secretary application for setting up lure coursing trials, entering hounds, managing workers and judges, drawing courses, scoring, and producing ASFA/AKC paperwork.

## Current release: v0.4.6 beta

This release adds a complete AKC JC/QC workflow, official test paperwork, individual QC certificates, and a prefilled Judges' Book cover. See [full release notes](docs/RELEASE_NOTES_0.4.6.md), [BIE setup](docs/BIE_EVENTS.md), and [specialty stakes](docs/SPECIALTY_STAKES.md).

## Update checker

Use **Admin → Updates & Versions** to check for releases. In a packaged Windows or Mac installation, **Update Program** downloads the verified release, backs up SQLite, closes the app, replaces program files, verifies the new version, and restarts automatically. Trial data stays in its existing data location. Installers are hosted in the public GitHub Releases repository, separately from the application source repository. See [maintaining the version index](docs/UPDATES.md).

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

The live SQLite database, backups, portable builds, generated PDFs, and logs are intentionally excluded from GitHub. Normal installers contain a blank database template under `database` and no live database under `data`. On first launch, choose **Create New Empty Database** or **Restore Existing Database**. Existing installations continue using their current database without a setup prompt.

## Portable Build

Create a portable package with:

```powershell
.\build_portable_package.ps1
```

## macOS Build

The GitHub Actions workflow in `.github/workflows/build-macos.yml` builds
separate Apple Silicon and Intel disk images. In GitHub, open **Actions**,
choose **Build Installers**, and select **Run workflow**. When both
jobs finish, download the two DMG artifacts from the workflow run.

The Mac application keeps its live SQLite database and backups outside the
application bundle at:

```text
~/Library/Application Support/Field Trial Secretary
```

This means replacing the application with a newer build does not replace the
trial database. Tagged releases require Developer ID signing and Apple
notarization before GitHub publishes their installers. See
[`docs/MACOS_RELEASE.md`](docs/MACOS_RELEASE.md) for the one-time Apple and
GitHub secret setup.
