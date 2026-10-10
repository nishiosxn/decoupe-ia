# Découpe AI — état opérationnel

- Stable : **v3.1.0**, main a00a316 ; tag v3.1.0 sur9105f4b, inchangé. Cloudflare public V3.1.0.
- Développement : develop, candidate V5.2.0 avec corrections, comparateur et filigrane. Checkpoints : audit bb46276 ; architecture/CI dab55f2 ; clôture/Pages/nettoyage655b5dd.
- Lot : réorganisation et workflow terminés, sans changement fonctionnel ni modèle IA. Source unique src/ ; dist/ généré ; état unique ici.
- Terminé : 9 archives Git distantes vérifiées par fetch indépendant/fsck ; 14 snapshots récupérables ; 8 branches retirées après vérification des pointes, PR et remplacement Pages.
- Preview : https://nishiosxn.github.io/decoupe-ia/ ; Actions develop après CI ; anciennes previews sous previews/v4.0.0/ et previews/v3.2.0/. Publication et ressources publiques vérifiées.
- Validations PASS : npm ci, build/validate, 9 unitaires, 19 Playwright, 1 essai ISNet réel global+local, dry-run Cloudflare7 assets, CI/Pages run38046087117, smoke navigateur public3 versions, garde-fou release (3 cas sur copie jetable) et diff.
- Non exécuté : téléphone physique, nouvelle campagne5 images, CI sur main (workflow non intégré), merge/tag stable/déploiement Cloudflare.
- Reste : vérification du dashboard Cloudflare avant retrait de codex/cloudflare-static-hosting, conservée sur décision utilisateur. Deux branches permanentes + cette exception temporaire. Aucun autre blocage.
- Prochaine action exacte : poursuivre les futures demandes sur develop ; pour finir le nettoyage, vérifier la branche liée au dashboard Cloudflare avant suppression. Promotion V5 en main uniquement après autorisation utilisateur explicite et contrôle release.
