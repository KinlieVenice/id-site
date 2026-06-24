import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Image as KImage, Rect, Text, Line, Transformer } from 'react-konva';
import CropMarks from './CropMarks.jsx';
import AttirePicker from './AttirePicker.jsx';
import SignaturePad from './SignaturePad.jsx';
import useImage from '../lib/useImage.js';
import { ATTIRE } from '../data/attire.js';

const FONTS = ['Inter', 'Georgia', 'Times New Roman', 'Courier New'];

// Phase 2 + 4 editor (FR12–FR14, FR16–FR17). A react-konva stage (Decision D6)
// hosts the finished photo plus three optional, affine-placed extras:
//   • attire overlay (move / scale / rotate)
//   • a white name strip below the photo, with typed name
//   • a smoothed signature (move / scale / rotate)
// "Apply" flattens the stage to a full-resolution canvas for export. Perspective
// warp is deliberately out of scope (Decision D4) — affine handles only.
export default function Editor({ baseCanvas, onDone, onBack }) {
  const baseW = baseCanvas.width;
  const baseH = baseCanvas.height;

  const [tab, setTab] = useState('attire');

  // name strip
  const [strip, setStrip] = useState(false);
  const [stripRatio, setStripRatio] = useState(0.16);
  const [nameText, setNameText] = useState('');
  const [font, setFont] = useState('Inter');
  const [align, setAlign] = useState('center');

  // attire + signature
  const [attireId, setAttireId] = useState(null);
  const [sigUrl, setSigUrl] = useState(null);
  const [signing, setSigning] = useState(false);

  const attireSrc = attireId ? ATTIRE.find((a) => a.id === attireId)?.src : null;
  const attireImg = useImage(attireSrc);
  const sigImg = useImage(sigUrl);

  // full-resolution output dimensions (photo + optional strip)
  const stripPx = strip ? Math.round(baseH * stripRatio) : 0;
  const fullW = baseW;
  const fullH = baseH + stripPx;

  // fit the stage into the panel; export upscales back by 1/scale
  const scale = useMemo(() => Math.min(440 / fullW, 480 / fullH, 1), [fullW, fullH]);
  const viewW = Math.round(fullW * scale);
  const viewH = Math.round(fullH * scale);
  const photoViewH = Math.round(baseH * scale);

  const [selected, setSelected] = useState(null);
  const [attireT, setAttireT] = useState(null);
  const [sigT, setSigT] = useState(null);
  const [nameT, setNameT] = useState(null);

  const stageRef = useRef(null);
  const trRef = useRef(null);
  const attireRef = useRef(null);
  const sigRef = useRef(null);
  const nameRef = useRef(null);

  // Place attire over the shoulders when first chosen.
  useEffect(() => {
    if (attireImg) {
      const s = viewW / attireImg.width;
      setAttireT({
        x: 0,
        y: photoViewH - attireImg.height * s,
        scaleX: s,
        scaleY: s,
        rotation: 0,
      });
      setSelected('attire');
    } else {
      setAttireT(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attireImg]);

  // Drop a freshly drawn signature near the strip (or bottom of the photo).
  useEffect(() => {
    if (sigImg) {
      const s = Math.min((viewW * 0.45) / sigImg.width, 1);
      setSigT({
        x: viewW * 0.5 - (sigImg.width * s) / 2,
        y: (strip ? photoViewH + (viewH - photoViewH) * 0.2 : photoViewH * 0.8),
        scaleX: s,
        scaleY: s,
        rotation: 0,
      });
      setSelected('signature');
    } else {
      setSigT(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigImg]);

  // Initialise the name node once the strip turns on.
  useEffect(() => {
    if (strip && !nameT) {
      setNameT({ x: 0, y: photoViewH + stripPx * scale * 0.3, scaleX: 1, scaleY: 1, rotation: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strip]);

  // Attach the transformer to whatever is selected.
  useEffect(() => {
    const map = { attire: attireRef, signature: sigRef, name: nameRef };
    const node = selected && map[selected]?.current;
    if (trRef.current) {
      trRef.current.nodes(node ? [node] : []);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selected, attireT, sigT, nameT, nameText, strip]);

  function commit(setter, node) {
    setter((t) => ({
      ...t,
      x: node.x(),
      y: node.y(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation(),
    }));
  }

  function apply() {
    setSelected(null);
    requestAnimationFrame(() => {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 1 / scale });
      onDone(canvas);
    });
  }

  const nameFontPx = stripPx * scale * 0.42;

  return (
    <section className="panel">
      <CropMarks />
      <h2>Add attire, name &amp; signature</h2>
      <p className="sub">
        All optional (Decision D4 — attire is a fun add-on, not a guarantee of
        realism). Drag the handles to position each piece, then apply.
      </p>

      <div className="row">
        <div className="col">
          <div className="preview-frame" style={{ minHeight: 0 }}>
            <Stage
              ref={stageRef}
              width={viewW}
              height={viewH}
              style={{ background: '#fff', maxWidth: '100%' }}
              onMouseDown={(e) => {
                if (e.target === e.target.getStage()) setSelected(null);
              }}
              onTouchStart={(e) => {
                if (e.target === e.target.getStage()) setSelected(null);
              }}
            >
              <Layer>
                <KImage image={baseCanvas} x={0} y={0} width={viewW} height={photoViewH} />

                {strip && (
                  <>
                    <Rect x={0} y={photoViewH} width={viewW} height={viewH - photoViewH} fill="#ffffff" />
                    <Line points={[0, photoViewH, viewW, photoViewH]} stroke="#d8d4c8" strokeWidth={1} />
                  </>
                )}

                {attireImg && attireT && (
                  <KImage
                    ref={attireRef}
                    image={attireImg}
                    {...attireT}
                    draggable
                    onClick={() => setSelected('attire')}
                    onTap={() => setSelected('attire')}
                    onDragEnd={(e) => commit(setAttireT, e.target)}
                    onTransformEnd={(e) => commit(setAttireT, e.target)}
                  />
                )}

                {strip && nameT && (
                  <Text
                    ref={nameRef}
                    text={nameText || 'Your Name'}
                    {...nameT}
                    width={viewW}
                    align={align}
                    fontFamily={font}
                    fontSize={nameFontPx}
                    fill={nameText ? '#10131a' : '#b8b4a8'}
                    draggable
                    onClick={() => setSelected('name')}
                    onTap={() => setSelected('name')}
                    onDragEnd={(e) => commit(setNameT, e.target)}
                    onTransformEnd={(e) => commit(setNameT, e.target)}
                  />
                )}

                {sigImg && sigT && (
                  <KImage
                    ref={sigRef}
                    image={sigImg}
                    {...sigT}
                    draggable
                    onClick={() => setSelected('signature')}
                    onTap={() => setSelected('signature')}
                    onDragEnd={(e) => commit(setSigT, e.target)}
                    onTransformEnd={(e) => commit(setSigT, e.target)}
                  />
                )}

                <Transformer
                  ref={trRef}
                  rotateEnabled
                  keepRatio
                  enabledAnchors={[
                    'top-left',
                    'top-right',
                    'bottom-left',
                    'bottom-right',
                  ]}
                  anchorStroke="#ff5a1f"
                  anchorFill="#fff"
                  borderStroke="#ff5a1f"
                />
              </Layer>
            </Stage>
          </div>
          {selected && (
            <p className="hint" style={{ marginTop: 8 }}>
              Editing: <b>{selected}</b> · drag to move, corners to scale, top handle to rotate.
            </p>
          )}
        </div>

        <div className="col">
          <div className="seg" style={{ marginBottom: 16 }}>
            {['attire', 'name', 'signature'].map((t) => (
              <button
                key={t}
                className={`seg-btn ${tab === t ? 'on' : ''}`}
                onClick={() => setTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'attire' && (
            <AttirePicker selectedId={attireId} onSelect={setAttireId} />
          )}

          {tab === 'name' && (
            <div>
              <label className="toggle" style={{ marginBottom: 14 }}>
                <input type="checkbox" checked={strip} onChange={(e) => setStrip(e.target.checked)} />
                Add a white name strip below the photo
              </label>
              {strip && (
                <>
                  <div className="field">
                    <span className="lbl">Name</span>
                    <input
                      type="text"
                      value={nameText}
                      placeholder="Type a name"
                      onChange={(e) => setNameText(e.target.value)}
                      style={{ fontFamily: 'var(--sans)' }}
                    />
                  </div>
                  <div className="field">
                    <span className="lbl">Font</span>
                    <select value={font} onChange={(e) => setFont(e.target.value)}>
                      {FONTS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <span className="lbl">Align</span>
                    <div className="seg">
                      {['left', 'center', 'right'].map((a) => (
                        <button
                          key={a}
                          className={`seg-btn ${align === a ? 'on' : ''}`}
                          onClick={() => setAlign(a)}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="control-row">
                    <label htmlFor="striph">Height</label>
                    <input
                      id="striph"
                      type="range"
                      min={0.1}
                      max={0.32}
                      step={0.01}
                      value={stripRatio}
                      onChange={(e) => setStripRatio(Number(e.target.value))}
                    />
                    <span className="mono" style={{ minWidth: 40 }}>
                      {Math.round(stripRatio * 100)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'signature' && (
            <div>
              {signing ? (
                <SignaturePad
                  onDone={(url) => {
                    setSigUrl(url);
                    setSigning(false);
                  }}
                  onCancel={() => setSigning(false)}
                />
              ) : (
                <>
                  <p className="sub">
                    {sigUrl
                      ? 'Signature placed. Drag the handles on the canvas to position it.'
                      : 'Draw a signature to place on the strip or over the photo.'}
                  </p>
                  <div className="btn-row" style={{ marginTop: 0 }}>
                    <button className="btn primary" onClick={() => setSigning(true)}>
                      {sigUrl ? 'Redraw signature' : 'Draw signature'}
                    </button>
                    {sigUrl && (
                      <button className="btn" onClick={() => setSigUrl(null)}>
                        Remove
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={onBack}>
          ← Back
        </button>
        <span className="spacer" />
        <button className="btn primary" onClick={apply}>
          Export →
        </button>
      </div>
    </section>
  );
}
