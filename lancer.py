#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EduGest Pro - Lanceur Universel Python (Windows / Mac / Linux)
Double-cliquez sur ce fichier pour démarrer l'application complète !
"""

import sys
import os
import subprocess
import webbrowser
import time
import threading

def install_deps():
    print("[INFO] Vérification et installation des bibliothèques sur votre Python...")
    print(f"[INFO] Interpréteur Python : {sys.executable}")
    subprocess.call([sys.executable, "-m", "pip", "install", "fastapi", "uvicorn", "pydantic"])

def init_database():
    print("\n[INFO] Initialisation de la base de données SQLite...")
    db_script = os.path.join("backend", "database.py")
    if os.path.exists(db_script):
        subprocess.call([sys.executable, db_script])
    else:
        print("[ATTENTION] database.py non trouvé dans backend/.")

def open_browser():
    time.sleep(2)
    print("\n" + "="*70)
    print(" [SUCCÈS] OUVERTURE AUTOMATIQUE DE VOTRE NAVIGATEUR : http://localhost:8000 ")
    print("="*70 + "\n")
    try:
        webbrowser.open("http://localhost:8000")
    except Exception:
        pass

def main():
    print("======================================================================")
    print("  🚀 DÉMARRAGE DU SERVEUR EDUGEST PRO ENTERPRISE")
    print("======================================================================\n")
    
    # Se placer dans le dossier du script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 1. Installer les dépendances
    install_deps()
    
    # 2. Initialiser la BD
    init_database()
    
    # 3. Ouvrir le navigateur
    threading.Thread(target=open_browser, daemon=True).start()
    
    # 4. Démarrer Uvicorn
    print("\n[INFO] Lancement de l'application Web sur le port 8000...")
    try:
        import uvicorn
        uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
    except ImportError:
        print("[INFO] Lancement via sous-processus uvicorn...")
        subprocess.call([sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])

if __name__ == "__main__":
    main()
