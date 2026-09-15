# Vérifications avant livraison

## Contrôles automatiques

Exécuter depuis la racine du projet :

```powershell
./scripts/check.ps1
```

Ce contrôle vérifie la syntaxe JavaScript, l’identité entre la source et la distribution, la présence du favicon et l’intégrité de la structure des archives.

## Parcours navigateur minimal

1. Ouvrir la page depuis `http://127.0.0.1:8765/decoupe.html`.
2. Importer un PNG ou JPG par le bouton.
3. Importer une image différente par glisser-déposer.
4. Coller une image avec `Ctrl + V` et avec « Coller l’image ».
5. Lancer « Enlever le fond » et attendre la fin du calcul.
6. Tester une retouche Ajouter puis une retouche Enlever.
7. Vérifier l’annulation du trait et du dernier résultat IA.
8. Vérifier les quatre exports et la conservation des dimensions.
9. Vérifier l’affichage sur une largeur mobile.
10. Vérifier l’absence d’erreur dans la console.

Documenter dans `outputs/VERSIONS.md` uniquement les tests réellement effectués.

