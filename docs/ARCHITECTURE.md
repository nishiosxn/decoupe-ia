# Architecture v4

## Flux

Fichier → décodage/redimensionnement → `ImageDocument` → masque alpha + RGB retouchés → canvas d’aperçu → export.

L’original est une copie immuable. Le masque contient l’alpha effectif. La sélection est un tableau séparé, représenté par un overlay vert uniquement dans l’atelier. `composite()` copie les RGB et ne modifie que l’alpha : aucune multiplication des couleurs par le masque.

## Retouches

`brushSegment()` rasterise la distance à un segment continu, avec cœur opaque et bord de dureté réglable. Gomme et Restaurer s’appliquent immédiatement, y compris sans détourage préalable. Les points intermédiaires manquants ne créent pas de trous dans le trait. Restaurer récupère aussi les RGB originaux après une reconstruction.

`applySelection()` supprime une zone sélectionnée en mettant son alpha à zéro dans le cœur. Il ne pondère pas l’effacement par une deuxième prédiction de premier plan. L’image originale n’est plus superposée aux trous transparents.

## IA

`AIClient` parle à un module worker. Un seul travail est lancé à la fois ; annuler termine le worker et rejette la requête sans mutation du document. La limite est de cinq minutes sans progression. Les résultats sont validés avant création d’un checkpoint et application.

- BiRefNet Lite : traitement d’image entier, alpha rééchantillonné à la résolution de travail.
- SlimSAM : points positifs/négatifs ; embeddings réutilisés tant que les RGB ne changent pas. Le masque de plus haute confiance est présenté, jamais automatiquement appliqué.
- LaMa : zone sélectionnée avec 96 px de contexte, carré de 512 px sans déformation, masque binaire légèrement étendu. Les couleurs produites sont réinjectées uniquement dans la sélection ; le fond extérieur est intact.
- Texture locale : recherche de patchs connus, propagation et recherche aléatoire sur cinq passes ; zone de travail plafonnée à 384 px, pixels extérieurs conservés. Cette synthèse sans modèle est la reconstruction par défaut, immédiatement disponible.
- Remplissage local : propagation des couleurs connues du bord vers le centre, sans modèle ; adapté aux fonds simples, distinct de LaMa.

Les dépendances sont chargées à la demande depuis des URLs versionnées. Les révisions de modèles sont fixées dans `src/ai/models.js`. Les téléchargements bénéficient du cache du navigateur ; LaMa utilise Cache Storage lorsque disponible.

## Historique et projets

Les checkpoints sauvegardent RGB, alpha et sélection. Annuler/rétablir couvre également les reconstructions. La profondeur vise une enveloppe de 96 Mo, avec deux checkpoints minimum. Limites d’image : 2048 px et 3 MP.

Le format `.decoupe` v1 est JSON avec trois PNG en data URLs : original, pixels retouchés, masque grayscale opaque. À l’ouverture, type, taille, dimensions et cohérence sont vérifiés. Aucun historique ou point SAM ne survit au rechargement d’un projet.

## Distribution

`src/` contient la source ; `scripts/build.mjs` copie le code statique dans `dist/`. Pas de bundler ni dépendance applicative npm. Playwright et Prettier sont les dépendances de développement. Les anciennes archives sont conservées. GitHub Pages sert une copie de `dist/` à la racine de sa branche dédiée ; Cloudflare garde `dist/`.
