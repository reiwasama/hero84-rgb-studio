param([switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
$studioFile = Join-Path $PSScriptRoot 'HERO84-RGB-Studio.html'
$studioProfile = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '.hero84-browser-profile'))
$studioCandidates = @('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe',(Join-Path $env:LOCALAPPDATA 'Google/Chrome/Application/chrome.exe'))
$studioBrowser = $studioCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (!$studioBrowser) { throw 'Chrome or Edge was not found.' }
if (!(Test-Path -LiteralPath $studioFile)) { throw 'Keep HERO84-RGB-Studio.html in the same folder.' }
$studioUrl = ([uri]$studioFile).AbsoluteUri
$studioArgs = @('--user-data-dir="' + $studioProfile + '"','--app="' + $studioUrl + '"','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--no-first-run','--no-default-browser-check')
if ($CheckOnly) { Write-Output $studioBrowser; Write-Output $studioArgs; exit }
# This is the interactive app window requested by the user.
Start-Process -FilePath $studioBrowser -ArgumentList $studioArgs -WindowStyle Normal
