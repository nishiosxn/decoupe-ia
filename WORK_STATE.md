# Découpe Studio — état opérationnel

## Base et contraintes

- Production `main` : a00a3169ad66c6c38af5f38884d8c664b7a35735, v3.1.0. Cloudflare sert `dist/`.
- Candidate initiale : `codex/intelligent-zone-brush-v3.2.0`, commit 3b110282d3765290d32a51bc9ce1ad802417d7bb.
- Reconstruction demandée le 2026-10-06 : gratuite dans le navigateur, génération = reconstruction du fond après suppression ; pas de clé API.
- Branche v4 : `codex/rebuild-studio-v4`. Aucun merge dans `main`, tag ou déploiement Cloudflare dans ce travail.

## Réalisé

- Nouvel atelier modulaire : `src/` (source), `dist/` (build), `tests/`, `scripts/`, `.github/workflows/ci.yml`.
- Gomme modifie réellement l’alpha ; restauration récupère l’original ; aucune superposition d’image fantôme.
- Sélection au pinceau et SlimSAM au clic ; détourage BiRefNet Lite 512 ; reconstruction de texture immédiatement disponible, LaMa optionnelle et remplissage local rapide.
- Historique RGB + masque, zoom, comparaison, export transparent, projet `.decoupe`.
- Modèles et moteurs épinglés ; worker annulable ; délai sans progression ; limites mémoire/import ; modèles inactifs libérés.
- Archives existantes, configuration Cloudflare et production préservées.
- Documentation : README, architecture, modèles, tests, workflow. CI de tests/build sans déploiement.

## Validation observée

- 8 tests du cœur et 7 tests navigateur Chrome réussis : suppression alpha exacte, exports réels, restauration/undo/redo, remplissage, texture sans réseau, projet, mobile, erreur et annulation.
- Smoke IA réel réussi avec les vrais poids préchargés sur un miroir local : SlimSAM, BiRefNet 512, LaMa. Reconstruction RGB effective et pixels hors sélection conservés.
- Photographie de référence (corgi, 614 × 410 px) détourée avec BiRefNet et inspectée visuellement : réussi.
- Variante BiRefNet 1024 rejetée après erreur mémoire ; la variante 512 est celle vérifiée et publiée.
- Build statique et syntaxe des modules : réussis. Voir docs/TESTS.md pour les limites de ces vérifications.

## Publication et suite

- Cible de preview : `preview/github-pages-v4.0.0`, fichiers de `dist/` à la racine.
- URL : https://nishiosxn.github.io/decoupe-ia/ ; Pages ne sert qu’une branche à la fois. La v3.2.0 preview reste dans Git.
- Valider la qualité sur les images de travail réelles avant toute production. Cette version reste une candidate, sans merge/tag Cloudflare implicite.
