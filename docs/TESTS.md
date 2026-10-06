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
6. Tester une retouche Ajouter avec un trait plus petit que la zone à récupérer et vérifier que la région cohérente autour du trait est sélectionnée, pas seulement les pixels peints.
7. Tester une retouche Enlever avec un trait plus petit que la zone indésirable et vérifier que la région cohérente est retirée avec un bord progressif.
8. Tester une zone ambiguë : si aucune région nette n’est détectée, vérifier que le masque précédent et les traits sont conservés.
9. Vérifier que les zones éloignées du prompt restent inchangées.
10. Vérifier l’annulation du trait et du dernier résultat IA.
11. Vérifier les quatre exports et la conservation des dimensions.
12. Vérifier l’affichage sur une largeur mobile.
13. Vérifier l’absence d’erreur dans la console.

Documenter dans `outputs/VERSIONS.md` uniquement les tests réellement effectués.

