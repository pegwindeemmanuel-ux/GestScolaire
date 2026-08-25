# GestScolaire

Système de gestion scolaire multi-années (Maternelle à Lycée) - EduGest Pro Enterprise.

## Technologies

- **Backend** : Python / FastAPI / SQLite
- **Frontend** : HTML / CSS / JavaScript vanilla

## Fonctionnalités

- Gestion des élèves (inscriptions, modifications, cartes QR)
- Corps enseignant et affectations
- Notes, matières, coefficients et bulletins (T1, T2, T3, Général)
- Présences, surveillance et incidents
- Finances, caisse et reçus (Orange Money, Moov Money, Espèces, Virement)
- Paramètres, licences et sécurité RBAC

## Démarrage

```cmd
pip install fastapi uvicorn pydantic
python database.py
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Puis ouvrez http://localhost:8000

## Auteurs

Développé par KOGO Informatiques & Binôme pour le Lycée & Groupe Scolaire Saint-Exupéry.
