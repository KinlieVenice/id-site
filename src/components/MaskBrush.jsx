import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

// FR15 (Phase 3) — manual touch-up brush to fix background-removal misses on
// hair, glasses and edges (Decision D3). Two modes:
//   erase   — paint away leftover background (destination-out)
//   restore — paint original pixels back in (sampled from the pre-removal crop)
// Works on a full-resolution working copy of the cutout; the on-screen canvas is
// just a scaled view, so edits stay sharp at export size.
export default function MaskBrush({ cutout, original, eraseColor, guide, onApply, onCancel }) {
  const viewRef = useRef(null);
  const workRef = useRef(null); // full-res working copy of the cutout
  const drawing = useRef(false);
  const history = useRef([]); // snapshots for undo (one per stroke)
  const [mode, setMode] = useState('erase');
  const [size, setSize] = useState(28);
  const [canUndo, setCanUndo] = useState(false);
  const [ring, setRing] = useState(null); // brush-size cursor preview
  const [zoom, setZoom] = useState(1); // display-only zoom, for precise touch-up

  const scale = Math.min(1, 640 / cutout.width);
  const viewW = Math.round(cutout.width * scale);
  const viewH = Math.round(cutout.height * scale);
  const dispW = Math.round(viewW * zoom);
  const dispH = Math.round(viewH * zoom);

  function zoomIn() {
    setZoom((z) => Math.min(3, Math.round((z + 0.5) * 100) / 100));
  }
  function zoomOut() {
    setZoom((z) => Math.max(1, Math.round((z - 0.5) * 100) / 100));
  }

  // Seed the working copy once from the incoming cutout.
  useEffect(() => {
    const work = document.createElement('canvas');
    work.width = cutout.width;
    work.height = cutout.height;
    work.getContext('2d').drawImage(cutout, 0, 0);
    workRef.current = work;
    history.current = [];
    setCanUndo(false);
    repaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cutout]);

  // Snapshot before a stroke so it can be undone (cap the stack so memory on
  // large photos stays bounded).
  function pushHistory() {
    const src = workRef.current;
    const snap = document.createElement('canvas');
    snap.width = src.width;
    snap.height = src.height;
    snap.getContext('2d').drawImage(src, 0, 0);
    history.current.push(snap);
    if (history.current.length > 20) history.current.shift();
    setCanUndo(true);
  }

  function undo() {
    const snap = history.current.pop();
    if (!snap) return;
    const ctx = workRef.current.getContext('2d');
    ctx.clearRect(0, 0, workRef.current.width, workRef.current.height);
    ctx.drawImage(snap, 0, 0);
    setCanUndo(history.current.length > 0);
    repaint();
  }

  // Ctrl/Cmd+Z to undo the last stroke.
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function repaint() {
    const view = viewRef.current;
    if (!view || !workRef.current) return;
    const ctx = view.getContext('2d');
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(workRef.current, 0, 0, viewW, viewH);
    if (guide) {
      // Full-opacity reference — never part of what gets saved (workRef), so
      // it can't leak into the exported photo even though it's shown at 100%.
      ctx.drawImage(guide, 0, 0, viewW, viewH);
    }
  }

  function pointAt(e) {
    const rect = viewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * cutout.width;
    const y = ((e.clientY - rect.top) / rect.height) * cutout.height;
    return { x, y };
  }

  function stroke(x, y) {
    const ctx = workRef.current.getContext('2d');
    const r = size / scale / 2; // brush radius in full-res pixels
    ctx.save();
    if (mode === 'erase') {
      if (eraseColor) {
        // The photo is already flattened onto a background colour (no
        // transparency to reveal), so "erasing" paints that colour back in
        // instead of punching a transparent hole.
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = eraseColor;
      } else {
        ctx.globalCompositeOperation = 'destination-out';
      }
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // restore: clip to the brush and redraw the original pixels there.
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(original, 0, 0);
    }
    ctx.restore();
    repaint();
  }

  // Position + size of the cursor ring that previews the brush. The displayed
  // brush diameter equals `size` in canvas coords; scale it to however the
  // canvas is actually rendered (it may be shrunk by max-width on small screens).
  function updateRing(e) {
    const rect = viewRef.current.getBoundingClientRect();
    const dispScale = rect.width / viewW;
    setRing({ left: e.clientX - rect.left, top: e.clientY - rect.top, d: size * dispScale });
  }

  function onDown(e) {
    e.preventDefault();
    drawing.current = true;
    updateRing(e);
    pushHistory();
    const p = pointAt(e);
    stroke(p.x, p.y);
  }
  function onMove(e) {
    updateRing(e);
    if (!drawing.current) return;
    const p = pointAt(e);
    stroke(p.x, p.y);
  }
  function onUp() {
    drawing.current = false;
  }
  function onLeave() {
    drawing.current = false;
    setRing(null);
  }

  return (
    <div className="maskbrush">
      <div className="control-row" style={{ marginTop: 0, marginBottom: 12 }}>
        <div className="seg">
          <button
            className={`seg-btn ${mode === 'erase' ? 'on' : ''}`}
            onClick={() => setMode('erase')}
          >
            Erase
          </button>
          <button
            className={`seg-btn ${mode === 'restore' ? 'on' : ''}`}
            onClick={() => setMode('restore')}
          >
            Restore
          </button>
        </div>
        <label htmlFor="brush">Brush</label>
        <input
          id="brush"
          type="range"
          min={8}
          max={80}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
        <span className="mono" style={{ minWidth: 40 }}>
          {size}px
        </span>
        <button className="btn" disabled={!canUndo} onClick={undo} title="Undo (Ctrl+Z)">
          ↶ Undo
        </button>
        <button className="btn" disabled={zoom <= 1} onClick={zoomOut} title="Zoom out" style={{ padding: '10px 14px' }}>
          <Icon name="zoom_out" />
        </button>
        <span className="mono" style={{ minWidth: 40, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button className="btn" disabled={zoom >= 3} onClick={zoomIn} title="Zoom in" style={{ padding: '10px 14px' }}>
          <Icon name="zoom_in" />
        </button>
      </div>

      <div
        className="preview-frame"
        style={{ minHeight: 0, padding: 10, maxHeight: 520, overflow: 'auto', placeItems: 'safe center' }}
      >
        <div className="brush-wrap">
          <canvas
            ref={viewRef}
            width={viewW}
            height={viewH}
            style={{ touchAction: 'none', cursor: 'crosshair', width: dispW, height: dispH, display: 'block' }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerEnter={updateRing}
            onPointerLeave={onLeave}
          />
          {ring && (
            <span
              className="brush-ring"
              style={{ left: ring.left, top: ring.top, width: ring.d, height: ring.d }}
            />
          )}
        </div>
      </div>
      <p className="hint" style={{ marginTop: 8 }}>
        The blue circle shows your brush size — adjust the slider and hover the
        photo to check it before you paint.
      </p>

      <div className="btn-row">
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <span className="spacer" />
        <button className="btn primary" onClick={() => onApply(workRef.current)}>
          Apply touch-up
        </button>
      </div>
    </div>
  );
}
