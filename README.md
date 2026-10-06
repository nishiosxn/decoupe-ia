# Découpe Studio

Atelier gratuit de détourage, suppression d’objets et reconstruction de fond, exécuté dans le navigateur. **v4.0.0 candidate** : reconstruction complète de l’application v3.

## Travailler avec l’application

1. Importer une image PNG, JPG ou WebP, la déposer ou la coller.
2. Détourer automatiquement avec **BiRefNet Lite**, ou retoucher directement.
3. **Gomme** retire les pixels vers la transparence ; **Restaurer** récupère les pixels originaux.
4. **Peindre la zone** sélectionne l’élément à supprimer ; **Objet au clic** utilise **SlimSAM**. Ajouter des clics pour préciser, Shift + clic pour exclure, Alt + pinceau pour retirer de la sélection.
5. Appliquer **Effacer** pour un trou transparent, ou **Supprimer et reconstruire** pour remplir le fond avec **LaMa**. Le remplissage local rapide et la synthèse de texture sans téléchargement sont disponibles pour les fonds simples.
6. Annuler/rétablir, comparer avec l’original, puis exporter PNG, WebP, JPG, SVG avec PNG intégré ou masque PNG.
7. Enregistrer un fichier `.decoupe` pour reprendre plus tard : il conserve l’original, l’image retouchée et le masque. La sélection temporaire et l’historique ne sont pas enregistrés.

Le damier montre la transparence. L’overlay vert montre uniquement une sélection en attente : il ne fait jamais partie de l’export. Le pinceau n’assombrit pas les couleurs pour simuler une suppression.

## Développement

Prérequis : Node.js 22 ou 24 et npm. Aucune clé API ni serveur IA.

```sh
npm ci
npm run check
npm run dev
```

Ouvrir http://127.0.0.1:4173/decoupe-ia/ . Le serveur ne publie rien sur Internet.

```sh
npm run test:browser
```

Localement les tests utilisent Chrome installé. En CI, Playwright utilise Chromium installé par le workflow. Le smoke test IA est volontairement séparé : il télécharge plusieurs centaines de Mo de modèles.

```powershell
$env:AI_SMOKE = '1'
npm run test:browser -- --grep 'AI models'
```

## Hiérarchie du dépôt

| Dossier                            | Responsabilité                                                            |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `src/index.html`, `src/styles.css` | Interface et présentation                                                 |
| `src/app.js`                       | Import, interaction, aperçu, sauvegarde et export                         |
| `src/core/`                        | Traitement des pixels et document avec historique, sans dépendance au DOM |
| `src/ai/`                          | Modèles, worker dédié, communication et annulation                        |
| `tests/`                           | Régressions des pixels et parcours réels dans le navigateur               |
| `scripts/`                         | Build statique, serveur local, vérification et archivage                  |
| `dist/`                            | Distribution générée, compatible GitHub Pages et Cloudflare               |
| `docs/`                            | Architecture, workflow, modèles et validation                             |
| `outputs/versions/`                | Anciennes archives, conservées sans modification                          |
| `.github/workflows/ci.yml`         | Tests, build et artefact statique à chaque proposition                    |

`src/` est la source de vérité. Ne pas éditer `dist/` à la main. `npm run build` régénère la distribution ; `outputs/decoupe.html` redirige vers celle-ci pour préserver l’entrée locale historique.

## Publication

Le développement v4 est isolé sur `codex/rebuild-studio-v4`. La preview doit utiliser `preview/github-pages-v4.0.0`, avec les fichiers de `dist/` copiés à sa racine et GitHub Pages configuré sur `/(root)`.

URL de preview : https://nishiosxn.github.io/decoupe-ia/ . GitHub Pages ne sert qu’une branche à la fois sur cette URL ; les branches de preview précédentes restent conservées dans Git.

La configuration Cloudflare `wrangler.jsonc` garde `assets.directory: ./dist`. La production peut être déclenchée par un push sur `main` : aucun merge dans `main` et aucun déploiement Cloudflare ne font partie de cette reconstruction. La CI ne déploie pas.

## Limites pratiques

- Les images restent sur l’appareil. jsDelivr fournit les moteurs ; Hugging Face fournit les modèles ; les requêtes de téléchargement sont visibles par ces services, sans pixels de vos images.
- Résolution de travail limitée à 2048 px de côté et 3 mégapixels ; le redimensionnement est annoncé. Les exports utilisent cette résolution.
- Le premier téléchargement est important et les moteurs peuvent être lents, surtout sur mobile. Une analyse peut être annulée ; après cinq minutes sans progression elle est interrompue.
- LaMa reconstruit un fond plausible, pas un fond historiquement exact. L’inférence est effectuée sur une zone avec contexte, ramenée à 512 × 512 ; les pixels hors sélection sont conservés.
- La sélection d’objet demande une vérification avant application ; la confiance du modèle n’est pas une garantie de justesse.
- Le SVG contient une image PNG : il ne s’agit pas d’une vectorisation.
- Le navigateur doit prendre en charge les modules JS, WebAssembly, les workers et Canvas. Aucun mode hors ligne complet n’est promis.

Voir [le workflow](docs/WORKFLOW.md), [les modèles](docs/MODELS.md) et [les tests](docs/TESTS.md).
