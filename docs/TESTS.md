# Validation de la candidate simple

## Vérifications automatiques

- `npm run check` : seuillage alpha 0/255, immutabilité et RGB, masque incohérent refusé, source/distribution identiques ; build statique.
- `./scripts/check.ps1` : syntaxe de la page, numéro visible, copie de distribution, intégrité des archives historiques.
- `npm run test:browser` : import, aperçu, PNG réellement téléchargé et redécodé, dimensions, alpha binaire et couleurs opaques, changement d’image, annulation, erreur, import invalide, dépôt et verrouillage. Ordinateur et mobile 390 × 844 sous Chrome. Le moteur est simulé dans cette suite rapide : elle ne prouve pas la qualité de segmentation.

## Essais IA réels reproductibles

```powershell
node scripts/test-images.mjs
$env:REAL_AI = '1'
npm run test:browser -- --grep 'real ISNet'
```

Images publiques téléchargées dans `work/fixtures`, ignorées par Git. URLs exactes dans `scripts/test-images.mjs` : portrait Unsplash, montre sur fond uni Unsplash, voiture rembg, plantes rembg, chaussure rouge sur fond rouge Unsplash. Les images peuvent changer chez leurs fournisseurs ; conserver les entrées locales pour comparer une régression.

Le test réel télécharge ISNet et exécute réellement l’inférence. Il contrôle le PNG téléchargé pour chaque photo : dimensions originales, pixels conservés et supprimés, aucune transparence partielle, RGB des pixels opaques identiques aux pixels originaux décodés. Résultats locaux et mesures dans `work/results/`.

Un miroir de poids préchargés peut être fourni via `AI_MODEL_MIRROR` pour contourner la lenteur réseau de l’environnement de test. Il ne remplace ni le modèle ni l’inférence. Les essais visuels sont nécessaires en plus des invariants : un masque incorrect peut néanmoins être binaire et à la bonne taille.

## Limites de la preuve

Ces images ne sont pas un benchmark annoté : pas de score IoU ni de garantie de conservation de chaque cheveu. L’émulation mobile vérifie le parcours et la mise en page, pas la mémoire ni les performances d’un téléphone physique. Aucun test ne justifie l’expression « détourage parfait ». Les contours binaires ne peuvent pas rendre les transparences physiques.

## Résultats observés le 2026-10-09

Chrome installé sous Windows, CPU/WASM, vrai ISNet FP16 1.7.0. Les ressources Static IMG.LY ont été préchargées sur un miroir local et vérifiées contre les SHA-256 du manifeste officiel. Aucune simulation du masque dans ces cinq essais. Le temps inclut le démarrage du moteur, l’inférence et le téléchargement du PNG, mais pas le téléchargement Internet initial des poids.

| Image                       | Dimensions du PNG | Durée  | Observation visuelle                                                                                                                                                                                  |
| --------------------------- | ----------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portrait                    | 600 × 900         | 20,1 s | Visage, vêtement sombre et masse des cheveux conservés ; fond noir supprimé. Pas de validation cheveu par cheveu.                                                                                     |
| Montres sur fond clair      | 600 × 436         | 15,9 s | Les deux montres blanches conservées, fond clair supprimé ; les très petites ouvertures restent imparfaites.                                                                                          |
| Voiture, scène complexe     | 480 × 360         | 15,3 s | Voiture conservée et décor supprimé ; la personne adjacente est aussi conservée. Le modèle ne choisit pas systématiquement un sujet unique.                                                           |
| Plantes et étagère          | 987 × 1481        | 27,6 s | Nombreux contours de feuilles conservés, mais étagère et plantes périphériques partiellement supprimées ; fragments résiduels. Cas visuellement insatisfaisant pour conserver l’ensemble du mobilier. |
| Chaussure rouge, fond rouge | 600 × 400         | 16,4 s | Chaussure et lacets conservés, fond rouge supprimé malgré les couleurs proches.                                                                                                                       |

Pour **les cinq PNG téléchargés et redécodés** : dimensions égales aux originales, pixels opaques et transparents présents, **0 pixel d’alpha intermédiaire**, **0 différence de RGB sur les pixels opaques**. Mesures brutes et empreintes des fichiers d’entrée dans [validation-simple.json](validation-simple.json).

