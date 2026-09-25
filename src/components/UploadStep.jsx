import { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { fileToDataURL } from '../lib/image.js';

const TIPS = [
  { icon: 'person', title: 'Face the camera', sub: 'Look straight ahead' },
  { icon: 'light_mode', title: 'Good lighting', sub: 'Avoid harsh shadows' },
  { icon: 'apparel', title: 'Avoid hats & glasses', sub: 'Unless required' },
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
      <div className="two-col upload-layout">
        <div>
          <div className="page-head">
            <h1>Create an ID photo</h1>
            <p className="sub">Start with a photo, then choose a size and make your adjustments.</p>
          </div>

          <div
            data-tour="upload" className={`dropzone ${over ? 'over' : ''}`}
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
            <p className="big">Drop your photo here</p>
            <p className="sub-line">or choose a file from your device</p>
            <span className="btn primary">
              <Icon name="add_photo_alternate" /> Choose a photo
            </span>
            <p className="dropzone-caption">JPG or PNG / Up to 20 MB</p>
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

        </div>

        <aside className="upload-guide">
          <h2>Before you start</h2>
          <p>A clear original makes a better ID photo.</p>
          <div className="tips-row">
            {TIPS.map((t) => (
              <div className="tip-card" key={t.title}>
                <Icon name={t.icon} />
                <div><div className="tip-card-title">{t.title}</div><div className="tip-card-sub">{t.sub}</div></div>
              </div>
            ))}
          </div>
          <div className="format-guide">
            <h2>Available formats</h2>
            <p>1 × 1 in · 2 × 2 in · Passport</p>
            <p>Photo prints · Custom dimensions</p>
          </div>
          <div className="privacy-note"><Icon name="lock" /><p><strong>Private by default</strong>Your photo is processed on this device. No account or server upload needed.</p></div>
        </aside>
      </div>
    </>
  );
}
