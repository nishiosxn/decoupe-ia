# Découpe AI

Version stable actuelle : **v5.2.0**, validée par l’utilisateur, intégrée dans main par la PR #1 et publiée sur Cloudflare. Le tag v5.2.0 désigne le commit de release 4f01851. Voir WORK_STATE.md pour la continuité.

V5.2.0 apporte le comparateur, les fonds transparent/blanc/noir, les corrections locales et le filigrane. La release conserve ISNet et le masque strictement binaire.

Production : https://decoupe-ia.nishiosamauwu.workers.dev/ . Preview : https://nishiosxn.github.io/decoupe-ia/ .

## Utilisation

Importer une image JPG/PNG/WebP, supprimer le fond, comparer puis télécharger un PNG à la résolution originale. Choisir un fond transparent, blanc ou noir. Après traitement, Corriger propose Ajouter/Supprimer : peindre les indications puis appliquer le recalcul local ; la dernière correction peut être annulée. L’original à20 % derrière le résultat aide à retrouver les éléments supprimés ; ce guide est désactivable et reste absent des exports.

Tout le traitement est local au navigateur. ISNet FP16 via @imgly/background-removal1.7.0 télécharge son runtime/modèle au premier traitement (~100 Mo). Aucune clé ni backend. Alpha transparent strictement0/255, RGB originaux conservés. Limites : sujets ambigus et détails fins ; ISNet n’est pas conditionné par les traits, donc une correction peut ne rien changer. Images limitées à32 MP et16384 pixels par côté ; mémoire dépendante de l’appareil. Voir docs/VALIDATION.md.

## Installation et commandes

Node.js22 ou plus, Chrome installé pour les tests locaux (Chromium en CI).

    npm ci
    npm run check
    npm run dev
    npm run test:browser

Test local : http://127.0.0.1:4173/decoupe-ia/ .

- npm run build : générer dist/ depuis src/.
- npm run validate : syntaxe JS, ressources, versions et distribution identique.
- npm run check : build, validation, tests unitaires.
- npm run test:browser : import/export, comparaison, corrections, filigrane, desktop/mobile/tactile émulé.
- npm run build:pages : staging .pages/ depuis dist/ et archives Git vérifiées ; checkout avec tags requis.
- npm run check:release : contrôle de cohérence stable/code/README/changelog, après validation utilisateur.

## Arborescence

    src/index.html, styles.css, app.js, favicon.svg
    src/ai/background-worker.js
    src/core/pixels.js, local-brush.js
    dist/                 distribution générée, versionnée et contrôlée
    scripts/              build, validation, serveur et fixtures
    tests/                unitaires et Playwright
    docs/                 architecture, workflow, historique, validation, audit

src/ est l’unique source officielle. Ne pas modifier dist/ directement. Les anciennes sources outputs/ et snapshots sont récupérables dans les tags archive/* ; voir docs/REPOSITORY_AUDIT.md.

## Git et publications

main contient la dernière stable et sert à la production Cloudflare. Chaque version demandée utilise une branche temporaire work/vX.Y.Z-nom, créée depuis main ; les reprises et corrections restent sur cette branche. Après validation : documentation synchronisée, PR et contrôles, merge autorisé, tag stable puis nettoyage vérifié. Aucun develop permanent ni branche créée simplement pour une nouvelle conversation.

GitHub Actions teste main et work/**. Pages publie la branche de travail après CI ; entre deux lots, main republie la stable. Les previews historiques restent sous previews/v4.0.0/ et previews/v3.2.0/. Le déploiement Cloudflare existant utilise Workers Builds depuis main ; aucune clé de déploiement n’est ajoutée au dépôt.

Lire [WORK_STATE.md](WORK_STATE.md) pour reprendre. [Architecture](docs/ARCHITECTURE.md), [workflow](docs/WORKFLOW.md), [changelog](docs/CHANGELOG.md), [validation](docs/VALIDATION.md), [audit et archives](docs/REPOSITORY_AUDIT.md).

Méthode inspirée de [GamePanel](https://github.com/MrMekouil/GamePanel) : checkpoints récupérables, état compact, preuves et validation avant release, sans importer son architecture Python.

Bibliothèque IMG.LY sous AGPL-3.0 : [source et licence](https://github.com/imgly/background-removal-js).
