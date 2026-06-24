import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import CropMarks from './CropMarks.jsx';
import { cropToCanvas } from '../lib/image.js';
import { presetPixels } from '../data/presets.js';

// FR3 — crop locked to the preset aspect ratio (zoom + pan), rendered to the
// preset's exact output pixels.
export default function CropStep({ imageSrc, preset, onCropped, onBack }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);

  const aspect = preset.wmm / preset.hmm;
  const { w, h } = presetPixels(preset);

  const onComplete = useCallback((_, pixels) => setAreaPixels(pixels), []);

  async function applyCrop() {
    if (!areaPixels) return;
    setBusy(true);
    try {
      const canvas = await cropToCanvas(imageSrc, areaPixels, w, h);
      onCropped(canvas);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <CropMarks />
      <h2>Crop to size</h2>
      <p className="sub">
        Position your face within the frame. Locked to{' '}
        <span className="mono">
          {preset.wmm}×{preset.hmm} mm ({w}×{h} px)
        </span>
        .
      </p>

      <div className="crop-stage">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onComplete}
          restrictPosition
          zoomWithScroll
        />
      </div>

      <div className="control-row">
        <label htmlFor="zoom">Zoom</label>
        <input
          id="zoom"
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        <span className="mono" style={{ minWidth: 48 }}>
          {zoom.toFixed(2)}×
        </span>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={onBack}>
          ← Back
        </button>
        <span className="spacer" />
        <button className="btn primary" disabled={!areaPixels || busy} onClick={applyCrop}>
          {busy ? 'Working…' : 'Background →'}
        </button>
      </div>
    </section>
  );
}
