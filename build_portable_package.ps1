param(
    [switch]$SkipPyInstallerInstall,
    [switch]$Clean,
    [switch]$NoZip
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonCandidates = @(
    "C:\Users\johns\AppData\Local\Programs\Python\Python313\python.exe",
    "C:\Users\johns\AppData\Local\Programs\Python\Python314\python.exe",
    "C:\Users\johns\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe",
    "python"
)

$python = $null
foreach ($candidate in $pythonCandidates) {
    try {
        $command = Get-Command $candidate -ErrorAction Stop
        $python = $command.Source
        break
    } catch {
    }
}

if (-not $python) {
    throw "Python was not found on this build computer. The target computer will not need Python, but this build step does."
}

Set-Location -LiteralPath $root

$versionPath = Join-Path $root "app\version.json"
$appVersion = "0.0.0"
if (Test-Path -LiteralPath $versionPath) {
    try {
        $versionData = Get-Content -Raw -LiteralPath $versionPath | ConvertFrom-Json
        if ($versionData.version) {
            $appVersion = [string]$versionData.version
        }
    } catch {
        $appVersion = "0.0.0"
    }
}
$safeAppVersion = ($appVersion -replace '[^0-9A-Za-z._-]', '-').Trim('-')
if (-not $safeAppVersion) {
    $safeAppVersion = "0.0.0"
}

if (-not $SkipPyInstallerInstall) {
    foreach ($package in @("pyinstaller", "pypdfium2", "pypdf", "reportlab", "pillow")) {
        $packageInstalled = $false
        try {
            & $python -m pip show $package *> $null
            $packageInstalled = ($LASTEXITCODE -eq 0)
        } catch {
            $packageInstalled = $false
        }
        if (-not $packageInstalled) {
            Write-Host "$package is not installed in this Python. Installing it now..."
            & $python -m pip install $package
            if ($LASTEXITCODE -ne 0) {
                throw "$package install failed."
            }
        }
    }
}

if ($Clean) {
    foreach ($path in @("build", "dist", "portable")) {
        $target = Join-Path $root $path
        if (Test-Path -LiteralPath $target) {
            Remove-Item -LiteralPath $target -Recurse -Force
        }
    }
}

Write-Host "Building FieldTrialSecretary.exe..."
$iconPath = Join-Path $root "app\assets\field-trial-secretary-icon.ico"
$pyInstallerArgs = @(
    "--noconfirm",
    "--clean",
    "--noupx",
    "--onedir",
    "--console",
    "--name", "FieldTrialSecretary",
    "--collect-all", "pypdfium2"
)
if (Test-Path -LiteralPath $iconPath) {
    $pyInstallerArgs += @("--icon", $iconPath)
}
$pyInstallerArgs += "server.py"
& $python -m PyInstaller @pyInstallerArgs
if ($LASTEXITCODE -ne 0) {
    throw "PyInstaller build failed."
}

$packageRoot = Join-Path $root "portable\Field Trial Secretary"
$distRoot = Join-Path $root "dist\FieldTrialSecretary"

if (Test-Path -LiteralPath $packageRoot) {
    Remove-Item -LiteralPath $packageRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $packageRoot | Out-Null

Get-ChildItem -LiteralPath $distRoot -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $packageRoot -Recurse -Force
}

foreach ($folder in @("app", "database")) {
    Copy-Item -LiteralPath (Join-Path $root $folder) -Destination (Join-Path $packageRoot $folder) -Recurse -Force
}

foreach ($folder in @("data")) {
    $source = Join-Path $root $folder
    $destination = Join-Path $packageRoot $folder
    if (Test-Path -LiteralPath $source) {
        Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
    } else {
        New-Item -ItemType Directory -Path $destination | Out-Null
    }
}

foreach ($folder in @(
    "backups",
    "backups\database",
    "backups\trial_archives",
    "backups\transfer_packages",
    "backups\app_file_restores"
)) {
    New-Item -ItemType Directory -Path (Join-Path $packageRoot $folder) -Force | Out-Null
}

$blankDb = Join-Path $packageRoot "data\blank_field_trial_secretary.sqlite"
$schemaPath = Join-Path $root "database\schema.sql"
if (Test-Path -LiteralPath $blankDb) {
    Remove-Item -LiteralPath $blankDb -Force
}
if (Test-Path -LiteralPath $schemaPath) {
    & $python -c "import sqlite3, pathlib; schema = pathlib.Path(r'$schemaPath').read_text(encoding='utf-8'); db = pathlib.Path(r'$blankDb'); db.parent.mkdir(parents=True, exist_ok=True); conn = sqlite3.connect(db); conn.executescript(schema); conn.commit(); conn.close()"
    if ($LASTEXITCODE -ne 0) {
        throw "Blank SQLite database creation failed."
    }
}

$startBat = Join-Path $packageRoot "Start Field Trial Secretary.bat"
@'
@echo off
cd /d "%~dp0"
echo Starting Field Trial Secretary...
echo.
echo If the browser does not open, go to:
echo http://127.0.0.1:8765/
echo.
"%~dp0FieldTrialSecretary.exe" --host 127.0.0.1 --port 8765 --open-browser
if errorlevel 1 pause
'@ | Set-Content -LiteralPath $startBat -Encoding ASCII

$startVbs = Join-Path $packageRoot "Start Field Trial Secretary.vbs"
@'
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appFolder = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = appFolder
command = """" & appFolder & "\FieldTrialSecretary.exe" & """" & " --host 127.0.0.1 --port 8765 --open-browser"
shell.Run command, 0, False
'@ | Set-Content -LiteralPath $startVbs -Encoding ASCII

$shortcutBat = Join-Path $packageRoot "Create Desktop Shortcut.bat"
@'
@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop=[Environment]::GetFolderPath('Desktop'); $shell=New-Object -ComObject WScript.Shell; $shortcut=$shell.CreateShortcut((Join-Path $desktop 'Field Trial Secretary.lnk')); $shortcut.TargetPath=(Join-Path $env:WINDIR 'System32\wscript.exe'); $shortcut.Arguments='""' + (Join-Path $PWD 'Start Field Trial Secretary.vbs') + '""'; $shortcut.WorkingDirectory=$PWD.Path; $shortcut.IconLocation=(Join-Path $PWD 'app\assets\field-trial-secretary-icon.ico'); $shortcut.Description='Start Field Trial Secretary'; $shortcut.Save()"
echo Desktop shortcut created.
pause
'@ | Set-Content -LiteralPath $shortcutBat -Encoding ASCII

$installBat = Join-Path $packageRoot "Install Field Trial Secretary.bat"
@'
@echo off
cd /d "%~dp0"
echo Field Trial Secretary is portable.
echo.
echo To choose an install location, move or extract this whole folder wherever you want it.
echo This folder is currently:
echo %CD%
echo.
echo Starting Field Trial Secretary...
start "" "%~dp0Start Field Trial Secretary.vbs"
'@ | Set-Content -LiteralPath $installBat -Encoding ASCII

$readme = Join-Path $packageRoot "README-PORTABLE.txt"
@'
Field Trial Secretary - Portable Package
Version: __APP_VERSION__

Fast install on a new computer:
1. Extract the zip into the folder where you want the app to live.
2. Open the "Field Trial Secretary" folder.
3. Double-click "Start Field Trial Secretary.vbs".
4. Optional: double-click "Create Desktop Shortcut.bat" to add a desktop shortcut with the Field Trial Secretary icon.

To run without installing:
1. Double-click "Start Field Trial Secretary.vbs".
2. Your browser should open to http://127.0.0.1:8765/.
3. Click Exit in the app header to stop the app. You can then close the browser tab.

Troubleshooting:
If the quiet launcher does not open, double-click "Start Field Trial Secretary.bat" to see startup messages.

To move to another computer:
Copy this whole "Field Trial Secretary" folder, or use the installer batch file after extracting the zip.

Important files:
- data\field_trial_secretary.sqlite contains the live SQLite data.
- data\blank_field_trial_secretary.sqlite is a blank starter database.
- app\templates contains the official PDF templates.
- backups starts empty in portable packages and will fill as the app creates backups.

The target computer does not need Python installed.
'@.Replace("__APP_VERSION__", $appVersion) | Set-Content -LiteralPath $readme -Encoding ASCII

if ($NoZip) {
    Write-Host ""
    Write-Host "Portable package folder created:"
    Write-Host $packageRoot
    exit 0
}

$zipPath = Join-Path $root ("portable\Field-Trial-Secretary-" + $safeAppVersion + "-portable-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".zip")
$zipCreated = $false
for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
        if (Test-Path -LiteralPath $zipPath) {
            Remove-Item -LiteralPath $zipPath -Force
        }
        Start-Sleep -Seconds $attempt
        Compress-Archive -Path (Join-Path $packageRoot "*") -DestinationPath $zipPath -Force
        $zipCreated = $true
        break
    } catch {
        if ($attempt -eq 3) {
            Write-Warning "The package folder was created, but the zip could not be created because Windows still had a file locked: $($_.Exception.Message)"
        }
    }
}

Write-Host ""
Write-Host "Portable package created:"
Write-Host $packageRoot
if ($zipCreated) {
    Write-Host ""
    Write-Host "Zip created:"
    Write-Host $zipPath
}
