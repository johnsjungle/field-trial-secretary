# Updates & Versions

The app reads https://raw.githubusercontent.com/johnsjungle/field-trial-secretary-updates/main/version-index.json without login. The application source repository and installer repository are public and remain separate.

Publish completed installers as GitHub Release assets in johnsjungle/field-trial-secretary-updates. Add their public browser download URLs to downloads.windows, downloads.appleSilicon, and downloads.intel in the public index. Publish the matching README and release notes under versions/<version>/. Mark a version available when its advertised downloads are ready; pending versions show notes without download buttons, and archived entries contain documentation only.

Mirror the index into app/version-index.json before building to provide an offline list. Do not include live databases, credentials, source code, or test data in the public documentation repository. Use clean public build artifacts. Existing installed checkers discover changes to the public index without recompilation.

The app checks only when requested and filters beta versions. For packaged Windows and Mac installations, the version index must provide a platform-specific `updates` asset with its SHA-256 checksum. **Update Program** downloads and verifies that asset, creates and verifies a SQLite backup, closes the app, replaces only allowlisted program components, confirms the new version uses the same database path, and restarts. Failed startup restores the previous program files. Manual download links remain available. The updater never sends trial data, and network failure leaves the bundled version list visible with an error message.
