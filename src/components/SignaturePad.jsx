import { useEffect, useRef } from 'react';
import SigPad from 'signature_pad';
import { trimTransparent } from '../lib/image.js';

// FR14 (Phase 2) — capture a signature with velocity-based Bézier smoothing.
// We use the signature_pad library rather than reimplementing smoothing
// (Decision D5). Returns a trimmed, transparent PNG data URL to the editor.
export default function SignaturePad({ onDone, onCancel }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Scale for crisp strokes on high-DPI screens.
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.getContext('2d').scale(ratio, ratio);

    const pad = new SigPad(canvas, {
      penColor: '#10131a',
      backgroundColor: 'rgba(0,0,0,0)', // transparent
      minWidth: 0.6,
      maxWidth: 2.4,
    });
    padRef.current = pad;
    return () => pad.off();
  }, []);

  function use() {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return;
    const trimmed = trimTransparent(canvasRef.current);
    onDone(trimmed.toDataURL('image/png'));
  }

  return (
    <div>
      <p className="sub" style={{ marginBottom: 12 }}>
        Sign with a mouse or finger. Strokes are smoothed automatically.
      </p>
      <div className="sig-stage">
        <canvas ref={canvasRef} className="sig-canvas" />
        <span className="sig-baseline" />
      </div>
      <div className="btn-row">
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn" onClick={() => padRef.current?.clear()}>
          Clear
        </button>
        <span className="spacer" />
        <button className="btn primary" onClick={use}>
          Use signature
        </button>
      </div>
    </div>
  );
}
