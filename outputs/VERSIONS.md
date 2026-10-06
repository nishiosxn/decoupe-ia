# Découpe — versions

## 4.0.0 — Découpe Studio (candidate)

- Reconstruction en modules : interface, document/pixels, moteurs worker, tests et build statique.
- Gomme déterministe vers transparence complète et restauration immédiate ; disparition de l’image fantôme superposée et de la suppression partielle pondérée par ISNet.
- Sélection au pinceau ou avec SlimSAM, application explicite par effacement/restauration/reconstruction.
- Détourage BiRefNet Lite, reconstruction du fond LaMa locale, remplissage local sans réseau pour petits défauts.
- Historique complet, zoom, comparaison, projets `.decoupe`, export transparent et masque.
- CI GitHub avec tests de pixels, parcours navigateur et artefact statique ; documentation du workflow opérationnel.
- Source de vérité : `src/` ; distribution générée : `dist/`. Anciennes archives conservées.


## 3.2.0 — Pinceau intelligent par région (candidate)

- Ajouter/Enlever n’utilisent plus la surface peinte comme masque final. Le trait devient un prompt spatial servant à détecter une région cohérente autour du geste.
- Chaque prompt ouvre une fenêtre locale avec davantage de contexte, relance ISNet sur les pixels originaux puis combine la confiance du modèle avec la continuité visuelle et les couleurs échantillonnées au cœur du trait.
- La correction est étendue à la région détectée et son contour est adouci. Les zones éloignées du prompt ne sont pas modifiées.
- Une zone trop ambiguë est refusée : le dernier masque valide et les traits restent disponibles pour réessayer, au lieu d’appliquer une gomme/restauration brute.
- La sélection intermédiaire est calculée sur une grille plafonnée pour limiter le coût mémoire et CPU sur les grandes images.
- UX : textes d’aide adaptés au nouveau comportement, libellé accessible du canvas amélioré et libération des URL temporaires lors de la fermeture de page.
- Validation effectuée : syntaxe JavaScript parsée avant écriture et source/distribution générées à partir du même contenu. Validation visuelle navigateur encore requise avant merge/release.

## 3.1.0 — Collage depuis le presse-papiers

- Nouveau bouton visible « Coller l’image » et prise en charge directe de `Ctrl + V` partout dans la page.
- Une image PNG, JPEG ou WebP copiée dans le presse-papiers devient immédiatement l’image active de la station de découpe, avec réinitialisation propre du résultat précédent.
- Le bouton explique d’utiliser `Ctrl + V` si le navigateur refuse l’accès direct au presse-papiers.
- Vérifications navigateur : collage clavier d’un PNG, collage du même PNG avec le bouton, dimensions et nom généré affichés, action « Enlever le fond » disponible, aucune erreur console. Syntaxe JavaScript validée et fichiers `outputs/decoupe.html` / `dist/index.html` identiques.
- Limite : si un site copie uniquement une adresse web ou du texte au lieu des pixels de l’image, Découpe ne télécharge pas automatiquement cette adresse ; il faut copier l’image elle-même ou l’enregistrer puis la déposer.

## 3.0.0 — Interface simplifiée

- Refonte majeure centrée sur le parcours principal : déposer une image, cliquer sur « Enlever le fond », puis corriger uniquement si nécessaire.
- Suppression des réglages techniques peu explicites de l’écran principal.
- Deux retouches seulement : Ajouter et Enlever. Chaque zone peinte est recalculée par l’IA sur les pixels originaux et fusionnée avec le dernier résultat validé, sans modifier le reste de l’image.
- Mémoire du dernier détourage, annulation du trait en attente, annulation du dernier résultat IA et comparaison avec l’original.
- Vérifications navigateur sur l’image de référence 985 × 545 : import, détourage initial, retouche Ajouter, retouche Enlever et annulation du résultat. Interface mobile contrôlée. Le modèle reste ISNet local et la zone doit contenir le détail avec un peu de contexte ; ce n’est pas une sélection d’objet à partir d’un point.

