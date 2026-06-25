import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Image as KImage, Rect, Text, Transformer } from 'react-konva';
import CropMarks from './CropMarks.jsx';
import AttirePicker from './AttirePicker.jsx';
import SignaturePad from './SignaturePad.jsx';
import useImage from '../lib/useImage.js';
import { ATTIRE } from '../data/attire.js';

const FONTS = ['Inter', 'Georgia', 'Times New Roman', 'Courier New'];

// Phase 2 + 4 editor (FR12–FR14, FR16–FR17). A react-konva stage (Decision D6)
// hosts the finished photo plus optional, affine-placed extras, each with its
// own move / scale / rotate handles:
//   • attire overlay
//   • a white name strip (placed INSIDE the photo by default, where IDs usually
//     put it) that can be dragged, resized and rotated
//   • the name text — multiline, independently resizable/rotatable
//   • a smoothed signature
// "Apply" flattens the stage to a full-resolution canvas. Perspective warp is
// out of scope (Decision D4) — affine only.
export default function Editor({ baseCanvas, persisted, onDone, onBack }) {
  const baseW = baseCanvas.width;
  const baseH = baseCanvas.height;

  // Restore prior work (if the user navigated away and came back).
  const saved = persisted?.current || {};

  const [tab, setTab] = useState(saved.tab ?? 'attire');

  // name strip + text
  const [strip, setStrip] = useState(saved.strip ?? false);
  const [nameText, setNameText] = useState(saved.nameText ?? '');
  const [font, setFont] = useState(saved.font ?? 'Inter');
  const [align, setAlign] = useState(saved.align ?? 'center');
  const [stripT, setStripT] = useState(saved.stripT ?? null);
  const [textT, setTextT] = useState(saved.textT ?? null);

  // attire + signature
  const [attireId, setAttireId] = useState(saved.attireId ?? null);
  const [sigUrl, setSigUrl] = useState(saved.sigUrl ?? null);
  const [signing, setSigning] = useState(false);

  const attireSrc = attireId ? ATTIRE.find((a) => a.id === attireId)?.src : null;
  const attireImg = useImage(attireSrc);
  const sigImg = useImage(sigUrl);

  // No canvas extension — the strip is an overlay inside the photo, so output
  // dimensions equal the photo's.
  const scale = useMemo(() => Math.min(440 / baseW, 480 / baseH, 1), [baseW, baseH]);
  const viewW = Math.round(baseW * scale);
  const viewH = Math.round(baseH * scale);

  const [selected, setSelected] = useState(saved.selected ?? null);
  const [attireT, setAttireT] = useState(saved.attireT ?? null);
  const [sigT, setSigT] = useState(saved.sigT ?? null);

  const stageRef = useRef(null);
  const trRef = useRef(null);
  const attireRef = useRef(null);
  const sigRef = useRef(null);
  const stripRef = useRef(null);
  const textRef = useRef(null);

  // Place attire over the shoulders when first chosen. Only auto-place when
  // there's no transform yet (a fresh pick clears it) — so a restored or
  // user-moved position is preserved.
  useEffect(() => {
    if (attireImg && !attireT) {
      const s = viewW / attireImg.width;
      setAttireT({ x: 0, y: viewH - attireImg.height * s, scaleX: s, scaleY: s, rotation: 0 });
      setSelected('attire');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attireImg]);

  // Drop a freshly drawn signature near the bottom of the photo (only when it
  // has no transform yet, so a restored placement survives).
  useEffect(() => {
    if (sigImg && !sigT) {
      const s = Math.min((viewW * 0.45) / sigImg.width, 1);
      setSigT({
        x: viewW * 0.5 - (sigImg.width * s) / 2,
        y: viewH * 0.78,
        scaleX: s,
        scaleY: s,
        rotation: 0,
      });
      setSelected('signature');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigImg]);

  // Choosing attire / drawing a signature clears its transform so it re-places
  // to a sensible default for the new image.
  function chooseAttire(id) {
    setAttireId(id);
    setAttireT(null);
  }
  function setSignature(url) {
    setSigUrl(url);
    setSigT(null);
  }

  // Persist the full editor state so it survives unmount (navigating back).
  useEffect(() => {
    if (persisted) {
      persisted.current = {
        tab, strip, nameText, font, align, stripT, textT,
        attireId, sigUrl, attireT, sigT, selected,
      };
    }
  }, [persisted, tab, strip, nameText, font, align, stripT, textT, attireId, sigUrl, attireT, sigT, selected]);

  // Initialise the strip + text the first time the strip is turned on, inside
  // the photo near the bottom (the usual ID layout).
  useEffect(() => {
    if (strip && !stripT) {
      const sw = viewW * 0.86;
      const sh = viewH * 0.15;
      const sx = (viewW - sw) / 2;
      const sy = viewH * 0.8;
      setStripT({ x: sx, y: sy, width: sw, height: sh, rotation: 0 });
      setTextT({ x: sx, y: sy + sh * 0.26, width: sw, fontSize: sh * 0.4, rotation: 0 });
      setSelected('strip');
      setTab('name');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strip]);

  // Attach the transformer to whatever is selected.
  useEffect(() => {
    const map = { attire: attireRef, signature: sigRef, strip: stripRef, name: textRef };
    const node = selected && map[selected]?.current;
    if (trRef.current) {
      trRef.current.nodes(node ? [node] : []);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selected, attireT, sigT, stripT, textT, nameText, strip, align, font]);

  function commitAffine(setter, node) {
    setter((t) => ({
      ...t,
      x: node.x(),
      y: node.y(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation(),
    }));
  }

  // Strip resizes freely; bake scale into width/height so the rect stays crisp.
  function commitStrip(node) {
    const w = Math.max(10, node.width() * node.scaleX());
    const h = Math.max(8, node.height() * node.scaleY());
    node.scaleX(1);
    node.scaleY(1);
    node.width(w);
    node.height(h);
    setStripT((t) => ({ ...t, x: node.x(), y: node.y(), width: w, height: h, rotation: node.rotation() }));
  }

  // Text resizes uniformly; bake scale into font size + width so it stays sharp.
  function commitText(node) {
    const s = node.scaleX();
    const fs = Math.max(6, node.fontSize() * s);
    const w = Math.max(20, node.width() * s);
    node.scaleX(1);
    node.scaleY(1);
    node.fontSize(fs);
    node.width(w);
    setTextT((t) => ({ ...t, x: node.x(), y: node.y(), width: w, fontSize: fs, rotation: node.rotation() }));
  }

  function apply() {
    setSelected(null);
    requestAnimationFrame(() => {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 1 / scale });
      onDone(canvas);
    });
  }

  const stripAnchors = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right',
  ];
  const cornerAnchors = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  const uniform = selected !== 'strip';

  return (
    <section className="panel">
      <CropMarks />
      <h2>Add attire, name &amp; signature</h2>
      <p className="sub">
        All optional (Decision D4 — attire is a fun add-on, not a guarantee of
        realism). Tap a piece, then drag to move, corners to scale, the top
        handle to rotate.
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
                <KImage image={baseCanvas} x={0} y={0} width={viewW} height={viewH} />

                {attireImg && attireT && (
                  <KImage
                    ref={attireRef}
                    image={attireImg}
                    {...attireT}
                    draggable
                    onClick={() => setSelected('attire')}
                    onTap={() => setSelected('attire')}
                    onDragEnd={(e) => commitAffine(setAttireT, e.target)}
                    onTransformEnd={(e) => commitAffine(setAttireT, e.target)}
                  />
                )}

                {strip && stripT && (
                  <Rect
                    ref={stripRef}
                    {...stripT}
                    fill="#ffffff"
                    stroke="#e3dfd3"
                    strokeWidth={1}
                    draggable
                    onClick={() => setSelected('strip')}
                    onTap={() => setSelected('strip')}
                    onDragEnd={(e) => commitStrip(e.target)}
                    onTransformEnd={(e) => commitStrip(e.target)}
                  />
                )}

                {strip && textT && (
                  <Text
                    ref={textRef}
                    text={nameText || 'Your Name'}
                    x={textT.x}
                    y={textT.y}
                    width={textT.width}
                    rotation={textT.rotation}
                    fontSize={textT.fontSize}
                    align={align}
                    fontFamily={font}
                    lineHeight={1.15}
                    fill={nameText ? '#10131a' : '#b8b4a8'}
                    draggable
                    onClick={() => setSelected('name')}
                    onTap={() => setSelected('name')}
                    onDragEnd={(e) => commitText(e.target)}
                    onTransformEnd={(e) => commitText(e.target)}
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
                    onDragEnd={(e) => commitAffine(setSigT, e.target)}
                    onTransformEnd={(e) => commitAffine(setSigT, e.target)}
                  />
                )}

                <Transformer
                  ref={trRef}
                  rotateEnabled
                  keepRatio={uniform}
                  enabledAnchors={selected === 'strip' ? stripAnchors : cornerAnchors}
                  anchorStroke="#ff5a1f"
                  anchorFill="#fff"
                  borderStroke="#ff5a1f"
                  boundBoxFunc={(oldBox, newBox) =>
                    newBox.width < 8 || newBox.height < 8 ? oldBox : newBox
                  }
                />
              </Layer>
            </Stage>
          </div>
          {selected && (
            <p className="hint" style={{ marginTop: 8 }}>
              Editing: <b>{selected === 'name' ? 'name text' : selected}</b> · drag to move,
              corners to scale, top handle to rotate.
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

          {tab === 'attire' && <AttirePicker selectedId={attireId} onSelect={chooseAttire} />}

          {tab === 'name' && (
            <div>
              <label className="toggle" style={{ marginBottom: 14 }}>
                <input type="checkbox" checked={strip} onChange={(e) => setStrip(e.target.checked)} />
                Add a white name strip (inside the photo)
              </label>
              {strip && (
                <>
                  <div className="field">
                    <span className="lbl">Name (press Enter for a new line)</span>
                    <textarea
                      value={nameText}
                      placeholder="Type a name"
                      rows={2}
                      onChange={(e) => setNameText(e.target.value)}
                      onFocus={() => setSelected('name')}
                      className="name-input"
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
                  <div className="seg" style={{ marginTop: 4 }}>
                    <button
                      className={`seg-btn ${selected === 'strip' ? 'on' : ''}`}
                      onClick={() => setSelected('strip')}
                    >
                      Edit strip
                    </button>
                    <button
                      className={`seg-btn ${selected === 'name' ? 'on' : ''}`}
                      onClick={() => setSelected('name')}
                    >
                      Edit text
                    </button>
                  </div>
                  <p className="hint" style={{ marginTop: 10 }}>
                    Drag the strip and text on the photo to position them; use the
                    corner handles to resize and the top handle to rotate.
                  </p>
                </>
              )}
            </div>
          )}

          {tab === 'signature' && (
            <div>
              {signing ? (
                <SignaturePad
                  onDone={(url) => {
                    setSignature(url);
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
                      <button
                        className="btn"
                        onClick={() => {
                          setSigUrl(null);
                          setSigT(null);
                        }}
                      >
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
