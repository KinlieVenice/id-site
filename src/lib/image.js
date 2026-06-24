// Pure canvas/image operations for the ID-photo pipeline.
//
// Everything here is a plain function over canvases and numbers — no React, no
// DOM-component state — so the maths (mm↔px, crop, composite, border, tile) is
// isolated and testable (Decision D1: all client-side; the architecture note
// asks for one image module).

// ---- units -----------------------------------------------------------------

export function mmToPx(mm, dpi) {
  return Math.round((mm / 25.4) * dpi);
}

// ---- loading ---------------------------------------------------------------

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read this image file.'));
    img.src = src;
  });
}

// Read a File into a data URL. Rejects clearly on unreadable files (FR1).
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      reject(new Error('Please choose a JPG or PNG image.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.readAsDataURL(file);
  });
}

// ---- crop ------------------------------------------------------------------

// Render the cropped region (in natural image pixels, from react-easy-crop's
// croppedAreaPixels) into a canvas of the preset's exact output dimensions (FR3).
export async function cropToCanvas(imageSrc, cropPixels, outW, outH) {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    img,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    outW,
    outH,
  );
  return canvas;
}

// ---- background removal ----------------------------------------------------

// Run the in-browser segmentation model (Decision D3). Lazy-imported so the
// WASM/model code is only fetched when the user actually toggles removal on.
// Returns a canvas with a transparent background at the same size as the input.
export async function removeBackground(sourceCanvas, onProgress) {
  const { removeBackground: imglyRemove } = await import('@imgly/background-removal');
  const blob = await canvasToBlob(sourceCanvas, 'image/png');
  const resultBlob = await imglyRemove(blob, {
    progress: (key, current, total) => {
      if (onProgress && total) onProgress(current / total, key);
    },
  });
  const url = URL.createObjectURL(resultBlob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---- composite -------------------------------------------------------------

// Paint a solid background colour behind a (possibly transparent) canvas (FR5).
export function compositeOnColor(sourceCanvas, color) {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sourceCanvas, 0, 0);
  return canvas;
}

// ---- cutting border --------------------------------------------------------

// Thin guide line just inside the photo edge (FR6). Drawn on a copy.
export function addBorder(sourceCanvas, color = '#1a1a1a', widthPx = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.strokeStyle = color;
  ctx.lineWidth = widthPx;
  const inset = widthPx / 2;
  ctx.strokeRect(inset, inset, canvas.width - widthPx, canvas.height - widthPx);
  return canvas;
}

// ---- tile / print sheet ----------------------------------------------------

// Pack copies of the final photo onto a paper sheet (FR8–FR11, Decision D7).
// All geometry is computed from millimetres at the export DPI.
export function buildTileSheet(photoCanvas, paper, dpi, copies, opts = {}) {
  const gapMm = opts.gapMm ?? 3;
  const marginMm = opts.marginMm ?? 5;
  const background = opts.background ?? '#ffffff';

  const sheetW = mmToPx(paper.wmm, dpi);
  const sheetH = mmToPx(paper.hmm, dpi);
  const gap = mmToPx(gapMm, dpi);
  const margin = mmToPx(marginMm, dpi);
  const photoW = photoCanvas.width;
  const photoH = photoCanvas.height;

  const usableW = sheetW - 2 * margin + gap;
  const usableH = sheetH - 2 * margin + gap;
  const cols = Math.max(0, Math.floor(usableW / (photoW + gap)));
  const rows = Math.max(0, Math.floor(usableH / (photoH + gap)));
  const capacity = cols * rows;
  const count = Math.min(Math.max(0, copies), capacity);

  const canvas = document.createElement('canvas');
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, sheetW, sheetH);

  // Centre the grid block within the usable area for a tidy sheet.
  const gridW = cols * photoW + (cols - 1) * gap;
  const gridH = rows * photoH + (rows - 1) * gap;
  const startX = Math.round((sheetW - gridW) / 2);
  const startY = Math.round((sheetH - gridH) / 2);

  let placed = 0;
  for (let r = 0; r < rows && placed < count; r++) {
    for (let c = 0; c < cols && placed < count; c++) {
      const x = startX + c * (photoW + gap);
      const y = startY + r * (photoH + gap);
      ctx.drawImage(photoCanvas, x, y);
      placed++;
    }
  }

  return { canvas, capacity, cols, rows, placed };
}

// Capacity-only helper for the UI to show "N fit per sheet" before exporting.
export function sheetCapacity(photoCanvas, paper, dpi, opts = {}) {
  const gapMm = opts.gapMm ?? 3;
  const marginMm = opts.marginMm ?? 5;
  const sheetW = mmToPx(paper.wmm, dpi);
  const sheetH = mmToPx(paper.hmm, dpi);
  const gap = mmToPx(gapMm, dpi);
  const margin = mmToPx(marginMm, dpi);
  const cols = Math.max(0, Math.floor((sheetW - 2 * margin + gap) / (photoCanvas.width + gap)));
  const rows = Math.max(0, Math.floor((sheetH - 2 * margin + gap) / (photoCanvas.height + gap)));
  return { capacity: cols * rows, cols, rows };
}

// ---- transparency helpers --------------------------------------------------

// Crop a canvas down to the bounding box of its non-transparent pixels. Used to
// tidy a drawn signature (Phase 2) so its transform handles hug the ink.
export function trimTransparent(sourceCanvas) {
  const { width: w, height: h } = sourceCanvas;
  const ctx = sourceCanvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, w, h);
  let top = h,
    left = w,
    right = 0,
    bottom = 0,
    found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        found = true;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (!found) return sourceCanvas;
  const pad = 4;
  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  right = Math.min(w - 1, right + pad);
  bottom = Math.min(h - 1, bottom + pad);
  const out = document.createElement('canvas');
  out.width = right - left + 1;
  out.height = bottom - top + 1;
  out.getContext('2d').drawImage(sourceCanvas, left, top, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

// ---- export ----------------------------------------------------------------

export function canvasToBlob(canvas, type = 'image/png', quality = 0.95) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Export failed.'))),
      type,
      quality,
    );
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadCanvas(canvas, filename, type = 'image/png', quality = 0.95) {
  const blob = await canvasToBlob(canvas, type, quality);
  downloadBlob(blob, filename);
}
