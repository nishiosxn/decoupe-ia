# Workflow opérationnel

## Branches

- `main` : production stable, protéger les pushes directs et exiger la CI avant fusion.
- `codex/rebuild-studio-v4` : reconstruction candidate.
- `codex/<fonction>` : évolutions isolées, une fonction cohérente par branche.
- `preview/github-pages-v4.0.0` : distribution publique de test, sans merge automatique.

## Cycle de travail

1. Lire `WORK_STATE.md` et vérifier `git status`. Ne jamais écraser un travail local.
2. Créer une branche depuis la base validée, corriger la source dans `src/`.
3. Ajouter un test reproduisant le bug ou vérifiant le résultat observable, surtout alpha/export/reconstruction.
4. Exécuter `npm run check` puis `npm run test:browser`. Pour une évolution de modèle, exécuter aussi le smoke IA.
5. Contrôler les changements générés dans `dist/`, la documentation et le diff.
6. Committer et pousser la branche de travail. La CI produit un artefact statique sans déployer.
7. Copier la distribution à la racine de la branche de preview. Tester l’URL publique avant une proposition de fusion.
8. Faire valider sur des images de travail réelles : cheveux, végétation, meubles, ombres, transparence et architecture.
9. Fusionner, taguer ou publier en production seulement sur demande explicite.

## Commandes

- `npm run dev` : serveur local, après build.
- `npm run check` : tests du cœur + build.
- `npm run test:browser` : tests d’interface et exports.
- `./scripts/check.ps1` : raccourci PowerShell de `npm run check`.
- `./scripts/release.ps1 4.0.0` : archive locale de la version de package, aucun tag ni déploiement. Refuse d’écraser une archive.

## Definition of done

Un bouton doit accomplir son action réellement, avec un test sur les pixels ou l’export. Un moteur doit être exécuté avant d’être annoncé comme validé. Un résultat incertain est une sélection à vérifier. Une erreur garde le dernier document. Les limites de qualité et de matériel sont décrites honnêtement.

## Publication Pages

Sur la branche dédiée, conserver la structure du projet et copier récursivement le contenu de `dist/` à la racine (`index.html`, `app.js`, `styles.css`, `core/`, `ai/`, `favicon.svg`, `.nojekyll`). Settings → Pages → Deploy from a branch → branche preview → /(root). Les chemins relatifs restent compatibles avec `/decoupe-ia/`.
