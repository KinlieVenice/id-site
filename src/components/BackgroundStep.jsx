import { useEffect, useRef, useState } from 'react';
import CropMarks from './CropMarks.jsx';
import MaskBrush from './MaskBrush.jsx';
import {
  removeBackground,
  compositeOnColor,
  addBorder,
  canvasToBlob,
} from '../lib/image.js';

// Quick background colours common to ID photos (FR5), plus a custom picker.
const SWATCHES = [
  { color: '#ffffff', label: 'White' },
  { color: '#f2f2f2', label: 'Off-white' },
  { color: '#dbe7f3', label: 'Light blue' },
  { color: '#c9dbea', label: 'Blue' },
  { color: '#e8c9c9', label: 'Light red' },
];

// FR4–FR6 — optional background removal, background colour, cutting border.
export default function BackgroundStep({ croppedCanvas, preset, onDone, onBack }) {
  const [removeBg, setRemoveBg] = useState(false);
  const [cutout, setCutout] = useState(null);
  const [bgColor, setBgColor] = useState(preset.defaultBg || '#ffffff');
  const [border, setBorder] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [brushing, setBrushing] = useState(false);

  const finalRef = useRef(null);

  // Run the in-browser model only when removal is switched on, and cache the
  // transparent cutout so colour/border tweaks don't re-run it (Decision D3).
  useEffect(() => {
    let cancelled = false;
    if (removeBg && !cutout) {
      setError('');
      setProgress({ pct: 0, msg: 'Loading model…' });
      removeBackground(croppedCanvas, (pct, key) => {
        if (!cancelled) setProgress({ pct, msg: key });
      })
        .then((c) => {
          if (!cancelled) {
            setCutout(c);
            setProgress(null);
          }
        })
        .catch((e) => {
          if (!cancelled) {
            setError(`Background removal failed: ${e.message}`);
            setRemoveBg(false);
            setProgress(null);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [removeBg, cutout, croppedCanvas]);

  // Recompose the final canvas whenever any cheap option changes.
  useEffect(() => {
    let base = croppedCanvas;
    if (removeBg && cutout) base = compositeOnColor(cutout, bgColor);
    if (border) base = addBorder(base);
    finalRef.current = base;

    let url;
    canvasToBlob(base, 'image/png').then((blob) => {
      url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [croppedCanvas, removeBg, cutout, bgColor, border]);

  const working = progress !== null;

  return (
    <section className="panel">
      <CropMarks />
      <h2>Background &amp; finish</h2>
      <p className="sub">Optional. Skip any of these and head straight to export.</p>

      {brushing && cutout ? (
        <div>
          <p className="sub" style={{ marginBottom: 12 }}>
            Erase leftover background, or restore parts the model cut away.
          </p>
          <MaskBrush
            cutout={cutout}
            original={croppedCanvas}
            onApply={(canvas) => {
              setCutout(canvas);
              setBrushing(false);
            }}
            onCancel={() => setBrushing(false)}
          />
        </div>
      ) : (
      <div className="row">
        <div className="col">
          <div className="preview-frame">
            {previewUrl ? (
              <img src={previewUrl} alt="Photo preview" />
            ) : (
              <span className="mono">rendering…</span>
            )}
          </div>
        </div>

        <div className="col">
          <div className="field">
            <span className="lbl">Background removal</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={removeBg}
                disabled={working}
                onChange={(e) => setRemoveBg(e.target.checked)}
              />
              Remove background (runs on your device)
            </label>
            {working && (
              <div className="progress">
                {progress.msg} {Math.round((progress.pct || 0) * 100)}%
                <div className="bar">
                  <i style={{ width: `${Math.round((progress.pct || 0) * 100)}%` }} />
                </div>
                <span style={{ display: 'block', marginTop: 6, color: 'var(--ink-3)' }}>
                  First run downloads the model — this can take a moment.
                </span>
              </div>
            )}
            {error && <p className="error">{error}</p>}
            {removeBg && cutout && !working && (
              <button
                className="btn"
                style={{ marginTop: 10 }}
                onClick={() => setBrushing(true)}
              >
                Refine edges (brush) →
              </button>
            )}
          </div>

          <div className="field" style={{ opacity: removeBg ? 1 : 0.45 }}>
            <span className="lbl">Background colour</span>
            <div className="swatches">
              {SWATCHES.map((s) => (
                <button
                  key={s.color}
                  className={`swatch ${bgColor === s.color ? 'selected' : ''}`}
                  style={{ background: s.color }}
                  title={s.label}
                  aria-label={s.label}
                  disabled={!removeBg}
                  onClick={() => setBgColor(s.color)}
                />
              ))}
              <label className="swatch custom" title="Custom colour">
                <input
                  type="color"
                  value={bgColor}
                  disabled={!removeBg}
                  onChange={(e) => setBgColor(e.target.value)}
                />
              </label>
            </div>
            {!removeBg && (
              <p className="hint" style={{ marginTop: 8 }}>
                Turn on background removal to set a colour.
              </p>
            )}
          </div>

          <div className="field">
            <span className="lbl">Cutting guide</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={border}
                onChange={(e) => setBorder(e.target.checked)}
              />
              Add a thin border to cut along
            </label>
          </div>
        </div>
      </div>
      )}

      {!brushing && (
      <div className="btn-row">
        <button className="btn" onClick={onBack}>
          ← Back
        </button>
        <span className="spacer" />
        <button
          className="btn primary"
          disabled={working || !finalRef.current}
          onClick={() => onDone(finalRef.current)}
        >
          Next →
        </button>
      </div>
      )}
    </section>
  );
}
