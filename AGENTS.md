# Découpe AI — règles permanentes

1. Lire WORK_STATE.md avant toute exploration ; vérifier branche, git status, git diff et derniers commits. Le code et l’état réel priment sur les souvenirs.
2. Main est la dernière stable. Pour un nouveau lot explicitement demandé, partir de main sur work/vX.Y.Z-nom ; poursuivre les corrections sur cette même branche, sans en créer une par conversation. Entre deux versions, aucune branche work ni develop permanente. Préserver tout travail non commité ; aucun reset destructif.
3. Chercher avec rg, lire les fonctions/fichiers concernés, élargir seulement si nécessaire. Réutiliser les preuves de checkpoint ; limiter sorties et tests répétés sans masquer les erreurs.
4. Source unique : src/. Ne jamais éditer dist/ ; npm run build le génère. IA dans src/ai/, opérations pures dans src/core/. Garder les chemins publics stables.
5. Invariants : ISNet navigateur sans backend ni clé ; RGB et dimensions originaux ; alpha exporté 0/255 ; crops depuis l’original ; aucune mutation hors indications ; filigrane/comparateur purement visuels.
6. Tester le périmètre touché puis la régression nécessaire. npm run check, npm run test:browser, git diff --check. CI contrôle aussi git diff --exit-code -- dist. Un test non exécuté n’est jamais PASS. Refaire une inférence réelle si le chargement IA change.
7. Checkpoint = bloc cohérent testé, WORK_STATE factuel mis à jour, commit puis push dans le périmètre autorisé. Avant interruption, indiquer acquis, blocage et prochaine action exacte ; ne pas recopier logs ou prompt.
8. Aucun merge main, tag de release ou déploiement Cloudflare sans autorisation explicite. Main reste stable ; la branche work contient le lot courant. Une release autorisée passe par une PR vers main, puis tag et nettoyage vérifiés. Avant release autorisée, synchroniser versions/README/état/changelog/validation et passer npm run check:release ; ne jamais déplacer un tag stable.
9. Pages publie les branches work/** après CI et conserve la stable via main entre deux lots. Ne pas changer une URL/configuration publique sans vérifier son usage et prévenir. Vérifier les publications avant nettoyage Git.
10. Avant suppression d’une branche : comparer commits, PR et publications ; pousser une archive/* si utile et vérifier sa récupération. Ne pas supprimer si le code ou un environnement est à risque ; demander l’arbitrage concerné.

Méthode : docs/WORKFLOW.md. État courant unique : WORK_STATE.md ; aucun état Assistant parallèle.
