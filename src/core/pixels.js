"use strict";
globalThis.binaryComposite = function binaryComposite(original, alpha) {
  if (alpha.length !== original.length / 4)
    throw new Error("Dimensions du masque incohérentes.");
  const output = new Uint8ClampedArray(original);
  for (let i = 0; i < alpha.length; i++)
    output[i * 4 + 3] =
      alpha[i] >= 128 && original[i * 4 + 3] > 0 ? 255 : 0;
  return output;
};
