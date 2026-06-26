param(
    [string]$Destination = ""
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if ([string]::IsNullOrWhiteSpace($Destination)) {
    $Destination = Join-Path $root "backups"
}

if (-not (Test-Path -LiteralPath $Destination)) {
    New-Item -ItemType Directory -Path $Destination | Out-Null
}

$zipPath = Join-Path $Destination "Field-Trial-Secretary-program-$timestamp.zip"
$staging = Join-Path ([System.IO.Path]::GetTempPath()) "FieldTrialSecretaryBackup-$timestamp"

if (Test-Path -LiteralPath $staging) {
    Remove-Item -LiteralPath $staging -Recurse -Force
}

New-Item -ItemType Directory -Path $staging | Out-Null

$excludeNames = @(".git", "backups")
Get-ChildItem -LiteralPath $root -Force | Where-Object {
    $excludeNames -notcontains $_.Name
} | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $staging -Recurse -Force
}

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force
Remove-Item -LiteralPath $staging -Recurse -Force

Write-Host "Program backup created:"
Write-Host $zipPath
Write-Host ""
Write-Host "SQLite data is included if the data folder exists."
Write-Host "For extra portability, also use Admin Test > Backup & Transfer > Export Data Backup in the app."
