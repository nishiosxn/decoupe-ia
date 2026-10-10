# Découpe AI — état opérationnel

- Base fonctionnelle : V5.2.0, codex/v5.2-smart-local-brush, bcb9020.
- Branche : codex/correction-original-watermark.
- Réalisé : couche originale à 20 % entre fond et résultat en correction, sous les traits ; contrôle discret activé par défaut, préférence par image. Aucune interaction ni mutation du masque/export ; comparateur restauré hors correction.
- Moteur IA, fusion locale, historique, versions archivées, Pages et Cloudflare inchangés. Pas de merge main, tag ou déploiement.
- Validé : 9 tests unitaires, 19 tests navigateur desktop/mobile réussis (2 essais IA opt-in non relancés, moteur inchangé), build, scripts/check.ps1, diff sans erreurs. Filigrane et alignement vérifiés visuellement par captures automatisées ; exports trois fonds identiques octet par octet.
- Livraison : commit et push sur cette branche dédiée ; aucun changement des branches historiques.
- Local : http://127.0.0.1:4173/decoupe-ia/ .
