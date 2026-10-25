# Corpus V5.3

Ces fichiers servent uniquement aux essais : ils ne sont pas publiés dans dist/.
L'image du personnage au chapeau mentionnée par l'utilisateur n'était pas disponible.

Wikipe-tan : Kasuga et Editor at Large, [original SVG](https://commons.wikimedia.org/wiki/File:Wikipe-tan_full_length.svg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Le SVG est conservé sans modification. Les composites anime-complex, anime-hat (chapeau ajouté), fine-lines (mèches ajoutées) et high-resolution sont des adaptations sous la même licence, produites par scripts/benchmark-fixtures.mjs. Fond géométrique original. Ils ne représentent pas des annotations humaines de scènes naturelles. La vérité terrain est l'alpha du dessin avant composition, binarisé à128 ; les pixels mélangés aux contours restent un cas difficile.

internal-openings et similar-colors : géométrie originale, CC0-1.0. Anneau avec véritable ouverture ; aucune photographie ni modèle prédit ne sert à fabriquer leur vérité terrain.

Photographies sous la [licence Unsplash](https://unsplash.com/license), téléchargées en largeur600, qualité90. Réutilisation autorisée, hors revente brute et service concurrent de banque d'images. Pas de vérité terrain : observation visuelle uniquement. Les noms historiques corgi.jpg et car-1.jpg désignent ici les nouvelles photographies attribuées ci-dessous, pas les anciennes fixtures d'origine indéterminée.

| Fichier | Source exacte |
|---|---|
| person.jpg | https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=90 |
| corgi.jpg | https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=90 |
| watch.jpg | https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=90 |
| car-1.jpg | https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=90 |
| shoe.jpg | https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=90 |

manifest.json conserve les SHA256 et les conditions. Garder les fichiers binaires commis pour reproduire la comparaison sans dépendre d'une réponse future du fournisseur. Regénération des composites : node scripts/benchmark-fixtures.mjs (Chrome installé, Node22+). Ce petit corpus de qualification n'est ni un jeu d'entraînement ni une mesure universelle de qualité.
