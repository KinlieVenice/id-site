import { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { ATTIRE, ATTIRE_GROUPS } from '../data/attire.js';

const CUSTOM_ID = 'custom';
const YOUR_OWN = 'Your own';
const TABS = [YOUR_OWN, ...ATTIRE_GROUPS];

// FR16 (Phase 4) — browse the curated attire set, grouped by type/body size.
// Selecting one drops it onto the editor canvas to position with handles.
// A custom upload works the same way, just with a user-picked image instead
// of a stock file. Presented as a "dress-up rail": one category tab active
// at a time, its items in a vertical scrolling strip below — same
// selectedId/onSelect contract as before, just a different layout.
export default function AttirePicker({ selectedId, customSrc, onSelect, onUploadCustom }) {
  const fileRef = useRef(null);
  const railRef = useRef(null);

  const startTab =
    selectedId === CUSTOM_ID
      ? YOUR_OWN
      : ATTIRE.find((a) => a.id === selectedId)?.group || ATTIRE_GROUPS[0] || YOUR_OWN;
  const [activeTab, setActiveTab] = useState(startTab);

  function handleFile(file) {
    if (!file || !/^image\//.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => onUploadCustom(reader.result);
    reader.readAsDataURL(file);
  }

  function scrollRail(dir) {
    railRef.current?.scrollBy({ top: dir * 160, behavior: 'smooth' });
  }

  const items = activeTab === YOUR_OWN ? null : ATTIRE.filter((a) => a.group === activeTab);

  return (
    <div className="dressup">
      <div className="dressup-controls">
        <button
          className={`btn dressup-none ${!selectedId ? 'primary' : ''}`}
          onClick={() => onSelect(null)}
        >
          <Icon name="block" /> No attire
        </button>

        <div className="dressup-tabs seg">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`seg-btn ${activeTab === tab ? 'on' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="dressup-rail-wrap">
        <button
          type="button"
          className="rail-arrow up"
          onClick={() => scrollRail(-1)}
          aria-label="Scroll rack up"
        >
          <Icon name="expand_more" style={{ transform: 'rotate(180deg)' }} />
        </button>

        <div className="dressup-rail" ref={railRef}>
          {activeTab === YOUR_OWN ? (
            <>
              <button
                className={`attire-card ${selectedId === CUSTOM_ID ? 'selected' : ''}`}
                onClick={() => (customSrc ? onSelect(CUSTOM_ID) : fileRef.current?.click())}
                title="Upload your own attire image"
              >
                {selectedId === CUSTOM_ID && customSrc ? (
                  <>
                    <span className="check-badge">
                      <Icon name="check" />
                    </span>
                    <img src={customSrc} alt="Custom attire" />
                    <span className="cap">Your upload</span>
                  </>
                ) : (
                  <>
                    <Icon name="upload" className="attire-card-placeholder" />
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
                  <Icon name="sync" className="attire-card-placeholder" />
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
            </>
          ) : (
            items.map((a) => (
              <button
                key={a.id}
                className={`attire-card ${selectedId === a.id ? 'selected' : ''}`}
                onClick={() => onSelect(a.id)}
                title={a.label}
              >
                {selectedId === a.id && (
                  <span className="check-badge">
                    <Icon name="check" />
                  </span>
                )}
                <img src={a.src} alt={a.label} />
                <span className="cap">{a.label}</span>
              </button>
            ))
          )}
        </div>

        <button
          type="button"
          className="rail-arrow down"
          onClick={() => scrollRail(1)}
          aria-label="Scroll rack down"
        >
          <Icon name="expand_more" />
        </button>
      </div>
    </div>
  );
}
