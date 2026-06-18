@echo off
setlocal

set "APP_DIR=%~dp0"

if not exist "%APP_DIR%package.json" (
  echo Could not find package.json in:
  echo "%APP_DIR%"
  exit /b 1
)

cd /d "%APP_DIR%"
call npm start

endlocal
