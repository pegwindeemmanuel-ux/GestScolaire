import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Body, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import webbrowser
import threading
import time
import uuid
import hashlib
from datetime import datetime, timedelta
from jose import JWTError, jwt
from database import get_db, init_db, verify_password
from licence import verifier_licence, DEV_PUBLIC_KEY_B64

# Clé JWT : générée aléatoirement au premier démarrage et stockée dans un fichier
# secret (cle_jwt.sec) NON versionné. Remplace l'ancienne clé codée en dur.
_JWT_KEY_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cle_jwt.sec")

def _load_or_create_jwt_secret():
    try:
        if os.path.exists(_JWT_KEY_FILE):
            with open(_JWT_KEY_FILE, "r", encoding="utf-8") as f:
                key = f.read().strip()
            if len(key) >= 32:
                return key
        # Génère une nouvelle clé aléatoire et la persiste
        import secrets
        key = secrets.token_hex(32)
        with open(_JWT_KEY_FILE, "w", encoding="utf-8") as f:
            f.write(key)
        return key
    except Exception:
        # Dernier filet si le fichier ne peut être créé : clé fixe (non idéale).
        return "edugest-pro-reserve-change-in-production-2026"

SECRET_KEY = _load_or_create_jwt_secret()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

security = HTTPBearer(auto_error=False)

app = FastAPI(
    title="EduGest Pro Enterprise API",
    description="Backend officiel pour la gestion scolaire multi-années (Maternelle à Lycée)",
    version="10.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "role": role, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Token d'authentification requis.")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Token invalide.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré.")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, role, email, username, status FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable.")
    return dict(user)


def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
    return user

# MIDDLEWARE ANTI-CACHE
@app.middleware("http")
async def add_no_cache_header(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.endswith((".html", ".js", ".css")) or request.url.path == "/":
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


# MIDDLEWARE GARDE-FOU DE LICENCE : bloque les ecritures si la licence n'est pas valide.
ALLOWED_WITHOUT_LICENCE = ("/api/license-info", "/api/license-install", "/api/login")
@app.middleware("http")
async def licence_guard(request: Request, call_next):
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        path = request.url.path
        # On laisse passer le login, l'info licence et l'installation de licence
        if not path.startswith(ALLOWED_WITHOUT_LICENCE):
            etat = verifier_licence_installee()
            if etat.get("status") != "ok":
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=402,
                    content={
                        "detail": "Licence invalide ou absente. Contactez l'administrateur (KOGO Informatiques) "
                                  f"pour installer la licence. {etat.get('message','')}"
                    },
                )
    return await call_next(request)

@app.on_event("startup")
def startup_event():
    init_db()
    _licence_checks = verifier_licence_installee()
    if _licence_checks.get("status") != "ok":
        # On n'empeche pas le serveur de demarrer, mais on marque la licence
        # clairement comme non valide pour l'affichage et le blocage des exports.
        _LICENCE_OK[0] = False
    else:
        _LICENCE_OK[0] = True

# Statut licence en memoire (mis a jour au demarrage et a chaque install)
_LICENCE_OK = [True]

# --- MOTEUR DE LICENCE & PROTECTION ANTI-COPIE (HARDWARE FINGERPRINT, SIGNATURE) ---
def get_machine_fingerprint():
    """Génère un identifiant unique lié au matériel de la machine serveur (MAC address / Node UUID)."""
    mac = uuid.getnode()
    raw_id = f"EDUGEST-SERVER-{mac}"
    short_hash = hashlib.sha256(raw_id.encode()).hexdigest()[:12].upper()
    return f"{short_hash[:4]}-{short_hash[4:8]}-{short_hash[8:12]}"


def _get_licence_token():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE `key` = 'licence_jeton'")
    row = cursor.fetchone()
    conn.close()
    return (row["value"] if row and row["value"] else "").strip()


