import { useEffect, useRef, useState } from 'react';

// FR15 (Phase 3) — manual touch-up brush to fix background-removal misses on
// hair, glasses and edges (Decision D3). Two modes:
//   erase   — paint away leftover background (destination-out)
//   restore — paint original pixels back in (sampled from the pre-removal crop)
// Works on a full-resolution working copy of the cutout; the on-screen canvas is
// just a scaled view, so edits stay sharp at export size.
export default function MaskBrush({ cutout, original, onApply, onCancel }) {
  const viewRef = useRef(null);
  const workRef = useRef(null); // full-res working copy of the cutout
  const drawing = useRef(false);
  const [mode, setMode] = useState('erase');
  const [size, setSize] = useState(28);

  const scale = Math.min(1, 360 / cutout.width);
  const viewW = Math.round(cutout.width * scale);
  const viewH = Math.round(cutout.height * scale);

  // Seed the working copy once from the incoming cutout.
  useEffect(() => {
    const work = document.createElement('canvas');
    work.width = cutout.width;
    work.height = cutout.height;
    work.getContext('2d').drawImage(cutout, 0, 0);
    workRef.current = work;
    repaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cutout]);

  function repaint() {
    const view = viewRef.current;
    if (!view || !workRef.current) return;
    const ctx = view.getContext('2d');
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(workRef.current, 0, 0, viewW, viewH);
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
      ctx.globalCompositeOperation = 'destination-out';
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

  function onDown(e) {
    e.preventDefault();
    drawing.current = true;
    const p = pointAt(e);
    stroke(p.x, p.y);
  }
  function onMove(e) {
    if (!drawing.current) return;
    const p = pointAt(e);
    stroke(p.x, p.y);
  }
  function onUp() {
    drawing.current = false;
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
      </div>

      <div className="preview-frame" style={{ minHeight: 0, padding: 10 }}>
        <canvas
          ref={viewRef}
          width={viewW}
          height={viewH}
          style={{ touchAction: 'none', cursor: 'crosshair', maxWidth: '100%' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
      </div>

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
