# Découpe AI — détourage simple

Candidate **v5.2.0**, construite depuis `codex/v5.1-compare-backgrounds` (`a684aaf`) sur `codex/v5.2-smart-local-brush`.

1. Déposer une image ou cliquer sur **Choisir une image** (JPG, PNG, WebP).
2. Cliquer sur **Supprimer le fond**.
3. Glisser le comparateur : 0 % = originale, 50 % = détourée à gauche / originale à droite, 100 % = détourée. Le curseur démarre au centre et fonctionne aussi au clavier.
4. Si nécessaire, ouvrir **Corriger**, peindre en **Ajouter** ou **Supprimer**, puis **Appliquer la correction locale**. Effacer les traits n’affecte pas le résultat ; la dernière correction appliquée peut être annulée.
5. Quitter la correction pour retrouver le comparateur, choisir **Transparent**, **Blanc** ou **Noir**, puis télécharger le PNG à la résolution originale.

Le parcours de base reste simple ; les corrections locales n’apparaissent qu’après un détourage réussi. L’original et le résultat sont superposés dans un seul cadre, à la même taille. Le fond choisi ne concerne que le résultat ; changer de fond ou déplacer le curseur ne relance jamais l’IA. Traitement local, sans compte ni clé API. Le modèle et le moteur sont téléchargés depuis jsDelivr et Static IMG.LY ; les pixels ne sont pas envoyés à un serveur IA.

## Moteur et export

ISNet FP16, via `@imgly/background-removal` **1.7.0**, reconnaît le premier plan. Il ne compare pas simplement les couleurs au fond. Inférence à 1024 × 1024 puis masque rééchantillonné à la taille originale. Le seuil interne de 128/255 produit exclusivement des alpha **0 ou 255**. Les RGB proviennent des pixels originaux décodés par le navigateur, jamais de la sortie colorée du modèle. Aucun lissage d’alpha après seuillage. En export transparent, le masque courant est exporté sans transparence intermédiaire. En export blanc/noir, un Canvas compose le résultat sur la couleur pure choisie et produit un PNG entièrement opaque ; le damier et le comparateur ne sont jamais exportés.

Ce choix impose des contours plus nets : cheveux, transparences physiques et très petits éléments restent difficiles. Le modèle peut se tromper sur le sujet. Les couleurs similaires au fond ne sont pas une règle de suppression. Aucun remplissage automatique des trous n’est appliqué : cela boucherait aussi de vraies ouvertures.

Images acceptées jusqu’à 32 MP et 16384 px par côté : au-delà, l’import est refusé explicitement, jamais réduit silencieusement. Sur appareil peu doté, une image sous cette limite peut encore dépasser la mémoire disponible. L’annulation interrompt le worker et libère le modèle. Le premier lancement télécharge environ 88 Mo de poids et 12 Mo de runtime ; les suivants dépendent du cache HTTP.

## Corrections locales

Le pinceau dessine des **indications temporaires**, jamais un effacement direct. La taille est celle du trait à l’écran. On peut peindre plusieurs zones et mélanger les modes avant d’appliquer. Le téléchargement est bloqué tant que des traits restent en attente, pour ne pas exporter un résultat qui ne les prend pas en compte.

Chaque trait définit une bounding box, augmentée d’une marge de contexte de 64 pixels minimum ou trois rayons du trait, à la résolution originale. Les crops proches sont regroupés ; les zones éloignées sont traitées séparément. ISNet repart uniquement des pixels originaux de ces crops. Le contexte aide l’analyse mais **seuls les pixels indiqués** peuvent être modifiés :

- Ajouter remet de l’alpha 255 si la prédiction locale reconnaît du sujet (seuil 128).
- Supprimer met de l’alpha 0 si la prédiction locale reconnaît du fond.
- En dehors des indications, le masque global reste exactement inchangé.

Les traits superposés utilisent le dernier mode peint. Toutes les régions d’une correction sont validées avant publication du résultat ; échec ou annulation préserve le résultat et les traits. Un historique minimal garde les différences de la dernière correction appliquée. Pour les exports, les RGB restent ceux de l’original.

**Limite essentielle : ISNet n’est pas un modèle conditionné par des clics ou des traits.** Le trait choisit où réanalyser, pas ce que le modèle doit obligatoirement considérer comme sujet/fond. Un objet que le modèle reconnaît encore comme sujet ne sera pas supprimé de force. Une prédiction inchangée produit un message explicite. Ce système corrige des erreurs sensibles au contexte ; il ne garantit pas la sélection arbitraire d’un objet. Le contexte d’une indication couvrant presque toute une petite image peut naturellement atteindre ses bords.

## Développement

Node.js 22 ou plus, puis :

```sh
npm ci
npm run check
npm run dev
npm run test:browser
```

Ouvrir http://127.0.0.1:4173/decoupe-ia/ . Tests locaux avec Chrome installé ; en CI, Chromium Playwright.

- `outputs/decoupe.html` : source active, interface et orchestration.
- `outputs/background-worker.js` : segmentation isolée et annulable, inchangée depuis V5 ; session ISNet réutilisée pour les crops successifs d’une correction.
- `outputs/local-brush.js` : géométrie des crops, couverture des traits, fusion binaire et patchs d’annulation, sans DOM.
- `dist/` : copie générée par `npm run build`, sans bundler.
- `tests/` : pixels et parcours navigateur.
- `scripts/check.ps1` : contrôle historique source/distribution et archives.
- `outputs/versions/` : archives immuables conservées.

Une séparation supplémentaire du code n’est nécessaire que lorsque de nouvelles fonctions la justifieront. Ne pas éditer `dist/` à la main. Voir [architecture](docs/ARCHITECTURE.md) et [tests](docs/TESTS.md).

## Publication

Cloudflare conserve sa configuration `wrangler.jsonc` et sa branche de production `main`. Ce travail ne fusionne rien, ne crée aucun tag et ne déploie pas Cloudflare.

GitHub Pages sert déjà une autre preview depuis une branche dédiée. Un dépôt ne possède qu’un site Pages ; remplacer sa source affecterait la preview existante. Cette candidate fournit `dist/` et un artefact CI statique prêts à publier, sans changer cette configuration. Une publication simultanée demanderait soit un autre dépôt Pages, soit l’ajout d’un sous-dossier dans la branche de publication existante. Ces actions ne font pas partie de cette livraison.

Bibliothèque IMG.LY sous AGPL-3.0 : [source et licence](https://github.com/imgly/background-removal-js). Les conditions de cette dépendance restent applicables.

### Guide visuel en correction

En mode Corriger, l’original apparaît à 20 % derrière le résultat opaque et les traits. Le contrôle « Afficher l’original en filigrane » est activé par défaut pour chaque nouvelle image ; son choix reste mémorisé tant que cette image est ouverte. Il agit uniquement sur la prévisualisation, sans inférence, modification du masque ou inclusion dans les PNG. Hors correction, le comparateur habituel est restauré.
