@echo off
cd /d "%~dp0"
echo Starting Field Trial Secretary from the source folder...
echo.
echo If the browser does not open, go to:
echo http://127.0.0.1:8765/
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_field_trial_secretary.ps1"
if errorlevel 1 pause
