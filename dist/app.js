"use strict";
const $ = (id) => document.getElementById(id);
let source = null,
  fileName = "",
  sourceURL = null,
  resultURL = null,
  worker = null,
  timer = null,
  busy = false,
  background = "transparent",
  downloadURL = null,
  downloadTimer = null,
  dragPointer = null;
let mask = null,
  strokes = [],
  editing = false,
  brushMode = "add",
  activeStroke = null,
  brushPointer = null,
  undoPatch = null,
  pendingInference = null;
function say(message, error = false) {
  $("status").textContent = message;
  $("status").classList.toggle("error", error);
}
function lock(value) {
  busy = value;
  for (const id of ["choose", "file", "change", "remove", "download"])
    $(id).disabled = value;
  $("backgrounds").disabled = value;
  $("compare").disabled = value;
  $("cancel").hidden = !value;
  $("progress").hidden = !value;
  $("drop").setAttribute("aria-busy", String(value));
  updateRetouch();
}
function stopWorker() {
  clearTimeout(timer);
  timer = null;
  worker?.terminate();
  worker = null;
  if (pendingInference) {
    pendingInference.reject(new Error("Traitement interrompu"));
    pendingInference = null;
  }
}
function setComparison(value) {
  const position = Math.max(0, Math.min(100, Math.round(Number(value))));
  $("compare").value = String(position);
  $("compare").setAttribute("aria-valuenow", String(position));
  $("compare").setAttribute(
    "aria-valuetext",
    position + " % détourée, " + (100 - position) + " % originale",
  );
  $("comparison").style.setProperty("--position", position + "%");
}
function setBackground(value) {
  if (!["transparent", "white", "black"].includes(value)) return;
  background = value;
  $("reveal").dataset.background = value;
  document.querySelector(
    'input[name="background"][value="' + value + '"]',
  ).checked = true;
}
function releaseDownload() {
  clearTimeout(downloadTimer);
  downloadTimer = null;
  if (downloadURL) URL.revokeObjectURL(downloadURL);
  downloadURL = null;
}
function releaseResult() {
  resetRetouch();
  releaseDownload();
  if (resultURL) URL.revokeObjectURL(resultURL);
  resultURL = null;
  $("result").removeAttribute("src");
  $("result").hidden = true;
  $("download").hidden = true;
  for (const id of [
    "reveal",
    "compare",
    "divider",
    "compareHint",
    "backgrounds",
  ])
    $(id).hidden = true;
  setComparison(50);
  setBackground("transparent");
}
function releaseSource() {
  source = null;
  if (sourceURL) URL.revokeObjectURL(sourceURL);
  sourceURL = null;
  $("original").removeAttribute("src");
  $("originalGuide").removeAttribute("src");
  $("showOriginalGuide").checked = true;
  releaseResult();
}
async function importImage(file) {
  if (busy || !file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return say("Choisissez une image JPG, PNG ou WebP.", true);
  lock(true);
  $("cancel").hidden = true;
  say("Ouverture de l’image…");
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    // Refuse instead of silently reducing export resolution on memory-constrained devices.
    if (
      !width ||
      !height ||
      width * height > 32000000 ||
      width > 16384 ||
      height > 16384
    )
      throw new Error(
        "Image trop grande pour ce traitement local (32 mégapixels maximum). Choisissez une image moins grande.",
      );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const decoded = ctx.getImageData(0, 0, width, height);
    canvas.width = canvas.height = 1;
    releaseSource();
    source = decoded;
    fileName = file.name.replace(/\.[^.]+$/, "") || "image";
    sourceURL = URL.createObjectURL(file);
    $("comparison").style.setProperty("--ratio", width / height);
    $("original").src = sourceURL;
    $("originalGuide").src = sourceURL;
    $("empty").hidden = true;
    $("previews").hidden = false;
    $("actions").hidden = false;
    $("info").hidden = false;
    $("info").textContent =
      file.name + " · " + width + " × " + height + " px";
    $("remove").hidden = false;
    $("remove").textContent = "Supprimer le fond";
    say("Image prête. Cliquez sur « Supprimer le fond ».");
  } catch (error) {
    say(
      error.message ||
        "Impossible d’ouvrir cette image. Essayez un autre fichier.",
      true,
    );
  } finally {
    bitmap?.close();
    lock(false);
    $("file").value = "";
  }
}
function fail(message) {
  stopWorker();
  lock(false);
  say(message, true);
  $("remove").textContent = "Réessayer";
}
async function processImage() {
  if (busy || !source) return;
  lock(true);
  say(
    "Chargement de l’IA… Le premier lancement peut prendre quelques minutes.",
  );
  try {
    worker = new Worker(new URL("background-worker.js", location.href));
    timer = setTimeout(
      () =>
        fail(
          "Le traitement a pris trop de temps. Vérifiez votre connexion puis réessayez.",
        ),
      480000,
    );
    worker.onerror = () =>
      fail(
        "Le moteur IA n’a pas pu démarrer. Vérifiez votre connexion et utilisez un navigateur récent.",
      );
    worker.onmessage = async ({ data }) => {
      if (data.type === "progress") {
        say(data.message);
        return;
      }
      if (data.type === "error") {
        fail(
          "Le détourage a échoué. Vérifiez votre connexion ou essayez une autre image.",
        );
        return;
      }
      if (data.type !== "result") return;
      stopWorker();
      $("cancel").hidden = true;
      say("Préparation du PNG transparent…");
      try {
        const nextMask = Uint8Array.from(
          new Uint8Array(data.alpha),
          (a, i) => (a >= 128 && source.data[i * 4 + 3] > 0 ? 255 : 0),
        );
        const pixels = binaryComposite(
          source.data,
          new Uint8Array(data.alpha),
        );
        const canvas = document.createElement("canvas");
        canvas.width = source.width;
        canvas.height = source.height;
        canvas
          .getContext("2d")
          .putImageData(
            new ImageData(pixels, source.width, source.height),
            0,
            0,
          );
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        canvas.width = canvas.height = 1;
        if (!blob) throw new Error("PNG non créé");
        releaseResult();
        mask = nextMask;
        resultURL = URL.createObjectURL(blob);
        $("result").src = resultURL;
        $("result").hidden = false;
        await $("result").decode();
        setComparison(50);
        for (const id of [
          "reveal",
          "compare",
          "divider",
          "compareHint",
          "backgrounds",
        ])
          $(id).hidden = false;
        $("download").hidden = false;
        $("remove").hidden = true;
        $("retouch").hidden = false;
        say(
          "Fond supprimé. Comparez, choisissez votre fond et téléchargez le PNG.",
        );
      } catch {
        say(
          "Impossible de préparer le PNG. Essayez une image moins volumineuse.",
          true,
        );
      } finally {
        lock(false);
      }
    };
    // Original RGBA stays immutable; only the predicted alpha comes back.
    const input = new Blob([source.data], {
      type:
        "image/x-rgba8;width=" +
        source.width +
        ";height=" +
        source.height,
    });
    worker.postMessage({ image: input });
  } catch {
    fail(
      "Votre navigateur ne peut pas lancer ce traitement. Essayez Chrome, Edge, Firefox ou Safari à jour.",
    );
  }
}

