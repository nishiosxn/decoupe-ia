# Architecture

Source unique src/, distribution versionnée dist/ générée par scripts/build.mjs et contrôlée par scripts/validate.mjs. scripts/site-files.mjs maintient les URL plates compatibles /decoupe-ia/ et Cloudflare. Aucun bundler ni backend. licenses.html sert les notices complètes.

app.js conserve le parcours V5.2 : RGBA original immuable, comparaison, fonds, filigrane20%, traits, patches atomiques, annulation et exports. background-worker.js orchestre segmentation et préparation du masque. models.js fixe artefacts, tailles, révisions et SHA256. segmentation.js fournit prétraitement, chargement ONNX, cache local vérifié, session et inférence ; aucun code IMG.LY AGPL importé. isnet-model.json décrit les chunks de poids de secours.

BiRef512 FP16 : RGB redimensionné512×512, ImageNet mean/std, NCHW float32 ; sortie logits convertie par sigmoid, float conservé. ISNet FP16 : étirement1024, (RGB-128)/256, probabilité directe ; poids identiques à la référence V5.2, runtime indépendant. Les poids arrivent des CDN statiques épinglés, jamais des pixels utilisateur. Un seul modèle résident à la fois ; changement de modèle libère la session précédente. Les tenseurs sont libérés explicitement. Échec du candidat → tentative ISNet ; erreur récupérable si le secours échoue aussi. Le bouton classique peut relancer explicitement ISNet.

MaskRefinement reconstruit la confiance float aux dimensions originales, traite seulement les pixels incertains avec un filtre bilatéral guidé RGB, puis produit alpha0/255. Aucun remplissage général des trous, érosion ou flou alpha final. La décontamination requiert des témoins sujet/fond très confiants et un mélange RGB cohérent ; patch RGB séparé, sans mutation source. Désactivée pour le secours et pour les crops de correction. binaryComposite applique seulement les corrections autorisées sur des pixels encore conservés. Le reste des RGB demeure identique à la source décodée.

Les corrections utilisent le modèle ayant produit le résultat, des crops depuis l’original et des modifications limitées aux indications. showMask applique le même patch RGB de bord ; annulation restaure le masque précédent. Guide, fonds et comparaison restent visuels : aucune inférence, aucun filigrane exporté. Blanc/noir composés à partir du même PNG détouré.

Main sert la stable Cloudflare. Actions work/** valide et publie Pages avec les archives Git historiques. Aucun changement de workflow/publication dans la V5.3 ; aucun tag stable ni déploiement Cloudflare autorisé pour cette candidate.

## Cycle de session V5.3

app.js réutilise le worker pour l’image courante. Inactivité60s (15s si deviceMemory<=4), changement d’image, erreur et annulation terminent le worker. Les appareils signalant<=4Go utilisent directement ISNet ; autrement BiRef FP16. Worker défaillant : reprise classique dans un worker neuf, une seule fois. WASM est choisi par défaut ; WebGPU reste expérimental, avec contrôle de masque dégénéré et repli CPU. Voir les mesures et limites dans QUALITY_BENCHMARK.md. Le veto RGB sur aplats évite une décontamination risquée, sans servir de classificateur de modèle.
