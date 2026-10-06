# Architecture de Découpe

## Résumé

Découpe est une application statique contenue dans un seul fichier HTML. Elle fonctionne sans serveur applicatif et sans compte utilisateur. Un petit serveur HTTP local est toutefois nécessaire pour autoriser le chargement du modèle IA.

En production, le dossier `dist` est servi comme ensemble de ressources statiques par Cloudflare Workers. La configuration versionnée se trouve dans `wrangler.jsonc` ; aucun serveur personnel n’est utilisé.

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
- Traits de pinceau en attente, utilisés comme prompts spatiaux et non comme gomme brute.
- Historique permettant d’annuler la dernière retouche IA.
- URL temporaires des aperçus et du résultat.

Changer d’image réinitialise entièrement cet état. Recharger la page le perd également.

## Parcours principal

1. Import par fichier, glisser-déposer, `Ctrl + V` ou bouton « Coller l’image ».
2. Détourage global par ISNet.
3. Correction facultative avec Ajouter ou Enlever.
4. Chaque trait sert d’indice spatial : une fenêtre locale plus large est analysée par ISNet sur les pixels originaux.
5. Une sélection guidée combine la confiance locale ISNet, les couleurs du cœur du trait et la continuité entre pixels voisins pour étendre le prompt à une région cohérente.
6. Ajouter restaure la région détectée ; Enlever retire la région détectée. Les transitions sont adoucies et les zones hors de la fenêtre locale restent inchangées.
7. Si aucune région suffisamment cohérente n’est trouvée, la retouche est refusée et le dernier masque valide ainsi que les traits sont conservés.
8. Export PNG, WebP, JPG ou SVG contenant un PNG intégré.

## Invariants à préserver

- L’image originale ne doit jamais être remplacée par l’aperçu détouré.
- Une retouche locale peut étendre un trait à la région détectée autour de lui, mais ne doit jamais recalculer arbitrairement le reste de l’image.
- Un échec d’inférence ne doit pas détruire le dernier masque valide.
- L’export est bloqué lorsque des traits n’ont pas encore été appliqués.
- `outputs/decoupe.html` et `dist/index.html` doivent rester identiques.
- Le SVG n’est pas vectorisé : il incorpore une image PNG.

## Limites connues

- ISNet n’est pas un modèle interactif natif comme SAM : la sélection intelligente est une couche de guidage locale construite autour de son masque et des pixels originaux.
- Un trait court placé au cœur de la zone est préférable. Une zone visuellement ambiguë peut être refusée plutôt que d’appliquer une gomme/restauration brute.
- Le collage fonctionne seulement si le presse-papiers contient les pixels d’une image PNG, JPEG ou WebP. Une simple adresse web n’est pas téléchargée automatiquement.
- La qualité finale reste limitée par la résolution de l’image originale et par la reconnaissance du modèle.
