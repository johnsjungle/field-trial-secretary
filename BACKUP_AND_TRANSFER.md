# Backup And Transfer

The app now has a local SQLite mode. For trial-day work, start the app with `start_field_trial_secretary.ps1` and use `http://127.0.0.1:8765/`.

To move everything to a new computer, back up the program files and the SQLite data file. A JSON export is still useful as a portable extra backup.

## On The Old Computer

1. Open the app.
2. Go to Admin Test > Backup & Transfer.
3. Click Create SQLite Backup.
4. Click Enable Protected Browser Storage.
5. Click Export Data Backup.
6. Save the downloaded JSON file somewhere safe.
7. In PowerShell, run:

```powershell
.\backup_field_trial_secretary.ps1
```

This creates a zip file in the `backups` folder.

## On The New Computer

1. Extract the Field Trial Secretary package.
2. Start Field Trial Secretary.
3. On first launch, choose **Restore Existing Database** and select the saved `.sqlite` database. Choose **Create New Empty Database** only for a new installation with no data to restore.
4. If a transfer package already placed `field_trial_secretary.sqlite` in the `data` folder, the app loads it automatically.
5. If needed, use Admin → Tools to restore another SQLite or JSON backup.

## What Is Included

A normal program installer includes:

- App files
- Local ASFA/AKC PDF templates
- Database schema and a blank database template
- No live trial database

An explicit transfer package also includes the current `data/field_trial_secretary.sqlite`.

The JSON data backup includes:

- Trials
- Hound database
- Judges
- Workers
- Official form template status
- Active trial selection

The SQLite database lives at:

```text
data/field_trial_secretary.sqlite
```

## Browser Safety Backup

The app also keeps a second in-browser safety backup using IndexedDB when supported by the browser. If localStorage is missing but the safety backup remains, the app can restore it from:

Admin Test > Backup & Transfer > Restore Browser Safety Backup

This is helpful after browser hiccups, but the exported JSON file is still the best portable backup.
