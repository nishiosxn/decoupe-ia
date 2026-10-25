# Découpe AI — état opérationnel

- Stable : **v5.2.0**, main et tag v5.2.0 =4f01851 ; production Cloudflare inchangée.
- Branche active : work/v5.3.0-quality-segmentation, créée depuis origin/main vérifié. PR #2 et branche work/v5.2.0-release conservées ; aucun nettoyage/merge implicite.
- Lot : V5.3 qualité de segmentation, navigateur gratuit ; interface V5.2 et alpha binaire à préserver.
- CP1 terminé : audit moteur/licences, corpus11 images attribuées,33 vraies inférences (ISNet/SkyTNT/BiRef512 FP32), seuils et scores reproductibles. Choix : BiRef512 généraliste, ISNet secours ; SkyTNT non retenu. BiRef1024 échoue en WASM.
- Limites connues : cas ton sur ton raté ; traits artificiels fins régressent, bords haute résolution limités. Image exacte de l’utilisateur absente. Détails : docs/QUALITY_BENCHMARK.md et docs/AI_AUDIT_V53.md.
- Validations CP1 : scripts de benchmark exécutés et SHA256 modèles/entrées vérifiés ; aucun masque simulé pour comparer les moteurs. Pas encore de validation du nouveau runtime intégré.
- CP2 terminé : BiRef512 FP16 qualifié sur11 images, notices et runtime indépendant intégrés, secours ISNet prévu. Inférence réelle via CDN, PNG600×900 binaire, RGB internes intacts. check12 unitaires et19 Playwright PASS (2 opt-in exclus).
- CP3 terminé : rayons1/2/3 mesurés, masque guidé adaptatif, veto RGB aplats, trous confiants préservés. Expérience2 crops (~41s, sans gain IoU face au filtre) exclue de l’app. Métriques frontières précision/rappel/F1 et erreurs intérieures disponibles. Tests ciblés15 PASS après correction d’un cas de test de tolérance (pas de bug métrique).
- En cours : CP4 sessions/cache/mémoire/secours réel ; CP5 validation/preview.
- Publications : Pages existant autorisé sur work ; aucune autorisation main/tag V5.3/Cloudflare. Archives et codex/cloudflare-static-hosting inchangés.
- Prochaine action exacte : réutiliser la session au sein d’une image, mesurer cache/WebGPU/mémoire et valider le secours avant CP4.
