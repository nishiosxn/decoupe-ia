# Benchmark qualité V5.3

CP1 : 33 inférences réelles sur11 images. Trois moteurs, mêmes entrées commises et vérifiées. Corpus et licences : tests/fixtures/quality/README.md ; audit : AI_AUDIT_V53.md. Source anime originale signalée par l’utilisateur non disponible.

Les six composites ont une vérité terrain issue de l’alpha source. Les cinq photos n’en ont pas. IoU/Dice/FP/FN/rappel de bord2px et rappel des petits détails sont calculés uniquement sur les composites. Pas de score photo inventé. Les six composites partagent un dessin ou une géométrie : pas six illustrations indépendantes. Les traits ajoutés et le chapeau sont des adaptations artificielles.

| Image | V5.2 IoU | SkyTNT IoU | BiRef512 FP32 IoU | Observation |
|---|---:|---:|---:|---|
| anime-complex | 92.54 % | 94.56 % | 96.62 % | BiRef conserve davantage de sujet ; quelques pixels de fond restent. |
| anime-hat | 91.83 % | 95.30 % | 97.00 % | Chapeau complet ; moins de faux négatifs avec BiRef. |
| fine-lines | 91.91 % | 82.83 % | 84.56 % | Régression IoU, plaques du fond conservées avec les deux candidats. ISNet classique reste accessible. |
| internal-openings | 77.92 % | 47.37 % | 99.54 % | BiRef supprime la véritable ouverture ; pas de remplissage automatique. |
| similar-colors | 9.52 % | 77.73 % | 9.32 % | Échec ISNet/BiRef sur la masse presque ton sur ton. SkyTNT conserve la masse mais remplit l’ouverture. |
| high-resolution | 91.02 % | 95.34 % | 96.69 % | BiRef moins de pertes de sujet, mais bord2px moins précis que la référence : résolution native512 limitante. |
| portrait | — | — | — | Résultats ISNet/BiRef visuellement proches ; SkyTNT masque vide. |
| fur | — | — | — | Chien conservé avec ISNet/BiRef, pas une validation de chaque poil ; SkyTNT vide. |
| object-plain | — | — | — | Deux montres conservées ; micro-ouvertures imparfaites. SkyTNT vide. |
| object-complex | — | — | — | Voiture conservée ; BiRef garde légèrement plus de pare-chocs. SkyTNT vide. |
| red-shoe | — | — | — | Chaussure conservée malgré fond rouge ; SkyTNT vide. |

Seuils96/112/128/144/160 comparés dans quality-v5.3-models.json. Pas de valeur universelle meilleure sur ce petit corpus : conserver0,5 sur les probabilités, avant éventuel raffinement guidé. Les probabilités flottantes de V5.3 évitent la quantification précoce du runtime de référence.

Temps observés à chaud : V5.2 ~10,4–11,5s, BiRef FP32 ~6,9–8,2s et SkyTNT ~11–12s, sur cet ordinateur. Premier cas ~21s/15s/14s respectivement, ressources candidates préchargées ; ces durées ne mesurent PAS le téléchargement Internet initial. Les mesures totalMs comprennent l’évaluation des métriques et l’encodage de l’image de diagnostic ; inferenceMs des candidats isole session.run et reconstruction. heap est le tas JS, PAS le pic WASM/processus. Pas de téléphone physique testé.

BiRef512 FP32 :191877254octets ; FP16 :98484532octets, qualification distincte CP2/CP4. SkyTNT :176069933octets ; référence FP16 :88152708octets. BiRef1024 :224005088octets, graphe chargé puis échec CPU/WASM (erreur numérique245867056), sans score de qualité exploitable. Modèles haute résolution plus lourds non qualifiés, non intégrés.

Reproduction (téléchargement statique gratuit, sans API d’inférence) : npm ci ; node scripts/benchmark/prepare.mjs ; npm run build ; node scripts/benchmark/server.mjs dans un terminal ; node scripts/benchmark.mjs dans un autre. Le serveur4180 sert les poids vérifiés et dist. Le script de préparation extrait le worker baseline du tag v5.2.0. BENCH_MODELS et BENCH_CASE limitent le périmètre ; BENCH_OUT choisit un nouveau répertoire pour une nouvelle campagne. Une reprise saute les résultats présents, sans les recalculer. node scripts/benchmark/contact-sheet.mjs produit une planche complète dans work/v53.

Ces observations ne justifient pas une release stable ni la promesse d’un détourage parfait. Les cas ratés restent dans le corpus et doivent être signalés à la validation.
