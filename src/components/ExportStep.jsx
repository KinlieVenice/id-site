import { useEffect, useMemo, useRef, useState } from 'react';
import CropMarks from './CropMarks.jsx';
import Icon from './Icon.jsx';
import { PAPERS } from '../data/paper.js';
import { PRESETS } from '../data/presets.js';
import {
  buildMixedTileSheet,
  scaleCanvasTo,
  addBorder,
  downloadCanvas,
} from '../lib/image.js';

// Human label for a size, preferring whole inches when the mm value is an
// exact inch conversion (e.g. 50.8mm -> "2×2 in"), else plain mm.
function sizeLabel(p) {
  const win = p.wmm / 25.4;
  const hin = p.hmm / 25.4;
  if (Math.abs(win - Math.round(win)) < 0.02 && Math.abs(hin - Math.round(hin)) < 0.02) {
    return `${Math.round(win)}×${Math.round(hin)} in`;
  }
  return `${Math.round(p.wmm)}×${Math.round(p.hmm)} mm`;
}

function sizeKey(p) {
  return `${Math.round(p.wmm * 10)}x${Math.round(p.hmm * 10)}`;
}

// FR7 single download + FR8–FR11 tile/print sheet. FR6 cutting border lives here
// (not in the Background step) so it's drawn last — on top of the name strip and
// attire — right before printing, where a cut guide belongs.
export default function ExportStep({ finalCanvas, preset, onBack }) {
  const [format, setFormat] = useState('image/png');
  const [border, setBorder] = useState(false);
  const [paperId, setPaperId] = useState(PAPERS[0].id);
  const previewRef = useRef(null);

  // The canvas we actually export: the finished photo, with the cutting border
  // applied last if requested.
  const outCanvas = useMemo(
    () => (border ? addBorder(finalCanvas) : finalCanvas),
    [border, finalCanvas],
  );

  const w = outCanvas.width;
  const h = outCanvas.height;
  const paper = PAPERS.find((p) => p.id === paperId);

  // Combo printing — every OTHER preset with the same aspect ratio as the one
  // this photo was cropped to, so it can be re-rendered at that size too
  // without re-cropping (e.g. cropped to 2×2in square -> also offer 1×1in).
  const compatibleSizes = useMemo(() => {
    const aspect = preset.wmm / preset.hmm;
    const seen = new Map();
    PRESETS.forEach((p) => {
      if (Math.abs(p.wmm / p.hmm - aspect) > 0.02) return;
      const key = sizeKey(p);
      if (!seen.has(key)) seen.set(key, p);
    });
    return [...seen.values()].sort((a, b) => a.wmm - b.wmm);
  }, [preset]);

  // The sizes to print, each with its own copy count. Starts with just the
  // size this photo was actually cropped to.
  const [mix, setMix] = useState(() => [
    { key: sizeKey(preset), wmm: preset.wmm, hmm: preset.hmm, dpi: preset.dpi, copies: 4 },
  ]);
  const [addKey, setAddKey] = useState('');

  const availableToAdd = compatibleSizes.filter((p) => !mix.some((m) => m.key === sizeKey(p)));

  function addSize() {
    const p = compatibleSizes.find((s) => sizeKey(s) === addKey);
    if (!p) return;
    setMix((m) => [...m, { key: sizeKey(p), wmm: p.wmm, hmm: p.hmm, dpi: p.dpi, copies: 4 }]);
    setAddKey('');
  }
  function removeSize(key) {
    setMix((m) => m.filter((row) => row.key !== key));
  }
  function setCopies(key, n) {
    setMix((m) => m.map((row) => (row.key === key ? { ...row, copies: Math.max(0, n) } : row)));
  }

  // Scale the finished photo to each requested size — same aspect ratio, so
  // this is a pure resize, no cropping.
  const items = useMemo(
    () =>
      mix
        .filter((row) => row.copies > 0)
        .map((row) => {
          const pw = Math.round((row.wmm / 25.4) * row.dpi);
          const ph = Math.round((row.hmm / 25.4) * row.dpi);
          return { canvas: scaleCanvasTo(outCanvas, pw, ph), count: row.copies };
        }),
    [mix, outCanvas],
  );

  const { canvas: sheetCanvas, placed, requested } = useMemo(
    () => buildMixedTileSheet(items, paper, preset.dpi),
    [items, paper, preset.dpi],
  );

  // Render a scaled-down preview of the print sheet into the small canvas.
  useEffect(() => {
    if (!previewRef.current || placed === 0) return;
    const view = previewRef.current;
    const maxW = 280;
    const scale = Math.min(1, maxW / sheetCanvas.width);
    view.width = Math.round(sheetCanvas.width * scale);
    view.height = Math.round(sheetCanvas.height * scale);
    const ctx = view.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, view.width, view.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sheetCanvas, 0, 0, view.width, view.height);
  }, [sheetCanvas, placed]);

  const ext = format === 'image/png' ? 'png' : 'jpg';

  function downloadSingle() {
    downloadCanvas(outCanvas, `id-photo_${preset.id}.${ext}`, format);
  }

  function downloadSheet() {
    downloadCanvas(sheetCanvas, `id-sheet_${preset.id}_${paper.id}.${ext}`, format);
  }

  return (
    <section className="panel">
      <CropMarks />
      <h2>Download</h2>
      <p className="sub">
        Your photo is{' '}
        <span className="mono">
          {w}×{h} px @ {preset.dpi} dpi
        </span>
        . Save a single copy, or tile copies onto a print sheet.
      </p>

      <div className="row" style={{ alignItems: 'flex-end' }}>
        <div className="field" style={{ maxWidth: 220, minWidth: 180 }}>
          <span className="lbl">File format</span>
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="image/png">PNG (lossless)</option>
            <option value="image/jpeg">JPG (smaller)</option>
          </select>
        </div>
        <div className="field">
          <label className="pill-toggle">
            <span className="pt-copy">
              <span className="pt-title">Cutting guide</span>
              <span className="pt-sub">Adds a thin border to cut along</span>
            </span>
            <input
              type="checkbox"
              checked={border}
              onChange={(e) => setBorder(e.target.checked)}
              style={{ display: 'none' }}
            />
            <span className={`pill-switch ${border ? 'on' : ''}`} role="presentation" aria-hidden="true" />
          </label>
        </div>
      </div>

      <div className="export-grid">
        <div className="subpanel">
          <h3>Single photo</h3>
          <div className="preview-frame" style={{ minHeight: 200 }}>
            <SingleThumb canvas={outCanvas} />
          </div>
          <div className="btn-row">
            <button className="btn primary" onClick={downloadSingle}>
              <Icon name="download" /> Download photo
            </button>
          </div>
        </div>

        <div className="subpanel">
          <h3>Print sheet</h3>
          <div className="field">
            <span className="lbl">Paper size</span>
            <select value={paperId} onChange={(e) => setPaperId(e.target.value)}>
              {PAPERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <span className="lbl">Sizes &amp; copies</span>
            {mix.map((row) => (
              <div className="mix-row" key={row.key}>
                <span className="mix-label">{sizeLabel(row)}</span>
                <input
                  type="number"
                  min={0}
                  value={row.copies}
                  onChange={(e) => setCopies(row.key, Number(e.target.value) || 0)}
                />
                {mix.length > 1 && (
                  <button
                    className="btn"
                    aria-label={`Remove ${sizeLabel(row)}`}
                    onClick={() => removeSize(row.key)}
                  >
                    <Icon name="close" />
                  </button>
                )}
              </div>
            ))}

            {availableToAdd.length > 0 && (
              <div className="mix-row mix-add">
                <select value={addKey} onChange={(e) => setAddKey(e.target.value)}>
                  <option value="">+ Add a size…</option>
                  {availableToAdd.map((p) => (
                    <option key={sizeKey(p)} value={sizeKey(p)}>
                      {sizeLabel(p)}
                    </option>
                  ))}
                </select>
                <button className="btn" disabled={!addKey} onClick={addSize}>
                  Add
                </button>
              </div>
            )}
          </div>

          <p className="capacity">
            {requested === 0 ? (
              <>Set a copy count above to fill the sheet.</>
            ) : placed >= requested ? (
              <>
                Fits all <b>{placed}</b> copies on this sheet
              </>
            ) : (
              <>
                Fits <b>{placed}</b> of {requested} requested — lower a copy count or pick bigger paper
              </>
            )}
          </p>
          {placed > 0 && (
            <div className="sheet-preview">
              <canvas ref={previewRef} />
            </div>
          )}
          <div className="btn-row">
            <button className="btn primary" disabled={placed === 0} onClick={downloadSheet}>
              <Icon name="print" /> Download sheet
            </button>
          </div>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={onBack}>
          <Icon name="arrow_back" /> Back
        </button>
      </div>
    </section>
  );
}

// Small live thumbnail of the final photo, drawn from the canvas.
function SingleThumb({ canvas }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const maxH = 200;
    const scale = Math.min(1, maxH / canvas.height);
    const view = ref.current;
    view.width = Math.round(canvas.width * scale);
    view.height = Math.round(canvas.height * scale);
    const ctx = view.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, view.width, view.height);
  }, [canvas]);
  return <canvas ref={ref} style={{ maxHeight: 200, maxWidth: '100%' }} />;
}
