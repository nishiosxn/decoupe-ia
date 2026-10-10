# Audit et consolidation — 2026-10-10

Historique du lot précédant la release : la méthode main/develop décrite ci-dessous a ensuite été remplacée par main + work temporaires. État courant : WORK_STATE.md et docs/WORKFLOW.md.

Audit réalisé avant modification : arbre propre, diff vide, branches locales/distantes concordantes, aucune PR ni GitHub Release dans Découpe AI. Main a00a316 affiche V3.1.0 ; le tag annoté v3.1.0 pointe sur 9105f4b (il ne sera pas déplacé). Cloudflare public affiche V3.1.0 ; wrangler.jsonc sert dist/. Aucun workflow Cloudflare dans la base V5. La liaison Git/configuration du dashboard Cloudflare n’est pas accessible via les fichiers Git ; aucune modification de cette intégration.

Base complète la plus récente : 8ffac19, V5.2.0 + filigrane, descendante de V5/V5.1/V5.2 ; 9 tests unitaires et 19 navigateur acquis au checkpoint précédent. Les expérimentations V3.2/V4 divergent à partir de main : elles ne sont pas prétendues intégrées ni supprimées pour leur nom. Elles sont remplacées dans le parcours actif par V5 mais leur code reste récupérable sous les tags suivants.

## Références avant nettoyage

Commits à droite = absents de 8ffac19, pas forcément uniques aux autres branches. Les tags annotés ont été poussés et leurs commits résolus comparés aux pointes distantes avant retrait.

| Branche | Pointe | Commits à droite | Archive | État initial |
|---|---|---:|---|---|
| codex/cloudflare-static-hosting | d320703 | 0 | archive/codex/cloudflare-static-hosting | Intégré dans la base V5 |
| codex/correction-original-watermark | 8ffac19 | 0 | archive/codex/correction-original-watermark | Intégré dans la base V5 |
| codex/intelligent-zone-brush-v3.2.0 | 3b11028 | 10 | archive/codex/intelligent-zone-brush-v3.2.0 | Divergent, archivé sans fusion fonctionnelle |
| codex/rebuild-studio-v4 | 2a1266e | 11 | archive/codex/rebuild-studio-v4 | Divergent, archivé sans fusion fonctionnelle |
| codex/simple-background-removal | c01667f | 0 | archive/codex/simple-background-removal | Intégré dans la base V5 |
| codex/v5.1-compare-backgrounds | a684aaf | 0 | archive/codex/v5.1-compare-backgrounds | Intégré dans la base V5 |
| codex/v5.2-smart-local-brush | bcb9020 | 0 | archive/codex/v5.2-smart-local-brush | Intégré dans la base V5 |
| preview/github-pages-v3.2.0 | 6d53fb0 | 11 | archive/preview/github-pages-v3.2.0 | Divergent, archivé sans fusion fonctionnelle |
| preview/github-pages-v4.0.0 | f438dc0 | 12 | archive/preview/github-pages-v4.0.0 | Pages actif, conserver jusqu’au remplacement vérifié |

Les anciennes versions outputs/versions/v1.0.0, v2.0.0, v2.0.1, v2.0.2, v2.1.0, v3.0.0 et v3.1.0 existent intégralement dans archive/codex/correction-original-watermark. Leur retrait du checkout actif ne détruit aucun objet historique. Récupération : git show archive/codex/correction-original-watermark:outputs/versions/v3.1.0/decoupe.html ; ou git archive archive/codex/correction-original-watermark outputs/versions. Même méthode pour les autres tags du tableau.

## Publications

Avant migration : GitHub Pages legacy, preview/github-pages-v4.0.0 à la racine ; URL https://nishiosxn.github.io/decoupe-ia/. Derniers déploiements Pages : 6873955906 (V4), 6873388274 (V3.2). Aucune PR ouverte ne référence les branches candidates au nettoyage. Main et son tag stable restent conservés.

Migration prévue : Actions sur develop, même URL de site, candidate V5 à la racine ; copies historiques générées depuis les tags sous previews/v4.0.0/ et previews/v3.2.0/. Suppression des branches preview seulement après vérification HTTP du nouveau site et de ses ressources.

## Principes repris de GamePanel

Étudiés via GitHub API authentifiée : AGENTS.md, WORK_STATE.md, ASSISTANT_STATE.md, docs/ASSISTANT_WORKFLOW.md, README, branches, tags, PR et releases. Dépôt privé, page web non accessible anonymement. Main b770037, stable documentée v0.3.1 / PR19 / tag4738d1a ; une branche et PR22 pour0.3.2. La liste de workflows contient une ancienne entrée review-026 dont le fichier actuel renvoie404 ; aucune automatisation de release actuelle n’est donc présumée.

Principes adaptés : état factuel compact, checkpoints récupérables, validations PASS/FAIL/non exécutées, documentation synchronisée avant release, tags stables immuables, audit avant nettoyage. Les règles Python, versions et rôles Assistant/Work ne sont pas importés. Ici develop est permanent par demande utilisateur ; WORK_STATE suffit, aucun ASSISTANT_STATE dupliqué. Source : https://github.com/MrMekouil/GamePanel .

## Résultat vérifié

CI et publication Actions réussies sur dab55f2 : run38046087117, déploiement Pages6979677854 depuis develop. Configuration Pages build_type=workflow, source metadata develop ; environnement limité à develop après retrait des anciennes règles de preview. Contrôle navigateur public : racineV5.2.0, /previews/v4.0.0/ et /previews/v3.2.0/ répondent200, zéro erreur JavaScript et zéro ressource HTTP en erreur.

Les8 branches du tableau sauf codex/cloudflare-static-hosting ont été supprimées à distance et, lorsqu’elles existaient, localement. Contrôle juste avant retrait : aucune nouvelle PR ouverte, SHA distant égal au tag et au fetch indépendant. Suppression distante atomique avec leases sur les pointes auditées. Main a00a316 et le tag stable (objetce42f12, cible9105f4b) sont inchangés.

Branches conservées : main et develop permanentes ; codex/cloudflare-static-hosting temporairement conservée par demande utilisateur, jusqu’à vérification de la liaison dans le dashboard Cloudflare. Objectif deux branches suspendu uniquement pour cette sécurité de publication. Les9 tags d’archive sont récupérables depuis un fetch bare indépendant, vérifié par git fsck ; les14 snapshots historiques sont présents.
