@echo off
cd /d "%~dp0"

echo =========================================================
echo Demarrage du serveur EduGest Pro Enterprise
echo =========================================================

echo.
echo 1. Installation des dependances Python (fastapi, uvicorn, pydantic)...
if exist "backend\requirements.txt" (
    python -m pip install -r backend\requirements.txt
) else if exist "requirements.txt" (
    python -m pip install -r requirements.txt
) else (
    python -m pip install fastapi uvicorn pydantic
)

echo.
echo 2. Initialisation de la base de donnees SQLite...
if exist "backend\database.py" (
    python backend/database.py
) else if exist "database.py" (
    python database.py
) else (
    echo [ERREUR] Fichier database.py introuvable !
)

echo.
echo 3. Demarrage du serveur sur http://localhost:8000 ...
echo Votre navigateur va s'ouvrir automatiquement.
echo ATTENTION : Ne fermez pas cette fenetre !
echo =========================================================
echo.

start "" "http://localhost:8000"

if exist "backend\main.py" (
    python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
) else if exist "main.py" (
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) else (
    echo [ERREUR CRITIQUE] Fichier main.py introuvable !
    pause
)

pause
