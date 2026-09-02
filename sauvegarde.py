"""EduGest Pro - Sauvegarde automatique de la base MariaDB (en pur Python).

Exporte toutes les tables de la base vers un fichier SQL horodaté dans le
dossier 'sauvegardes' et purge les sauvegardes les plus anciennes.

Utilisation :
    python sauvegarde.py
"""
import os
import glob
import datetime
import pymysql
from pymysql.cursors import DictCursor

DB_HOST = "127.0.0.1"
DB_PORT = 3306
DB_USER = "root"
DB_PASS = ""
DB_NAME = "edugest_pro"
KEEP = 15  # nombre de sauvegardes à conserver

TABLES = [
    "academic_years",
    "settings",
    "users",
    "students",
    "teachers",
    "subjects",
    "grades",
    "transactions",
]


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dest = os.path.join(base_dir, "sauvegardes")
    os.makedirs(dest, exist_ok=True)

    stamp = datetime.datetime.now().strftime("%Y-%m-%d_%Hh%M")
    fichier = os.path.join(dest, f"sauvegarde_{stamp}.sql")

    conn = pymysql.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS,
        database=DB_NAME, cursorclass=DictCursor, charset="utf8mb4",
    )
    cur = conn.cursor()

    lignes = []
    lignes.append(f"-- EduGest Pro - Sauvegarde {stamp}\n")
    lignes.append(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n")
    lignes.append(f"USE `{DB_NAME}`;\n\n")

    for table in TABLES:
        lignes.append(f"-- Table: {table}\n")
        cur.execute(f"SELECT * FROM `{table}`")
        rows = cur.fetchall()
        for row in rows:
            cols = ", ".join(f"`{k}`" for k in row.keys())
            vals = ", ".join(_sql_literal(v) for v in row.values())
            lignes.append(f"INSERT INTO `{table}` ({cols}) VALUES ({vals});\n")
        lignes.append("\n")

    with open(fichier, "w", encoding="utf-8") as f:
        f.writelines(lignes)

    conn.close()

    taille = os.path.getsize(fichier)
    print(f"[SAUVEGARDE] REUSSIE : {fichier} ({taille} octets)")

    _purge(dest)


def _sql_literal(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("\\", "\\\\").replace("'", "''")
    return f"'{s}'"


def _purge(dest):
    fichiers = sorted(glob.glob(os.path.join(dest, "sauvegarde_*.sql")))
    while len(fichiers) > KEEP:
        ancien = fichiers.pop(0)
        os.remove(ancien)
        print(f"[SAUVEGARDE] Ancienne sauvegarde supprimee : {ancien}")


if __name__ == "__main__":
    main()