## 2.1.0 — Recalcul IA indépendant des zones

- Nouveau pinceau Affiner avec IA : chaque coup est analysé indépendamment sur les pixels originaux, avec une marge de contexte ; seuls les pixels peints sont remplacés dans le résultat existant.
- Les corrections locales se rejouent dans leur ordre, restent annulables et sont conservées lors du recalcul global. En cas d’échec d’une zone, aucune des nouvelles zones du lot n’est appliquée.
- Mode IA seule et mode IA + silhouettes sombres (par défaut pour le cas demandé). Ce dernier combine ISNet avec un filtre explicite de luminosité/chrominance ; il ne constitue pas un nouveau modèle entraîné. Le seuil est utilisé lors du prochain calcul local.
- Restaurer brut reste une retouche manuelle distincte.
- Test navigateur sur la capture 349 × 203 fournie : deux inférences locales réalisées ; le mode IA seule conservait les disques ; le mode silhouettes sombres a retiré leurs fonds en préservant la structure centrale et le petit détail noir à droite. Un croissant clair à gauche subsistait hors de la zone peinte testée : couvrir entièrement la zone avec marge. Aucune erreur console.
- Limites : résolution de l’original, reconnaissance ISNet, filtrage sombre susceptible d’enlever des parties claires/colorées. Le pinceau doit englober le détail et son fond ; ce n’est pas une sélection SAM à partir d’un point. Le reste de l’image n’est pas modifié par une analyse locale.

## 2.0.2 — Validation des pinceaux et recalcul effectif

- Les pinceaux Restaurer/Effacer produisent des marques vertes/rouges en attente. Le bouton Détourer / appliquer les retouches les valide.
- Export désactivé tant que des retouches attendent leur validation.
- Sans retouches en attente, Recalculer relance effectivement le moteur IA. Les corrections validées sont conservées.
- Tests navigateur sur la capture de référence : image inchangée avant validation ; image modifiée après effacement et après restauration ; annulation rétablissant exactement le PNG précédent ; recalcul IA effectif conservant le PNG corrigé ; aucune erreur console.
- Mémoire tampon limitée à la session et au fichier importé. Restaurer récupère les pixels du fichier original, sans reconstruction IA de détails absents.

## 2.0.1 — Mémoire tampon et retouches conservées

- Le résultat IA reste en mémoire pendant les changements de sélection.
- Restaurer/Effacer restent actifs et sont réappliqués après un nouveau détourage.
- Le bouton Détourer applique les retouches sans relancer le modèle lorsque la sélection est inchangée.
- Restaurer peut récupérer des pixels originaux hors de la sélection précédente. Aucun détail déjà absent du fichier importé ne peut être reconstruit.
- Tampon limité à la session : changer de fichier ou recharger la page le réinitialise.
- Vérifications : syntaxe JavaScript et identité des deux fichiers servis. Validation visuelle complète non effectuée pour cette correction.

La page `decoupe.html` ouvre la version courante. Les copies sous `versions/` conservent chaque livraison.

## 2.0.0 — Pinceau de zone IA

- Peinture de la zone complète à traiter, recadrage de l’analyse IA et exclusion des pixels hors zone.
- Pinceaux Restaurer/Effacer après détourage, annulation des coups de pinceau.
- Diamètre réglable, souris et tactile, conservation des dimensions originales à l’export.
- Le modèle ISNet existant est conservé. Ce mode ne sélectionne pas un objet entier à partir d’un simple point : il faut couvrir sa silhouette et une marge de fond.
- SVG : photo PNG incorporée, sans vectorisation.

## 1.0.0 — Version antérieure sauvegardée

Détourage automatique de toute l’image, réglages du masque et exports.

## Règle pour les prochaines itérations

Ne pas écraser une version archivée. Numéroter les corrections 2.0.1, les ajouts compatibles 2.1.0, et les évolutions majeures 3.0.0. Mettre à jour le numéro visible, archiver la livraison et compléter ce journal.
