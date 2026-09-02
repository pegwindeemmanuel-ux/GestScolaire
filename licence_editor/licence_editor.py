"""EduGest Pro - Editeur de licences (usage DEVELOPPEUR/EDITEUR uniquement).

Cet outil, a executer UNIQUEMENT sur le poste du developpeur, permet de
generer des licences signees pour un etablissement donne.

La CLE PRIVEE ne doit JAMAIS etre distribuee avec le logiciel installe a
l'ecole. On garde ici une copie dans 'cle_privee.sec' (a proteger fortement).

Usage :
    python licence_editor.py --machine BF-9A81-33C2 --period annual
    python licence_editor.py --machine BF-9A81-33C2 --period biennial
    python licence_editor.py --machine BF-9A81-33C2 --period perpetual
    python licence_editor.py --machine BF-9A81-33C2 --period annual --expire 31/07/2028
"""

import os
import sys
import argparse

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(BASE))  # pour importer licence.py

from licence import generer_licence, DEV_PUBLIC_KEY_B64  # noqa: E402


CLE_PRIVEE_FILE = os.path.join(BASE, "cle_privee.sec")


def charger_cle_privee():
    if os.path.exists(CLE_PRIVEE_FILE):
        with open(CLE_PRIVEE_FILE) as f:
            return f.read().strip()
    return ""


def sauvegarder_cle_privee(key):
    with open(CLE_PRIVEE_FILE, "w") as f:
        f.write(key)
    print(f"[i] Cle privee enregistree dans {CLE_PRIVEE_FILE}")


def main():
    parser = argparse.ArgumentParser(description="EduGest Pro - Genere une licence")
    parser.add_argument("--machine", required=True, help="ID materiel (ex: BF-9A81-33C2)")
    parser.add_argument("--period", default="annual",
                        choices=["annual", "biennial", "perpetual", "demo"])
    parser.add_argument("--expire", default="", help="Date JJ/MM/AAAA (si non perpétuelle)")
    args = parser.parse_args()

    # Verifier la cle privee presente
    cle_privee = charger_cle_privee()
    if not cle_privee:
        print("[!] Aucune cle privee. Veuillez definir DEV_PRIVATE_KEY_B64 dans licence.py")
        print("    (variable lib_var) puis relancez. Ou collez votre cle privee ici.")
        sys.exit(1)

    # Date d'expiration par defaut selon la periode
    expire = args.expire
    if not expire and args.period == "annual":
        expire = "31/07/2027"
    elif not expire and args.period == "biennial":
        expire = "31/07/2028"

    token = generer_licence(
        machine_id=args.machine,
        periode=args.period,
        expire_str=expire,
        private_key_b64=cle_privee,
    )

    print("\n" + "=" * 70)
    print(f"   LICENCE GENERE pour la machine : {args.machine}")
    print(f"   Periode : {args.period}")
    print(f"   Expire  : {expire if expire else 'PERPETUELLE'}")
    print("=" * 70)
    print("\nCopiez ce jeton dans la base de l'etablissement (cle 'licence_jeton') :\n")
    print(token)
    print("\n" + "=" * 70)
    print("Cle publique attendue pour la verification :")
    print(DEV_PUBLIC_KEY_B64)
    print("=" * 70)


if __name__ == "__main__":
    main()