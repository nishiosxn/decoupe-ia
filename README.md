# Découpe AI

Version stable actuelle : **v3.1.0**, conservée sur main (a00a316). Le tag v3.1.0 désigne la release initiale9105f4b. Production Cloudflare inchangée.

Candidate : **v5.2.0**, sur develop, avec comparateur, fonds, corrections locales et filigrane. Cette candidate n’est pas une release production validée par l’utilisateur.

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
- npm run check:release : contrôle supplémentaire stable=candidate, uniquement après validation utilisateur.

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

main = stable/Cloudflare ; develop = travail courant et preview. Aucun merge ni déploiement production automatique depuis develop. GitHub Actions teste develop et main ; seule develop peut publier Pages. La preview conserve https://nishiosxn.github.io/decoupe-ia/ ; les anciennes previews restent disponibles sous previews/v4.0.0/ et previews/v3.2.0/ après migration vérifiée.

Lire [WORK_STATE.md](WORK_STATE.md) pour reprendre. [Architecture](docs/ARCHITECTURE.md), [workflow](docs/WORKFLOW.md), [changelog](docs/CHANGELOG.md), [validation](docs/VALIDATION.md), [audit et archives](docs/REPOSITORY_AUDIT.md).

Méthode inspirée de [GamePanel](https://github.com/MrMekouil/GamePanel) : checkpoints récupérables, état compact, preuves et validation avant release, sans importer son architecture Python ni ses branches par lot.

Bibliothèque IMG.LY sous AGPL-3.0 : [source et licence](https://github.com/imgly/background-removal-js).
