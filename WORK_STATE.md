# Découpe AI — WORK_STATE

Ce fichier est la source de vérité **opérationnelle du travail en cours** pour les agents Codex.

Il doit rester court, factuel et fondé sur l’état réel du dépôt. Ne pas y stocker de longs raisonnements, de logs bruts ou d’hypothèses non vérifiées.

> Important : les informations spécifiques au projet doivent être découvertes dans le dépôt ou confirmées par l’utilisateur. Ne rien inventer à partir du seul nom « Découpe AI ».

## Base stable

À renseigner après inspection du dépôt.

- Version stable actuelle : **à déterminer**
- Branche stable principale : **à déterminer**
- Dernier commit stable pertinent : **à déterminer**
- Dernière validation connue : **à déterminer**

Si aucune version/tag stable n’existe, l’indiquer explicitement au lieu d’en inventer une.

## Lot / tâche courante

**Statut : aucun lot fonctionnel spécifique n’est encore documenté dans ce fichier.**

Lorsqu’une tâche de développement est lancée, remplacer cette section par :

- objectif exact;
- périmètre;
- état actuel;
- travail déjà terminé;
- travail restant;
- branche/commit de travail si utile;
- validations déjà effectuées;
- blockers réels.

Ne pas recopier tout le prompt utilisateur si un résumé opérationnel suffit.

## Architecture et stack confirmées

À compléter uniquement après inspection du dépôt.

- Frontend : **à déterminer**
- Backend : **à déterminer**
- Base de données / stockage : **à déterminer**
- Authentification / permissions : **à déterminer**
- Tests : **à déterminer**
- Build / packaging : **à déterminer**
- Déploiement / hébergement : **à déterminer**

Supprimer les lignes non pertinentes une fois le projet compris.

## Commandes projet confirmées

À compléter avec les commandes réellement vérifiées dans le dépôt.

Exemples de catégories possibles :

- installation : **à déterminer**
- développement local : **à déterminer**
- tests ciblés : **à déterminer**
- tests complets : **à déterminer**
- lint : **à déterminer**
- typecheck : **à déterminer**
- build : **à déterminer**

Ne jamais inventer une commande. Préférer les scripts présents dans le projet (`package.json`, `pyproject.toml`, `Makefile`, scripts, documentation, etc.).

## Décisions et contraintes confirmées

Pour l’instant :

- Préserver le travail existant.
- Éviter les refactors sans rapport direct avec la demande.
- Réutiliser l’architecture et les conventions existantes.
- Ne pas créer de système parallèle lorsqu’un mécanisme existe déjà.
- Le backend doit rester l’autorité finale pour les règles de sécurité lorsque le projet possède un backend.
- Ne pas introduire de changement destructif de données sans demande explicite.
- Ne pas commit/push/merge/tag/deploy sans autorisation explicite.
- Ne pas exposer ou committer de secrets.

Ajouter ici uniquement les décisions fonctionnelles ou techniques réellement confirmées pour Découpe AI.

## Checkpoints de travail

Utiliser cette section pour les tâches longues.

### Checkpoint 1 — Investigation ciblée

- Identifier les fichiers/modules concernés.
- Vérifier l’implémentation actuelle.
- Vérifier les tests et conventions existants.
- Confirmer le périmètre minimal de modification.

Statut : **à lancer uniquement lorsqu’une tâche concrète le nécessite**.

### Checkpoint 2 — Implémentation

- Modifier uniquement les composants nécessaires.
- Réutiliser les abstractions existantes.
- Préserver la compatibilité attendue.
- Éviter les changements hors périmètre.

Statut : **en attente d’une tâche concrète**.

### Checkpoint 3 — Validation ciblée

- Exécuter le test/check le plus proche de la modification.
- Corriger les régressions introduites.
- Ne pas relancer inutilement toute la suite après chaque petite modification.

Statut : **en attente**.

### Checkpoint 4 — Validation finale

Selon l’ampleur de la tâche :

- tests ciblés;
- tests du sous-système;
- build/lint/typecheck si pertinents;
- suite complète lorsque justifiée;
- validation UI/intégration seulement si nécessaire;
- vérification du diff et de `git status`.

Statut : **en attente**.

### Checkpoint 5 — État et livraison

- Mettre ce fichier à jour avec les faits utiles.
- Documenter les éventuels blockers ou limitations.
- Commit/push uniquement si demandé.
- Aucun merge/tag/deploy sans demande explicite.

Statut : **en attente**.

## Hors périmètre permanent par défaut

Sauf demande explicite :

- pas de refonte globale;
- pas de migration destructive;
- pas de changement d’architecture gratuit;
- pas de renommage massif;
- pas de mise à jour générale des dépendances;
- pas de suppression de compatibilité existante;
- pas de release;
- pas de déploiement;
- pas de modification de production.

## Modèle de mise à jour après une tâche

Lorsqu’un lot réel est en cours, remplacer les sections génériques ci-dessus par des faits précis, par exemple :

```md
## Lot courant — <nom>

**Statut : en cours / prêt pour validation / terminé**

### Objectif

<résumé court>

### Réalisé

- ...
- ...

### Validation

- `<commande ciblée>` → OK
- `<commande build/test>` → OK

### Reste à faire

- ...
- ...

### Git

- Branche : `<branche>`
- Commit : `<hash>` si pertinent
```

Ne conserver que les informations utiles à une reprise de travail par un autre agent.