function resetRetouch() {
  mask = null;
  strokes = [];
  undoPatch = null;
  editing = false;
  updateOriginalGuide();
  activeStroke = null;
  brushPointer = null;
  $("retouch").hidden = true;
  $("retouchTools").hidden = true;
  $("correct").textContent = "Corriger";
  $("correct").setAttribute("aria-expanded", "false");
  $("brushOverlay").hidden = true;
  $("brushCursor").hidden = true;
  $("brushOverlay").width = $("brushOverlay").height = 1;
  setBrushMode("add");
}
function updateRetouch() {
  for (const id of ["correct", "addBrush", "removeBrush", "brushSize"])
    $(id).disabled = busy;
  $("clearStrokes").disabled = busy || !strokes.length;
  $("applyLocal").disabled = busy || !strokes.length || !!activeStroke;
  $("undoLocal").disabled = busy || !undoPatch || !!strokes.length;
  $("download").disabled = busy || !!strokes.length;
  $("brushOverlay").style.pointerEvents = busy ? "none" : "auto";
}
function setBrushMode(mode) {
  brushMode = mode;
  $("addBrush").setAttribute("aria-pressed", String(mode === "add"));
  $("removeBrush").setAttribute(
    "aria-pressed",
    String(mode === "remove"),
  );
  $("brushCursor").classList.toggle("remove", mode === "remove");
}
function drawStrokes() {
  if (!source || !editing) return;
  const overlay = $("brushOverlay"),
    rect = $("comparison").getBoundingClientRect(),
    scale = Math.min(2, devicePixelRatio || 1);
  overlay.width = Math.max(1, Math.round(rect.width * scale));
  overlay.height = Math.max(1, Math.round(rect.height * scale));
  const ctx = overlay.getContext("2d");
  ctx.scale(overlay.width / source.width, overlay.height / source.height);
  ctx.lineCap = ctx.lineJoin = "round";
  for (const stroke of strokes) {
    ctx.strokeStyle = ctx.fillStyle =
      stroke.mode === "add" ? "#b4ed6655" : "#ff899c66";
    ctx.lineWidth = stroke.radius * 2;
    ctx.beginPath();
    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      ctx.arc(p.x, p.y, stroke.radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      stroke.points.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      ctx.stroke();
    }
  }
}
function brushPoint(event) {
  const rect = $("comparison").getBoundingClientRect();
  return {
    x: Math.max(
      0,
      Math.min(
        source.width,
        ((event.clientX - rect.left) * source.width) / rect.width,
      ),
    ),
    y: Math.max(
      0,
      Math.min(
        source.height,
        ((event.clientY - rect.top) * source.height) / rect.height,
      ),
    ),
  };
}
function showCursor(event) {
  const rect = $("comparison").getBoundingClientRect(),
    cursor = $("brushCursor");
  cursor.hidden = false;
  cursor.style.left = event.clientX - rect.left + "px";
  cursor.style.top = event.clientY - rect.top + "px";
  cursor.style.width = cursor.style.height = $("brushSize").value + "px";
}
function updateOriginalGuide() {
  $("originalGuide").hidden = !editing || !$("showOriginalGuide").checked;
}
$("showOriginalGuide").onchange = updateOriginalGuide;
function toggleEditing() {
  if (busy || !mask) return;
  editing = !editing;
  updateOriginalGuide();
  $("correct").textContent = editing
    ? "Quitter la correction"
    : "Corriger";
  $("correct").setAttribute("aria-expanded", String(editing));
  $("retouchTools").hidden = !editing;
  $("brushOverlay").hidden = !editing;
  $("compare").hidden = editing;
  $("divider").hidden = editing;
  $("compareHint").hidden = editing;
  $("brushCursor").hidden = true;
  if (editing) setComparison(100);
  else setComparison(50);
  drawStrokes();
  updateRetouch();
  if (!editing && strokes.length)
    say(
      "Traits en attente : rouvrez Corriger pour les appliquer ou les effacer avant téléchargement.",
    );
}
async function showMask(nextMask) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  let url;
  try {
    canvas
      .getContext("2d")
      .putImageData(
        new ImageData(
          binaryComposite(source.data, nextMask),
          source.width,
          source.height,
        ),
        0,
        0,
      );
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw Error("PNG non créé");
    url = URL.createObjectURL(blob);
    const probe = new Image();
    probe.src = url;
    await probe.decode();
    const old = resultURL;
    $("result").src = url;
    resultURL = url;
    url = null;
    mask = nextMask;
    if (old) URL.revokeObjectURL(old);
    releaseDownload();
  } finally {
    canvas.width = canvas.height = 1;
    if (url) URL.revokeObjectURL(url);
  }
}
async function applyLocal() {
  if (busy || !mask || !strokes.length || activeStroke) return;
  lock(true);
  say("Recalcul de la segmentation locale…");
  let next = null;
  try {
    const boxes = LocalBrush.regions(
        strokes,
        source.width,
        source.height,
      ),
      patches = [];
    worker = new Worker(new URL("background-worker.js", location.href));
    worker.onmessage = ({ data }) => {
      if (data.type === "progress")
        return say("Correction locale · " + data.message);
      if (data.type === "result" && pendingInference) {
        const p = pendingInference;
        pendingInference = null;
        p.resolve(new Uint8Array(data.alpha));
      } else if (data.type === "error" && pendingInference) {
        const p = pendingInference;
        pendingInference = null;
        p.reject(new Error("Échec du modèle local"));
      }
    };
    worker.onerror = () => stopWorker();
    timer = setTimeout(stopWorker, 480000);
    for (let i = 0; i < boxes.length; i++) {
      const rect = boxes[i],
        codes = LocalBrush.coverage(strokes, rect);
      say("Analyse locale " + (i + 1) + "/" + boxes.length + "…");
      const pixels = LocalBrush.crop(source.data, source.width, rect);
      const image = new Blob([pixels], {
        type: "image/x-rgba8;width=" + rect.w + ";height=" + rect.h,
      });
      const alpha = await new Promise((resolve, reject) => {
        pendingInference = { resolve, reject };
        worker.postMessage({ image });
      });
      patches.push(
        LocalBrush.changes(
          mask,
          source.width,
          source.data,
          rect,
          alpha,
          codes,
        ),
      );
    }
    stopWorker();
    $("cancel").hidden = true;
    const count = patches.reduce((n, p) => n + p.indices.length, 0);
    if (!count) {
      strokes = [];
      drawStrokes();
      say(
        "La prédiction locale ne propose aucun changement. Élargissez le trait ou son contexte ; ISNet peut confirmer la même erreur.",
      );
      return;
    }
    next = mask.slice();
    for (const patch of patches) LocalBrush.apply(next, patch);
    await showMask(next);
    undoPatch = patches;
    strokes = [];
    drawStrokes();
    say(
      "Correction locale appliquée : " +
        count +
        " pixels ajustés. Le reste de l’image est conservé.",
    );
  } catch {
    say(
      "Correction locale interrompue ou échouée. Le résultat précédent et vos traits sont conservés ; vous pouvez réessayer.",
      true,
    );
  } finally {
    stopWorker();
    lock(false);
  }
}
$("correct").onclick = toggleEditing;
$("addBrush").onclick = () => setBrushMode("add");
$("removeBrush").onclick = () => setBrushMode("remove");
$("clearStrokes").onclick = () => {
  strokes = [];
  activeStroke = null;
  drawStrokes();
  updateRetouch();
  say("Traits effacés. Le masque n’a pas été modifié.");
};
$("applyLocal").onclick = applyLocal;
$("undoLocal").onclick = async () => {
  if (busy || !undoPatch || strokes.length) return;
  lock(true);
  $("cancel").hidden = true;
  try {
    const next = mask.slice();
    for (const patch of undoPatch) LocalBrush.apply(next, patch, true);
    await showMask(next);
    undoPatch = null;
    say("Dernière correction locale annulée.");
  } catch {
    say(
      "Impossible d’annuler pour le moment. Le résultat courant est conservé.",
      true,
    );
  } finally {
    lock(false);
  }
};
$("brushOverlay").addEventListener("pointerdown", (event) => {
  if (busy || !editing || event.button !== 0 || brushPointer !== null)
    return;
  event.preventDefault();
  brushPointer = event.pointerId;
  $("brushOverlay").setPointerCapture(event.pointerId);
  activeStroke = {
    mode: brushMode,
    radius:
      (Number($("brushSize").value) * source.width) /
      $("comparison").getBoundingClientRect().width /
      2,
    points: [brushPoint(event)],
  };
  strokes.push(activeStroke);
  showCursor(event);
  drawStrokes();
  updateRetouch();
});
$("brushOverlay").addEventListener("pointermove", (event) => {
  if (busy || !editing) return;
  showCursor(event);
  if (event.pointerId === brushPointer && activeStroke) {
    for (const sample of event.getCoalescedEvents?.().length
      ? event.getCoalescedEvents()
      : [event])
      activeStroke.points.push(brushPoint(sample));
    drawStrokes();
  }
});
for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
  $("brushOverlay").addEventListener(name, (event) => {
    if (event.pointerId !== brushPointer) return;
    if (name === "pointerup" && activeStroke)
      activeStroke.points.push(brushPoint(event));
    brushPointer = null;
    activeStroke = null;
    drawStrokes();
    updateRetouch();
  });
