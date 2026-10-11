@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0HERO84-Baslat.ps1"
if errorlevel 1 pause
