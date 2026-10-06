# Validation v4

## Régressions automatisées

`npm test` vérifie : suppression alpha exacte sans assombrissement RGB, restauration, segments continus, sélection appliquée en une fois, historique RGB/alpha, reconstruction sans modification extérieure, refus d’un masque intégral et respect de la transparence originale.

`npm run test:browser` vérifie dans Chrome/Chromium :

- gomme réelle puis décodage du PNG téléchargé : pixel effacé alpha = 0 ; pixel hors trait alpha = 255 ;
- restauration, annulation et rétablissement ;
- sélection, remplissage local et annulation ;
- sauvegarde et ouverture d’un projet avec son masque et l’original ;
- affichage à 390 px sans débordement horizontal, export accessible ;
- reconstruction de texture sans réseau et sans modèle ;
- erreur de chargement et annulation conservant l’image et réactivant les outils manuels.

## Smoke IA

`AI_SMOKE=1` active un parcours réel avec chargement des modèles et inférences dans le worker : objet au clic, effacement du masque SAM, BiRefNet, reconstruction LaMa. Les requêtes vers les hébergeurs des modèles doivent être GET/HEAD, sans envoi des pixels. Ce test est exclu de la CI rapide à cause du téléchargement et du coût CPU.

## Validation manuelle avant production

Sur des images de travail réelles, vérifier : détourage de cheveux/feuilles, bords fins, ombres, objet adjacent de couleur proche, suppression sur fond texturé, reconstruction de perspective architecturale, imports avec transparence, haute résolution réduite, annulation pendant un modèle et récupération après erreur réseau. Comparer l’export téléchargé à l’atelier.

La réussite d’un smoke test confirme l’intégration technique, pas la qualité de toutes les reconstructions. La v4 reste une candidate jusqu’à validation sur les images de travail.

Un miroir local optionnel (`AI_MODEL_MIRROR`) peut servir les poids ONNX identiques pour accélérer les tests sur une connexion lente. Il ne remplace pas le modèle ni le moteur et ne fait pas partie du frontend publié.

## Résultats du 2026-10-06

- 8 tests du cœur réussis.
- 7 tests navigateur Chrome réussis, dont export PNG décodé avec transparence réelle, projet, mobile, synthèse de texture sans réseau, erreur et annulation.
- Smoke IA réel réussi : SlimSAM sélectionne puis efface, BiRefNet 512 détoure le fond vers la transparence, LaMa reconstruit la zone et conserve strictement les pixels extérieurs. Poids ONNX épinglés préchargés sur un miroir local pour éviter les lenteurs réseau ; moteurs et inférences réels, sans mock de résultat.
- LaMa : SHA-256 du poids vérifié, `1faef5301d78db7dda502fe59966957ec4b79dd64e16f03ed96913c7a4eb68d6`.
- Une photographie publique de référence de SlimSAM (corgi, 614 × 410 px) a aussi été détourée avec BiRefNet et inspectée visuellement.
- La variante BiRefNet Lite 1024 px a été rejetée après échec mémoire dans Chrome ; la variante 512 px est celle publiée et vérifiée.

Ces résultats valident le fonctionnement observé et ne garantissent pas la qualité sur toutes les images de travail.
