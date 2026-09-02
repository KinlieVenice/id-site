import { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import CropMarks from './CropMarks.jsx';
import { fileToDataURL } from '../lib/image.js';

const TIPS = [
  { icon: 'person', title: 'Face the camera', sub: 'Look straight ahead' },
  { icon: 'light_mode', title: 'Good lighting', sub: 'Avoid harsh shadows' },
  { icon: 'person', title: 'Neutral expression', sub: 'Natural expression' },
  { icon: 'apparel', title: 'Avoid hats & glasses', sub: 'Unless required' },
];

const FEATURES = [
  { icon: 'apparel', text: 'Add a corporate attire overlay' },
  { icon: 'badge', text: 'Add your name & signature' },
  { icon: 'auto_fix_high', text: 'Remove the background + choose any color' },
  { icon: 'brush', text: 'Manually refine edges for a cleaner cutout' },
  { icon: 'tune', text: 'Adjust brightness, contrast & smoothness' },
  { icon: 'flag', text: 'Use official passport photo sizes for dozens of countries' },
  { icon: 'crop_square', text: 'Choose 1×1", 2×2", or any custom size' },
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
    <>
      <div className="two-col">
        <div>
          <div className="page-head">
            <span className="step-badge">STEP 1 OF 5</span>
            <h1>Let&rsquo;s get your photo</h1>
            <p className="sub">Upload a clear, front-facing photo for the best results.</p>
          </div>

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
            <div className="dropzone-icon-wrap">
              <Icon name="upload" className="dropzone-icon" />
            </div>
            <p className="big">Drag and drop your photo here</p>
            <p className="sub-line">or choose a file from your device</p>
            <span className="btn2 primary">
              <Icon name="add_photo_alternate" /> Choose a photo
            </span>
            <p className="dropzone-caption">JPG, PNG · Max 20MB · Processed on your device</p>
            <input
              ref={inputRef}
              id="photo-file-input"
              type="file"
              accept="image/png,image/jpeg"
              hidden
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {error && <p className="error">{error}</p>}

          <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)', marginTop: 24, marginBottom: 4 }}>
            Tips for best results
          </p>
          <div className="tips-row">
            {TIPS.map((t) => (
              <div className="tip-card" key={t.title}>
                <Icon name={t.icon} />
                <div className="tip-card-title">{t.title}</div>
                <div className="tip-card-sub">{t.sub}</div>
              </div>
            ))}
          </div>

          <div className="bottom-banner">
            <span className="bb-icon">
              <Icon name="sparkles" />
            </span>
            <span className="bb-copy">
              <span className="bb-title">We&rsquo;ll take care of the rest</span>
              <br />
              <span className="bb-sub">After upload, you can adjust the size, background, lighting, and more.</span>
            </span>
          </div>
        </div>

        <div className="card side-card">
          <CropMarks />
          <h2>One photo. Multiple possibilities.</h2>
          <p className="sub">We&rsquo;ll help you crop, clean up, and format it perfectly.</p>
          <ul className="feature-list">
            {FEATURES.map((f) => (
              <li key={f.text}>
                <Icon name={f.icon} />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="example-label good">
            Good example <Icon name="check_circle" />
          </div>
          <div className="example-grid">
            {[0, 1, 2].map((i) => (
              <div className="example-thumb" key={i}>
                <Icon name="person" style={{ fontSize: 34, color: '#22c55e' }} />
                <span className="example-mark good">
                  <Icon name="check" />
                </span>
              </div>
            ))}
          </div>

          <div className="example-label bad">
            Not recommended <Icon name="close" />
          </div>
          <div className="example-grid">
            {[0, 1, 2].map((i) => (
              <div className="example-thumb" key={i}>
                <Icon name="person" style={{ fontSize: 34, color: '#ef4444' }} />
                <span className="example-mark bad">
                  <Icon name="close" />
                </span>
              </div>
            ))}
          </div>
          <p className="example-caption">Avoid glasses, shadows, and side profiles.</p>
        </div>
      </div>
    </>
  );
}
