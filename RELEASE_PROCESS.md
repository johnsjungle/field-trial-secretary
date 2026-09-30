# HALO Release Process

Use this when preparing a portable update for another computer.

## Build A New Portable Release

1. Update `app/version.json`.
   - Increase `version`.
   - Set `releaseDate`.
   - Add a short `notes` value.
2. Start HALO in server mode.
3. Go to `Admin > Tools`.
4. Click `Create Transfer Package`.
5. Copy the generated `field-trial-secretary-<version>-installer-*.zip` to the other computer.

The transfer package includes the current live SQLite database and a blank starter database. It does not include old backup history.

## Build A Program-Only Update

Use this for a computer that already has HALO installed and should keep its existing trial database.

1. Update `app/version.json`.
2. Start HALO in server mode.
3. Go to `Admin > Tools`.
4. Click `Create Program Update Package`.
5. Copy the generated `field-trial-secretary-<version>-program-update-*.zip` to the other computer.

The program update package does not include `data\field_trial_secretary.sqlite`.

## Install On Another Computer

1. Right-click the zip and choose `Extract All`.
2. Extract it into the folder where you want the app to live.
3. Open the `Field Trial Secretary` compatibility folder.
4. Double-click `Start HALO.vbs`.

The target computer does not need Python.

## Update An Existing Computer

1. Close HALO on that computer.
2. Right-click the program update zip and choose `Extract All`.
3. Open the extracted folder.
4. Double-click `Update Field Trial Secretary.bat`.
5. Press Enter to update the suggested folder, or type the folder where HALO is installed.
6. Start the app again with `Start HALO.vbs`.

This updates program files and leaves the existing SQLite database alone.

## Online Releases

For a public download, upload the generated installer zip to a GitHub Release or another trusted download location.

Recommended release title:

`HALO v<version>`

Recommended asset:

`field-trial-secretary-<version>-installer-*.zip`

After uploading, copy the release URL into `app/version.json` as `releaseUrl` before building the next release.
