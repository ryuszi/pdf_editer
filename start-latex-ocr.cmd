@echo off
setlocal
cd /d "%~dp0services\latex_ocr"

if not exist ".venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  python -m venv .venv
  if errorlevel 1 (
    echo Python was not found. Install Python 3.11+ and try again.
    pause
    exit /b 1
  )
)

call ".venv\Scripts\activate.bat"

echo Installing LaTeX OCR dependencies if needed...
python -m pip install -r requirements.txt
if errorlevel 1 (
  pause
  exit /b 1
)

echo.
echo Starting local LaTeX OCR service...
echo Keep this window open while using the formula recognition feature.
python app.py
pause
