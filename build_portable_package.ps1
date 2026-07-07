param(
    [switch]$SkipPyInstallerInstall,
    [switch]$Clean
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

if (-not $SkipPyInstallerInstall) {
    $pyInstallerInstalled = $false
    try {
        & $python -m pip show pyinstaller *> $null
        $pyInstallerInstalled = ($LASTEXITCODE -eq 0)
    } catch {
        $pyInstallerInstalled = $false
    }
    if (-not $pyInstallerInstalled) {
        Write-Host "PyInstaller is not installed in this Python. Installing it now..."
        & $python -m pip install pyinstaller
        if ($LASTEXITCODE -ne 0) {
            throw "PyInstaller install failed."
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
& $python -m PyInstaller --noconfirm --clean --onedir --console --name FieldTrialSecretary server.py
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

foreach ($folder in @("data", "backups")) {
    $source = Join-Path $root $folder
    $destination = Join-Path $packageRoot $folder
    if (Test-Path -LiteralPath $source) {
        Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
    } else {
        New-Item -ItemType Directory -Path $destination | Out-Null
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
FieldTrialSecretary.exe --host 127.0.0.1 --port 8765 --open-browser
pause
'@ | Set-Content -LiteralPath $startBat -Encoding ASCII

$readme = Join-Path $packageRoot "README-PORTABLE.txt"
@'
Field Trial Secretary - Portable Package

To run:
1. Double-click "Start Field Trial Secretary.bat".
2. Your browser should open to http://127.0.0.1:8765/.
3. Leave the black command window open while using the app.
4. Close the command window or press Ctrl+C to stop the app.

To move to another computer:
Copy this whole "Field Trial Secretary" folder.

Important files:
- data\field_trial_secretary.sqlite contains the live SQLite data.
- app\templates contains the official PDF templates.
- backups contains backup files.

The target computer does not need Python installed.
'@ | Set-Content -LiteralPath $readme -Encoding ASCII

$zipPath = Join-Path $root ("portable\Field-Trial-Secretary-portable-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".zip")
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
