# Updates & Versions

Admin → Updates & Versions displays the installed version, bundled release history, README and release-note links, and a manual online update check. Beta releases can be included or hidden. Downloads open in a browser; the app never installs updates automatically or uploads trial data.

## Publish a new download

1. Upload the completed installers to the public Google Drive folder linked in `app/version-index.json`.
2. Give each file public viewer access and copy its share link.
3. Add an entry to `app/version-index.json` with `version` (three numeric components), `date`, `channel` (`stable` or `beta`), `status` (`pending` or `available`), and `summary`.
4. Add version-specific `readmeUrl` and `notesUrl`. For Drive-hosted documents, use their public share links.
5. Put individual installer links in `downloads.windows`, `downloads.appleSilicon`, and `downloads.intel`. Only mark the entry `available` when its advertised files are ready. Pending entries show documentation but no installer buttons.
6. Commit and push the index to the branch named in `app/version.json` → `latestVersionUrl`. Existing installations can then discover the new release without recompilation.

The current endpoint uses the repository's `codex/trial-entry-redesign` branch. Keep that endpoint available for installed apps; if moving to another branch, retain a copy of the index at the old path. Older downloads remain linked to their GitHub releases. v0.3.10 remains pending while its installer set is unfinished; no individual Drive download links have been invented.

The index is public JSON, limited to 200 entries. README/download links accept HTTPS links on GitHub or Google Drive document/download hosts only. A failed online check preserves the displayed list and explains that current availability could not be checked.
