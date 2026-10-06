# Modèles et dépendances

Les images ne sont jamais envoyées à un serveur. Les modèles sont chargés à la première utilisation dans un worker WebAssembly, avec un thread pour fonctionner sur un site statique sans en-têtes COOP/COEP.

| Fonction       | Modèle                         | Licence déclarée | Révision                                 |
| -------------- | ------------------------------ | ---------------- | ---------------------------------------- |
| Détourage      | studioludens/birefnet-lite-512 | MIT              | 4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7 |
| Objet au clic  | Xenova/slimsam-77-uniform      | Apache 2.0       | 5850ab45f587c112167512ffef949107115e26a0 |
| Reconstruction | sapienkit/LaMa-ONNX            | Apache 2.0       | 0153b00d76c01058d825296ee162b46ff75ce05d |

Sources et contrats :

- https://huggingface.co/studioludens/birefnet-lite-512 : alpha matte via `input_image`, logits et sigmoid.
- https://huggingface.co/Xenova/slimsam-77-uniform : points, labels, embeddings et plusieurs masques avec confiance IoU.
- https://huggingface.co/sapienkit/LaMa-ONNX : image float32 RGB /255 et masque float32, 512 × 512 ; résultat RGB déjà dans [0,255].
- LaMa original : https://github.com/advimman/lama ; Suvorov et al., WACV 2022, Resolution-robust Large Mask Inpainting with Fourier Convolutions.
- Données LaMa : Places2, attribution aux auteurs Places2, CC BY 4.0 ; https://places2.csail.mit.edu/ .

Moteurs : Transformers.js 3.8.1 (Apache 2.0), ONNX Runtime Web 1.22.0 (MIT). Chargés depuis jsDelivr ; aucun secret. Polices système, sans téléchargement externe.

Aucun classement de qualité universel n’est promis. Les modèles remplacent l’heuristique couleur/ISNet locale du pinceau v3, mais leurs résultats doivent être vérifiés sur les images de travail. La sélection SAM n’est pas une détection avec étiquette textuelle et LaMa n’est pas une génération depuis un prompt.
