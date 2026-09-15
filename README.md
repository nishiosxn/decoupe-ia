# Découpe IA

Application locale de détourage d’images par IA avec retouches au pinceau.

## Version actuelle

**v3.1.0** — import par fichier, glisser-déposer ou presse-papiers, détourage automatique et corrections locales Ajouter/Enlever.

Le traitement se fait dans le navigateur. Aucun jeton ChatGPT n’est utilisé. Le modèle ISNet est téléchargé au premier lancement, puis exécuté localement.

## Lancer l’application

Depuis le dossier du projet :

```powershell
cd outputs
python -m http.server 8765
```

Ouvrir ensuite <http://127.0.0.1:8765/decoupe.html>.

## Organisation

- `outputs/decoupe.html` : source active et page utilisée localement.
- `dist/index.html` : copie publiable, toujours identique à la source active.
- `outputs/versions/` : archives immuables de chaque livraison.
- `outputs/VERSIONS.md` : historique fonctionnel, limites et tests réalisés.
- `docs/ARCHITECTURE.md` : fonctionnement interne et règles à préserver.
- `docs/TESTS.md` : vérifications avant livraison.
- `scripts/check.ps1` : contrôle automatique de la cohérence du projet.
- `scripts/release.ps1` : création sécurisée d’une archive de version.
- `AGENTS.md` : consignes permanentes pour les prochaines interventions de Codex.

## Cycle d’une évolution

1. Créer une branche `codex/nom-de-la-fonction`.
2. Modifier `outputs/decoupe.html` et son numéro visible.
3. Copier la page dans `dist/index.html` et tester.
4. Documenter les changements dans `outputs/VERSIONS.md`.
5. Exécuter `./scripts/release.ps1 X.Y.Z` pour archiver la livraison.
6. Créer un commit et une étiquette Git `vX.Y.Z`.

Les anciennes archives ne doivent jamais être modifiées.
