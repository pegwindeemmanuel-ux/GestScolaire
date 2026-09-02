# 🎓 EduGest Pro V4.5 Enterprise - Système de Gestion Scolaire Multi-Années

**EduGest Pro** est une suite logicielle complète pour l'administration et le suivi pédagogique des établissements scolaires, allant de la **Maternelle au Lycée**. 

Le projet vous offre deux modes d'utilisation : un **Mode Démonstration Web** (immédiatement testable dans le navigateur) et un **Mode Production Serveur (Python / MariaDB)** pour une capacité illimitée d'élèves sur plusieurs dizaines d'années !

---

## 🚀 1. Mode Production Serveur (Capacité Illimitée & Multi-Années)

Pour enregistrer des milliers d'élèves par an, gérer la caisse en simultané sur plusieurs ordinateurs et archiver les exercices scolaires sans perte de données, utilisez le serveur Python inclus dans ce dossier. La base de données est **MariaDB / MySQL** (celle de votre WAMP), adaptée aux gros effectifs (2000‑5000 élèves), au multi-postes et à l'accès distant futur.

### 🪟 Sous WINDOWS (Le plus simple) :
Double-cliquez simplement sur le fichier **`demarrer_serveur.bat`** !
Il se chargera automatiquement de vérifier Python, d'installer les bibliothèques nécessaires, d'initialiser la base MariaDB, de faire une sauvegarde automatique et d'ouvrir le serveur.

*Si vous préférez l'Invite de Commandes (cmd / PowerShell) :*
```cmd
pip install fastapi uvicorn pydantic pymysql python-jose python-multipart cryptography bcrypt
python database.py
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 🍎 Sous APPLE macOS / LINUX :
Ouvrez votre Terminal dans le dossier du projet et exécutez :
```bash
chmod +x start_server.sh
./start_server.sh
```
Ou manuellement avec Python :
```bash
pip install fastapi uvicorn pydantic pymysql python-jose python-multipart cryptography bcrypt
python database.py   # Initialise la base MariaDB 'edugest_pro'
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```
> Sur macOS/Linux, adaptez `db.py` aux identifiants MariaDB de votre poste.

### 🌐 Accès dans votre établissement (Wi-Fi Local / Intranet) :
- **Sur l'ordinateur serveur principal :** Ouvrez votre navigateur sur `http://localhost:8000` (s'ouvre automatiquement par le script).
- **Pour les autres PC de l'école (Secrétariat, Économat, Salle des profs) :** Connectez l'ordinateur au même réseau Wi-Fi ou câble Ethernet que le serveur. Notez l'adresse IP locale du serveur (via la commande `ipconfig` sous Windows, ex: `192.168.1.50`) et tapez dans le navigateur : `http://192.168.1.50:8000`. Tous les utilisateurs travaillent simultanément et en temps réel sur la même base de données centralisée !

