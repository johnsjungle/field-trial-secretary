$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonCandidates = @(
    "C:\Users\johns\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe",
    "C:\Users\johns\AppData\Local\Programs\Python\Python314\python.exe",
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
    throw "Python was not found. Install Python or update this launcher with the Python path."
}

Set-Location -LiteralPath $root
Write-Host "Starting Field Trial Secretary with SQLite storage..."
Write-Host "Open this address in your browser:"
Write-Host "http://127.0.0.1:8765/"
Write-Host ""
& $python "$root\server.py" --host 127.0.0.1 --port 8765 --open-browser
