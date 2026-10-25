# Audit V5.3 — 2026-10-25

## Base et périmètre

main distant et tag v5.2.0 : 4f01851b3be6f2bb0d2795e769d779e1f2080225, vérifiés avant création de work/v5.3.0-quality-segmentation. Arbre propre, aucune modification perdue. La branche work/v5.2.0-release (9cf52f2) et PR documentaire #2 restent ouvertes : elles sont conservées, sans merge ni suppression dans ce lot. codex/cloudflare-static-hosting et tous les tags d'archives restent intacts. Pas de changement Cloudflare, de main ou de tag stable.

## V5.2 mesurée

Le worker charge @imgly/background-removal1.7.0, ISNet FP16, CPU/WASM, rescale=true. Source officielle inspectée : [inference.ts](https://github.com/imgly/background-removal-js/blob/12f56cc4f2a90d624e165a715748d22efc7a1d93/packages/web/src/inference.ts), utils.ts et ressources1.7.0.

- Entrée : RGBA décodé original ; étirement bilinéaire1024×1024 sans conservation du ratio. NCHW float32, (RGB-128)/256. Les couleurs utilisées à l'export ne sont pas ces couleurs normalisées.
- Sortie native : probabilité float1024×1024, accessible directement via ONNX. L'API IMG.LY la quantifie en uint8 avant agrandissement, rééchantillonne puis crée un masque RGBA ; l'app extrait seulement alpha. Double perte : résolution spatiale puis quantification anticipée. segmentForeground n'expose pas le tenseur float.
- Binarisation : alpha>=128 et alpha original>0. Le seuil n'identifie pas un sujet : il coupe une probabilité déjà produite. Baisser ce seuil peut récupérer des mèches ET du fond. Seuils96/112/128/144/160 comparés, sans changement arbitraire de la valeur centrale.
- Les erreurs sémantiques (cheveu supprimé avec confiance, trou intérieur, accessoires manquants) ne se corrigent pas par un lissage. Les prédictions partielles ne distinguent pas automatiquement une ouverture réelle d'une erreur.
- Les franges viennent aussi du RGB mélangé au fond dans la source : la V5.2 recopie ces couleurs sans décontamination. Un alpha binaire ne peut pas décomposer à lui seul ce mélange.
- Mémoire : au minimum original4N + masqueN + PNG/canvas4N + copies du Blob et RGBA worker ; l'API crée aussi le masque RGBA4N avant extractionN. Modèle88 152 708 octets, entrée float12MiB et activations WASM supplémentaires. Les tailles des tableaux ne constituent pas une mesure de pic mémoire ; performance.memory n'inclut pas tout le moteur WASM.
- Chaque traitement global détruit le worker/session ; les crops d'une même correction réutilisent une session, puis la détruisent. Annulation par terminaison, état source immuable. Comparateur/fonds/guide ne lancent pas d'inférence.

## Licences et candidats

| Élément | Code | Poids | Décision initiale |
|---|---|---|---|
| IMG.LY1.7.0 | AGPL-3.0, pas MIT | manifeste tiers annonce MIT pour ISNET, dépôt original DIS Apache2.0 | Référence V5.2 de benchmark ; retrait de la bibliothèque du runtime V5.3 pour éviter une obligation de distribution AGPL non résolue par un simple lien vers un dépôt privé |
| ISNet/DIS | Apache2.0 [original](https://github.com/xuebinqin/DIS/blob/main/LICENSE.md) | poids provenant du modèle ISNet, artefact FP16 IMG.LY1.7.0 identifié par SHA256 | Secours indépendant via ONNX Runtime ; licence originale Apache fournie, ne pas remplacer par l'étiquette MIT contradictoire du manifeste tiers |
| SkyTNT anime | Apache2.0 [code](https://github.com/SkyTNT/anime-segmentation/blob/55d874013a2811cdf59c365059174c7823acf5b4/LICENSE) | [carte des poids Apache2.0](https://huggingface.co/skytnt/anime-seg/tree/493cb60893f47441b26ec4fb9a306bce9e342982) | ONNX1024,176069933octets, faisable CPU ; absent sur les photos. Moins bon que BiRef512 sur les composites anime principaux : non retenu dans l'app |
| BiRefNet / SwinT Lite | [MIT](https://github.com/ZhengPeng7/BiRefNet/blob/main/LICENSE) | [MIT original](https://huggingface.co/ZhengPeng7/BiRefNet_lite), [conversion512 et licence explicite des poids](https://huggingface.co/studioludens/birefnet-lite-512/tree/962e67969ec6acec9c19fab76acee4f5e22e990c) |512 FP32 fonctionne ; FP16 en qualification. Fichier licence conservé avec copyright ZhengPeng et Studio Ludens |
| BiRefNet Lite1024 ONNX | MIT | [conversion MIT](https://huggingface.co/onnx-community/BiRefNet_lite-ONNX/tree/de15b22ba131738a16dff04aab8bdf8dc32e3ac1) | Graphe chargé, inférence WASM échoue avec erreur runtime numérique245867056. Non intégré ; aucun résultat de qualité inventé |
| BiRefNet généraliste / haute résolution | MIT | MIT, variantes beaucoup plus lourdes | Non qualifiées sur appareils modestes ; pas intégrées. Aucun essai navigateur réussi revendiqué |
| ONNX Runtime Web1.22.0 | [MIT Microsoft](https://github.com/microsoft/onnxruntime/blob/v1.22.0/LICENSE) | sans objet | Runtime indépendant retenu ; version CDN figée |
| BRIA RMBG2.0 | conditions commerciales incompatibles | conditions incompatibles | Explicitement exclu, aucun poids téléchargé |

Les licences du code ne valent pas autorisation implicite sur les poids : les cartes des modèles ont été examinées séparément. Apache implique conservation du texte, des attributions et notices applicables ; MIT implique conservation du copyright et permission. Notices livrées avec le site. L'AGPL permet la gratuité mais impose notamment l'accès au code source correspondant et une distribution compatible : cette contrainte ne disparaît pas parce que l'IA tourne dans un navigateur. La V5.2 de référence reste archivée ; le nouveau runtime n'importe plus son code AGPL.

Pas d'API d'inférence, d'image envoyée à un tiers, de clé, de serveur GPU ni de service Cloudflare ajouté. Seuls JS/WASM/poids statiques sont téléchargés. Poids exclus de Git. Les serveurs de benchmark locaux ne font aucune inférence : Chrome exécute réellement les graphes.

## Résultats et décision

33 inférences réelles sur11 images : baseline V5.2, SkyTNT1024 et BiRef512 FP32. Détails, SHA256 des entrées, seuils et scores dans QUALITY_BENCHMARK.md et quality-v5.3-models.json. Des composites avec alpha source connu et de vraies photographies sont distingués ; aucun score photo inventé. L'image exacte signalée par l'utilisateur est absente.

BiRef512 est retenu comme candidat généraliste : amélioration des composites anime/chapeau/haute résolution et de l'ouverture interne ; photos visuellement comparables. Le cas ton sur ton reste mauvais, les traits artificiels fins constituent une régression. SkyTNT n'est pas chargé en plus : son avantage isolé sur le cas ton sur ton ne compense pas ses échecs généralistes et ses erreurs d'ouvertures. Préserver ISNet à la demande pour comparer/récupérer un résultat classique. Aucune classification automatique hasardeuse et aucune double inférence systématique.
