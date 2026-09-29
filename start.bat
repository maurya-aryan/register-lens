@echo off
title Register Lens
cd /d "%~dp0backend"
start "" http://localhost:8000
"%~dp0.venv\Scripts\python.exe" -m uvicorn app.main:app --port 8000
