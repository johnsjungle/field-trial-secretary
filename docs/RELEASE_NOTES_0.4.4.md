# Field Trial Secretary v0.4.4 beta

Makes installation and future program updates safer and simpler while preserving trial data.

- Replaces the two-step updater with one **Update Program** action that downloads and verifies the release, backs up SQLite, closes the app, installs only program files, verifies the new version and database path, and restarts automatically.
- Keeps rollback protection: if the updated application does not start successfully, the previous program files are restored and the trial database remains untouched.
- Removes live SQLite data from normal Windows installer packages. A clean blank template now lives under program assets instead of the live `data` directory.
- Adds a first-run database screen to create a truly empty database or restore an existing Field Trial Secretary SQLite database after integrity and application-format checks.
- Prevents stale browser data from repopulating a newly created empty database.
- Keeps existing installations on their current database without displaying the first-run screen.
- Keeps explicit transfer packages able to carry the current database while excluding inherited or stale data files.
- Applies the same separate-template design to signed Windows, Apple Silicon, and Intel packages and verifies it during release builds.
- Requires a field clerk before an ASFA trial setup can be saved.
- Recognizes spelled-out and alternate breed names during hound imports, including previously imported records that need normalization.
- Corrects BOB runoff huntmaster labels and includes breed initials beside BIF/BIE runoff hounds.
- Reduces temporary GitHub Actions artifact retention after published installers are created.

Includes all v0.4.3 BIE event-management features and publishes as a normal GitHub release rather than a prerelease.