def verifier_licence_installee():
    """Verifie la licence actuellement installee et renvoie un état complet."""
    token = _get_licence_token()
    machine_id = get_machine_fingerprint()
    if not token:
        return {
            "status": "aucune",
            "machine_id": machine_id,
            "message": "Aucune licence installee. Le logiciel est en mode non verifie.",
            "public_key_ok": not DEV_PUBLIC_KEY_B64.startswith("REMPLACEZ"),
        }
    return verifier_licence(token, machine_id)


def _exiger_licence_valide(user: dict = Depends(get_current_user)):
    """Bloque toute écriture métier si la licence est invalide, expirée ou absente."""
    etat = verifier_licence_installee()
    if etat.get("status") != "ok":
        msg = etat.get("message", "Licence invalide.")
        raise HTTPException(
            status_code=402,
            detail=f"Licence non valide : {msg} Contactez votre administrateur pour installer une licence.",
        )
    return user


@app.get("/api/license-info")
def get_license_info():
    """Retourne l'état VERIFIE de la licence et l'ID matériel de la machine."""
    etat = verifier_licence_installee()
    machine_id = get_machine_fingerprint()

    st = etat.get("status", "invalide")
    if st == "ok":
        status_text = "🟢 LICENCE VALIDE"
        if etat.get("period") == "perpetual":
            status_text += " — PERPÉTUELLE"
            expire_display = "Aucune (perpétuelle)"
        else:
            expire_display = etat.get("expires_on", "")
            status_text += f" (EXP: {expire_display})"
        color = "ok"
    elif st == "aucune":
        status_text = "🟠 AUCUNE LICENCE — mode non verifie"
        expire_display = "—"
        color = "none"
    elif st in ("machine_invalide", "invalide"):
        status_text = "🔴 LICENCE INVALIDE / INCOMPATIBLE"
        expire_display = "—"
        color = "invalid"
    elif st == "expiree":
        status_text = f"🔴 LICENCE EXPIRÉE le {etat.get('expires_on','')}"
        expire_display = etat.get("expires_on", "")
        color = "expired"
    else:
        status_text = "🔴 LICENCE ABSENTE DU SERVEUR"
        expire_display = "—"
        color = "missing"

    return {
        "status": "success",
        "license_state": st,
        "license_color": color,
        "machine_id": machine_id,
        "license_status": status_text,
        "license_period": etat.get("period", ""),
        "expires_on": etat.get("expires_on", ""),
        "licensed_to": "Lycée & Groupe Scolaire Saint-Exupéry",
        "developer": "KOGO Informatiques & Binôme",
        "protection": "Verrouillage matériel & licences signées (Anti-Piratage)",
        "public_key_ok": not DEV_PUBLIC_KEY_B64.startswith("REMPLACEZ"),
    }


class LicenseInstall(BaseModel):
    token: str


@app.post("/api/license-install")
def install_license(data: LicenseInstall, user: dict = Depends(require_admin)):
    """Installe (ou remplace) le jeton de licence de l'établissement (admin uniquement)."""
    token = data.token.strip()
    machine_id = get_machine_fingerprint()
    verif = verifier_licence(token, machine_id)
    if verif.get("status") != "ok":
        raise HTTPException(status_code=400, detail=verif.get("message", "Licence invalide."))
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO settings (`key`, value) VALUES ('licence_jeton', %s) "
        "ON DUPLICATE KEY UPDATE value = VALUES(value)",
        (token,),
    )
    conn.commit()
    conn.close()
    _LICENCE_OK[0] = True
    return {"status": "success", "message": "Licence installée et vérifiée.", "info": verif}

# --- MODÈLES DE DONNÉES PYDANTIC ---
class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    id: str
    name: str
    role: str
    email: str
    username: str
    password: str
    status: str

class StudentCreate(BaseModel):
    model_config = {"populate_by_name": True}
    id: str
    lastName: str = Body(..., alias="lastName")
    firstName: str = Body(..., alias="firstName")
    gender: str
    cycle: str
    class_name: str = Body(..., alias="class")
    birthDate: str = Body(..., alias="birthDate")
    originSchool: str = Body(..., alias="originSchool")
    pastAverage: float = Body(..., alias="pastAverage")
    isRepeating: str = Body(..., alias="isRepeating")
    fatherName: str = Body(..., alias="fatherName")
    motherName: str = Body(..., alias="motherName")
    photo: str
    totalFee: float = Body(..., alias="totalFee")

