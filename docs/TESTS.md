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

Résultats photographiques : en cours de validation, à compléter avant livraison.
