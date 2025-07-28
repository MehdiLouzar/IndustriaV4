@echo off
REM Batch helper to run initDB.sql using PowerShell even when script execution is restricted
powershell -ExecutionPolicy Bypass -File "%~dp0run_initdb.ps1" %*
