"""Moteur de secours de la traduction automatique : Argos Translate, en local (FR -> EN).

Utilisé par .github/workflows/traduction.yml seulement si Gemini n'a pas tout traduit.
Entrée et sortie : un dictionnaire JSON {clé: texte}. Les textes arrivent déjà découpés
(sans code, sans Markdown, glossaire déjà appliqué) par scripts/traduction/traduire.mjs.

    python argos.py .traduction/argos-entree.json .traduction/argos-sortie.json
"""

import json
import sys

import argostranslate.package
import argostranslate.translate


def installer_fr_en():
    """Télécharge le modèle FR -> EN s'il n'est pas déjà là (il est mis en cache par l'Action)."""
    if any(p.from_code == "fr" and p.to_code == "en" for p in argostranslate.package.get_installed_packages()):
        return
    print("Téléchargement du modèle Argos FR -> EN...")
    argostranslate.package.update_package_index()
    paquet = next(
        p for p in argostranslate.package.get_available_packages() if p.from_code == "fr" and p.to_code == "en"
    )
    argostranslate.package.install_from_path(paquet.download())


def main(entree, sortie):
    with open(entree, encoding="utf-8") as f:
        textes = json.load(f)
    if not textes:
        print("Argos : rien à traduire.")
        return

    installer_fr_en()
    traductions = {cle: argostranslate.translate.translate(texte, "fr", "en") for cle, texte in textes.items()}

    with open(sortie, "w", encoding="utf-8") as f:
        json.dump(traductions, f, ensure_ascii=False, indent=2)
    print(f"Argos : {len(traductions)} morceaux traduits.")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
