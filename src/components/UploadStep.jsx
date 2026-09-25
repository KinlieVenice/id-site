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
            <span className="step-badge">01 / START WITH A PHOTO</span>
            <h1>A familiar face.<br /><em>A fresh format.</em></h1>
            <p className="sub">Your next ID photo starts here. Crop, refine, and make it print-ready—all in your browser.</p>
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
              <Icon name="lock" />
            </span>
            <span className="bb-copy">
              <span className="bb-title">Your photo stays with you.</span>
              <br />
              <span className="bb-sub">No uploads to a server. No account. Just your photo, on your device.</span>
            </span>
          </div>
        </div>

        <aside className="studio-note">
          <div className="note-heading"><span>THE FINISHED FORMAT</span><span>FIG. 01</span></div>
          <div className="photo-specimen" aria-hidden="true">
            <span className="measure-top">35 mm</span>
            <div className="specimen-print">
              <div className="specimen-portrait"><div className="portrait-head" /><div className="portrait-body" /></div>
              <span className="specimen-caption">YOUR NEXT CHAPTER</span>
            </div>
            <span className="measure-side">45 mm</span>
            <span className="specimen-stamp">READY FOR<br />WHAT’S NEXT.</span>
          </div>
          <h2>Small photo.<br />Big possibilities.</h2>
          <p>A new job. A first passport. A fresh start.<br />Get the details right, wherever you’re headed.</p>
          <dl className="studio-services">
            <div><dt>01 / Format</dt><dd>Passport, ID &amp; custom sizes</dd></div>
            <div><dt>02 / Finish</dt><dd>Background, lighting &amp; attire</dd></div>
            <div><dt>03 / Print</dt><dd>Single photos &amp; print sheets</dd></div>
          </dl>
        </aside>
      </div>
    </>
  );
}