class PaymentCreate(BaseModel):
    student: str
    type: str
    amount: float
    method: str
    ref: str
    status: str
    operator: str

class SubjectCreate(BaseModel):
    class_name: str
    name: str
    coef: int
    teacher: str

class GradesSaveRequest(BaseModel):
    class_name: str
    subject_name: str
    grades: Dict[str, Dict[str, Any]]

class PromoteYearRequest(BaseModel):
    new_year_label: str

class SettingsUpdateRequest(BaseModel):
    settings: Dict[str, Any]

# --- ROUTES API ---

@app.post("/api/login")
def login_user(req: LoginRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE (username = %s OR email = %s) AND status = 'Actif'", (req.username, req.username))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=401, detail="Identifiant ou mot de passe incorrect.")
    user = dict(row)
    if not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Identifiant ou mot de passe incorrect.")
    token = create_access_token(user["id"], user["role"])
    user_safe = {k: v for k, v in user.items() if k != "password"}
    return {"status": "success", "token": token, "user": user_safe}

@app.post("/api/users")
def add_user(u: UserCreate, user: dict = Depends(_exiger_licence_valide), _admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        from database import hash_password
        cursor.execute("INSERT INTO users (id, name, role, email, username, password, status) VALUES (%s, %s, %s, %s, %s, %s, %s)", (u.id, u.name, u.role, u.email, u.username, hash_password(u.password), u.status))
        conn.commit()
    except Exception:
        conn.close()
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur ou cet email existe déjà.")
    conn.close()
    return {"status": "success"}


@app.delete("/api/users/{user_id}")
def delete_user(user_id: str, user: dict = Depends(_exiger_licence_valide), _admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/api/settings")
def update_settings(req: SettingsUpdateRequest, user: dict = Depends(_exiger_licence_valide), _admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()
    for key, value in req.settings.items():
        val_str = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
        cursor.execute("INSERT INTO settings (`key`, `value`) VALUES (%s, %s) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)", (key, val_str))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/api/state")
def get_full_state(year: Optional[str] = None, user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    if not year:
        cursor.execute("SELECT year_label FROM academic_years WHERE is_current = 1 LIMIT 1")
        row = cursor.fetchone()
        year = row["year_label"] if row else "2025 - 2026"

    cursor.execute("SELECT * FROM settings")
    settings_rows = cursor.fetchall()
    school = {row["key"]: row["value"] for row in settings_rows}
    if "school_name" in school and "name" not in school:
        school["name"] = school["school_name"]
    elif "name" in school and "school_name" not in school:
        school["school_name"] = school["name"]
    if "name" not in school:
        school["name"] = "Lycée & Groupe Scolaire Saint-Exupéry"
        school["school_name"] = "Lycée & Groupe Scolaire Saint-Exupéry"
    if "motto" not in school:
        school["motto"] = "Unité - Progrès - Justice"
    if "phone" not in school:
        school["phone"] = "+226 25 30 00 00"
    if "director" not in school:
        school["director"] = "M. Ousmane COMPAORÉ"
    if "tuition_fees" in school:
        try: school["tuitionFees"] = json.loads(school["tuition_fees"])
        except: school["tuitionFees"] = {"maternelle": 120000, "primaire": 150000, "college": 200000, "lycee": 250000}
    school["year"] = year

    cursor.execute("SELECT * FROM academic_years ORDER BY id DESC")
    years = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT id, name, role, email, username, status FROM users")
    users = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT * FROM teachers")
    teachers = []
    for row in cursor.fetchall():
        t = dict(row)
        try: t["classes"] = json.loads(t["classes"]) if t["classes"] else []
        except: t["classes"] = []
        teachers.append(t)

    cursor.execute("SELECT * FROM students WHERE academic_year = %s", (year,))
    students = []
    for row in cursor.fetchall():
        r = dict(row)
        s = {}
        s["id"] = r["id"]
        s["lastName"] = r.get("last_name") or r.get("lastName") or "Inconnu"
        s["firstName"] = r.get("first_name") or r.get("firstName") or ""
        s["last_name"] = s["lastName"]
        s["first_name"] = s["firstName"]
        s["gender"] = r.get("gender", "F")
        s["cycle"] = r.get("cycle", "college")
        s["class"] = r.get("class_name") or r.get("class") or "6ème"
        s["class_name"] = s["class"]
        s["birthDate"] = r.get("birth_date") or r.get("birthDate") or ""
        s["originSchool"] = r.get("origin_school") or r.get("originSchool") or ""
        s["pastAverage"] = r.get("past_average") or r.get("pastAverage") or 12.0
        s["isRepeating"] = r.get("is_repeating") or r.get("isRepeating") or "Non"
        s["fatherName"] = r.get("father_name") or r.get("fatherName") or ""
        s["motherName"] = r.get("mother_name") or r.get("motherName") or ""
        s["photo"] = r.get("photo") or ("👩🏾‍🎓" if s["gender"]=="F" else "👨🏾‍🎓")
        s["status"] = r.get("status", "À jour")
        s["totalFee"] = r.get("total_fee") or r.get("totalFee") or 150000
        s["balance"] = r.get("balance", 0)
        s["attendance"] = r.get("attendance", 98)
        try: s["incidents"] = json.loads(r["incidents"]) if r["incidents"] and isinstance(r["incidents"], str) else (r["incidents"] or [])
        except: s["incidents"] = []
        students.append(s)

    cursor.execute("SELECT * FROM subjects WHERE academic_year = %s", (year,))
    subjects = {}
    for row in cursor.fetchall():
        c_name = row["class_name"]
        if c_name not in subjects:
            subjects[c_name] = []
        subjects[c_name].append(dict(row))

    cursor.execute("SELECT * FROM grades WHERE academic_year = %s", (year,))
    grades = {}
    for row in cursor.fetchall():
        st_id = row["student_id"]
        sub_name = row["subject_name"]
        if st_id not in grades:
            grades[st_id] = {}
        grades[st_id][sub_name] = {
            "note1": row["note1"],
            "note2": row["note2"],
            "compo": row["compo"]
        }

    cursor.execute("SELECT * FROM transactions WHERE academic_year = %s ORDER BY date DESC, id DESC", (year,))
    transactions = []
    for row in cursor.fetchall():
        r = dict(row)
        t = {}
        t["id"] = r["id"]
        t["student"] = r.get("student_name") or r.get("student") or "Élève inconnu"
        t["student_name"] = t["student"]
        t["student_id"] = r.get("student_id", "")
        t["type"] = r.get("type", "Scolarité")
        t["amount"] = r.get("amount", 0)
        t["method"] = r.get("method", "Espèces")
        t["ref"] = r.get("ref", "N/A")
        t["date"] = r.get("date", "Aujourd'hui")
        t["status"] = r.get("status", "Payé")
        t["operator"] = r.get("operator", "Économe")
        transactions.append(t)

    conn.close()

    return {
        "school": school,
        "academicYears": years,
        "currentYear": year,
        "users": users,
        "teachers": teachers,
        "students": students,
        "subjects": subjects,
        "grades": grades,
        "transactions": transactions
    }

@app.post("/api/students")
def add_student(student: StudentCreate, user: dict = Depends(_exiger_licence_valide)):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT year_label FROM academic_years WHERE is_current = 1 LIMIT 1")
    year = cursor.fetchone()["year_label"]

    try:
        cursor.execute("""
        INSERT INTO students (id, academic_year, last_name, first_name, gender, cycle, class_name, birth_date, origin_school, past_average, is_repeating, father_name, mother_name, photo, status, total_fee, balance, attendance, incidents)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            student.id, year, student.lastName, student.firstName, student.gender,
            student.cycle, student.class_name, student.birthDate, student.originSchool,
            student.pastAverage, student.isRepeating, student.fatherName, student.motherName,
            student.photo, "À jour", student.totalFee, 0, 98,
            json.dumps([f"Inscrit le {year}"])
        ))
        conn.commit()
    except Exception:
        conn.close()
        raise HTTPException(status_code=400, detail="Ce matricule existe déjà pour cette année scolaire.")
    
    conn.close()
    return {"status": "success", "message": f"Élève {student.firstName} {student.lastName} ajouté."}

@app.delete("/api/students/{student_id}")
def delete_student(student_id: str, user: dict = Depends(_exiger_licence_valide), _admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))
    cursor.execute("DELETE FROM transactions WHERE student_id = %s OR student_name LIKE %s", (student_id, f"%{student_id}%"))
    cursor.execute("DELETE FROM grades WHERE student_id = %s", (student_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.delete("/api/teachers/{teacher_id}")
def delete_teacher(teacher_id: str, user: dict = Depends(_exiger_licence_valide), _admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM teachers WHERE id = %s", (teacher_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/api/transactions")
def add_payment(payment: PaymentCreate, user: dict = Depends(_exiger_licence_valide)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT year_label FROM academic_years WHERE is_current = 1 LIMIT 1")
    year = cursor.fetchone()["year_label"]

    tx_id = f"REC-{year[:4]}-{os.urandom(2).hex().upper()}"
    
    st_id = payment.student
    if "(" in payment.student and ")" in payment.student:
        st_id = payment.student.split("(")[-1].replace(")", "").strip()

    cursor.execute("SELECT balance, status FROM students WHERE id = %s AND academic_year = %s", (st_id, year))
    row = cursor.fetchone()
    if row:
        new_balance = max(0, row["balance"] - payment.amount)
        new_status = "À jour" if payment.status == "Payé" or new_balance == 0 else "Partiel"
        cursor.execute("UPDATE students SET balance = %s, status = %s WHERE id = %s AND academic_year = %s", (new_balance, new_status, st_id, year))

    cursor.execute("""
    INSERT INTO transactions (id, academic_year, student_id, student_name, type, amount, method, ref, date, status, operator) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        tx_id, year, st_id, payment.student, payment.type, payment.amount,
        payment.method, payment.ref, "Aujourd'hui", payment.status, payment.operator
    ))

    conn.commit()
    conn.close()
    return {"status": "success", "tx_id": tx_id}

@app.delete("/api/transactions/{tx_id}")
def delete_transaction(tx_id: str, user: dict = Depends(_exiger_licence_valide)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT student_id, amount FROM transactions WHERE id = %s", (tx_id,))
    tx = cursor.fetchone()
    if tx and tx["student_id"]:
        cursor.execute("SELECT balance, total_fee FROM students WHERE id = %s", (tx["student_id"],))
        stu = cursor.fetchone()
        if stu:
            tot = stu["total_fee"] or 150000
            new_bal = min(tot, stu["balance"] + tx["amount"])
            new_stat = "Partiel" if (new_bal < tot and new_bal > 0) else ("En retard" if new_bal == tot else "À jour")
            cursor.execute("UPDATE students SET balance = %s, status = %s WHERE id = %s", (new_bal, new_stat, tx["student_id"]))
    cursor.execute("DELETE FROM transactions WHERE id = %s", (tx_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.delete("/api/transactions-purge")
def purge_transactions(user: dict = Depends(_exiger_licence_valide), _admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions")
    cursor.execute("UPDATE students SET balance = total_fee, status = 'En retard'")
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/api/promote-year")
def promote_academic_year(req: PromoteYearRequest, user: dict = Depends(_exiger_licence_valide), _admin: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT year_label FROM academic_years WHERE is_current = 1 LIMIT 1")
    current_year = cursor.fetchone()["year_label"]

    if req.new_year_label == current_year:
        raise HTTPException(status_code=400, detail="L'année cible doit être différente de l'année en cours.")

    cursor.execute("UPDATE academic_years SET is_current = 0, is_archived = 1 WHERE year_label = %s", (current_year,))
    cursor.execute("INSERT INTO academic_years (year_label, is_current, is_archived) VALUES (%s, 1, 0) ON DUPLICATE KEY UPDATE year_label=year_label", (req.new_year_label,))
    cursor.execute("UPDATE academic_years SET is_current = 1 WHERE year_label = %s", (req.new_year_label,))

    cursor.execute("SELECT value FROM settings WHERE `key` = 'tuition_fees'")
    fees = json.loads(cursor.fetchone()["value"])

    cursor.execute("SELECT * FROM students WHERE academic_year = %s", (current_year,))
    old_students = cursor.fetchall()

    CLASSE_SUP = {
        "Petite Section (PS)": "Moyenne Section (MS)", "Moyenne Section (MS)": "Grande Section (GS)", "Grande Section (GS)": "CP1",
        "CP1": "CP2", "CP2": "CE1", "CE1": "CE2", "CE2": "CM1", "CM1": "CM2",
        "CM2": "6ème", "6ème": "5ème", "5ème": "4ème", "4ème": "3ème",
        "3ème": "Seconde (2nde)", "Seconde (2nde)": "Première (1ère)", "Première (1ère)": "Terminale (Tle)",
        "Terminale (Tle)": "Diplômé / Ancien Élève"
    }

    promoted = 0
    for s in old_students:
        old_class = s["class_name"]
        is_rep = s["is_repeating"]
        
        new_class = old_class if is_rep.startswith("Oui") else CLASSE_SUP.get(old_class, old_class)
        if new_class == "Diplômé / Ancien Élève":
            continue

        cycle = s["cycle"]
        if new_class in ["CP1", "CP2", "CE1", "CE2", "CM1", "CM2"]: cycle = "primaire"
        elif new_class in ["6ème", "5ème", "4ème", "3ème"]: cycle = "college"
        elif new_class in ["Seconde (2nde)", "Première (1ère)", "Terminale (Tle)"]: cycle = "lycee"

        total_fee = fees.get(cycle, 150000)

        cursor.execute("""
        INSERT INTO students (id, academic_year, last_name, first_name, gender, cycle, class_name, birth_date, origin_school, past_average, is_repeating, father_name, mother_name, photo, status, total_fee, balance, attendance, incidents) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            s["id"], req.new_year_label, s["last_name"], s["first_name"], s["gender"], cycle,
            new_class, s["birth_date"], s["origin_school"], s["past_average"], "Non",
            s["father_name"], s["mother_name"], s["photo"], "À jour", total_fee, 0, 100,
            json.dumps([f"Promu de {old_class} vers {new_class} pour {req.new_year_label}"])
        ))
        promoted += 1

    cursor.execute("SELECT * FROM subjects WHERE academic_year = %s", (current_year,))
    for sub in cursor.fetchall():
        cursor.execute("""
        INSERT INTO subjects (id, academic_year, class_name, name, coef, teacher)
        VALUES (%s, %s, %s, %s, %s, %s)
        """, (f"SUB-{os.urandom(3).hex().upper()}", req.new_year_label, sub["class_name"], sub["name"], sub["coef"], sub["teacher"]))

    conn.commit()
    conn.close()

    return {"status": "success", "message": f"Passage réussi ! {promoted} élèves transférés dans l'exercice {req.new_year_label}."}

if os.path.exists("index.html"):
    app.mount("/", StaticFiles(directory=".", html=True), name="static")

def open_browser():
    time.sleep(1.5)
    print("\n" + "="*70)
    print(" 🌐 OUVERTURE AUTOMATIQUE DE VOTRE NAVIGATEUR SUR : http://localhost:8000 ")
    print("="*70 + "\n")
    try:
        webbrowser.open("http://localhost:8000")
    except Exception:
        pass

if __name__ == "__main__":
    import uvicorn
    print("🚀 Démarrage du serveur EduGest Pro sur http://localhost:8000 ...")
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
