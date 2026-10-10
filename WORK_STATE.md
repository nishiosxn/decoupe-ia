# Découpe AI — état opérationnel

- Stable : **v3.1.0**, main a00a316 ; tag v3.1.0 sur9105f4b. Cloudflare public V3.1.0, production inchangée.
- Développement : develop ; candidate V5.2.0 issue de8ffac19 (corrections, comparateur, filigrane).
- Lot : réorganisation du dépôt et workflow, sans changement fonctionnel ni modèle IA.
- Terminé : audit, 9 tags archive/* poussés/vérifiés, séparation src/ai et src/core, build déterministe et validations ; documentation compacte, état unique (pas ASSISTANT_STATE).
- Restant : publication CI/Pages Actions, vérification publique puis nettoyage des 8 branches sûres ; conserver la branche Cloudflare.
- Validation : npm ci, build/validate, 9 tests unitaires, 19 Playwright, 1 essai ISNet réel (global + local), dry-run Cloudflare 7 assets, build Pages et récupération indépendante des archives : PASS. Deux opt-in exclus de la suite standard ; pas de téléphone physique.
- Décision : conserver codex/cloudflare-static-hosting jusqu’à vérification du dashboard (réponse utilisateur). Aucun merge main, tag stable ou déploiement production autorisé.
- Blocage : liaison Cloudflare non vérifiable depuis Git ; reste du lot autonome.
- Prochaine action exacte : pousser le checkpoint, activer Pages Actions et la règle develop, vérifier le déploiement avant nettoyage.
