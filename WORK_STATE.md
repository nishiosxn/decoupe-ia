# Découpe AI — état opérationnel

- Base : `origin/main` a00a3169ad66c6c38af5f38884d8c664b7a35735, v3.1.0.
- Travail : `codex/simple-background-removal`, candidate simple v5.0.0.
- Périmètre : import → ISNet local → PNG transparent ; aucun pinceau ou outil expérimental.
- Source : `outputs/decoupe.html` et `outputs/background-worker.js`, copies dans `dist/`. Archives intactes, favicon réutilisé, Cloudflare inchangé.
- Invariants : dimensions originales, RGB décodés originaux, alpha strictement 0/255 (seuil 128), pas de réduction silencieuse ; refus explicite au-delà de 32 MP / 16384 px.
- Réalisé : interface responsive, worker annulable/libéré, erreurs et reprise, import non destructif, URL révoquées ; CI de vérification et artefact statique sans déploiement.
- Vérifié : 3 tests pixels/cohérence et 4 parcours Chrome, dont mobile, réussis ; contrôle PowerShell réussi.
- En cours : tests photographiques IA réels ; téléchargement des vrais poids très lent, miroir local avec contrôle SHA256 en préparation.
- Pages : configuration vérifiée le 2026-10-09, source `preview/github-pages-v4.0.0` à `/`. Ne pas la remplacer : une seule publication Pages par dépôt, preview simultanée impossible sur une branche indépendante sans affecter cette configuration.
- Reste : terminer tests réels, documenter qualité et limites, revue finale, commit/push de la branche. Aucun merge, tag ni déploiement Cloudflare.
