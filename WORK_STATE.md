# Découpe AI — état opérationnel

- Stable : **v5.2.0**, main/tag v5.2.0 =4f01851 ; Cloudflare inchangé. Aucun merge, tag ou déploiement production V5.3.
- Candidate : **v5.3.0**, work/v5.3.0-quality-segmentation, issue de main vérifié. PR #2 et branche work/v5.2.0-release antérieures préservées ; archives et codex/cloudflare-static-hosting inchangés.
- CP1–CP5 terminés : audit/licences, corpus11 images, benchmark réel comparatif, BiRef512 FP16 intégré, ISNet secours/classique, confiance float et raffinement guidé, RGB de bord conservateur, cache/session et validation finale. Code applicatif CP4 a59aca4 ; CP5 clôture preuves/tests/docs.
- Choix : WASM par défaut ; WebGPU AMD non qualifié (sorties vides), garde/repli CPU vérifié. Mémoire signalée<=4Go : ISNet direct. Un seul modèle résident, session60s max inactive (15s faible mémoire), libérée à remplacement/annulation/erreur.
- PASS : npm ci (0 vulnérabilité), check18 unitaires,23 Playwright standards ;2 tests IA opt-in séparés (5 PNG réels + correction locale100/100, hors indications0, annulation exacte).11 PNG diagnostics binaires/dimensions conformes, nuance décodage JPEG explicitée dans le benchmark.
- Pages : https://nishiosxn.github.io/decoupe-ia/ ;12 ressources conformes aux blobs Git et archives V3.2/V4 accessibles ; inférence réelle publique et téléchargement PASS. CI/Pages des checkpoints précédents PASS, contrôle automatique à chaque push.
- Qualité : gains anime/chapeau/ouvertures et conservation globale haute résolution ; traits artificiels fins régressent, ton sur ton raté, bords fins/halos non garantis. Original exact de l’utilisateur absent. Aucune promesse de détourage parfait.
- Performances PC mesurées :~9,6s chaud, premier lancement réseau variable ; pic Chrome~2,85Go BiRef/~1,65Go ISNet. Tests de détails : docs/QUALITY_BENCHMARK.md et docs/VALIDATION.md. Téléphone physique, Safari et Firefox non testés.
- Tâches restantes : retour utilisateur et arbitrage des limites avant promotion stable ; aucun blocage technique de livraison.
- Prochaine action exacte : attendre la validation utilisateur sur cette branche ; poursuivre ici les corrections demandées. Aucun merge main/tag/Cloudflare sans nouvelle autorisation explicite.
