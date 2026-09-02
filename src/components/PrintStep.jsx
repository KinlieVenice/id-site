import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { PAPERS } from '../data/paper.js';
import { buildMixedTileSheet, scaleCanvasTo, addBorder, downloadCanvas } from '../lib/image.js';

// Chip choices for "photos per sheet" — a simplified front-end over the same
// buildMixedTileSheet packer ExportStep used: we just set the copy count for
// the single size this photo was cropped to, then let the packer decide the
// actual layout. If the sheet can't fit the requested count the summary says
// so, same as before.
const COUNT_CHIPS = [2, 4, 6, 8, 9];

export default function PrintStep({ finalCanvas, preset, onBack, ready }) {
  const [format, setFormat] = useState('image/png');
  const [border, setBorder] = useState(false);
  const [paperId, setPaperId] = useState(PAPERS[0].id);
  const [copies, setCopies] = useState(4);
  const previewRef = useRef(null);

  const outCanvas = useMemo(() => (border ? addBorder(finalCanvas) : finalCanvas), [border, finalCanvas]);
  const paper = PAPERS.find((p) => p.id === paperId);

  const items = useMemo(() => {
    const pw = Math.round((preset.wmm / 25.4) * preset.dpi);
    const ph = Math.round((preset.hmm / 25.4) * preset.dpi);
    return [{ canvas: scaleCanvasTo(outCanvas, pw, ph), count: copies }];
  }, [outCanvas, preset, copies]);

  const { canvas: sheetCanvas, placed, requested } = useMemo(
    () => buildMixedTileSheet(items, paper, preset.dpi),
    [items, paper, preset.dpi],
  );

  useEffect(() => {
    if (!previewRef.current || placed === 0) return;
    const view = previewRef.current;
    const maxW = 420;
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
    <>
      <div className="page-head">
        <span className="step-badge">STEP 5 OF 5</span>
        <h1>Print your photos</h1>
        <p className="sub">Choose a paper size and how many copies you need.</p>
      </div>

      <div className="two-col">
        <div>
          <div className="print-toolbar">
            <div className="field" style={{ marginBottom: 0, minWidth: 200 }}>
              <span className="lbl">Paper size</span>
              <select value={paperId} onChange={(e) => setPaperId(e.target.value)}>
                {PAPERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="paper-badge">
              {outCanvas.width}×{outCanvas.height} px @ {preset.dpi} DPI
            </span>
          </div>

          <div className="print-preview">
            {placed > 0 ? (
              <canvas ref={previewRef} />
            ) : (
              <p className="hint">Choose a copy count to preview the sheet.</p>
            )}
          </div>

          <div className="field" style={{ marginTop: 18 }}>
            <span className="lbl">Photos per sheet</span>
            <div className="chip-row">
              {COUNT_CHIPS.map((n) => (
                <button
                  key={n}
                  className={`chip-btn ${copies === n ? 'on' : ''}`}
                  onClick={() => setCopies(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="two-col" style={{ marginTop: 18, alignItems: 'flex-end' }}>
            <div className="field" style={{ maxWidth: 220, marginBottom: 0 }}>
              <span className="lbl">File format</span>
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/png">PNG (lossless)</option>
                <option value="image/jpeg">JPG (smaller)</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
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
        </div>

        <div className="card side-card">
          <h2>Summary</h2>
          <p className="sub">Ready to print and download.</p>

          <div className="print-summary">
            <div>
              <div className="print-summary-num">{placed}</div>
              <div className="print-summary-label">
                {placed >= requested
                  ? 'photos on this sheet'
                  : `of ${requested} requested — lower the count or pick bigger paper`}
              </div>
            </div>
            <div className="print-summary-grid">
              {Array.from({ length: Math.min(9, placed || 0) }).map((_, i) => (
                <span key={i}>
                  <Icon name="person" />
                </span>
              ))}
            </div>
          </div>

          <div className="about-rows">
            <div className="about-row">
              <span>Size</span>
              <span>
                {Math.round(preset.wmm)} × {Math.round(preset.hmm)} mm
              </span>
            </div>
            <div className="about-row">
              <span>Paper</span>
              <span>{paper.label}</span>
            </div>
            <div className="about-row">
              <span>Format</span>
              <span>{ext.toUpperCase()}</span>
            </div>
          </div>

          <div className="btn-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <button className="btn primary" disabled={placed === 0} onClick={downloadSheet}>
              <Icon name="print" /> Download print sheet
            </button>
            <button className="btn" onClick={downloadSingle}>
              <Icon name="download" /> Download single photo
            </button>
          </div>

          {ready && (
            <div className="requirement-badge">
              <Icon name="check_circle" fill />
              <span>
                <span className="rb-title">Your photo is ready</span>
                <br />
                <span className="rb-sub">Everything looks good for printing.</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={onBack}>
          <Icon name="arrow_back" /> Back
        </button>
      </div>
    </>
  );
}
