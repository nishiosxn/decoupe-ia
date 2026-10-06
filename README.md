# Découpe IA

## Preview GitHub Pages — v3.2.0 candidate

Cette branche `preview/github-pages-v3.2.0` publie uniquement la version de test du pinceau intelligent, issue de `codex/intelligent-zone-brush-v3.2.0` (commit `3b110282d3765290d32a51bc9ce1ad802417d7bb`).

- URL : https://nishiosxn.github.io/decoupe-ia/
- GitHub Pages : **Deploy from a branch**, branche `preview/github-pages-v3.2.0`, dossier **/(root)**.
- `index.html` et `favicon.svg` à la racine sont des copies exactes de `dist/`. `.nojekyll` désactive le traitement Jekyll ; aucune compilation n'est nécessaire.
- Pour actualiser cette preview, recopier les fichiers de `dist/` à la racine avant de committer et pousser cette branche.
- La configuration Cloudflare et la structure du projet sont conservées. Aucun merge dans `main`, tag ou déploiement Cloudflare n'est effectué par cette publication.
- Il s'agit d'une candidate à tester : la qualité du pinceau intelligent sur des images réelles reste à valider.


Application locale de détourage d’images par IA avec retouches au pinceau.

## Version actuelle

**v3.2.0 (candidate)** — import par fichier, glisser-déposer ou presse-papiers, détourage automatique et corrections locales Ajouter/Enlever avec sélection intelligente de région.

Le traitement se fait dans le navigateur. Aucun jeton ChatGPT n’est utilisé. Le modèle ISNet est téléchargé au premier lancement, puis exécuté localement. Les pinceaux servent désormais de prompts spatiaux : ils indiquent une zone et le moteur combine le masque local ISNet avec la continuité visuelle de l’image pour sélectionner une région cohérente, au lieu de modifier uniquement les pixels peints.

## Lancer l’application

Depuis le dossier du projet :

```powershell
cd outputs
python -m http.server 8765
```

Ouvrir ensuite <http://127.0.0.1:8765/decoupe.html>.

## Publication publique

Le dépôt est relié à Cloudflare Workers Builds. La configuration `wrangler.jsonc` publie automatiquement le dossier `dist` comme site statique.

Réglages Cloudflare :

- Build command : vide.
- Deploy command : `npx wrangler deploy`.
- Production branch : `main`.
- Cloudflare Access : désactivé pour permettre un accès public.

Chaque modification envoyée sur `main` déclenche un nouveau déploiement.

## Organisation

- `outputs/decoupe.html` : source active et page utilisée localement.
- `dist/index.html` : copie publiable, toujours identique à la source active.
- `outputs/versions/` : archives immuables de chaque livraison.
- `outputs/VERSIONS.md` : historique fonctionnel, limites et tests réalisés.
- `docs/ARCHITECTURE.md` : fonctionnement interne et règles à préserver.
- `docs/TESTS.md` : vérifications avant livraison.
- `scripts/check.ps1` : contrôle automatique de la cohérence du projet.
- `scripts/release.ps1` : création sécurisée d’une archive de version.
- `AGENTS.md` : consignes permanentes pour les prochaines interventions de Codex.
- `wrangler.jsonc` : configuration de l’hébergement public Cloudflare.

## Cycle d’une évolution

1. Créer une branche `codex/nom-de-la-fonction`.
2. Modifier `outputs/decoupe.html` et son numéro visible.
3. Copier la page dans `dist/index.html` et tester.
4. Documenter les changements dans `outputs/VERSIONS.md`.
5. Exécuter `./scripts/release.ps1 X.Y.Z` pour archiver la livraison.
6. Créer un commit et une étiquette Git `vX.Y.Z`.

Les anciennes archives ne doivent jamais être modifiées.
