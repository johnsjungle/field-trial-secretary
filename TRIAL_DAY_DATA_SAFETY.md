# Trial Day Data Safety

The recommended trial-day mode now saves data to SQLite:

```text
data/field_trial_secretary.sqlite
```

Start it with:

```powershell
.\start_field_trial_secretary.ps1
```

Then open `http://127.0.0.1:8765/`.

The browser fallback also saves data in two browser locations:

1. `localStorage`, used by the app for normal loading.
2. IndexedDB safety backup, refreshed after saves when the browser supports it.

The app can also request protected browser storage from the browser. Use:

Admin Test > Backup & Transfer > Enable Protected Browser Storage

This reduces the chance that the browser clears app data automatically.

## Recommended Trial Day Routine

Before leaving for the field:

1. Open the app on the trial computer.
2. Go to Admin Test > Backup & Transfer.
3. Click Create SQLite Backup.
4. Click Enable Protected Browser Storage.
5. Click Export Data Backup and save the JSON file to a USB drive or cloud folder.
6. Run `backup_field_trial_secretary.ps1` to create a program zip if the program changed.

During the trial:

- Export Data Backup after entries close.
- Export Data Backup after roll call.
- Export Data Backup after prelim draw.
- Export Data Backup after finals/results.

If something looks empty:

1. Go to Admin Test > Backup & Transfer.
2. Click Restore Browser Safety Backup.
3. If needed, import the last exported JSON backup.

## Remaining Risk

SQLite mode is now the preferred stable local mode. The browser safety backup and exported JSON are still useful secondary backups.
