@echo off
setlocal EnableExtensions EnableDelayedExpansion

title CoIntern Launcher (Windows)

set "PORT=3001"
set "APP_URL=http://localhost:%PORT%/dashboard"
set "CHROME_EXE=chrome"
set "USER_DATA_DIR=%TEMP%\cointern_pwa"
set "ROOT=%~dp0\..\.."

cd /d "%ROOT%"

rem --- Resolve Chrome path (PATH often doesn't include it) ---
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
  set "CHROME_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

rem --- Kill anything currently listening on PORT (sleep/crash leftovers) ---
for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess"`) do set "PID=%%p"
if defined PID (
  taskkill /PID !PID! /F >nul 2>&1
  set "PID="
)

rem --- Ensure production build exists (and rebuild if sources newer) ---
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root = '%ROOT%';" ^
  "$buildId = Join-Path $root '.next\BUILD_ID';" ^
  "if (-not (Test-Path $buildId)) { exit 2 }" ^
  "$buildTime = (Get-Item $buildId).LastWriteTimeUtc;" ^
  "$paths = @((Join-Path $root 'src'), (Join-Path $root 'package.json'), (Join-Path $root 'next.config.ts'));" ^
  "$newer = $false;" ^
  "foreach($p in $paths) { if (Test-Path $p) { if ((Get-Item $p).LastWriteTimeUtc -gt $buildTime) { $newer = $true } } }" ^
  "if ($newer) { exit 3 } else { exit 0 }"
set "BUILD_CHECK=%ERRORLEVEL%"

if %BUILD_CHECK%==2 (
  call npm run build
  if not %ERRORLEVEL%==0 exit /b %ERRORLEVEL%
) else if %BUILD_CHECK%==3 (
  call npm run build
  if not %ERRORLEVEL%==0 exit /b %ERRORLEVEL%
)

rem --- Start production server in background ---
start "" /b cmd /c "npm run start"

rem --- Wait until server responds (up to ~30s) ---
set "READY=0"
for /l %%i in (1,1,30) do (
  powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 '%APP_URL%') | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
  if !ERRORLEVEL!==0 (
    set "READY=1"
    goto :OPEN_APP
  )
  timeout /t 1 /nobreak >nul
)

echo Server did not become ready on %APP_URL% within 30 seconds.
goto :CLEANUP

:OPEN_APP
rem --- Open Chrome as a native-style app window and wait for it to close ---
start /wait "" "%CHROME_EXE%" --app=%APP_URL% --user-data-dir="%USER_DATA_DIR%" --new-window

:CLEANUP
rem --- Kill listener on PORT (stop server) ---
for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess"`) do set "PID=%%p"
if defined PID (
  taskkill /PID !PID! /F >nul 2>&1
)

exit /b 0

