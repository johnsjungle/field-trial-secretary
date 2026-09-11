# Updates & Versions

The app reads https://raw.githubusercontent.com/johnsjungle/field-trial-secretary-updates/main/version-index.json without login. The private source repository remains private.

Publish completed installers as GitHub Release assets in johnsjungle/field-trial-secretary-updates. Add their public browser download URLs to downloads.windows, downloads.appleSilicon, and downloads.intel in the public index. Publish the matching README and release notes under versions/<version>/. Mark a version available when its advertised downloads are ready; pending versions show notes without download buttons, and archived entries contain documentation only.

Mirror the index into app/version-index.json before building to provide an offline list. Do not include live databases, credentials, source code, or test data in the public documentation repository. Use clean public build artifacts. Existing installed checkers discover changes to the public index without recompilation.

The app checks only when requested, filters beta versions, opens downloads in the user's browser, and leaves installation manual. It never sends trial data. On network failure it retains the loaded list with a visible error message.
