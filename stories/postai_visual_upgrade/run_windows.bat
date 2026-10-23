@echo off
setlocal
chcp 65001 >nul
set PYTHONUTF8=1
cd /d "%~dp0"
echo POST-AI Director Edition 2.0
echo No pip installation. No API calls. Original audio is preserved.
echo.
if exist "%~dp0..\.venv\Scripts\python.exe" (
  "%~dp0..\.venv\Scripts\python.exe" "%~dp0studio.py" %*
  goto done
)
if exist "%~dp0.venv\Scripts\python.exe" (
  "%~dp0.venv\Scripts\python.exe" "%~dp0studio.py" %*
  goto done
)
where py >nul 2>nul
if not errorlevel 1 (
  py -3 "%~dp0studio.py" %*
  goto done
)
where python >nul 2>nul
if not errorlevel 1 (
  python "%~dp0studio.py" %*
  goto done
)
echo Python 3.10 or newer was not found. Use the Python installed for the audio kit.
:done
echo.
pause
endlocal
