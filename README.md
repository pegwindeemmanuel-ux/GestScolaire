# EduGest Pro Enterprise

Système de gestion scolaire multi-années (Maternelle à Lycée) - EduGest Pro Enterprise.

## Technologies

- **Backend** : Python / FastAPI
- **Base de données** : MariaDB / MySQL (WAMP) — remplace SQLite pour supporter les gros effectifs et le multi-postes
- **Frontend** : HTML / CSS / JavaScript vanilla

## Fonctionnalités

- Gestion des élèves (inscriptions, modifications, cartes QR)
- Corps enseignant et affectations
- Notes, matières, coefficients et bulletins (T1, T2, T3, Général)
- Présences, surveillance et incidents
- Finances, caisse et reçus (Orange Money, Moov Money, Espèces, Virement)
- Paramètres, licences et sécurité RBAC
- Passage de classe en fin d'année (multi-années)

## Prérequis

- WAMP avec MariaDB/MySQL en cours d'exécution (service `wampmysqld64`)
- Python 3.12+
- Bibliothèque Python `pymysql` : `pip install pymysql`

## Démarrage (simple)

Double-cliquez sur **`demarrer_serveur.bat`** :
1. installe les dépendances,
2. initialise la base MariaDB,
3. fait une **sauvegarde automatique**,
4. démarre le serveur sur http://localhost:8000.

Ou en ligne de commande :

```cmd
pip install fastapi uvicorn pydantic pymysql
python database.py
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Puis ouvrez http://localhost:8000

## Accès depuis d'autres postes (réseau local)

1. Trouvez l'adresse IP du serveur (ex. `192.168.10.10`).
2. Ouvrez le port 8000 dans le pare-feu Windows :
   - clic droit sur **`ouvrir_firewall.bat`** → **Exécuter en tant qu'administrateur**.
3. Sur chaque poste, ouvrez : `http://IP-DU-SERVEUR:8000`
   Exemple : `http://192.168.10.10:8000`

Le serveur écoute déjà sur toutes les interfaces (`0.0.0.0`).
Pour l'accès à distance futur (internet), il faudra un hébergement VPS + un domaine, la base MariaDB s'y installe de la même façon.

## Sauvegarde automatique

- **`sauvegarde.py`** exporte toutes les tables vers `sauvegardes\` (fichier SQL horodaté) et garde les 15 plus récentes.
- Une **tâche planifiée Windows** (`EduGestPro_Sauvegarde`) l'exécute automatiquement tous les jours à **23h00**.
- Une sauvegarde est aussi créée à **chaque démarrage** du serveur via `demarrer_serveur.bat`.

## Restauration

Depuis un fichier `sauvegardes\sauvegarde_....sql`, réimportez les lignes dans MariaDB (via l'interface ou la ligne de commande) dans la base `edugest_pro`.

## Comptes par défaut

| Rôle      | Identifiant      | Mot de passe      |
|-----------|------------------|-------------------|
| Admin     | `admin`          | `EMMANUEL 76827248` |
| Admin     | `KOGOinformatiques` | `EMMANUEL 7682`  |
| Directeur | `directeur`      | `dir123`          |
| Secrétaire| `secretaire`     | `sec123`          |
| Économe   | `econome`        | `eco123`          |
| Surveillant | `surveillant`   | `surv123`         |
| Professeur| `professeur`     | `prof123`         |

> Important : changez ces mots de passe par défaut avant la mise en production réelle.

## Licence (protection anti-piratage)

EduGest Pro utilise une **licence signée électroniquement** et **verrouillée au matériel** du serveur :

- **ID matériel** : le serveur génère un identifiant unique (dérivé de la carte mère / MAC). Il s'affiche dans `Paramètres → Licence`.
- **Jeton de licence** : généré par l'éditeur (KOGO Informatiques) avec une **clé privée secrète**. Le serveur le vérifie avec une **clé publique** (éditeur) — il ne peut donc **pas fabriquer ni prolonger** sa propre licence, ni la copier sur une autre machine.
- **Vérification au démarrage** : si la licence est absente, expirée, falsifiée ou incompatible avec la machine, les **écritures sont bloquées** (HTTP 402) tant que la bonne licence n'est pas installée.
- **Installation** : l'administrateur colle le jeton reçu de l'éditeur dans `Paramètres → Licence → Installer la Licence`.

### Générer une licence (côté éditeur uniquement)

L'outil **`licence_editor/`** est réservé à KOGO Informatiques — il ne doit **jamais** être déployé à l'école (il contient la clé privée).

```cmd
cd licence_editor
python licence_editor.py --machine FE39-863B-4946 --period annual
python licence_editor.py --machine FE39-863B-4946 --period biennial
python licence_editor.py --machine FE39-863B-4946 --period permanent   # perpétuelle
```

- `--machine` : l'ID matériel affiché dans l'école.
- `--period` : `annual`, `biennial`, `perpetual` ou `demo`.
- `--expire JJ/MM/AAAA` : date d'expiration (sinon valeurs par défaut).

La clé privée est stockée dans `licence_editor/cle_privee.sec` (exclue de git via `.gitignore`).
La clé publique est intégrée au serveur dans `licence.py` (`DEV_PUBLIC_KEY_B64`).

## Auteurs

Développé par KOGO Informatiques & Binôme pour le Lycée & Groupe Scolaire Saint-Exupéry.