# Découpe AI — état opérationnel

- Base du lot : `codex/simple-background-removal` V5.0.0, commit `c01667fe69a549afb084141d427b1cf3e106c76f`, synchronisé avec GitHub.
- Travail : `codex/v5.1-compare-backgrounds`, candidate V5.1.0.
- Périmètre : comparateur avant/après et trois fonds ; aucun pinceau ni modification IA.
- Réalisé : cadre unique proportionnel ; résultat révélé à gauche, original à droite ; 0/50/100 %, souris/tactile par Pointer Events et capture, range accessible au clavier/ARIA ; contrôles masqués avant détourage et réinitialisés à chaque image.
- Fonds : Transparent par défaut (damier CSS), Blanc, Noir ; changement instantané sans copie ni inférence. Export transparent réutilisé ; fond opaque composé à la demande par Canvas. Dimensions et couleurs du sujet conservées.
- Ressources : un seul PNG détouré de référence ; Canvas opaque temporaire et URL de téléchargement nettoyés ; actions incompatibles bloquées pendant l’export.
- Source : `outputs/decoupe.html` identique à `dist/index.html`. Worker et seuil alpha 128 inchangés par rapport à V5.0.0. Archives, favicon et `wrangler.jsonc` intacts.
- Validation locale : 3 tests pixels/cohérence, 13 tests navigateur (5 existants + 8 nouveaux) ; clavier, souris, véritables événements tactiles émulés, alignement portrait/paysage, desktop/mobile, exports redécodés 0/255 ou opaques, aucun recalcul IA, imports répétés. Test photographique IA opt-in non relancé : le moteur est inchangé, résultats V5 conservés dans docs/TESTS.md.
- Vérification visuelle : desktop 1440 px et mobile 390 px, portrait avec son masque réel V5 réutilisé. Pas de test sur téléphone physique.
- Validation finale : build, contrôle PowerShell, syntaxe et `git diff --check` réussis. IA, seuillage et Cloudflare comparés à la V5 : identiques. CI étendue à cette branche, sans déploiement.
- Publication : conserver `http://127.0.0.1:4173/decoupe-ia/` pour les essais locaux. Pages reste sur `preview/github-pages-v4.0.0` ; aucune modification demandée dans ce lot.
- Production : `main` reste a00a3169ad66c6c38af5f38884d8c664b7a35735 ; aucun merge, tag ni déploiement Cloudflare.
- Livraison sur la branche dédiée ; consulter Git pour le commit courant. Aucun développement restant dans ce lot.