### 📱 Utilisation sur Smartphone et Tablette (Zéro configuration requise !) :
- **Responsive Design Natif :** L'application est entièrement compatible et optimisée pour les écrans mobiles (surveillants dans la cour, professeurs en classe, directeur en déplacement).
- **Comment connecter un smartphone ?** Connectez simplement le téléphone au Wi-Fi de l'établissement et ouvrez le navigateur mobile (Chrome, Safari, Edge) sur l'adresse IP du serveur (ex: `http://192.168.1.50:8000`).
- **Astuce Raccourci de Type Application Mobile (PWA) :** Sur le smartphone, appuyez sur le menu du navigateur (les 3 petits points ou l'icône de partage) et choisissez **« Ajouter à l'écran d'accueil »** (*Add to Home Screen*). Une icône **EduGest Pro** s'installe sur le téléphone comme une vraie application mobile !
- **Prise de photo directe :** Lors de l'ajout d'une photo d'élève pour la carte QR ou lors du signalement d'un incident, cliquer sur le bouton de chargement propose automatiquement d'ouvrir l'appareil photo du smartphone en direct pour capturer la photo sur place !

---

## 🔄 2. Moteur d'Archivage Multi-Années & Passage de Classe

Le serveur intègre une table relationnelle `academic_years` conçue pour un **archivage historique perpétuel** :
1. **Exercice Verrouillé :** À la fin de chaque année scolaire (ex: *2025 - 2026*), lorsque l'Administrateur déclenche le passage de classe via l'API `/api/promote-year`, l'exercice en cours est automatiquement basculé en **Lecture Seule / Archivé**.
2. **Nouvel Exercice :** Une nouvelle année est créée (ex: *2026 - 2027*). Les élèves non-redoublants sont promus dans leur nouvelle classe (*PS ➔ MS, CM2 ➔ 6ème, Terminale ➔ Diplômé*) et reçoivent automatiquement le tarif dynamique de scolarité de leur nouveau cycle avec un solde à 0 FCFA.
3. **Traçabilité totale :** Vous pouvez à tout moment consulter les anciens reçus, bulletins et notes des élèves des années précédentes pour délivrer des duplicatas ou attestations.

---

## 🌟 3. Fonctionnalités et Spécifications Respectées

### 🔀 Hiérarchie Maternelle ➔ Lycée (16 classes)
- **Maternelle :** Petite Section (PS), Moyenne Section (MS), Grande Section (GS).
- **Primaire :** CP1 au CM2.
- **Collège :** 6ème à la 3ème.
- **Lycée :** Seconde à Terminale (Tle).

### 🪪 Cartes d'Élèves PVC, Code QR & Photos d'Identité
- **Génération instantanée de Cartes et Badges PVC :** Délivrance en un clic de la carte d'élève officielle (format badge portrait) avec **Code QR vectoriel** intégré et affichage garanti du nom officiel et de la devise de l'établissement.
- **Gestion et Modification en direct (Boutons « ✏️ Modifier ») :** Prise en charge complète de la modification des dossiers élèves et enseignants sans avoir à supprimer ! Vous pouvez changer à tout moment les noms, prénoms, classes et charger une nouvelle photographie (capture caméra web ou fichier JPG/PNG). Compression automatique en portrait 180×240px (~6 Ko par élève) pour préserver la rapidité du serveur.

### 💰 Économat, Scolarités Dynamiques & Mobile Money
- **Tarifs Dynamiques :** Les frais annuels sont configurables par cycle dans l'espace Économat.
- **Encaissements multi-modes :** Prise en charge de **🟧 Orange Money**, **🟦 Moov Money (Flooz)**, **💵 Espèces** et **🏛️ Virement bancaire** avec saisie obligatoire du **numéro de référence**.
- **Actes et Reçus au format Feuille A5 :** Génération instantanée et impression en un clic du *Reçu de Caisse*, de l' *Avis de Rappel* et du *Bulletin de Redevance / Non-Redevance* au format officiel A5 (148 × 210 mm).

### 👨‍🏫 Pédagogie & Notes des Enseignants
- Grille de saisie interactive des notes (**Devoir 1**, **Devoir 2**, **Composition / Examen**).
- **Matières & Coefficients personnalisables :** Flexibilité totale par classe.
- **Bulletin Officiel A4 Compact (1 Page Garantie) :** En-tête officiel avec **Devise du Pays** (*Unité - Progrès - Justice*), calcul automatique du rang et mise en page compacte optimisée pour tenir strictement sur 1 seule feuille A4 sans débordement.
- **Appréciations Académiques Rigoureuses :** Attribution automatique d'appréciations conformes aux standards officiels selon la note sur 20 (*Nul*, *Insuffisant / Faible*, *Médiocre*, *Passable*, *Assez Bien*, *Bien*, *Très Bien*, *Excellence absolue*).
- **Direction et Signataires par Cycle (Multi-Direction) :** Support natif d'un directeur distinct par cycle dans les Paramètres Admin (*Maternelle*, *Primaire*, *Collège*, *Lycée*). Les bulletins et reçus apposent automatiquement le titre et le cachet du directeur compétent selon la classe de l'élève !

### 🔐 Sécurité & Contrôle d'Accès (RBAC Strict en Liste Blanche)
- **Verrouillage Automatique d'Inactivité (Watchdog) :** Déconnexion automatique et purge des champs de saisie après une période d'inactivité (configurable par l'Admin de 5 à 60 minutes) pour protéger les données scolaires sur les postes partagés. Clôture immédiate de la session lors de la fermeture du navigateur (`sessionStorage`).
Le système applique un contrôle d'accès rigoureux et imperméable selon les privilèges de chaque fonction :
- **Administrateur Général (`admin` / `KOGOinformatiques`) :** Accès total et exclusif à la section **« 🔐 Paramètres & Licence »** (Empreinte matérielle Hardware Fingerprint, création/suppression de profils, configuration de l'établissement, maintenance), ainsi qu'au **Passage de Classe en fin d'année (`/api/promote-year`)** et à la **Purge du journal des encaissements (`/api/transactions-purge`)**.
- **Secrétaire (`secretaire`) :** Gestion des inscriptions, dossiers élèves, cartes d'identité QR et répertoire des enseignants.
- **Économe (`econome`) :** Caisse, encaissements (Orange Money, Moov Money, Espèces, Virement), reçus et rappels A5, modification des tarifs dynamiques de scolarité et annulation de versements.
- **Surveillant (`surveillant`) :** Pointage quotidien de l'appel par classe et journalisation chronologique des incidents de discipline ou d'infirmerie.
- **Enseignant (`professeur`) :** Configuration des matières et coefficients, appel en classe, signalement d'incidents et saisie des notes (Devoir 1, Devoir 2, Compo/Examen).
- **Directeur (`direction`) :** **Mode Lecture Seule strict :** accès à tous les tableaux de bord, bilans financiers et dossiers élèves, mais tous les boutons d'inscription, de modification, de suppression et d'encaissement sont automatiquement masqués ou désactivés.

#### 🔑 Comptes de Connexion Préconfigurés (Identifiant / Mot de passe)
> **⚠️ SÉCURITÉ EN ÉTABLISSEMENT :** Par défaut pour les déploiements chez les clients, l'affichage public de ces identifiants sur la page d'accueil est **désactivé et masqué (`display: none;`)** par sécurité ! Un sélecteur **« 🛡️ Afficher/Masquer l'aide de connexion »** dans l'espace Paramètres (Admin) vous permet de basculer l'affichage. **Important : changez ces mots de passe par défaut avant la mise en production réelle.**

- **KOGOinformatiques** / `EMMANUEL 7682` *(Admin Principal KOGO)*
- **admin** / `EMMANUEL 76827248` *(Admin Total)*
- **secretaire** / `sec123` *(Secrétariat & Inscriptions)*
- **econome** / `eco123` *(Économat & Caisse A5)*
- **surveillant** / `surv123` *(Vie Scolaire & Présences)*
- **professeur** / `prof123` *(Enseignants & Notes)*
- **directeur** / `dir123` *(Directeur - Lecture Seule)*

---

## 🪪 3 bis. Licence Logiciel (Anti-Piratage)

EduGest Pro utilise une **licence signée électroniquement** et **verrouillée au matériel** du serveur :

- **ID matériel** : l'admin le voit dans `Paramètres → Licence`. Il faut le communiquer à l'éditeur pour obtenir la licence.
- **Jeton de licence** : généré par l'éditeur (KOGO Informatiques) avec une clé privée secrète. Le serveur ne peut **ni le falsifier, ni le prolonger, ni le copier sur une autre machine**.
- **Vérification** : au démarrage et avant chaque écriture. Sans licence valide → blocage des écritures (HTTP 402), lecture et administration conservées.
- **Renouvellement** : à l'expiration, un admin colle le nouveau jeton reçu de l'éditeur dans `Paramètres → Licence → Installer la Licence`. L'administrateur reste toujours connectable, même licence expirée.
- L'outil **`licence_editor/`** est réservé à l'éditeur (clé privée) et **ne doit jamais être déployé dans l'école**.

---
*Système conçu et développé par Arena.ai & KOGO Informatiques pour l'excellence de votre établissement.*
