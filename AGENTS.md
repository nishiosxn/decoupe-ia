# Découpe

Application locale de détourage IA. Source servie : outputs/decoupe.html. dist/index.html doit rester identique.

## Reprise rapide obligatoire

- Lire d’abord README.md, docs/ARCHITECTURE.md, la dernière entrée de outputs/VERSIONS.md et le diff Git courant.
- Ne pas rescanner outputs/versions/ sauf pour diagnostiquer une régression historique précise.
- Exécuter scripts/check.ps1 avant chaque livraison.
- Utiliser une branche `codex/<sujet>` pour toute nouvelle évolution.

## Versions demandées par l’utilisateur

- Chaque prochaine livraison doit avoir un numéro visible et un dossier autonome outputs/versions/vX.Y.Z/.
- Ne jamais modifier les archives livrées. Conserver le favicon avec chaque copie HTML.
- Corriger un défaut : incrémenter Z ; ajouter une fonction compatible : Y ; changement majeur : X.
- Mettre à jour outputs/VERSIONS.md avec les limites réelles et les vérifications effectuées.
- v1.0.0 : ancienne application ; v2.0.0 : zone peinte, analyse ISNet recadrée, retouches manuelles.
- La zone v2 nécessite de couvrir l’objet entier ; ce n’est pas un modèle de sélection d’objet par point tel que SAM.
- Ne pas qualifier le SVG de vectorisé : il contient un PNG.
