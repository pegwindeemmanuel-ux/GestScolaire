import sqlite3
import json
import os

DB_PATH = "edugest_pro.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Table des Années Scolaires
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS academic_years (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year_label TEXT UNIQUE,
        is_current BOOLEAN DEFAULT 0,
        is_archived BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Table Paramètres
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
    """)

    # Table Utilisateurs avec USERNAME et MOT DE PASSE pour authentification réelle
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        role TEXT,
        email TEXT UNIQUE,
        username TEXT UNIQUE,
        password TEXT,
        status TEXT DEFAULT 'Actif'
    );
    """)

    # Tenter d'ajouter les colonnes username et password sur une base existante si besoin
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN username TEXT;")
        cursor.execute("ALTER TABLE users ADD COLUMN password TEXT;")
    except Exception:
        pass

    # Table Élèves
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id TEXT,
        academic_year TEXT,
        last_name TEXT,
        first_name TEXT,
        gender TEXT,
        cycle TEXT,
        class_name TEXT,
        birth_date TEXT,
        origin_school TEXT,
        past_average REAL,
        is_repeating TEXT,
        father_name TEXT,
        mother_name TEXT,
        photo TEXT,
        status TEXT,
        total_fee REAL,
        balance REAL,
        attendance INTEGER,
        incidents TEXT,
        PRIMARY KEY (id, academic_year)
    );
    """)

    # Table Enseignants
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        name TEXT,
        subject TEXT,
        email TEXT,
        phone TEXT,
        classes TEXT
    );
    """)

    # Table Matières & Coefficients
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        academic_year TEXT,
        class_name TEXT,
        name TEXT,
        coef INTEGER,
        teacher TEXT
    );
    """)

    # Table Notes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT,
        academic_year TEXT,
        subject_name TEXT,
        note1 REAL,
        note2 REAL,
        compo REAL,
        UNIQUE(student_id, academic_year, subject_name)
    );
    """)

    # Table Transactions / Reçus
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        academic_year TEXT,
        student_id TEXT,
        student_name TEXT,
        type TEXT,
        amount REAL,
        method TEXT,
        ref TEXT,
        date TEXT,
        status TEXT,
        operator TEXT
    );
    """)

    cursor.execute("SELECT COUNT(*) as cnt FROM academic_years")
    if cursor.fetchone()["cnt"] == 0:
        seed_default_data(conn)
    else:
        # Mettre à jour les comptes existants avec identifiant et mot de passe si non renseignés
        update_user_credentials(conn)

    conn.commit()
    conn.close()
    print("✅ Base de données SQLite 'edugest_pro.db' initialisée et prête avec authentification !")

def update_user_credentials(conn):
    cursor = conn.cursor()
    creds = [
        ("secretaire", "sec123", "secretaire"),
        ("econome", "eco123", "econome"),
        ("surveillant", "surv123", "surveillant"),
        ("professeur", "prof123", "professeur"),
        ("directeur", "dir123", "direction")
    ]
    for username, password, role in creds:
        cursor.execute("UPDATE users SET username=?, password=? WHERE role=? AND username NOT IN ('KOGOinformatiques', 'admin')", (username, password, role))
    
    # Configuration garantie des deux comptes administrateurs demandés par le binôme
    cursor.execute("INSERT OR REPLACE INTO users (id, name, role, email, username, password, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                   ("USR-06", "Admin Principal KOGO", "admin", "kogoinformatiques@saintexupery.bf", "KOGOinformatiques", "EMMANUEL 7682", "Actif"))
    cursor.execute("INSERT OR REPLACE INTO users (id, name, role, email, username, password, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                   ("USR-07", "Admin Principal", "admin", "admin@saintexupery.bf", "admin", "EMMANUEL 76827248", "Actif"))

def seed_default_data(conn):
    cursor = conn.cursor()
    print("🌱 Seeding des données initiales avec identifiants et mots de passe...")
    
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
    cursor.executemany("INSERT INTO settings (key, value) VALUES (?, ?)", settings_data)

    # Utilisateurs avec username et password
    users_data = [
        ("USR-01", "M. Ousmane COMPAORÉ", "direction", "direction@saintexupery.bf", "directeur", "dir123", "Actif"),
        ("USR-02", "Mme. Aminata KINDA", "secretaire", "secretariat@saintexupery.bf", "secretaire", "sec123", "Actif"),
        ("USR-03", "M. Adama SANOU", "econome", "economat@saintexupery.bf", "econome", "eco123", "Actif"),
        ("USR-04", "M. Seydou TRAORÉ", "surveillant", "viescolaire@saintexupery.bf", "surveillant", "surv123", "Actif"),
        ("USR-05", "Dr. Alassane DIARRA", "professeur", "a.diarra@saintexupery.bf", "professeur", "prof123", "Actif"),
        ("USR-06", "Admin Principal KOGO", "admin", "kogoinformatiques@saintexupery.bf", "KOGOinformatiques", "EMMANUEL 7682", "Actif"),
        ("USR-07", "Admin Principal", "admin", "admin@saintexupery.bf", "admin", "EMMANUEL 76827248", "Actif")
    ]
    cursor.executemany("INSERT OR REPLACE INTO users (id, name, role, email, username, password, status) VALUES (?, ?, ?, ?, ?, ?, ?)", users_data)

    teachers_data = [
        ("PRF-01", "Dr. Alassane Diarra", "Mathématiques", "a.diarra@saintexupery.bf", "+226 70 20 30 40", json.dumps(["Terminale (Tle)", "3ème", "6ème"])),
        ("PRF-02", "Mme. Chantal Somé", "Français & Littérature", "c.some@saintexupery.bf", "+226 78 50 60 70", json.dumps(["3ème", "6ème", "CM2"])),
        ("PRF-03", "M. Émile Ilboudo", "Physique - Chimie / Sciences", "e.ilboudo@saintexupery.bf", "+226 76 80 90 00", json.dumps(["Terminale (Tle)", "3ème"])),
        ("PRF-04", "Mme. Sylvie Kinda", "Histoire - Géographie / SVT", "s.kinda@saintexupery.bf", "+226 71 10 20 30", json.dumps(["Terminale (Tle)", "3ème", "6ème"])),
        ("PRF-05", "M. Christian Bazié", "Anglais", "c.bazie@saintexupery.bf", "+226 72 40 50 60", json.dumps(["Terminale (Tle)", "3ème", "6ème"]))
    ]
    cursor.executemany("INSERT INTO teachers VALUES (?, ?, ?, ?, ?, ?)", teachers_data)

    year = "2025 - 2026"
    students_data = [
        ("MAT-2026-0001", year, "KABORÉ", "Aminata", "F", "lycee", "Terminale (Tle)", "14/05/2008", "Lycée Philippe Zinda", 15.4, "Non", "Paul KABORÉ (+226 70 11 22 33)", "Fatou KABORÉ", "👩🏾‍🎓", "À jour", 250000, 0, 98, json.dumps(["Félicitations du Conseil de classe T1"])),
        ("MAT-2026-0002", year, "SAWADOGO", "Jean-Paul", "M", "college", "3ème", "22/09/2011", "École Sainte-Marie", 12.8, "Non", "Marc SAWADOGO (+226 78 44 55 66)", "Aïcha SAWADOGO", "👨🏾‍🎓", "En retard", 200000, 75000, 86, json.dumps(["Retard 15min le 12/06", "Convocation parentale le 15/06"])),
        ("MAT-2026-0003", year, "OUÉDRAOGO", "Fatilmata", "F", "college", "6ème", "03/11/2014", "École Primaire Centre A", 16.2, "Non", "Moussa OUÉDRAOGO (+226 76 77 88 99)", "Mariam OUÉDRAOGO", "👧🏾", "À jour", 200000, 0, 96, json.dumps([])),
        ("MAT-2026-0004", year, "TRAORÉ", "Ibrahim", "M", "primaire", "CM2", "18/01/2015", "Groupe Scolaire le Petit Prince", 13.5, "Non", "Adama TRAORÉ (+226 71 00 11 22)", "Blandine TRAORÉ", "👦🏾", "Partiel", 150000, 50000, 92, json.dumps(["Passage infirmerie (Maux de tête)"])),
        ("MAT-2026-0005", year, "SANOU", "Blandine", "F", "lycee", "Terminale (Tle)", "30/07/2008", "Lycée International", 17.1, "Non", "Christian SANOU (+226 72 33 44 55)", "Sylvie SANOU", "👩🏾‍🎓", "À jour", 250000, 0, 100, json.dumps(["Prix d'Excellence en Mathématiques"])),
        ("MAT-2026-0006", year, "DIALLO", "Oumarou", "M", "maternelle", "Grande Section (GS)", "10/04/2020", "Maternelle les Anges", 14.0, "Non", "Abdou DIALLO (+226 75 66 77 88)", "Salimata DIALLO", "👶🏾", "À jour", 120000, 0, 95, json.dumps([])),
        ("MAT-2026-0007", year, "COULIBALY", "Aïcha", "F", "college", "3ème", "12/08/2011", "Collège Moderne", 11.2, "Oui (3ème)", "Seydou COULIBALY (+226 70 99 88 77)", "Chantal COULIBALY", "👧🏾", "En retard", 200000, 100000, 88, json.dumps(["Avertissement travail"])),
        ("MAT-2026-0008", year, "BARRY", "Cheick", "M", "primaire", "CP1", "05/02/2019", "Maternelle Saint-Exupéry", 15.0, "Non", "Hamidou BARRY (+226 78 12 34 56)", "Kadiatou BARRY", "👦🏾", "À jour", 150000, 0, 94, json.dumps([]))
    ]
    cursor.executemany("INSERT INTO students VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", students_data)

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
    cursor.executemany("INSERT INTO subjects VALUES (?, ?, ?, ?, ?, ?)", subjects_data)

    tx_data = [
        ("REC-2026-081", year, "MAT-2026-0001", "Aminata KABORÉ (MAT-2026-0001)", "Frais de scolarité - Solde annuel", 150000, "Orange Money", "OM-8910023", "03/07/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-080", year, "MAT-2026-0005", "Blandine SANOU (MAT-2026-0005)", "Frais de scolarité - T1 & T2", 150000, "Moov Money", "MOOV-44512", "02/07/2026", "Payé", "M. Adama SANOU (Économe)"),
        ("REC-2026-079", year, "MAT-2026-0004", "Ibrahim TRAORÉ (MAT-2026-0004)", "Acompte scolarité", 75000, "Espèces", "RECU-ESP-099", "01/07/2026", "Partiel", "Secrétariat Caisse"),
        ("REC-2026-078", year, "MAT-2026-0002", "Jean-Paul SAWADOGO (MAT-2026-0002)", "Frais de scolarité - T1", 75000, "Virement Bancaire", "VIR-BF01-8890", "28/06/2026", "En retard", "M. Adama SANOU (Économe)")
    ]
    cursor.executemany("INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", tx_data)

if __name__ == "__main__":
    init_db()
