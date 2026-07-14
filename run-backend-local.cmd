@echo off
cd /d "%~dp0backend\lms-backend"
call mvnw.cmd "-Dmaven.repo.local=target\m2-repository" spring-boot:run > target\local-backend.combined.log 2>&1
