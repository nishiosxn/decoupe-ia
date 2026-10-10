# Découpe AI — état opérationnel

- Stable : **v5.2.0**, main ; release validée, intégrée par PR #1 et publiée. Commit de release4f01851b3be6f2bb0d2795e769d779e1f2080225, tag v5.2.0 vérifié. Tag historique v3.1.0 inchangé.
- Production : https://decoupe-ia.nishiosamauwu.workers.dev/ vérifiée ; Workers Builds decoupe-ia depuis main, compte955bb4f9225dcdf53f583c87f4a62edd, version042449b4-1b17-4ccd-bc47-b9509aadeecf.
- Développement actif : aucun. Méthode main + work/vX.Y.Z-nom temporaire par version demandée ; aucune develop permanente. Corrections et reprises d’un même lot restent sur sa branche.
- Validations PASS : npm ci, check (9 unitaires), check:release, 19 Playwright locaux, CI release/PR/main, dry-run7 assets ; production7 blobs conformes au tag, 6 parcours publics desktop/mobile, IA réelle globale + crop local via CDN, PNG binaire/RGB/dimensions, annulation. Détails et limites dans docs/VALIDATION.md.
- Pages : https://nishiosxn.github.io/decoupe-ia/ ; main entre deux lots, work/** en preview ; archives V4 et V3.2 préservées. Source et environnement ne dépendent plus de develop.
- Historique : develop intégralement préservée dans main/tag puis supprimée ; tags archive/* conservés. Les branches work intégrées sont retirées après vérification de la clôture et de la publication. Aucun lot fonctionnel actif.
- Exception technique : codex/cloudflare-static-hosting conservée jusqu’à inspection authentifiée du dashboard (configuration de branche non vérifiable, Wrangler non authentifié). Production main fonctionnelle, aucun blocage de publication.
- Non exécuté : téléphone physique et nouvelle campagne cinq images ; aucun échec applicatif restant.
- Prochaine action exacte : attendre une nouvelle demande avant de créer une branche work. Pour retirer l’exception Cloudflare, vérifier d’abord ses éventuelles références dans le dashboard.
