import { useRef, useState } from 'react';
import { fileToDataURL } from '../lib/image.js';

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
    <section className="panel">
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
        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 18a4.5 4.5 0 0 1-.4-8.98A5.5 5.5 0 0 1 17.4 8.02 4 4 0 0 1 17 16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 21v-7.5M9 16l3-3 3 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="big">Drop an image here, or click to choose</p>
        <p className="hint">JPG · PNG · processed on your device</p>
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
  );
}
