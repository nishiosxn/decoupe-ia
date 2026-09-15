# Architecture de Découpe

## Résumé

Découpe est une application statique contenue dans un seul fichier HTML. Elle fonctionne sans serveur applicatif et sans compte utilisateur. Un petit serveur HTTP local est toutefois nécessaire pour autoriser le chargement du modèle IA.

## Fichiers faisant autorité

- `outputs/decoupe.html` est la source active.
- `dist/index.html` est la copie destinée à la publication et doit être strictement identique.
- `outputs/versions/vX.Y.Z/` contient les livraisons figées. Une archive existante n’est jamais modifiée.
- `outputs/VERSIONS.md` explique ce qui a réellement changé, les tests réalisés et les limites connues.

## Moteur de détourage

- Bibliothèque : `@imgly/background-removal` 1.7.0.
- Modèle : ISNet FP16, exécuté côté navigateur sur le processeur.
- Le premier lancement télécharge les fichiers du modèle depuis Static IMG.LY.
- Les images de l’utilisateur ne sont pas envoyées à ChatGPT et aucun jeton ChatGPT n’est consommé.

## État conservé pendant la session

- Pixels RGBA de l’image originale.
- Masque alpha du dernier résultat validé.
- Traits de pinceau en attente.
- Historique permettant d’annuler la dernière retouche IA.
- URL temporaires des aperçus et du résultat.

Changer d’image réinitialise entièrement cet état. Recharger la page le perd également.

## Parcours principal

1. Import par fichier, glisser-déposer, `Ctrl + V` ou bouton « Coller l’image ».
2. Détourage global par ISNet.
3. Correction facultative avec Ajouter ou Enlever.
4. Chaque zone peinte est analysée sur les pixels originaux, avec du contexte autour.
5. Seule la zone couverte est fusionnée dans le masque existant.
6. Export PNG, WebP, JPG ou SVG contenant un PNG intégré.

## Invariants à préserver

- L’image originale ne doit jamais être remplacée par l’aperçu détouré.
- Une retouche locale ne doit pas recalculer les zones non peintes.
- Un échec d’inférence ne doit pas détruire le dernier masque valide.
- L’export est bloqué lorsque des traits n’ont pas encore été appliqués.
- `outputs/decoupe.html` et `dist/index.html` doivent rester identiques.
- Le SVG n’est pas vectorisé : il incorpore une image PNG.

## Limites connues

- ISNet n’est pas un modèle de sélection d’objet par simple clic comme SAM.
- Le pinceau doit couvrir le détail et un peu de fond pour donner du contexte à l’IA.
- Le collage fonctionne seulement si le presse-papiers contient les pixels d’une image PNG, JPEG ou WebP. Une simple adresse web n’est pas téléchargée automatiquement.
- La qualité finale reste limitée par la résolution de l’image originale et par la reconnaissance du modèle.

