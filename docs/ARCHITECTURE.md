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

## Corrections locales — V5.2.0

Le masque global binaire est un Uint8Array indépendant des pixels originaux. Les traits gardent mode, rayon et points en coordonnées source. Ils sont rendus sur un Canvas d’overlay à la résolution de l’aperçu (DPR limité à 2), jamais dans le PNG. En correction, le résultat est entièrement visible ; quitter restitue le comparateur au centre. Les contrôles de correction sont absents avant le premier résultat.

LocalBrush.regions calcule et regroupe les rectangles avec contexte, bornés à l’image. LocalBrush.crop extrait du RGBA original, sans utiliser l’aperçu ni son fond. Un worker ISNet traite les crops successivement et réutilise sa session dans ce lot ; il est terminé ensuite. Le reste de l’image n’est pas envoyé au modèle. Les boîtes dont les contextes se recouvrent sont fusionnées ; des contextes éloignés restent indépendants.

LocalBrush.coverage rasterise les segments avec distance au segment et disques aux extrémités ; les points espacés ne créent pas de trous. Les codes 1 (Ajouter) / 2 (Supprimer) prennent le dernier trait en cas de recouvrement. LocalBrush.changes produit des patchs indices/avant/après : ajout seulement si probabilité locale>=128 et alpha original>0 ; retrait seulement si probabilité<128. Le contexte seul ne change jamais le masque. Les pixels non indiqués sont conservés bit à bit. Aucun fondu de masque n’est appliqué.

Les patchs ne sont appliqués à une copie de travail qu’une fois toutes les inférences réussies. Le PNG est encodé et vérifié avant remplacement de l’URL et du masque courants. Échec/annulation n’applique pas de correction partielle. Une seule annulation conserve uniquement les pixels modifiés, sans pile de copies RGBA. Les traits en attente bloquent export et annulation ; on peut les effacer ou les appliquer. Changer d’image remet à zéro masque, traits, historique et overlay.

Cette fusion est volontairement monotone selon le mode et limitée aux indications : une prédiction locale qui confirme l’erreur ne la change pas. Aucun traitement par couleur ni gomme brute n’est substitué à la segmentation. Le modèle et le seuil global V5 sont inchangés.
