# Architecture — détourage simple

## Source et distribution

`outputs/decoupe.html` est la source active ; `dist/index.html` en est la copie identique. `outputs/background-worker.js` est copié dans `dist/`. Favicon inchangé. `npm run build` synchronise ces trois ressources. Archives, configuration Cloudflare et branches historiques conservées.

## Flux et invariants

Fichier → décodage à la taille originale → pixels RGBA immuables → worker ISNet → alpha prédit → seuillage → RGB originaux + alpha binaire → PNG.

- L’import ne redimensionne jamais les pixels. Une image excédant la limite mémoire préventive est refusée avec une explication.
- ISNet analyse une représentation 1024 × 1024 ; seul le masque est rééchantillonné, pas l’image exportée.
- `segmentForeground` retourne un masque RGBA brut, pour éviter la perte de couleurs due au prémultiplié d’un PNG intermédiaire.
- `binaryComposite` copie les RGB originaux décodés, affecte alpha=255 si prédiction>=128 et alpha original>0, sinon alpha=0. Une entrée partiellement transparente devient donc opaque ou transparente dans le résultat.
- Aucun seuil de couleur, aucune suppression par similarité au fond, aucune retouche ni historique.
- Le damier CSS ne fait pas partie du PNG.

## Cycle de vie

Un seul import ou traitement à la fois. Actions incompatibles et drop bloqués. Le worker est terminé après résultat, annulation, erreur ou délai de huit minutes. Les modèles ne restent pas alloués entre deux traitements ; le navigateur peut conserver les téléchargements dans son cache HTTP. L’original reste disponible après une erreur et permet de réessayer.

Le changement d’image n’efface l’ancien document qu’après décodage réussi. Les URL d’objets précédentes sont révoquées, les bitmaps sont fermés, les canvases temporaires réduits après usage. La sortie du worker est vérifiée contre les dimensions attendues. L’export conserve la taille originale. À la fermeture de la page, les références et le worker sont libérés.

## Dépendances et sécurité

Moteur chargé à la demande, version figée `@imgly/background-removal@1.7.0`, modèle `isnet_fp16`, CPU/WASM. Aucun backend, stockage permanent des images ou clé. Les fournisseurs de fichiers statiques voient les requêtes de téléchargement du moteur, sans recevoir les images.

Le navigateur doit supporter WebAssembly, Worker, createImageBitmap et OffscreenCanvas (utilisé par IMG.LY). La qualité est celle d’une segmentation automatique, avec limites sur sujets ambigus et détails plus petits que la résolution du masque.

## Comparateur et fonds — V5.1.0

Un cadre centré utilise le ratio exact de l’image et une hauteur adaptée au viewport. Les deux images occupent le même rectangle absolu. L’original est dessous ; une couche détourée porte son fond CSS et est révélée à gauche par `clip-path`. À 0 %, l’original est entièrement visible ; à 100 %, le résultat l’est entièrement. Un input range natif fournit la sémantique ARIA et le clavier ; Pointer Events et capture gèrent souris, stylet et tactile avec des coordonnées relatives au cadre. Le range invisible a une poignée native de largeur nulle pour éviter un décalage tactile ; la poignée visible est purement décorative. Avant le résultat, les contrôles de comparaison et de fond sont masqués.

Le PNG transparent reste l’unique résultat de référence, avec le masque binaire inchangé. Les radios modifient instantanément le fond CSS, sans canvas ni copie de pixels lors du choix. Pour exporter du blanc/noir, un Canvas temporaire à la résolution originale est rempli avec #FFFFFF/#000000 puis reçoit le PNG détouré avec le compositing Canvas par défaut. Tous les pixels exportés sont alors opaques. L’export transparent réutilise directement le PNG original du résultat. Aucune fonction de comparaison ou de fond n’appelle le worker.

L’encodage d’un fond bloque brièvement les actions incompatibles. Le Canvas temporaire est libéré après encodage ; l’URL de téléchargement opaque est révoquée à l’export opaque suivant, au changement d’image ou après 60 secondes. Un nouvel import valide remet le fond transparent et le comparateur à 50 %, sans conserver l’ancien résultat. ISNet, son seuil 128 et le worker restent identiques à V5.0.0.
