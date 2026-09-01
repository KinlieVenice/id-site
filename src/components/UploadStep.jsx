import { useRef, useState } from 'react';
import CropMarks from './CropMarks.jsx';
import Icon from './Icon.jsx';
import { fileToDataURL } from '../lib/image.js';

const FEATURES = [
  { icon: 'flag', text: 'Official passport sizes for dozens of countries' },
  { icon: 'crop_square', text: '1×1in, 2×2in, or any custom size you need' },
  { icon: 'apparel', text: 'Add a corporate attire overlay' },
  { icon: 'badge', text: 'Add your name and signature' },
  { icon: 'auto_fix_high', text: 'Remove the background, pick any colour' },
  { icon: 'brush', text: 'Refine edges by hand for a clean cutout' },
  { icon: 'tune', text: 'Adjust brightness, contrast, and smoothen' },
];

// FR1 — upload via file input or drag-and-drop. Nothing leaves the device.
export default function UploadStep({ onImage }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file) {
    setError('');
    try {
      const dataUrl = await fileToDataURL(file);
      onImage(dataUrl);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="landing-split">
      <section className="panel landing-upload">
        <CropMarks />
        <h2>Upload your photo</h2>
        <p className="sub">A clear, front-facing photo works best. JPG or PNG.</p>

        <div
          className={`dropzone ${over ? 'over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <Icon name="add_photo_alternate" className="dropzone-icon" />
          <p className="big">Drop a photo here</p>
          <p className="hint" style={{ marginBottom: 26 }}>
            or choose a file from your device
          </p>
          <span className="btn primary">
            <Icon name="upload" /> Choose photo
          </span>
          <p className="hint" style={{ marginTop: 26 }}>JPG · PNG · processed on your device</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {error && <p className="error">{error}</p>}
      </section>

      <aside className="landing-features">
        <h2>Everything you need, in one place</h2>
        <p className="sub">Crop, clean up, and print-ready — all in your browser.</p>
        <ul>
          {FEATURES.map((f) => (
            <li key={f.text}>
              <Icon name={f.icon} />
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
