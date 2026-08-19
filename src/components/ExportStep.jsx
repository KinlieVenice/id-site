import { useEffect, useMemo, useRef, useState } from 'react';
import { PAPERS } from '../data/paper.js';
import { buildTileSheet, sheetCapacity, addBorder, downloadCanvas } from '../lib/image.js';

// FR7 single download + FR8–FR11 tile/print sheet. FR6 cutting border lives here
// (not in the Background step) so it's drawn last — on top of the name strip and
// attire — right before printing, where a cut guide belongs.
export default function ExportStep({ finalCanvas, preset, onBack }) {
  const [format, setFormat] = useState('image/png');
  const [border, setBorder] = useState(false);
  const [paperId, setPaperId] = useState(PAPERS[0].id);
  const [copies, setCopies] = useState(4);
  const previewRef = useRef(null);

  // The canvas we actually export: the finished photo, with the cutting border
  // applied last if requested.
  const outCanvas = useMemo(
    () => (border ? addBorder(finalCanvas) : finalCanvas),
    [border, finalCanvas],
  );

  // Report the actual exported pixels (a name strip can change the size), but
  // keep the preset's DPI for the print maths.
  const w = outCanvas.width;
  const h = outCanvas.height;
  const paper = PAPERS.find((p) => p.id === paperId);

  const { capacity, cols, rows } = useMemo(
    () => sheetCapacity(outCanvas, paper, preset.dpi),
    [outCanvas, paper, preset.dpi],
  );

  // Clamp the copy count to what physically fits (FR10).
  const effectiveCopies = Math.min(copies, capacity);

  // Render a scaled-down preview of the print sheet into the small canvas.
  useEffect(() => {
    if (!previewRef.current || capacity === 0) return;
    const { canvas } = buildTileSheet(outCanvas, paper, preset.dpi, effectiveCopies);
    const view = previewRef.current;
    const maxW = 280;
    const scale = Math.min(1, maxW / canvas.width);
    view.width = Math.round(canvas.width * scale);
    view.height = Math.round(canvas.height * scale);
    const ctx = view.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, view.width, view.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, view.width, view.height);
  }, [outCanvas, paper, preset.dpi, effectiveCopies, capacity]);

  const ext = format === 'image/png' ? 'png' : 'jpg';

  function downloadSingle() {
    downloadCanvas(outCanvas, `id-photo_${preset.id}.${ext}`, format);
  }

  function downloadSheet() {
    const { canvas } = buildTileSheet(outCanvas, paper, preset.dpi, effectiveCopies);
    downloadCanvas(canvas, `id-sheet_${preset.id}_${paper.id}.${ext}`, format);
  }

  return (
    <section className="panel">
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
          <span className="lbl">Cutting guide</span>
          <label className="toggle">
            <input type="checkbox" checked={border} onChange={(e) => setBorder(e.target.checked)} />
            Add a thin border to cut along
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
              Download photo
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
            <span className="lbl">Copies</span>
            <input
              type="number"
              min={1}
              max={Math.max(1, capacity)}
              value={effectiveCopies}
              onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <p className="capacity">
            {capacity > 0 ? (
              <>
                Fits <b>{capacity}</b> per sheet ({cols}×{rows} grid)
              </>
            ) : (
              <>This photo is too large for the selected paper.</>
            )}
          </p>
          {capacity > 0 && (
            <div className="sheet-preview">
              <canvas ref={previewRef} />
            </div>
          )}
          <div className="btn-row">
            <button className="btn primary" disabled={capacity === 0} onClick={downloadSheet}>
              Download sheet
            </button>
          </div>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={onBack}>
          ← Back
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
