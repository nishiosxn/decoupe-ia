# Découpe AI — état opérationnel

- Base : `codex/v5.1-compare-backgrounds`, V5.1.0 `a684aafa94c42831cae7d553a5f3de4beb59f884`.
- Lot : V5.2.0 `codex/v5.2-smart-local-brush`, corrections locales après détourage.
- Réalisé : Corriger / Ajouter / Supprimer, taille, traits différés, effacement, application locale, annulation d’une correction ; souris/tactile, curseur et feedback. Comparateur et fonds conservés. Export bloqué si des traits attendent l’application.
- IA : worker ISNet FP16 V5 inchangé. Bounding boxes des traits + contexte, regroupement des zones proches, crops originaux, inférences locales séquentielles dans un worker réutilisé puis libéré. Fusion uniquement dans les indications, seuil 128, alpha 0/255. Pas de gomme brute.
- Limite : ISNet ne comprend pas un prompt de trait ; une prédiction inchangée peut laisser la correction sans effet. Supprimer ne force pas la suppression d’un objet prédit sujet. Message explicite et documentation.
- Atomicité : masque courant conservé jusqu’à validation des crops et du PNG ; erreurs/annulation préservent résultat et traits. Historique minimal des seules différences. RGB et dimensions originaux conservés.
- Fichiers : source `outputs/decoupe.html`, module pur `outputs/local-brush.js`, copies dans `dist/`. Tests et docs ajoutés, CI étendue à cette branche.
- Vérifié : suite complète avec 9 tests unitaires et 17 tests navigateur réussis (2 essais IA opt-in exclus de la suite standard) ; tests ajout/correction/export desktop-mobile, retrait et panne atomique, vrai geste tactile émulé. Essai IA réel : crop 372×342 sur portrait 600×900 avec 2 erreurs injectées ; 100 pixels récupérés, 100 supprimés, zéro changement hors indications et zéro alpha intermédiaire ; undo réussi. Voir docs/TESTS.md et docs/validation-local.json.
- Revue finale : affichages desktop et mobile inspectés ; diff et synchronisation source/distribution vérifiés. Livraison par commit/push sur la branche dédiée ; aucun changement des branches historiques.
- Local : conserver http://127.0.0.1:4173/decoupe-ia/ . Pages et Cloudflare inchangés ; pas de merge main, tag ou déploiement.
