# Découpe AI — WORK_STATE

Ce fichier est la source de vérité **opérationnelle du travail en cours** pour les agents Codex.

## Base stable

- Version stable actuelle : **v3.1.0**
- Branche stable principale : **main**
- Dernier commit main observé avant ce lot : **a00a3169ad66c6c38af5f38884d8c664b7a35735**
- Déploiement : Cloudflare Workers sert le dossier `dist`; un push sur `main` peut déclencher la publication.

## Lot courant — v3.2.0 candidate : pinceau intelligent par région

**Statut : implémenté sur `codex/intelligent-zone-brush-v3.2.0`, validation navigateur réelle encore requise avant merge/release.**

### Objectif

Transformer Ajouter/Enlever en prompts spatiaux intelligents. Le pinceau ne doit plus être une gomme/restauration brute limitée aux pixels peints : il indique une région que le moteur doit détecter et corriger de façon cohérente.

### Réalisé

- `outputs/decoupe.html` et `dist/index.html` passent en v3.2.0 candidate et restent strictement identiques.
- Chaque groupe de traits lance une inférence ISNet locale avec davantage de contexte.
- Le cœur du trait fournit des exemples de couleur ; la sélection combine ces exemples, la continuité locale entre pixels et la confiance ISNet.
- La région détectée est étendue et adoucie avant fusion.
- Ajouter restaure la région détectée vers l’alpha original ; Enlever la retire vers la transparence.
- Une région ambiguë provoque un refus sans détruire le masque précédent ni les traits.
- La grille de sélection est plafonnée (760 px de côté / 360 000 cellules) pour limiter mémoire et CPU.
- Aide UI et accessibilité du canvas mises à jour.
- URLs Blob source/résultat libérées sur `pagehide`.
- Documentation architecture/tests/versions mise à jour.

### Architecture confirmée

- Frontend : application statique monofichier HTML/CSS/JavaScript.
- Moteur IA : `@imgly/background-removal@1.7.0`, ISNet FP16, exécuté localement dans le navigateur sur CPU.
- Backend applicatif : aucun.
- Clé/API IA : aucune ; aucun jeton ChatGPT n’est utilisé.
- Source active : `outputs/decoupe.html`.
- Distribution : `dist/index.html`, identique à la source.
- Hébergement : Cloudflare Workers Assets via `wrangler.jsonc`.
- Tests automatisés disponibles : `scripts/check.ps1` (syntaxe JS, identité source/dist, archives).

### Validation effectuée

- Le JavaScript modifié a été parsé avec `new Function(...)` avant écriture GitHub : **OK**.
- Source et distribution ont été écrites à partir de la même chaîne de contenu : même blob Git après mise à jour initiale.
- Validation navigateur interactive : **à faire** sur image réelle avant merge.

### Reste à faire

- Tester dans un vrai navigateur : détourage initial, Ajouter, Enlever, zone ambiguë, annulation, exports, mobile.
- Ajuster les seuils de sélection si les tests réels montrent une extension trop large ou trop courte.
- Exécuter `./scripts/check.ps1` dans un environnement Windows/PowerShell si disponible.
- Ne merger dans `main`, ne taguer et ne publier qu’après validation explicite.

## Contraintes confirmées

- Préserver l’image originale et le dernier masque valide.
- Les retouches doivent rester locales autour du prompt.
- Les anciennes archives sous `outputs/versions/` sont immuables.
- Aucun secret ne doit être ajouté au frontend.
- Pas de merge/tag/deploy sans demande explicite.