Décision : conserver ISNet pour cette base simple, sans prétendre améliorer sa reconnaissance par un nettoyage arbitraire des couleurs ou des trous. Le cas des plantes démontre une limite réelle de segmentation, que le seuillage ne résout pas. Un essai exploratoire de BiRefNet Lite 512 n’a pas fourni de comparaison exploitable dans cet environnement (échecs de chargement du modèle dans le navigateur) ; aucune supériorité n’est revendiquée et cette dépendance n’est pas intégrée.

La suite rapide compte 3 tests pixels/cohérence et 5 parcours navigateur réussis. Le test photographique réel distinct réussit les invariants sur les cinq images ; sa réussite ne signifie pas que tous les masques sont satisfaisants visuellement. La CI vérifie la suite rapide, le build et publie un artefact statique sans déployer Pages ou Cloudflare.

Essai IA complémentaire : chaussure exécutée avec viewport mobile 390 × 844, traitement et téléchargement réels réussis en 12,0 s sur le même ordinateur ; dimensions 600 × 400, alpha intermédiaire=0 et différence RGB opaque=0. Cela ne mesure pas la vitesse d’un téléphone physique.

## V5.1.0 — comparateur et fonds

8 nouveaux tests navigateur, en complément des 5 parcours V5 :

- Curseur initial à 50 %, navigation Home/End/flèches et déplacement souris ; rendu effectivement contrôlé à 0/50/100 % à partir des pixels d’une capture du cadre.
- Vrai geste tactile émulé par Chrome (touchStart/touchMove/touchEnd), capture et bornes en dehors du cadre.
- Rectangles de l’original et du résultat strictement égaux, ratios paysage et portrait conservés, desktop/mobile et changement de viewport, sans débordement horizontal.
- PNG téléchargés puis redécodés : fond transparent alpha 0/255 ; blanc #FFFFFF et noir #000000 avec alpha 255 partout ; dimensions et couleurs opaques conservées.
- Plusieurs changements de fond, puis nouvel import et téléchargement ; retour au fond transparent et au curseur 50 %.
- Un seul Worker créé pour chaque détourage, URL du résultat inchangée malgré le déplacement et les fonds : aucune nouvelle inférence.

Validation : `npm run check`, `npm run test:browser` et `./scripts/check.ps1`. Les tests de ce lot simulent uniquement la réponse IA pour isoler la comparaison et les exports ; les essais photographiques réels V5 ci-dessus restent historiques. Aucun modèle, seuil ou code worker n’est modifié. Vérification visuelle de la nouvelle interface en 1440 px et 390 px, avec le portrait et son masque réel déjà calculé lors de V5. L’émulation tactile ne remplace pas un essai sur téléphone physique.

## V5.2.0 — corrections locales

- 6 nouveaux tests unitaires : régions séparées/contextes regroupés, extraction RGBA depuis l’original, continuité des traits et priorité du dernier mode, fusion binaire monotone, protection hors indications, seuil 127/128, alpha original transparent, annulation et cohérence de distribution.
- 4 nouveaux parcours navigateur : apparition des outils après détourage, dessin différé, crop local issu de l’original, ajout et suppression localisés, panne sans mutation partielle, conservation des traits, effacement, annulation, exports trois fonds et comparateur après correction ; desktop/mobile et vrai geste tactile émulé Chrome.
- Essai réel ISNet sur le portrait V5 : deux erreurs de masque délibérément introduites pour isoler la capacité de correction (100 pixels de sujet manquants, 100 pixels de fond conservés). Le recalcul reçoit un crop **372 × 342** sur une image **600 × 900**, depuis l’original. **100 pixels récupérés, 100 supprimés, 0 modification hors indications, 0 alpha intermédiaire**. Annulation vérifiée. Recalcul/encodage local observé : **11,5 s** sur l’ordinateur de test, avec poids préchargés sur le miroir local vérifié de V5. Ce test contrôlé ne prouve pas que toutes les erreurs naturelles d’ISNet sont corrigibles.

Mesures brutes : [validation-local.json](validation-local.json). Reproduction du test réel : préparer le portrait via scripts/test-images.mjs, puis définir LOCAL_AI=1 et lancer npm run test:browser -- --grep 'real ISNet local'. AI_MODEL_MIRROR reste optionnel. Les autres tests simulent la sortie IA pour isoler la géométrie, la fusion et l’UX.

La suppression d’un objet toujours prédit comme sujet est intentionnellement sans effet : ce cas est vérifié par un test unitaire. ISNet n’est pas une segmentation interactive conditionnée par les traits. Les anciennes observations de qualité V5 restent applicables. Aucun test sur téléphone physique n’a été réalisé.
