import { useRef } from 'react';
import Icon from './Icon.jsx';
import { ATTIRE, ATTIRE_GROUPS } from '../data/attire.js';

const CUSTOM_ID = 'custom';

// FR16 (Phase 4) — browse the curated attire set, grouped by type/body size.
// Selecting one drops it onto the editor canvas to position with handles.
// A custom upload works the same way, just with a user-picked image instead
// of a stock file.
export default function AttirePicker({ selectedId, customSrc, onSelect, onUploadCustom }) {
  const fileRef = useRef(null);

  function handleFile(file) {
    if (!file || !/^image\//.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => onUploadCustom(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <button
        className={`btn ${!selectedId ? 'primary' : ''}`}
        style={{ marginBottom: 12 }}
        onClick={() => onSelect(null)}
      >
        No attire
      </button>

      <div className="group-label">Your own</div>
      <div className="attire-grid">
        <button
          className={`attire-card ${selectedId === CUSTOM_ID ? 'selected' : ''}`}
          onClick={() => (customSrc ? onSelect(CUSTOM_ID) : fileRef.current?.click())}
          title="Upload your own attire image"
        >
          {selectedId === CUSTOM_ID && customSrc ? (
            <>
              <span className="check-badge" style={{ top: 2, right: 2, width: 16, height: 16, fontSize: 10 }}>
                <Icon name="check" />
              </span>
              <img src={customSrc} alt="Custom attire" />
              <span className="cap">Your upload</span>
            </>
          ) : (
            <>
              <Icon name="upload" style={{ fontSize: 22, margin: '14px 0 4px' }} />
              <span className="cap">Upload custom</span>
            </>
          )}
        </button>
        {customSrc && (
          <button
            className="attire-card"
            onClick={() => fileRef.current?.click()}
            title="Replace your uploaded attire image"
          >
            <Icon name="sync" style={{ fontSize: 22, margin: '14px 0 4px' }} />
            <span className="cap">Replace upload</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {ATTIRE_GROUPS.map((group) => (
        <div key={group}>
          <div className="group-label">{group}</div>
          <div className="attire-grid">
            {ATTIRE.filter((a) => a.group === group).map((a) => (
              <button
                key={a.id}
                className={`attire-card ${selectedId === a.id ? 'selected' : ''}`}
                onClick={() => onSelect(a.id)}
                title={a.label}
              >
                {selectedId === a.id && (
                  <span className="check-badge" style={{ top: 2, right: 2, width: 16, height: 16, fontSize: 10 }}>
                    <Icon name="check" />
                  </span>
                )}
                <img src={a.src} alt={a.label} />
                <span className="cap">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
