"""EduGest Pro - Moteur de licence chiffree et verrouillee au materiel.

Le principe (licence hors-ligne, signature asymetrique) :
- Le DEVELOPPEUR/editeur possede une CLE PRIVEE (jamais distribuee).
- Avec cette cle privee, il cree des licences signees (jeton) contenant :
    * l'id materiel de la machine cible,
    * la periode (annual / biennial / perpetual),
    * la date d'expiration.
- Le SERVEUR de l'etablissement possede uniquement la CLE PUBLIQUE (integree au
  code) et peut VERIFIER la licence, sans jamais pouvoir en fabriquer une.

Un jeton de licence est un objet JSON compact signe avec la cle privee (Ed25519).

Installation requise : pip install cryptography
"""

import json
import base64
import hashlib
from datetime import datetime
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives import serialization

# ---------------------------------------------------------------------------
# CLE PRIVEE DU DEVELOPPEUR (A CORRIGER DANS 'licence_editor/' - jamais distribuer)
# ---------------------------------------------------------------------------
# Cette cle privee est celle de l'EDITEUR. Elle doit rester a l'abri (sur un
# dossier securise de developpement, PAS dans le dossier public du serveur).
# Un exemple est fourni. Reprenez-le avec votre vraie cle via generate_keypair().
_DEV_PRIVATE_KEY_B64 = "REMPLACEZ_PAR_LA_CLE_PRIVEE"

# ---------------------------------------------------------------------------
# CLE PUBLIQUE DU DEVELOPPEUR (distribuee avec le logiciel)
# ---------------------------------------------------------------------------
# C'est la cle publique correspondante, incluse dans le code serveur pour la
# verification des licences. Chaque cle publique depend des cles generees.
# Cle publique a integrer avec le logiciel (elle permet uniquement de VERIFIER).
DEV_PUBLIC_KEY_B64 = "/tHivsOico7FXaBbW028RjfaLfG+XH5NaGnaczXDct0="


def generate_keypair():
    """Genere une paire de cles Ed25519 (pour le developpeur uniquement).

    Affiche la cle privee (a garder secretement, cote editeur) et la cle
    publique (a integrer dans votre code serveur)."
    """
    private_key = Ed25519PrivateKey.generate()
    private_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_key = private_key.public_key()
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    private_b64 = base64.b64encode(private_bytes).decode()
    public_b64 = base64.b64encode(public_bytes).decode()
    return private_b64, public_b64


def _private_key_obj(priv_b64):
    return Ed25519PrivateKey.from_private_bytes(base64.b64decode(priv_b64.encode()))


def _public_key_obj(pub_b64):
    return Ed25519PublicKey.from_public_bytes(base64.b64decode(pub_b64.encode()))


def _norm(machine_id):
    """Normalise un id machine (tolere tirets, minuscules/majuscules)."""
    return machine_id.replace("-", "").upper()


def generer_licence(machine_id, periode="annual", expire_str="", private_key_b64=_DEV_PRIVATE_KEY_B64):
    """Cree un jeton de licence signe.

    Args:
        machine_id: id materiel (ex: 'BF-9A81-33C2').
        periode: 'annual', 'biennial', 'perpetual' ou 'demo'.
        expire_str: date d'expiration 'JJ/MM/AAAA' (ignoree si perpetual).
        private_key_b64: cle privee de l'editeur (defaut si definie).

    Returns:
        str: le jeton de licence (a copier dans la base de l'etablissement).
    """
    if not private_key_b64 or private_key_b64.startswith("REMPLACEZ"):
        raise ValueError("Cle privee de l'editeur absente. Utilisez generate_keypair().")

    payload = {
        "machine": _norm(machine_id),
        "periode": periode,
        "expire": expire_str if periode != "perpetual" else "",
        "emis": datetime.utcnow().strftime("%Y-%m-%d"),
    }
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    digest = hashlib.sha256(raw).digest()
    signature = _private_key_obj(private_key_b64).sign(raw + digest)  # signe contenu+empreinte

    token_data = {
        "d": base64.b64encode(raw).decode(),
        "s": base64.b64encode(signature).decode(),
    }
    return base64.urlsafe_b64encode(json.dumps(token_data, separators=(",", ":")).encode()).decode()


def verifier_licence(token, machine_id, public_key_b64=DEV_PUBLIC_KEY_B64):
    """Verifie un jeton de licence.

    Returns:
        dict avec "status" ("ok" | "invalide" | "expiree" | "machine_invalide" |
        "cle_manquante"), et selon le cas la periode, l'expiration et le statut texte.
    """
    if not public_key_b64 or public_key_b64.startswith("REMPLACEZ"):
        return {"status": "cle_manquante", "message": "Cle publique de licence absente."}

    try:
        token_text = base64.urlsafe_b64decode(token.encode()).decode()
        token_data = json.loads(token_text)
        raw = base64.b64decode(token_data["d"].encode()).decode()
        signature = base64.b64decode(token_data["s"].encode())
        digest = hashlib.sha256(raw.encode()).digest()
        _public_key_obj(public_key_b64).verify(signature, raw.encode() + digest)
    except Exception:
        return {"status": "invalide", "message": "Licence invalide ou falsifiee."}

    payload = json.loads(raw)
    if payload.get("machine", "").replace("-", "").upper() != _norm(machine_id):
        return {"status": "machine_invalide", "message": "Licence non compatible avec cette machine."}

    periode = payload.get("periode", "annual")
    expire_str = payload.get("expire", "")

    # Verifier l'expiration (sauf perpetual)
    if periode != "perpetual":
        try:
            dt = datetime.strptime(expire_str, "%d/%m/%Y")
            now = datetime.utcnow()
            if now > dt:
                return {
                    "status": "expiree",
                    "period": periode,
                    "expires_on": expire_str,
                    "message": f"Licence expiree le {expire_str}.",
                }
        except Exception as e:
            return {"status": "invalide", "message": "Date d'expiration illisible."}

    return {
        "status": "ok",
        "period": periode,
        "expires_on": expire_str,
        "message": "Licence valide.",
    }


def nouvelle_licence_demo(machine_id, public_key_b64=DEV_PUBLIC_KEY_B64):
    """Retourne un message d'etat pour affichage quand aucune licence n'est installee."""
    return {
        "status": "aucune",
        "message": "Aucune licence installee.",
        "machine_id": machine_id,
        "public_key_b64": public_key_b64,
    }


if __name__ == "__main__":
    print("== Generation d'une paire de cles (editeur) ==")
    priv, pub = generate_keypair()
    print(f"CLE PRIVEE (a garder secretement cote editeur) :\n{priv}\n")
    print(f"CLE PUBLIQUE (a integrer dans le serveur) :\n{pub}\n")