$("brushOverlay").addEventListener("pointerleave", () => {
  $("brushCursor").hidden = true;
});
new ResizeObserver(() => drawStrokes()).observe($("comparison"));
$("choose").onclick = $("change").onclick = () => {
  if (!busy) $("file").click();
};
$("file").onchange = (event) => importImage(event.target.files[0]);
$("remove").onclick = processImage;
$("cancel").onclick = () => {
  stopWorker();
  lock(false);
  say("Traitement annulé. Vous pouvez réessayer ou changer d’image.");
};
$("compare").addEventListener("input", (event) =>
  setComparison(event.target.value),
);
function moveComparison(event) {
  const rect = $("comparison").getBoundingClientRect();
  setComparison(((event.clientX - rect.left) / rect.width) * 100);
}
$("compare").addEventListener("pointerdown", (event) => {
  if (busy || event.button !== 0 || dragPointer !== null) return;
  event.preventDefault();
  dragPointer = event.pointerId;
  $("compare").focus({ preventScroll: true });
  $("compare").setPointerCapture(event.pointerId);
  moveComparison(event);
});
$("compare").addEventListener("pointermove", (event) => {
  if (event.pointerId === dragPointer) moveComparison(event);
});
for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
  $("compare").addEventListener(name, (event) => {
    if (event.pointerId === dragPointer) dragPointer = null;
  });
