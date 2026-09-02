import json
import os
import bcrypt
import pymysql
from pymysql.cursors import DictCursor

from db import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _connect(database: str):
    conn = pymysql.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASSWORD,
        database=database, cursorclass=DictCursor, autocommit=False, charset="utf8mb4",
    )
    return conn


def get_db():
    """Retourne une connexion dict-like à la base MarieDB edugest_pro."""
    return _connect(DB_NAME)


def ensure_database():
    """Crée la base de données si elle n'existe pas encore."""
    conn = _connect("information_schema")
    cur = conn.cursor()
    cur.execute("SELECT SCHEMA_NAME FROM SCHEMATA WHERE SCHEMA_NAME = %s", (DB_NAME,))
    if not cur.fetchone():
        cur.execute(
            f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        conn.commit()
    conn.close()


def init_db():
    ensure_database()
    conn = _connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS academic_years (
        id INT AUTO_INCREMENT PRIMARY KEY,
        year_label VARCHAR(100) UNIQUE,
        is_current TINYINT(1) DEFAULT 0,
        is_archived TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        `key` VARCHAR(150) PRIMARY KEY,
        `value` TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(190),
        role VARCHAR(64),
        email VARCHAR(150) UNIQUE,
        username VARCHAR(64) UNIQUE,
        password VARCHAR(190),
        status VARCHAR(32) DEFAULT 'Actif'
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(64),
        academic_year VARCHAR(64),
        last_name VARCHAR(190),
        first_name VARCHAR(190),
        gender VARCHAR(8),
        cycle VARCHAR(32),
        class_name VARCHAR(64),
        birth_date VARCHAR(32),
        origin_school VARCHAR(190),
        past_average DOUBLE,
        is_repeating VARCHAR(32),
        father_name VARCHAR(190),
        mother_name VARCHAR(190),
        photo LONGTEXT,
        status VARCHAR(32),
        total_fee DOUBLE,
        balance DOUBLE,
        attendance INT,
        incidents TEXT,
        PRIMARY KEY (id, academic_year)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teachers (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(190),
        subject VARCHAR(190),
        email VARCHAR(190),
        phone VARCHAR(64),
        classes TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS subjects (
        id VARCHAR(64) PRIMARY KEY,
        academic_year VARCHAR(64),
        class_name VARCHAR(64),
        name VARCHAR(190),
        coef INT,
        teacher VARCHAR(190)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(64),
        academic_year VARCHAR(64),
        subject_name VARCHAR(120),
        note1 DOUBLE,
        note2 DOUBLE,
        compo DOUBLE,
        UNIQUE KEY uq_grade (student_id, academic_year, subject_name)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(64) PRIMARY KEY,
        academic_year VARCHAR(64),
        student_id VARCHAR(64),
        student_name VARCHAR(190),
        type VARCHAR(190),
        amount DOUBLE,
        method VARCHAR(64),
        ref VARCHAR(128),
        date VARCHAR(64),
        status VARCHAR(32),
        operator VARCHAR(190)
    );
    """)

    # --- INDEXATION POUR GROS EFFECTIF ---
    def ensure_index(table, col, name):
        cursor.execute(
            "SELECT COUNT(*) AS cnt FROM information_schema.statistics "
            "WHERE table_schema = %s AND table_name = %s AND index_name = %s",
            (DB_NAME, table, name),
        )
        if cursor.fetchone()["cnt"] == 0:
            cursor.execute(f"CREATE INDEX `{name}` ON `{table}` ({col})")

    ensure_index("students", "academic_year", "idx_students_year")
    ensure_index("students", "class_name", "idx_students_class")
    ensure_index("transactions", "academic_year", "idx_tx_year")
    ensure_index("transactions", "student_id", "idx_tx_student")
    ensure_index("grades", "academic_year", "idx_grades_year")
    ensure_index("grades", "student_id", "idx_grades_student")
    ensure_index("subjects", "academic_year", "idx_subjects_year")
    ensure_index("subjects", "class_name", "idx_subjects_class")

    cursor.execute("SELECT COUNT(*) AS cnt FROM academic_years")
    if cursor.fetchone()["cnt"] == 0:
        seed_default_data(conn)
    else:
        update_user_credentials(conn)

    conn.commit()
    conn.close()
    print(f"[OK] Base de donnees MariaDB '{DB_NAME}' initialisee et prete avec authentification !")


def update_user_credentials(conn):
    cursor = conn.cursor()

    cursor.execute("SELECT username, password FROM users")
    existing = {row["username"]: row["password"] for row in cursor.fetchall()}

    creds = [
        ("secretaire", "sec123", "secretaire"),
        ("econome", "eco123", "econome"),
        ("surveillant", "surv123", "surveillant"),
        ("professeur", "prof123", "professeur"),
        ("directeur", "dir123", "direction")
    ]
    for username, password, role in creds:
        stored = existing.get(username, "")
        if stored and not stored.startswith("$2"):
            cursor.execute("UPDATE users SET password=%s WHERE username=%s", (hash_password(password), username))

    admin_accounts = [
        ("USR-06", "Admin Principal KOGO", "admin", "kogoinformatiques@saintexupery.bf", "KOGOinformatiques", "EMMANUEL 7682"),
        ("USR-07", "Admin Principal", "admin", "admin@saintexupery.bf", "admin", "EMMANUEL 76827248")
    ]
    for uid, name, role, email, username, password in admin_accounts:
        stored = existing.get(username, "")
        if stored and not stored.startswith("$2"):
            cursor.execute("UPDATE users SET password=%s WHERE username=%s", (hash_password(password), username))
        elif not stored:
            cursor.execute(
                "INSERT INTO users (id, name, role, email, username, password, status) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) "
                "ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), email=VALUES(email), "
                "password=VALUES(password), status=VALUES(status)",
                (uid, name, role, email, username, hash_password(password), "Actif")
            )


def _placeholders(n):
    return ", ".join(["%s"] * n)


def seed_default_data(conn):
    cursor = conn.cursor()
    print("[OK] Seeding des donnees initiales avec identifiants et mots de passe...")

    cursor.execute("INSERT INTO academic_years (year_label, is_current, is_archived) VALUES ('2025 - 2026', 1, 0)")

    settings_data = [
        ("school_name", "Lycée & Groupe Scolaire Saint-Exupéry"),
        ("motto", "Unité - Progrès - Justice"),
        ("country", "Burkina Faso"),
        ("address", "Avenue de l'Indépendance, 01 BP 1000 Ouagadougou"),
        ("phone", "+226 25 30 00 00"),
        ("email", "direction@saintexupery.bf"),
        ("director", "M. Ousmane COMPAORÉ"),
        ("tuition_fees", json.dumps({"maternelle": 120000, "primaire": 150000, "college": 200000, "lycee": 250000}))
    ]
    cursor.executemany("INSERT INTO settings (`key`, `value`) VALUES (%s, %s)", settings_data)

    users_data = [
        ("USR-01", "M. Ousmane COMPAORÉ", "direction", "direction@saintexupery.bf", "directeur", hash_password("dir123"), "Actif"),
        ("USR-02", "Mme. Aminata KINDA", "secretaire", "secretariat@saintexupery.bf", "secretaire", hash_password("sec123"), "Actif"),
        ("USR-03", "M. Adama SANOU", "econome", "economat@saintexupery.bf", "econome", hash_password("eco123"), "Actif"),
        ("USR-04", "M. Seydou TRAORÉ", "surveillant", "viescolaire@saintexupery.bf", "surveillant", hash_password("surv123"), "Actif"),
        ("USR-05", "Dr. Alassane DIARRA", "professeur", "a.diarra@saintexupery.bf", "professeur", hash_password("prof123"), "Actif"),
        ("USR-06", "Admin Principal KOGO", "admin", "kogoinformatiques@saintexupery.bf", "KOGOinformatiques", hash_password("EMMANUEL 7682"), "Actif"),
        ("USR-07", "Admin Principal", "admin", "admin@saintexupery.bf", "admin", hash_password("EMMANUEL 76827248"), "Actif")
    ]
    cursor.executemany(
        "INSERT INTO users (id, name, role, email, username, password, status) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s) "
        "ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), email=VALUES(email), "
        "password=VALUES(password), status=VALUES(status)",
        users_data
    )

    teachers_data = [
        ("PRF-01", "Dr. Alassane Diarra", "Mathématiques", "a.diarra@saintexupery.bf", "+226 70 20 30 40", json.dumps(["Terminale (Tle)", "3ème", "6ème"])),
        ("PRF-02", "Mme. Chantal Somé", "Français & Littérature", "c.some@saintexupery.bf", "+226 78 50 60 70", json.dumps(["3ème", "6ème", "CM2"])),
        ("PRF-03", "M. Émile Ilboudo", "Physique - Chimie / Sciences", "e.ilboudo@saintexupery.bf", "+226 76 80 90 00", json.dumps(["Terminale (Tle)", "3ème"])),
        ("PRF-04", "Mme. Sylvie Kinda", "Histoire - Géographie / SVT", "s.kinda@saintexupery.bf", "+226 71 10 20 30", json.dumps(["Terminale (Tle)", "3ème", "6ème"])),
        ("PRF-05", "M. Christian Bazié", "Anglais", "c.bazie@saintexupery.bf", "+226 72 40 50 60", json.dumps(["Terminale (Tle)", "3ème", "6ème"]))
    ]
    cursor.executemany("INSERT INTO teachers (id, name, subject, email, phone, classes) VALUES (%s, %s, %s, %s, %s, %s)", teachers_data)

    year = "2025 - 2026"
    students_data = [
        ("MAT-2026-0001", year, "KABORÉ", "Aminata", "F", "lycee", "Terminale (Tle)", "14/05/2008", "Lycée Philippe Zinda", 15.4, "Non", "Paul KABORÉ (+226 70 11 22 33)", "Fatou KABORÉ", "👩🏾‍🎓", "À jour", 250000, 0, 98, json.dumps(["Félicitations du Conseil de classe T1"])),
        ("MAT-2026-0002", year, "SAWADOGO", "Jean-Paul", "M", "college", "3ème", "22/09/2011", "École Sainte-Marie", 12.8, "Non", "Marc SAWADOGO (+226 78 44 55 66)", "Aïcha SAWADOGO", "👨🏾‍🎓", "En retard", 200000, 75000, 86, json.dumps(["Retard 15min le 12/06", "Convocation parentale le 15/06"])),
        ("MAT-2026-0003", year, "OUÉDRAOGO", "Fatilmata", "F", "college", "6ème", "03/11/2014", "École Primaire Centre A", 16.2, "Non", "Moussa OUÉDRAOGO (+226 76 77 88 99)", "Mariam OUÉDRAOGO", "👧🏾", "À jour", 200000, 0, 96, json.dumps([])),
        ("MAT-2026-0004", year, "TRAORÉ", "Ibrahim", "M", "primaire", "CM2", "18/01/2015", "Groupe Scolaire le Petit Prince", 13.5, "Non", "Adama TRAORÉ (+226 71 00 11 22)", "Blandine TRAORÉ", "👦🏾", "Partiel", 150000, 50000, 92, json.dumps(["Passage infirmerie (Maux de tête)"])),
        ("MAT-2026-0005", year, "SANOU", "Blandine", "F", "lycee", "Terminale (Tle)", "30/07/2008", "Lycée International", 17.1, "Non", "Christian SANOU (+226 72 33 44 55)", "Sylvie SANOU", "👩🏾‍🎓", "À jour", 250000, 0, 100, json.dumps(["Prix d'Excellence en Mathématiques"])),
        ("MAT-2026-0006", year, "DIALLO", "Oumarou", "M", "maternelle", "Grande Section (GS)", "10/04/2020", "Maternelle les Anges", 14.0, "Non", "Abdou DIALLO (+226 75 66 77 88)", "Salimata DIALLO", "👶🏾", "À jour", 120000, 0, 95, json.dumps([])),
        ("MAT-2026-0007", year, "COULIBALY", "Aïcha", "F", "college", "3ème", "12/08/2011", "Collège Moderne", 11.2, "Oui (3ème)", "Seydou COULIBALY (+226 70 99 88 77)", "Chantal COULIBALY", "👧🏾", "En retard", 200000, 100000, 88, json.dumps(["Avertissement travail"])),
        ("MAT-2026-0008", year, "BARRY", "Cheick", "M", "primaire", "CP1", "05/02/2019", "Maternelle Saint-Exupéry", 15.0, "Non", "Hamidou BARRY (+226 78 12 34 56)", "Kadiatou BARRY", "👦🏾", "À jour", 150000, 0, 94, json.dumps([])),
        ("MAT-2026-0009", year, "KOGO", "Manuel", "M", "primaire", "CP1", "10/05/2019", "Maternelle Avenir", 16.0, "Non", "M. KOGO (+226 78 90 00 11)", "Mme KOGO", "👦🏾", "Partiel", 50000, 15000, 99, json.dumps(["Inscrit en CP1 - Tarif 50 000 F"])),
        ("MAT-2026-0010", year, "TAPSOBA", "Cédric", "M", "maternelle", "Petite Section (PS)", "12/03/2021", "Crèche les Lutins", 13.0, "Non", "Léonce TAPSOBA (+226 70 31 42 53)", "Bénédicte TAPSOBA", "👶🏾", "À jour", 120000, 0, 97, json.dumps([])),
        ("MAT-2026-0011", year, "ZOUNGRANA", "Estelle", "F", "maternelle", "Petite Section (PS)", "27/08/2021", "Crèche les Anges", 12.5, "Non", "Aristide ZOUNGRANA (+226 76 42 31 20)", "Pélagie ZOUNGRANA", "👧🏾", "À jour", 120000, 0, 96, json.dumps([])),
        ("MAT-2026-0012", year, "ILBOUDO", "Wenceslas", "M", "maternelle", "Moyenne Section (MS)", "14/09/2020", "Maternelle les Lutins", 14.5, "Non", "Émile ILBOUDO (+226 78 65 43 21)", "Joséphine ILBOUDO", "👶🏾", "Partiel", 120000, 30000, 93, json.dumps([])),
        ("MAT-2026-0013", year, "NIKIÉMA", "Grâce", "F", "maternelle", "Moyenne Section (MS)", "02/11/2020", "Maternelle Sainte-Marie", 15.1, "Non", "Boureima NIKIÉMA (+226 71 22 33 44)", "Awa NIKIÉMA", "👧🏾", "À jour", 120000, 0, 98, json.dumps(["Bon comportement en classe"])),
        ("MAT-2026-0014", year, "COMPAORÉ", "Merveille", "F", "maternelle", "Grande Section (GS)", "30/01/2020", "Maternelle le Petit Prince", 15.8, "Non", "Sylvain COMPAORÉ (+226 70 88 99 00)", "Mariette COMPAORÉ", "👧🏾", "À jour", 120000, 0, 99, json.dumps([])),
        ("MAT-2026-0015", year, "SANOGO", "Hamadou", "M", "primaire", "CP2", "18/06/2018", "École Primaire Centre B", 14.2, "Non", "Moussa SANOGO (+226 75 11 22 33)", "Rokiatou SANOGO", "👩🏾‍🎓", "À jour", 150000, 0, 95, json.dumps([])),
        ("MAT-2026-0016", year, "KAFANDO", "Rachida", "F", "primaire", "CP2", "07/12/2018", "École Primaire Centre A", 13.7, "Non", "Adama KAFANDO (+226 76 44 55 66)", "Salimata KAFANDO", "👧🏾", "En retard", 150000, 75000, 90, json.dumps(["Retards répétés matin"])),
        ("MAT-2026-0017", year, "BAMBARA", "Issouf", "M", "primaire", "CE1", "23/04/2017", "École Primaire Sainte-Marie", 12.9, "Non", "Karim BAMBARA (+226 70 66 77 88)", "Aminata BAMBARA", "👦🏾", "À jour", 150000, 0, 94, json.dumps([])),
        ("MAT-2026-0018", year, "YAMÉOGO", "Florence", "F", "primaire", "CE2", "09/09/2016", "École Primaire le Doyen", 16.4, "Non", "Cyrille YAMÉOGO (+226 78 12 23 34)", "Delphine YAMÉOGO", "👩🏾‍🎓", "À jour", 150000, 0, 97, json.dumps(["Félicitations trimestre 1"])),
        ("MAT-2026-0019", year, "ZIDA", "Dieudonné", "M", "primaire", "CM1", "11/02/2016", "Groupe Scolaire le Petit Prince", 15.5, "Non", "Alassane ZIDA (+226 76 35 46 57)", "Martine ZIDA", "👦🏾", "À jour", 150000, 0, 96, json.dumps([])),
        ("MAT-2026-0020", year, "OUATTARA", "Lalèyè", "F", "primaire", "CM2", "19/07/2015", "École Primaire Centre C", 14.8, "Non", "Daouda OUATTARA (+226 70 78 89 90)", "Fatim OUATTARA", "👧🏾", "Partiel", 150000, 25000, 92, json.dumps([])),
        ("MAT-2026-0021", year, "SOMDA", "Maëva", "F", "college", "6ème", "21/10/2014", "CM2 - Groupe Scolaire la Source", 16.7, "Non", "Jean SOMDA (+226 72 66 55 44)", "Clarisse SOMDA", "👧🏾", "À jour", 200000, 0, 96, json.dumps([])),
        ("MAT-2026-0022", year, "BASSOLE", "Roland", "M", "college", "5ème", "16/05/2013", "6ème - Collège Moderne", 13.3, "Non", "Théodore BASSOLE (+226 71 55 66 77)", "Bernadette BASSOLE", "👦🏾", "À jour", 200000, 0, 93, json.dumps([])),
        ("MAT-2026-0023", year, "GNANOU", "Prisca", "F", "college", "4ème", "08/01/2013", "5ème - Collège Sainte-Marie", 14.6, "Non", "Bernard GNANOU (+226 76 22 33 44)", "Solange GNANOU", "👩🏾‍🎓", "À jour", 200000, 0, 95, json.dumps([])),
        ("MAT-2026-0024", year, "DIENDÉRÉ", "Sana", "F", "college", "3ème", "25/11/2011", "4ème - Collège Moderne", 15.9, "Non", "Luc DIENDÉRÉ (+226 70 99 00 11)", "Héloïse DIENDÉRÉ", "👧🏾", "À jour", 200000, 0, 97, json.dumps([])),
        ("MAT-2026-0025", year, "KABRÉ", "Jonathan", "M", "lycee", "Seconde (2nde)", "03/08/2010", "3ème - Collège le Savoir", 15.2, "Non", "Delwende KABRÉ (+226 78 44 55 66)", "Isabelle KABRÉ", "👨🏾‍🎓", "À jour", 250000, 0, 94, json.dumps([])),
        ("MAT-2026-0026", year, "OUERMI", "Naomie", "F", "lycee", "Première (1ère)", "17/03/2009", "2nde - Lycée Philippe Zinda", 16.3, "Non", "Herman OUERMI (+226 71 88 99 00)", "Maimouna OUERMI", "👩🏾‍🎓", "À jour", 250000, 0, 98, json.dumps(["Prix d'excellence en 2nde"]))
    ]
    ph = _placeholders(len(students_data[0]))
    cursor.executemany(
        f"INSERT INTO students (id, academic_year, last_name, first_name, gender, cycle, class_name, "
        f"birth_date, origin_school, past_average, is_repeating, father_name, mother_name, photo, status, "
        f"total_fee, balance, attendance, incidents) VALUES ({ph})",
        students_data
    )

    subjects_data = [
        ("SUB-1", year, "6ème", "Mathématiques", 4, "Dr. Alassane Diarra"),
        ("SUB-2", year, "6ème", "Français", 4, "Mme. Chantal Somé"),
        ("SUB-3", year, "6ème", "Histoire - Géographie", 3, "Mme. Sylvie Kinda"),
        ("SUB-4", year, "6ème", "Anglais", 2, "M. Christian Bazié"),
        ("SUB-5", year, "6ème", "Sciences / SVT", 2, "M. Émile Ilboudo"),
        ("SUB-6", year, "3ème", "Mathématiques", 5, "Dr. Alassane Diarra"),
        ("SUB-7", year, "3ème", "Français & Littérature", 4, "Mme. Chantal Somé"),
        ("SUB-8", year, "3ème", "Physique - Chimie", 3, "M. Émile Ilboudo"),
        ("SUB-9", year, "3ème", "Histoire - Géographie", 3, "Mme. Sylvie Kinda"),
        ("SUB-10", year, "3ème", "Anglais", 2, "M. Christian Bazié"),
        ("SUB-11", year, "Terminale (Tle)", "Mathématiques Spéciales", 6, "Dr. Alassane Diarra"),
        ("SUB-12", year, "Terminale (Tle)", "Physique - Chimie", 5, "M. Émile Ilboudo"),
        ("SUB-13", year, "Terminale (Tle)", "Philosophie", 3, "Mme. Chantal Somé"),
        ("SUB-14", year, "Terminale (Tle)", "Anglais", 2, "M. Christian Bazié"),
        ("SUB-15", year, "Terminale (Tle)", "SVT", 4, "Mme. Sylvie Kinda")
    ]
    ph = _placeholders(len(subjects_data[0]))
    cursor.executemany(
        f"INSERT INTO subjects (id, academic_year, class_name, name, coef, teacher) VALUES ({ph})",
        subjects_data
    )

    tx_data = [
        ("REC-2026-081", year, "MAT-2026-0001", "Aminata KABORÉ (MAT-2026-0001)", "Frais de scolarité - Solde annuel", 150000, "Orange Money", "OM-8910023", "03/07/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-080", year, "MAT-2026-0005", "Blandine SANOU (MAT-2026-0005)", "Frais de scolarité - T1 & T2", 150000, "Moov Money", "MOOV-44512", "02/07/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-079", year, "MAT-2026-0004", "Ibrahim TRAORÉ (MAT-2026-0004)", "Acompte scolarité", 75000, "Espèces", "RECU-ESP-099", "01/07/2026", "Partiel", "Secrétariat Caisse"),
        ("REC-2026-078", year, "MAT-2026-0002", "Jean-Paul SAWADOGO (MAT-2026-0002)", "Frais de scolarité - T1", 75000, "Virement Bancaire", "VIR-BF01-8890", "28/06/2026", "En retard", "M. Adama SANOU (Économe)"),
        ("REC-2026-082", year, "MAT-2026-0009", "Manuel KOGO (MAT-2026-0009)", "1er versement scolarité", 10000, "Espèces", "RECU-KOGO-01", "02/07/2026", "Partiel", "M. Adama SANOU (Économe)"),
        ("REC-2026-083", year, "MAT-2026-0009", "Manuel KOGO (MAT-2026-0009)", "2ème versement scolarité", 20000, "Orange Money", "OM-778811", "03/07/2026", "Partiel", "M. Adama SANOU (Économe)"),
        ("REC-2026-084", year, "MAT-2026-0009", "Manuel KOGO (MAT-2026-0009)", "3ème versement scolarité", 5000, "Espèces", "RECU-KOGO-03", "04/07/2026", "Partiel", "M. Adama SANOU (Économe)"),
        ("REC-2026-085", year, "MAT-2026-0003", "Fatilmata OUÉDRAOGO (MAT-2026-0003)", "Frais de scolarité - Solde annuel", 200000, "Virement Bancaire", "VIR-BF01-8901", "29/06/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-086", year, "MAT-2026-0006", "Oumarou DIALLO (MAT-2026-0006)", "Frais de scolarité - Solde annuel", 120000, "Espèces", "RECU-DIALLO-01", "29/06/2026", "Payé", "Secrétariat Caisse"),
        ("REC-2026-087", year, "MAT-2026-0008", "Cheick BARRY (MAT-2026-0008)", "Frais de scolarité - Solde annuel", 150000, "Orange Money", "OM-8820044", "30/06/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-088", year, "MAT-2026-0007", "Aïcha COULIBALY (MAT-2026-0007)", "Acompte scolarité - T1", 100000, "Espèces", "RECU-COUL-01", "28/06/2026", "Partiel", "M. Adama SANOU (Économe)"),
        ("REC-2026-089", year, "MAT-2026-0010", "Cédric TAPSOBA (MAT-2026-0010)", "Frais de scolarité - Solde annuel", 120000, "Moov Money", "MOOV-22103", "29/06/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-090", year, "MAT-2026-0011", "Estelle ZOUNGRANA (MAT-2026-0011)", "Frais de scolarité - Solde annuel", 120000, "Orange Money", "OM-1188233", "30/06/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-091", year, "MAT-2026-0012", "Wenceslas ILBOUDO (MAT-2026-0012)", "2ème versement scolarité", 60000, "Espèces", "RECU-ILB-02", "01/07/2026", "Partiel", "Secrétariat Caisse"),
        ("REC-2026-092", year, "MAT-2026-0012", "Wenceslas ILBOUDO (MAT-2026-0012)", "1er versement scolarité", 30000, "Orange Money", "OM-9091122", "28/06/2026", "Partiel", "M. Adama SANOU (Économe)"),
        ("REC-2026-093", year, "MAT-2026-0013", "Grâce NIKIÉMA (MAT-2026-0013)", "Frais de scolarité - Solde annuel", 120000, "Espèces", "RECU-NIK-01", "30/06/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-094", year, "MAT-2026-0014", "Merveille COMPAORÉ (MAT-2026-0014)", "Frais de scolarité - Solde annuel", 120000, "Moov Money", "MOOV-55617", "01/07/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-095", year, "MAT-2026-0015", "Hamadou SANOGO (MAT-2026-0015)", "Frais de scolarité - Solde annuel", 150000, "Orange Money", "OM-6655111", "01/07/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-096", year, "MAT-2026-0016", "Rachida KAFANDO (MAT-2026-0016)", "Acompte scolarité - T1", 75000, "Espèces", "RECU-KAF-01", "29/06/2026", "Partiel", "Secrétariat Caisse"),
        ("REC-2026-097", year, "MAT-2026-0017", "Issouf BAMBARA (MAT-2026-0017)", "Frais de scolarité - Solde annuel", 150000, "Espèces", "RECU-BAM-01", "02/07/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-098", year, "MAT-2026-0018", "Florence YAMÉOGO (MAT-2026-0018)", "Frais de scolarité - Solde annuel", 150000, "Virement Bancaire", "VIR-BF01-8989", "02/07/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-099", year, "MAT-2026-0019", "Dieudonné ZIDA (MAT-2026-0019)", "Frais de scolarité - Solde annuel", 150000, "Orange Money", "OM-3322445", "03/07/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-100", year, "MAT-2026-0020", "Lalèyè OUATTARA (MAT-2026-0020)", "Acompte scolarité", 125000, "Moov Money", "MOOV-88999", "30/06/2026", "Partiel", "M. Adama SANOU (Économe)"),
        ("REC-2026-101", year, "MAT-2026-0021", "Maëva SOMDA (MAT-2026-0021)", "Frais de scolarité - Solde annuel", 200000, "Virement Bancaire", "VIR-BF01-8765", "29/06/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-102", year, "MAT-2026-0022", "Roland BASSOLE (MAT-2026-0022)", "Frais de scolarité - Solde annuel", 200000, "Orange Money", "OM-7744221", "01/07/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-103", year, "MAT-2026-0023", "Prisca GNANOU (MAT-2026-0023)", "Frais de scolarité - Solde annuel", 200000, "Espèces", "RECU-GNA-01", "30/06/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-104", year, "MAT-2026-0024", "Sana DIENDÉRÉ (MAT-2026-0024)", "Frais de scolarité - Solde annuel", 200000, "Virement Bancaire", "VIR-BF01-8899", "02/07/2026", "Payé", "Secrétariat Caisse"),
        ("REC-2026-105", year, "MAT-2026-0025", "Jonathan KABRÉ (MAT-2026-0025)", "Frais de scolarité - Solde annuel", 250000, "Orange Money", "OM-9911345", "03/07/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-106", year, "MAT-2026-0026", "Naomie OUERMI (MAT-2026-0026)", "Frais de scolarité - Solde annuel", 250000, "Moov Money", "MOOV-1112233", "01/07/2026", "Payé", "M. Adama SANOU (Économe)")
    ]
    ph = _placeholders(len(tx_data[0]))
    cursor.executemany(
        f"INSERT INTO transactions (id, academic_year, student_id, student_name, type, amount, method, ref, "
        f"date, status, operator) VALUES ({ph})",
        tx_data
    )


if __name__ == "__main__":
    init_db()
