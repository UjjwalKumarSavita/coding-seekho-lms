@echo off
cd /d "%~dp0coding-seekho-update"
call npm.cmd start > local-frontend.combined.log 2>&1
