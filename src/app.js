import { ImageDocument } from './core/document.js';
import { brushSegment, applySelection, mergeRepair, selectionBounds } from './core/pixels.js';
import { AIClient } from './ai/client.js';

const $ = (selector) => document.querySelector(selector);
const image = $('#image'),
  selectionCanvas = $('#selection'),
  interaction = $('#interaction'),
  stage = $('#stage');
const workspace = $('#workspace'),
  thumb = $('#thumbnail');
let doc,
  tool = 'erase',
  busy = false,
  comparing = false,
  stroke,
  frame = 0,
  session = 0,
  rgbRevision = 0;
let points = [],
  labels = [],
  scale = 1,
  dirty = false;
const ai = new AIClient((message) => status(message));
const ctx = (canvas) => canvas.getContext('2d', { willReadFrequently: true });
const toBlob = (canvas, type = 'image/png', quality = 0.95) =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Impossible d’encoder cette image.'))),
      type,
      quality,
    ),
  );
function status(message, error = false) {
  $('#status').textContent = message;
  $('#status').classList.toggle('error', error);
}
function controls() {
  const locked = busy || !doc;
  document.querySelectorAll('[data-document]').forEach((element) => (element.disabled = locked));
  const selected = doc?.selection.some(Boolean);
  document
    .querySelectorAll('[data-selection]')
    .forEach((element) => (element.disabled = locked || !selected));
  $('#undo').disabled = locked || !doc.past.length;
  $('#redo').disabled = locked || !doc.future.length;
  $('#import').disabled = busy;
  $('#browse').disabled = busy;
  $('#demo').disabled = busy;
  $('#open-project').disabled = busy;
  $('#cancel').hidden = !busy;
  $('.editor').setAttribute('aria-busy', String(busy));
  $('#selected-count').textContent = doc
    ? `${((doc.selection.reduce((sum, value) => sum + (value > 0 ? 1 : 0), 0) / doc.selection.length) * 100).toFixed(1)} %`
    : '0 %';
  document
    .querySelectorAll('[data-tool]')
    .forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.tool === tool)));
  $('#compare').setAttribute('aria-pressed', String(comparing));
}
function render() {
  if (!doc) return;
  ctx(image).putImageData(
    new ImageData(comparing ? doc.original.slice() : doc.output(), doc.width, doc.height),
    0,
    0,
  );
  const overlay = new Uint8ClampedArray(doc.selection.length * 4);
  if (!comparing)
    for (let i = 0; i < doc.selection.length; i++) {
      overlay[i * 4] = 207;
      overlay[i * 4 + 1] = 235;
      overlay[i * 4 + 2] = 139;
      overlay[i * 4 + 3] = Math.round(doc.selection[i] * 0.38);
    }
  ctx(selectionCanvas).putImageData(new ImageData(overlay, doc.width, doc.height), 0, 0);
  const context = ctx(thumb);
  context.clearRect(0, 0, thumb.width, thumb.height);
  const size = Math.min(thumb.width / doc.width, thumb.height / doc.height);
  // Thumbnail always renders the edited result, even when comparing with original.
  const output = outputCanvas();
  context.drawImage(
    output,
    (thumb.width - doc.width * size) / 2,
    (thumb.height - doc.height * size) / 2,
    doc.width * size,
    doc.height * size,
  );
}
function scheduleRender() {
  if (!frame)
    frame = requestAnimationFrame(() => {
      frame = 0;
      render();
    });
}
function fit() {
  if (!doc) return;
  scale =
    $('#zoom').value === 'fit'
      ? Math.min(
          (workspace.clientWidth - 52) / doc.width,
          (workspace.clientHeight - 52) / doc.height,
          1,
        )
      : Number($('#zoom').value);
  scale = Math.max(0.01, scale);
  stage.style.width = `${doc.width * scale}px`;
  stage.style.height = `${doc.height * scale}px`;
}
function outputCanvas(pixels = doc.output()) {
  const canvas = document.createElement('canvas');
  canvas.width = doc.width;
  canvas.height = doc.height;
  ctx(canvas).putImageData(new ImageData(pixels, doc.width, doc.height), 0, 0);
  return canvas;
}
function activateDocument(next) {
  doc = next;
  session++;
  rgbRevision++;
  points = [];
  labels = [];
  comparing = false;
  dirty = false;
  for (const canvas of [image, selectionCanvas, interaction]) {
    canvas.width = doc.width;
    canvas.height = doc.height;
  }
  $('#empty').hidden = true;
  stage.hidden = false;
  $('#export-empty').hidden = true;
  $('#file-name').textContent = doc.name;
  $('#dimensions').textContent = `${doc.width} × ${doc.height} px`;
  $('#zoom').value = 'fit';
  fit();
  render();
  controls();
}
async function decode(blob) {
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  return bitmap;
}
async function importFile(file) {
  if (busy || !file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    return status('Choisissez un PNG, JPG ou WebP.', true);
  if (file.size > 30 * 1024 * 1024) return status('Le fichier dépasse 30 Mo.', true);
  busy = true;
  controls();
  status('Ouverture de l’image…');
  try {
    const bitmap = await decode(file);
    const factor = Math.min(
      1,
      2048 / Math.max(bitmap.width, bitmap.height),
      Math.sqrt(3000000 / (bitmap.width * bitmap.height)),
    );
    const width = Math.max(1, Math.round(bitmap.width * factor)),
      height = Math.max(1, Math.round(bitmap.height * factor));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx(canvas).drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    activateDocument(
      new ImageDocument(
        width,
        height,
        ctx(canvas).getImageData(0, 0, width, height).data,
        file.name,
      ),
    );
    status(
      factor < 1
        ? `Image adaptée à ${width} × ${height} px pour préserver la mémoire. Prête à retoucher.`
        : 'Image ouverte. La gomme et les sélections sont disponibles immédiatement.',
    );
  } catch (error) {
    status(`Impossible d’ouvrir l’image : ${error.message}`, true);
  } finally {
    busy = false;
    controls();
  }
}
function setTool(next) {
  if (busy) return;
  tool = next;
  comparing = false;
  stage.dataset.tool = tool;
  $('#cursor').hidden = true;
  const help = {
    erase: 'La gomme supprime immédiatement les pixels. Le damier indique la transparence.',
    restore: 'Restaure les pixels et les couleurs de l’image originale sous le pinceau.',
    select:
      'Peignez l’élément à retirer, puis effacez ou reconstruisez. Alt retire de la sélection.',
    object:
      'Cliquez dans l’objet. Ajoutez des points pour préciser ; Shift + clic exclut une zone.',
  };
  $('#tool-help').textContent = help[tool];
  controls();
  render();
}
function position(event) {
  const bounds = interaction.getBoundingClientRect();
  return {
    x: Math.max(
      0,
      Math.min(doc.width - 1, ((event.clientX - bounds.left) / bounds.width) * doc.width),
    ),
    y: Math.max(
      0,
      Math.min(doc.height - 1, ((event.clientY - bounds.top) / bounds.height) * doc.height),
    ),
  };
}
function cursor(event) {
  if (!doc || busy || comparing || tool === 'object') return ($('#cursor').hidden = true);
  const point = position(event),
    size = Number($('#brush').value) * scale;
  const element = $('#cursor');
  element.hidden = false;
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.left = `${point.x * scale}px`;
  element.style.top = `${point.y * scale}px`;
}
function paint(a, b, alt) {
  const action = tool === 'select' ? (alt ? 'unselect' : 'select') : tool;
  brushSegment(
    tool === 'select' ? doc.selection : doc.mask,
    doc.original,
    doc.width,
    doc.height,
    a,
    b,
    Number($('#brush').value) / 2,
    Number($('#hardness').value) / 100,
    action,
  );
  if (tool === 'restore') {
    // A restored pixel also returns to its original RGB after a reconstruction.
    const footprint = new Uint8ClampedArray(doc.mask.length);
    brushSegment(
      footprint,
      doc.original,
      doc.width,
      doc.height,
      a,
      b,
      Number($('#brush').value) / 2,
      Number($('#hardness').value) / 100,
      'select',
    );
    mergeRepair(doc.pixels, doc.original, footprint);
  }
  dirty = true;
  scheduleRender();
}
interaction.addEventListener('pointerdown', (event) => {
  if (!doc || busy || comparing || stroke || !event.isPrimary || event.button !== 0) return;
  event.preventDefault();
  if (tool === 'object') {
    detectObject(position(event), event.shiftKey ? 0 : 1);
    return;
  }
  interaction.setPointerCapture(event.pointerId);
  doc.checkpoint();
  stroke = { id: event.pointerId, point: position(event) };
  paint(stroke.point, stroke.point, event.altKey);
});
interaction.addEventListener('pointermove', (event) => {
  cursor(event);
  if (!stroke || stroke.id !== event.pointerId || busy) return;
  for (const sample of event.getCoalescedEvents?.() || [event]) {
    const point = position(sample);
    paint(stroke.point, point, event.altKey);
    stroke.point = point;
  }
});
function endStroke(event) {
  if (!stroke || stroke.id !== event.pointerId) return;
  if (tool === 'restore') {
    rgbRevision++;
    points = [];
    labels = [];
  }
  stroke = null;
  controls();
  status(
    tool === 'select'
      ? 'Zone peinte. Choisissez Effacer ou Supprimer et reconstruire.'
      : 'Retouche appliquée. Vous pouvez l’annuler avec Ctrl + Z.',
  );
}
interaction.addEventListener('pointerup', endStroke);
interaction.addEventListener('pointercancel', endStroke);
interaction.addEventListener('lostpointercapture', endStroke);
interaction.addEventListener('pointerleave', () => ($('#cursor').hidden = true));

async function operation(task, payload, apply, message) {
  if (!doc || busy) return;
  busy = true;
  comparing = false;
  $('#cursor').hidden = true;
  controls();
  status('Préparation du moteur local…');
  try {
    const result = await ai.run(task, payload);
    apply(result);
    dirty = true;
    render();
    status(message(result));
  } catch (error) {
    status(`${error.message} Votre dernier résultat est conservé.`, true);
  } finally {
    busy = false;
    controls();
  }
}
async function detectObject(point, label) {
  if (busy || !doc) return;
  const nextPoints = [...points, [Math.round(point.x), Math.round(point.y)]],
    nextLabels = [...labels, label];
  if (nextPoints.length > 12)
    return status('Limite de 12 points atteinte. Annulez la sélection pour recommencer.', true);
  // Capture input while locking the UI, before asynchronous PNG encoding.
  busy = true;
  controls();
  let blob;
  try {
    blob = await toBlob(outputCanvas(doc.pixels));
  } catch (error) {
    status(error.message, true);
  } finally {
    busy = false;
    controls();
  }
  if (!blob) return;
  await operation(
    'segment',
    { blob, points: nextPoints, labels: nextLabels, key: `${session}:${rgbRevision}` },
    (result) => {
      if (result.mask.length !== doc.mask.length)
        throw new Error('Le modèle a renvoyé un masque invalide.');
      doc.checkpoint();
      doc.selection = result.mask;
      points = nextPoints;
      labels = nextLabels;
    },
    (result) =>
      `Objet sélectionné · confiance du modèle ${Math.round(result.score * 100)} %. Vérifiez la zone avant de l’appliquer.`,
  );
}
$('#background').onclick = async () => {
  if (!doc || busy) return;
  busy = true;
  controls();
  let blob;
  try {
    blob = await toBlob(outputCanvas(doc.pixels));
  } catch (error) {
    status(error.message, true);
  } finally {
    busy = false;
    controls();
  }
  if (!blob) return;
  await operation(
    'background',
    { blob },
    (result) => {
      if (result.mask.length !== doc.mask.length)
        throw new Error('Le modèle a renvoyé un masque invalide.');
      doc.checkpoint();
      doc.mask = Uint8ClampedArray.from(result.mask, (value, i) =>
        Math.min(value, doc.pixels[i * 4 + 3]),
      );
      doc.selection.fill(0);
      points = [];
      labels = [];
    },
    () => 'Fond retiré. Affinez avec la gomme ou Restaurer, puis exportez.',
  );
};
function clearSelection() {
  if (!doc || busy) return;
  doc.checkpoint();
  doc.selection.fill(0);
  points = [];
  labels = [];
  render();
  controls();
}
$('#clear-selection').onclick = clearSelection;
for (const [id, action] of [
  ['erase-selection', 'erase'],
  ['restore-selection', 'restore'],
])
  $(`#${id}`).onclick = () => {
    if (!doc || busy || !doc.selection.some(Boolean)) return;
    doc.checkpoint();
    applySelection(doc.mask, doc.original, doc.selection, action);
    if (action === 'restore') {
      mergeRepair(doc.pixels, doc.original, doc.selection);
      rgbRevision++;
    }
    doc.selection.fill(0);
    points = [];
    labels = [];
    dirty = true;
    render();
    controls();
    status(
      action === 'erase'
        ? 'Zone supprimée : les pixels sélectionnés sont transparents.'
        : 'Zone originale restaurée.',
    );
  };
$('#repair').onclick = () => {
  if (!doc || busy || !doc.selection.some(Boolean)) return;
  const area = selectionBounds(doc.selection, doc.width, doc.height);
  if (doc.selection.every((value) => value > 0))
    return status('Laissez du fond autour de l’élément pour le reconstruire.', true);
  if (!area) return;
  operation(
    'repair',
    {
      pixels: doc.pixels,
      selection: doc.selection,
      width: doc.width,
      height: doc.height,
      method: $('#repair-method').value,
    },
    (result) => {
      if (result.pixels.length !== doc.pixels.length)
        throw new Error('Image reconstruite invalide.');
      doc.checkpoint();
      mergeRepair(doc.pixels, result.pixels, doc.selection);
      applySelection(doc.mask, doc.original, doc.selection, 'restore');
      doc.selection.fill(0);
      points = [];
      labels = [];
      rgbRevision++;
    },
    (result) =>
      `${result.method} : élément retiré et fond reconstruit. Vérifiez le résultat, Ctrl + Z permet de revenir en arrière.`,
  );
};
$('#cancel').onclick = () => ai.cancel();
function history(action) {
  if (!doc || busy) return;
  if (doc[action]()) {
    rgbRevision++;
    points = [];
    labels = [];
    dirty = true;
    comparing = false;
    render();
    controls();
    status(action === 'undo' ? 'Action annulée.' : 'Action rétablie.');
  }
}
$('#undo').onclick = () => history('undo');
$('#redo').onclick = () => history('redo');
$('#reset').onclick = () => {
  if (!doc || busy) return;
  doc.reset();
  rgbRevision++;
  points = [];
  labels = [];
  comparing = false;
  dirty = true;
  render();
  controls();
  status('Image originale retrouvée. Cette action peut être annulée.');
};
$('#compare').onclick = () => {
  if (!doc || busy) return;
  comparing = !comparing;
  $('#cursor').hidden = true;
  render();
  controls();
};
$('#zoom').onchange = fit;
$('#fit').onclick = () => {
  $('#zoom').value = 'fit';
  fit();
};
new ResizeObserver(fit).observe(workspace);
document
  .querySelectorAll('[data-tool]')
  .forEach((button) => (button.onclick = () => setTool(button.dataset.tool)));
$('#brush').oninput = () => ($('#brush-value').textContent = `${$('#brush').value} px`);
$('#hardness').oninput = () => ($('#hardness-value').textContent = `${$('#hardness').value} %`);
document.querySelectorAll('[data-backdrop]').forEach(
  (button) =>
    (button.onclick = () => {
      workspace.dataset.backdrop = button.dataset.backdrop;
      document
        .querySelectorAll('[data-backdrop]')
        .forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    }),
);
$('#import').onclick = $('#browse').onclick = () => $('#file').click();
$('#file').onchange = () => {
  importFile($('#file').files[0]);
  $('#file').value = '';
};
workspace.addEventListener('dragover', (event) => {
  event.preventDefault();
  if (!busy) workspace.classList.add('drag');
});
workspace.addEventListener('dragleave', () => workspace.classList.remove('drag'));
workspace.addEventListener('drop', (event) => {
  event.preventDefault();
  workspace.classList.remove('drag');
  importFile(event.dataTransfer.files[0]);
});
window.addEventListener('paste', (event) => {
  const file = [...(event.clipboardData?.items || [])]
    .find((item) => item.type.startsWith('image/'))
    ?.getAsFile();
  if (file) {
    event.preventDefault();
    importFile(file);
  }
});
$('#demo').onclick = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 650;
  const c = ctx(canvas);
  c.fillStyle = '#c6d4bc';
  c.fillRect(0, 0, 900, 650);
  c.fillStyle = '#a8b99e';
  c.fillRect(0, 470, 900, 180);
  c.fillStyle = '#708667';
  c.beginPath();
  c.ellipse(430, 490, 210, 28, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ede5c8';
  c.fillRect(260, 215, 330, 275);
  c.fillStyle = '#ddd2ae';
  c.beginPath();
  c.moveTo(590, 215);
  c.lineTo(650, 150);
  c.lineTo(650, 425);
  c.lineTo(590, 490);
  c.fill();
  c.fillStyle = '#f8efd6';
  c.beginPath();
  c.moveTo(260, 215);
  c.lineTo(320, 150);
  c.lineTo(650, 150);
  c.lineTo(590, 215);
  c.fill();
  c.fillStyle = '#405847';
  c.fillRect(365, 315, 115, 175);
  c.fillStyle = '#617862';
  c.fillRect(288, 266, 53, 64);
  c.fillRect(504, 266, 53, 64);
  c.fillStyle = '#be7054';
  c.fillRect(730, 385, 45, 93);
  c.fillStyle = '#465f40';
  c.beginPath();
  c.arc(752, 360, 53, 0, Math.PI * 2);
  c.fill();
  importFile(new File([await toBlob(canvas)], 'atelier-demo.png', { type: 'image/png' }));
};
function download(blob, name) {
  const url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function basename() {
  return (
    doc.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^\p{L}\p{N} _.-]/gu, '-')
      .slice(0, 90) || 'image'
  );
}
$('#download').onclick = async () => {
  if (!doc || busy) return;
  try {
    const format = $('#format').value,
      canvas = outputCanvas();
    let blob;
    if (format === 'jpeg') {
      const c = ctx(canvas);
      c.globalCompositeOperation = 'destination-over';
      c.fillStyle = $('#export-color').value;
      c.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (format === 'svg')
      blob = new Blob(
        [
          `<svg xmlns="http://www.w3.org/2000/svg" width="${doc.width}" height="${doc.height}" viewBox="0 0 ${doc.width} ${doc.height}"><image width="${doc.width}" height="${doc.height}" href="${canvas.toDataURL()}"/></svg>`,
        ],
        { type: 'image/svg+xml' },
      );
    else blob = await toBlob(canvas, `image/${format}`);
    if (format === 'webp' && blob.type !== 'image/webp')
      throw new Error('Ce navigateur ne peut pas exporter en WebP. Choisissez PNG.');
    download(blob, `${basename()}-decoupe.${format === 'jpeg' ? 'jpg' : format}`);
    status('Export téléchargé. La sélection colorée est exclue du fichier.');
  } catch (error) {
    status(error.message, true);
  }
};
$('#download-mask').onclick = async () => {
  if (!doc || busy) return;
  const data = new Uint8ClampedArray(doc.mask.length * 4);
  for (let i = 0; i < doc.mask.length; i++) {
    data.fill(doc.mask[i], i * 4, i * 4 + 3);
    data[i * 4 + 3] = 255;
  }
  download(await toBlob(outputCanvas(data)), `${basename()}-masque.png`);
};
$('#save-project').onclick = () => {
  if (!doc || busy) return;
  const mask = new Uint8ClampedArray(doc.mask.length * 4);
  for (let i = 0; i < doc.mask.length; i++) {
    mask.fill(doc.mask[i], i * 4, i * 4 + 3);
    mask[i * 4 + 3] = 255;
  }
  const project = {
    format: 'decoupe-studio',
    version: 1,
    name: doc.name,
    original: outputCanvas(doc.original).toDataURL(),
    pixels: outputCanvas(doc.pixels).toDataURL(),
    mask: outputCanvas(mask).toDataURL(),
  };
  download(
    new Blob([JSON.stringify(project)], { type: 'application/json' }),
    `${basename()}.decoupe`,
  );
  dirty = false;
  status('Projet enregistré. Ouvrez le fichier .decoupe pour reprendre votre travail.');
};
$('#open-project').onclick = () => $('#project-file').click();
$('#project-file').onchange = async () => {
  const file = $('#project-file').files[0];
  $('#project-file').value = '';
  if (!file || busy) return;
  if (file.size > 100 * 1024 * 1024) return status('Ce projet dépasse la limite de 100 Mo.', true);
  busy = true;
  controls();
  try {
    const project = JSON.parse(await file.text());
    if (project.format !== 'decoupe-studio' || project.version !== 1)
      throw new Error('Format de projet inconnu.');
    const images = [];
    for (const value of [project.original, project.pixels, project.mask]) {
      if (typeof value !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value))
        throw new Error('Image de projet invalide.');
      const bitmap = await decode(await (await fetch(value)).blob());
      if (bitmap.width > 2048 || bitmap.height > 2048 || bitmap.width * bitmap.height > 3001000) {
        bitmap.close();
        throw new Error('Résolution de projet trop grande.');
      }
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      ctx(canvas).drawImage(bitmap, 0, 0);
      bitmap.close();
      images.push({
        width: canvas.width,
        height: canvas.height,
        data: ctx(canvas).getImageData(0, 0, canvas.width, canvas.height).data,
      });
    }
    if (images.some((item) => item.width !== images[0].width || item.height !== images[0].height))
      throw new Error('Dimensions de projet incohérentes.');
    const next = new ImageDocument(
      images[0].width,
      images[0].height,
      images[0].data,
      String(project.name || 'projet').slice(0, 200),
    );
    next.pixels = images[1].data;
    next.mask = Uint8ClampedArray.from(next.mask, (_, i) => images[2].data[i * 4]);
    activateDocument(next);
    status('Projet retrouvé. Vous pouvez reprendre vos retouches.');
  } catch (error) {
    status(`Projet non ouvert : ${error.message}`, true);
  } finally {
    busy = false;
    controls();
  }
};
for (const id of ['help', 'models']) {
  $(`#${id}-open`).onclick = () => $(`#${id}`).showModal();
  $(`#${id} .dialog-close`).onclick = () => $(`#${id}`).close();
}
window.addEventListener('keydown', (event) => {
  if (/INPUT|SELECT|TEXTAREA/.test(event.target.tagName) || $('dialog[open]')) return;
  const key = event.key.toLowerCase();
  if (event.ctrlKey || event.metaKey) {
    if (key === 'z') {
      event.preventDefault();
      history(event.shiftKey ? 'redo' : 'undo');
    }
    if (key === 'y') {
      event.preventDefault();
      history('redo');
    }
    if (key === 's') {
      event.preventDefault();
      $('#save-project').click();
    }
    return;
  }
  if (event.key === 'Escape') {
    if (busy) ai.cancel();
    else clearSelection();
  }
  const shortcuts = { e: 'erase', r: 'restore', b: 'select', s: 'object' };
  if (shortcuts[key]) setTool(shortcuts[key]);
  if (event.key === '?') $('#help').showModal();
});
window.addEventListener('beforeunload', (event) => {
  if (dirty || busy) {
    event.preventDefault();
    event.returnValue = '';
  }
});
window.addEventListener('pagehide', () => ai.cancel());
controls();
