@echo off
setlocal
cd /d "%~dp0"

set "NODE_HOME=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "PNPM_JS=%USERPROFILE%\Desktop\app\pnpm-exe\package\dist\pnpm.mjs"
set "PATH=%NODE_HOME%;%PATH%"

if not exist "%NODE_HOME%\node.exe" (
  echo Node.js was not found at:
  echo %NODE_HOME%\node.exe
  echo.
  echo Install Node.js, or run this project from the Codex environment.
  pause
  exit /b 1
)

if not exist "%PNPM_JS%" (
  echo pnpm launcher was not found at:
  echo %PNPM_JS%
  echo.
  echo Ask Codex to recreate pnpm-exe, or install pnpm globally.
  pause
  exit /b 1
)

echo Installing dependencies if needed...
node "%PNPM_JS%" install --ignore-scripts
if errorlevel 1 (
  pause
  exit /b 1
)

echo.
echo Starting PDF Canvas Editor...
echo Open http://127.0.0.1:3000 in your browser.
node "%PNPM_JS%" dev
pause
