#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EduGest Pro - Lanceur Universel Python (Windows / Mac / Linux)
Double-cliquez sur ce fichier (ou : python lancer.py) pour demarrer l'application.

Connexion : la base MariaDB/MySQL (celle de votre WAMP) doit etre active,
avec la base 'edugest_pro' (creee automatiquement a la premiere initialisation).
"""

import sys
import os
import subprocess
import webbrowser
import time
import threading

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def install_deps():
    print("[INFO] Verification des bibliotheques Python...")
    print(f"[INFO] Interpreteur Python : {sys.executable}")
    subprocess.call([sys.executable, "-m", "pip", "install", "-q",
                     "fastapi", "uvicorn", "pydantic", "pymysql", "python-jose",
                     "python-multipart", "cryptography", "bcrypt"])


def init_database():
    print("\n[INFO] Initialisation de la base de donnees MariaDB...")
    db_script = os.path.join(BASE_DIR, "database.py")
    if os.path.exists(db_script):
        subprocess.call([sys.executable, db_script])
    else:
        print("[ATTENTION] database.py non trouve.")


def open_browser():
    time.sleep(3)
    print("\n" + "=" * 70)
    print(" [SUCCES] OUVERTURE DE VOTRE NAVIGATEUR : http://localhost:8000 ")
    print("=" * 70 + "\n")
    try:
        webbrowser.open("http://localhost:8000")
    except Exception:
        pass


def main():
    print("======================================================================")
    print("  DEMARRAGE DU SERVEUR EDUGEST PRO ENTERPRISE")
    print("======================================================================\n")

    os.chdir(BASE_DIR)

    install_deps()
    init_database()
    threading.Thread(target=open_browser, daemon=True).start()

    print("\n[INFO] Lancement de l'application Web sur le port 8000...")
    try:
        import uvicorn
        uvicorn.run("main:app", host="0.0.0.0", port=8000)
    except ImportError:
        subprocess.call([sys.executable, "-m", "uvicorn", "main:app",
                         "--host", "0.0.0.0", "--port", "8000"])


if __name__ == "__main__":
    main()