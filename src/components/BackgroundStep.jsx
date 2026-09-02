import { useEffect, useRef, useState } from 'react';
import CropMarks from './CropMarks.jsx';
import Icon from './Icon.jsx';
import MaskBrush from './MaskBrush.jsx';
import { removeBackground, compositeOnColor, applyAdjustments, canvasToBlob } from '../lib/image.js';

// Most common Philippine ID photo background colors: white is the strict
// requirement for the current DFA ePassport/PhilID, NBI clearance, LTO
// driver's license, PRC license, and the Civil Service Exam ID photo —
// off-white/cream/grey are explicitly rejected for the PH passport. Blue is
// the well-documented secondary color, used by older machine-readable PH
// passports and many overseas PH consulates, commonly cited at #0038A8 (the
// same blue as the Philippine flag).
const SWATCHES = [
  { color: '#ffffff', label: 'White' },
  { color: '#bcd4f0', label: 'Light blue' },
  { color: '#0038a8', label: 'Royal blue' },
];

export default function BackgroundStep({ croppedCanvas, preset, persisted, onDone, onBack }) {
  const saved = persisted?.current || {};
  const sameSource = saved.forCanvas === croppedCanvas;

  const [removeBg, setRemoveBg] = useState(sameSource ? !!saved.removeBg : false);
  const [cutout, setCutout] = useState(sameSource ? saved.cutout ?? null : null);
  const [bgColor, setBgColor] = useState(saved.bgColor ?? preset.defaultBg ?? '#ffffff');
  const [brightness, setBrightness] = useState(saved.brightness ?? 1);
  const [contrast, setContrast] = useState(saved.contrast ?? 1);
  const [smooth, setSmooth] = useState(saved.smooth ?? 0);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [brushing, setBrushing] = useState(false);

  const finalRef = useRef(null);

  useEffect(() => {
    if (persisted) {
      persisted.current = {
        removeBg, cutout, bgColor, brightness, contrast, smooth, forCanvas: croppedCanvas,
      };
    }
  }, [persisted, removeBg, cutout, bgColor, brightness, contrast, smooth, croppedCanvas]);

  useEffect(() => {
    let cancelled = false;
    if (removeBg && !cutout) {
      setError('');
      setProgress({ pct: 0 });
      removeBackground(croppedCanvas, (pct) => {
        if (!cancelled) setProgress({ pct });
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

  useEffect(() => {
    // With a cutout, adjust it first (it still has an alpha channel, so
    // brightness/contrast/smooth only touch the subject) and composite the
    // solid background color on afterward, clean. Without one, there's no
    // way to tell subject from background, so adjustments hit the whole photo.
    let base;
    if (removeBg && cutout) {
      base = compositeOnColor(applyAdjustments(cutout, { brightness, contrast, smooth }), bgColor);
    } else {
      base = applyAdjustments(croppedCanvas, { brightness, contrast, smooth });
    }
    finalRef.current = base;

    let url;
    canvasToBlob(base, 'image/png').then((blob) => {
      url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [croppedCanvas, removeBg, cutout, bgColor, brightness, contrast, smooth]);

  const working = progress !== null;
  const pct = Math.round((progress?.pct || 0) * 100);

  return (
    <>
      <div className="page-head">
        <span className="step-badge">STEP 3 OF 5</span>
        <h1>Background &amp; finish</h1>
        <p className="sub">Optional. Skip any of these and head straight to export.</p>
      </div>

      <section className="panel">
      <CropMarks />

      {brushing && cutout ? (
        <div>
          <p className="sub" style={{ marginBottom: 12 }}>
            Erase leftover background, or restore parts that were removed.
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
        <div className="row workspace">
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
              <label className="pill-toggle">
                <span className="pt-copy">
                  <span className="pt-title">Remove background</span>
                  <span className="pt-sub">Runs on your device</span>
                </span>
                <input
                  type="checkbox"
                  checked={removeBg}
                  disabled={working}
                  onChange={(e) => setRemoveBg(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <span
                  className={`pill-switch ${removeBg ? 'on' : ''}`}
                  role="presentation"
                  aria-hidden="true"
                />
              </label>

              {working && (
                <div className="progress">
                  <span className="progress-label">
                    {pct > 0 ? `Removing background… ${pct}%` : 'Preparing…'}
                  </span>
                  <div className="bar">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              {error && <p className="error">{error}</p>}

              {removeBg && cutout && !working && (
                <button className="btn" style={{ marginTop: 10 }} onClick={() => setBrushing(true)}>
                  <Icon name="brush" /> Refine edges
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
              <span className="lbl">Touch up</span>
              <div className="adjust-row">
                <label htmlFor="brightness">
                  <Icon name="light_mode" /> Brightness
                </label>
                <input
                  id="brightness"
                  type="range"
                  min={0.7}
                  max={1.3}
                  step={0.01}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                />
                <span className="mono">{Math.round(brightness * 100)}%</span>
              </div>
              <div className="adjust-row">
                <label htmlFor="contrast">
                  <Icon name="contrast" /> Contrast
                </label>
                <input
                  id="contrast"
                  type="range"
                  min={0.7}
                  max={1.3}
                  step={0.01}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                />
                <span className="mono">{Math.round(contrast * 100)}%</span>
              </div>
              <div className="adjust-row">
                <label htmlFor="smooth">
                  <Icon name="blur_on" /> Smoothen
                </label>
                <input
                  id="smooth"
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={smooth}
                  onChange={(e) => setSmooth(Number(e.target.value))}
                />
                <span className="mono">{smooth.toFixed(1)}</span>
              </div>
              {(brightness !== 1 || contrast !== 1 || smooth !== 0) && (
                <button
                  className="btn"
                  style={{ marginTop: 4 }}
                  onClick={() => {
                    setBrightness(1);
                    setContrast(1);
                    setSmooth(0);
                  }}
                >
                  Reset touch up
                </button>
              )}
            </div>

            <p className="hint">
              The cutting-guide border is added at the Export step, so it sits on top of any name
              strip or attire.
            </p>
          </div>
        </div>
      )}

      {!brushing && (
        <div className="btn-row">
          <button className="btn" onClick={onBack}>
            <Icon name="arrow_back" /> Back
          </button>
          <span className="spacer" />
          <button
            className="btn primary"
            disabled={working || !finalRef.current}
            onClick={() => onDone(finalRef.current)}
          >
            Next <Icon name="arrow_forward" />
          </button>
        </div>
      )}
      </section>
    </>
  );
}