$("backgrounds").addEventListener("change", (event) => {
  if (!busy && event.target.name === "background")
    setBackground(event.target.value);
});
$("download").onclick = async () => {
  if (!resultURL || busy || strokes.length) return;
  let url = resultURL,
    canvas = null;
  const selected = background;
  if (selected !== "transparent") {
    lock(true);
    $("cancel").hidden = true;
    try {
      canvas = document.createElement("canvas");
      canvas.width = source.width;
      canvas.height = source.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = selected === "white" ? "#ffffff" : "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage($("result"), 0, 0);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("PNG non créé");
      releaseDownload();
      url = downloadURL = URL.createObjectURL(blob);
      downloadTimer = setTimeout(releaseDownload, 60000);
    } catch {
      say(
        "Impossible d’exporter le PNG. Réessayez ou choisissez le fond transparent.",
        true,
      );
      return;
    } finally {
      if (canvas) canvas.width = canvas.height = 1;
      lock(false);
    }
  }
  const a = document.createElement("a");
  a.href = url;
  a.download =
    fileName +
    (selected === "transparent"
      ? "-sans-fond"
      : "-fond-" + (selected === "white" ? "blanc" : "noir")) +
    ".png";
  document.body.append(a);
  a.click();
  a.remove();
};
for (const name of ["dragenter", "dragover"])
  $("drop").addEventListener(name, (event) => {
    event.preventDefault();
    if (!busy) $("drop").classList.add("drag");
  });
for (const name of ["dragleave", "drop"])
  $("drop").addEventListener(name, (event) => {
    event.preventDefault();
    $("drop").classList.remove("drag");
  });
$("drop").addEventListener("drop", (event) =>
  importImage(event.dataTransfer.files[0]),
);
window.addEventListener("dragover", (event) => event.preventDefault());
window.addEventListener("drop", (event) => event.preventDefault());
window.addEventListener("pagehide", () => {
  stopWorker();
  releaseSource();
});
