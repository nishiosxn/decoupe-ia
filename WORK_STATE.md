# Découpe AI — état opérationnel

- Stable : **v5.2.0**, fonctionnement validé par l’utilisateur ; intégration et publication explicitement autorisées le2026-10-10. Main/Cloudflare encore V3.1.0 avant cette release.
- Lot actif : work/v5.2.0-release depuis develop870fe95. Code src/ et dist/ identiques à la version approuvée ; aucun changement du moteur.
- Méthode : main + une branche work temporaire par version ; aucune develop permanente après publication vérifiée.
- Terminé : audit propre, références distantes vérifiées, documentation de release et CI main/work adaptées. Serveur localV5.2.0 HTTP200.
- Validations PASS : npm ci, check (9 unitaires), check:release, 19 parcours Playwright desktop/mobile/tactile émulé, diff et source/distribution identiques à develop870fe95. Deux tests IA opt-in exclus de la suite standard.
- Cloudflare : check Workers Builds sur main confirme Worker decoupe-ia, compte955bb4f9225dcdf53f583c87f4a62edd ; Wrangler local non authentifié. Attendre le déploiement automatique après merge, puis vérifier la production.
- Restant : validations, push/PR/merge, tagv5.2.0, publication et parcours public, nettoyage develop/work et examen branche Cloudflare.
- Prochaine action exacte : pousser la clôture et ouvrir la PR ; attendre les contrôles avant merge autorisé, puis publication et vérification publiques.
