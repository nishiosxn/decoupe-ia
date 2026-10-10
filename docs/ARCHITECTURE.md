# Architecture

## Sources et distribution

src/index.html contient le DOM ; styles.css le design responsive ; app.js orchestre import, état, preview, worker, correction et téléchargement. Les scripts restent classiques pour préserver le comportement du checkpoint8ffac19 et les tests existants. Aucune dépendance ou bundler supplémentaire.

src/ai/background-worker.js : segmentation ISNet FP161.7.0, CPU/WASM, segmentForeground et sortie RGBA brute. Son contenu est conservé intégralement. src/core/pixels.js expose binaryComposite ; src/core/local-brush.js expose la géométrie, la couverture des traits et les patchs binaires. Ces modules purs ne connaissent ni le DOM ni les publications.

scripts/site-files.mjs est la table source → dist. Les scripts sont copiés à la racine publique pour conserver background-worker.js et les autres URLs relatives, y compris sous /decoupe-ia/. scripts/build.mjs génère dist/ ; scripts/validate.mjs vérifie toutes les copies et ressources locales, la syntaxe et les versions. dist/ reste versionné pour le déploiement Cloudflare existant ; CI refuse une distribution désynchronisée.

## Flux et garanties

Import → décodage RGBA original immuable → worker ISNet → alpha → binaryComposite → PNG. Seul le masque est rééchantillonné depuis la résolution d’inférence1024×1024. L’export conserve dimensions et RGB décodés ; alpha=255 si prédiction>=128 et alpha original>0, sinon0. Aucun filtre de couleur ni alpha partiel.

Les traits ne mutent pas le masque. Bounding boxes + contexte max(64px,3 rayons), regroupement si recouvrement, crop de l’original → segmentation locale → patch uniquement sous les indications. Ajouter suit les prédictions sujet, Supprimer les prédictions fond. Les patches de toutes les régions sont validés avant remplacement atomique du résultat ; une annulation conserve les seules différences de la dernière correction. Échec/annulation du worker conserve résultat et traits. ISNet ne comprend pas de prompts de pinceau : absence de changement possible.

Preview : même cadre et ratio pour original, résultat et overlay. Comparateur clip-path hors correction ; en correction, fond sélectionné → original20 % optionnel → résultat100 % → traits/curseur. Le guide n’intercepte pas les événements et n’est jamais encodé. Blanc/noir sont composés uniquement au téléchargement ; transparent réutilise le PNG binaire. Le téléchargement est bloqué si des traits restent en attente.

URL d’objets révoquées à remplacement, canvases temporaires libérés, bitmaps fermés. Le worker est terminé après succès, erreur, annulation ou8minutes ; les crops successifs réutilisent sa session pendant un lot. Aucun backend, secret ou envoi des pixels aux fournisseurs de modèles.

## Publications

wrangler.jsonc reste inchangé et sert dist/ ; main n’est pas modifiée par ce lot. GitHub Pages reçoit .pages/ via Actions après les validations develop. Le staging ajoute les previews historiques en lisant leurs tags Git, sans créer une seconde source active ou une branche de publication. Les tags sont nécessaires au build Pages ; leur absence est bloquante, jamais ignorée.
