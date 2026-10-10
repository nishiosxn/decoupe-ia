# Workflow

## Reprise et checkpoints

Lire WORK_STATE.md, vérifier branche/status/diff/log puis ouvrir seulement les fichiers concernés. Les preuves acquises ne sont réexécutées que si le contrat change, si une régression apparaît ou si un doute concret le justifie. WORK_STATE contient stable, candidate, périmètre, acquis, reste, preuves, blocage et prochaine action ; Git contient l’historique exact. Aucun ASSISTANT_STATE supplémentaire : un état distinct n’apporte ici aucune utilité.

Demande → état réel → développement sur develop → tests ciblés → validation finale adaptée → mise à jour WORK_STATE → commit cohérent → push. Pas de branche par demande. Une branche temporaire est exceptionnelle : justifier le risque, intégrer et nettoyer après vérification.

Avant interruption : mettre à jour l’état, checkpoint si cohérent, ne pas supprimer le travail incomplet. Restitution compacte : commits, PASS/FAIL/non exécuté, limites et blocage. Les modèles/outils et l’historique de conversation ne sont pas recopiés dans les documents.

## Validation

npm ci ; npm run check ; npm run test:browser ; git diff --check. CI reconstruit et exige git diff --exit-code -- dist. Tests ciblés pendant le développement ; suite finale une fois le lot cohérent, puis seulement les reprises justifiées par des corrections. Un changement de chargement IA exige une inférence réelle opt-in et une preuve explicite ; aucune simulation ne vaut une qualification du modèle.

Les garanties RGB, dimensions, masque binaire, isolation des corrections, annulation, filigrane et exports restent obligatoires. Les limites et tests non exécutés sont dans docs/VALIDATION.md.

## Preview

Push develop → validations → staging Pages depuis dist/ + archives → déploiement GitHub Pages par Actions. Même URL publique ; anciennes previews sous /previews/v4.0.0/ et /previews/v3.2.0/. Un échec CI empêche la publication. Main n’est pas la source Pages. Une preview n’autorise ni une release ni Cloudflare.

## Release : autorisation utilisateur obligatoire

Après validation utilisateur explicite : audit final de develop et main, synchronisation de la version stable avec la candidate dans README/WORK_STATE/changelog/validation/métadonnées, retirer la présentation de candidate pour la version approuvée, puis npm run check et npm run check:release, tests pertinents. Préparer l’intégration contrôlée dans main ; ne pas la réaliser sans demande explicite. Vérifier ensuite le commit main, lancer le déploiement Cloudflare seulement si autorisé et vérifier l’URL/version servie. Un tag vX.Y.Z nécessite son autorisation et doit pointer exactement sur la release validée. Aucun tag stable n’est déplacé ; correction documentaire ultérieure = commit normal.

La CI main n’est active qu’une fois le workflow autorisé intégré à main. Ce lot conserve main et son déploiement existant intacts ; aucun workflow Cloudflare n’est inventé.

## Archives et nettoyage

Avant retrait : état distant fraîchement relu, commits uniques comparés, PR/publications contrôlées, archive explicite poussée si nécessaire, tag résolu égal à la pointe et fichiers récupérables. Utiliser git show ou git archive depuis les tags recensés dans docs/REPOSITORY_AUDIT.md. Une version divergente archivée n’est pas présentée comme fusionnée. Ne jamais supprimer une branche encore utilisée par une publication. Si la liaison d’un hébergeur n’est pas vérifiable, conserver la branche jusqu’à arbitrage. Aucun nettoyage automatique aveugle après release.
