# Historique fonctionnel

## Candidate V5.3.0

- BiRefNet Lite512 FP16, runtime ONNX indépendant, probabilités conservées jusqu’à la binarisation ; export à résolution originale.
- Secours ISNet et comparaison à la demande avec le résultat classique ; aucune classification opaque ni double inférence systématique.
- Benchmark attribué11 images, comparaison réelle ISNet/SkyTNT/BiRef FP32 et FP16 ; limites et régressions conservées.
- Filtrage guidé uniquement des zones incertaines et décontamination RGB de bord très conservatrice, sans remplissage systématique des trous.
- Candidate non autorisée en production ; main et tag V5.2 inchangés.

## Stable V5.2.0

- Détourage local ISNet avec alpha binaire, import et PNG à la résolution originale (base V5).
- Comparateur avant/après et fonds transparent/blanc/noir (V5.1, a684aaf).
- Indications Ajouter/Supprimer, crops originaux, fusion locale et annulation (V5.2, bcb9020).
- Guide original20 % en correction, sans effet sur les exports (8ffac19).
- Réorganisation src/dist, validations et workflow main + branches work temporaires ; preview Actions et archives Git. Aucun changement du moteur ou de la qualité de segmentation dans ce lot.

## Stable V3.1.0

Tag v3.1.0 sur9105f4b, branche main a00a316 ; configuration de publication statique Cloudflare. Ancienne version de production, conservée par son tag.

## Expérimentations conservées

V3.2 : pinceau par régions cohérentes ; V4 : studio, retouches et reconstruction. Ces chemins divergent de V5, ne sont pas intégrés dans V5 et restent récupérables sous archive/codex/* et archive/preview/*. Les snapshots V1/V2/V3 sont dans outputs/versions/ des archives Git, sans copie source active supplémentaire. Détails exacts : Git et docs/REPOSITORY_AUDIT.md.
