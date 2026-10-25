"use strict";
globalThis.binaryComposite = function binaryComposite(
  original,
  alpha,
  corrections = null,
) {
  if (alpha.length !== original.length / 4)
    throw new Error("Dimensions du masque incohérentes.");
  const output = new Uint8ClampedArray(original);
  for (let i = 0; i < alpha.length; i++)
    output[i * 4 + 3] = alpha[i] >= 128 && original[i * 4 + 3] > 0 ? 255 : 0;
  if (corrections) {
    if (corrections.colors.length !== corrections.indices.length * 3)
      throw new Error("Corrections RGB incohérentes.");
    for (let j = 0; j < corrections.indices.length; j++) {
      const i = corrections.indices[j];
      if (i >= alpha.length) throw new Error("Correction RGB hors image.");
      if (output[i * 4 + 3])
        for (let k = 0; k < 3; k++)
          output[i * 4 + k] = corrections.colors[j * 3 + k];
    }
  }
  return output;
};
