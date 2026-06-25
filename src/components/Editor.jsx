import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Image as KImage, Rect, Text, Transformer } from 'react-konva';
import CropMarks from './CropMarks.jsx';
import AttirePicker from './AttirePicker.jsx';
import SignaturePad from './SignaturePad.jsx';
import useImage from '../lib/useImage.js';
import { ATTIRE } from '../data/attire.js';

const FONTS = ['Inter', 'Georgia', 'Times New Roman', 'Courier New'];

const SUB_STEPS = [
  {
    title: 'Clothing overlay',
    sub: 'Add a suit, blazer, or other attire over your photo.',
  },
  {
    title: 'Name',
    sub: 'Type your name to add it to the photo.',
  },
  {
    title: 'Signature',
    sub: 'Draw your signature to place on the photo.',
  },
];

export default function Editor({ baseCanvas, persisted, onDone, onBack }) {
  const baseW = baseCanvas.width;
  const baseH = baseCanvas.height;

  const saved = persisted?.current || {};

  const [subStep, setSubStep] = useState(saved.subStep ?? 0);

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

  // Responsive canvas: measure the container and fit the Stage to it.
  const canvasColRef = useRef(null);
  const [canvasColW, setCanvasColW] = useState(440);

  useEffect(() => {
    const el = canvasColRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCanvasColW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 32px = 16px padding × 2 sides in .preview-frame
  const scale = useMemo(
    () => Math.min((canvasColW - 32) / baseW, 480 / baseH, 1),
    [canvasColW, baseW, baseH],
  );
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

  useEffect(() => {
    if (attireImg && !attireT) {
      const s = viewW / attireImg.width;
      setAttireT({ x: 0, y: viewH - attireImg.height * s, scaleX: s, scaleY: s, rotation: 0 });
      setSelected('attire');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attireImg]);

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

  function chooseAttire(id) {
    setAttireId(id);
    setAttireT(null);
  }
  function setSignature(url) {
    setSigUrl(url);
    setSigT(null);
  }

  useEffect(() => {
    if (persisted) {
      persisted.current = {
        subStep, strip, nameText, font, align, stripT, textT,
        attireId, sigUrl, attireT, sigT, selected,
      };
    }
  }, [persisted, subStep, strip, nameText, font, align, stripT, textT, attireId, sigUrl, attireT, sigT, selected]);

  // Auto-place strip + text the first time strip is turned on.
  useEffect(() => {
    if (strip && !stripT) {
      const sw = viewW * 0.86;
      const sh = viewH * 0.15;
      const sx = (viewW - sw) / 2;
      const sy = viewH * 0.8;
      setStripT({ x: sx, y: sy, width: sw, height: sh, rotation: 0 });
      setTextT({ x: sx, y: sy + sh * 0.26, width: sw, fontSize: sh * 0.4, rotation: 0 });
      setSelected('strip');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strip]);

  // Auto-enable the strip when the user types a name.
  function handleNameChange(e) {
    const val = e.target.value;
    setNameText(val);
    if (val && !strip) setStrip(true);
  }

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

  function commitStrip(node) {
    const w = Math.max(10, node.width() * node.scaleX());
    const h = Math.max(8, node.height() * node.scaleY());
    node.scaleX(1);
    node.scaleY(1);
    node.width(w);
    node.height(h);
    setStripT((t) => ({ ...t, x: node.x(), y: node.y(), width: w, height: h, rotation: node.rotation() }));
  }

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

  const stepInfo = SUB_STEPS[subStep];
  const canGoBack = subStep > 0;
  const canGoNext = subStep < 2;

  return (
    <section className="panel">
      <CropMarks />
      <h2>Add attire, name &amp; signature</h2>
      <p className="sub">All optional — skip any section you don&apos;t need.</p>

      <div className="editor-row row">
        {/* Canvas column */}
        <div className="col editor-canvas-col" ref={canvasColRef}>
          <div className="preview-frame" style={{ minHeight: 0, padding: 16 }}>
            <Stage
              ref={stageRef}
              width={viewW}
              height={viewH}
              style={{ background: '#fff', display: 'block' }}
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
              Tap to select · drag to move · corners to scale · top handle to rotate
            </p>
          )}
        </div>

        {/* Guided controls column */}
        <div className="col editor-controls-col">
          {/* Step indicator */}
          <div className="guided-header">
            <div className="guided-step-label">
              <span className="step-dots">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`step-dot ${i === subStep ? 'active' : i < subStep ? 'done' : ''}`}
                  />
                ))}
              </span>
              Step {subStep + 1} of 3
            </div>
            <p className="guided-title">{stepInfo.title}</p>
            <p className="guided-sub">{stepInfo.sub}</p>
          </div>

          {/* Step 1 — Attire */}
          {subStep === 0 && (
            <AttirePicker selectedId={attireId} onSelect={chooseAttire} />
          )}

          {/* Step 2 — Name */}
          {subStep === 1 && (
            <div>
              <div className="field">
                <span className="lbl">Name (Enter for a new line)</span>
                <textarea
                  value={nameText}
                  placeholder="Type a name…"
                  rows={2}
                  onChange={handleNameChange}
                  onFocus={() => nameText && setSelected('name')}
                  className="name-input"
                />
              </div>
              {nameText && strip && (
                <>
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
                      Move strip
                    </button>
                    <button
                      className={`seg-btn ${selected === 'name' ? 'on' : ''}`}
                      onClick={() => setSelected('name')}
                    >
                      Move text
                    </button>
                  </div>
                  <p className="hint" style={{ marginTop: 10 }}>
                    Drag the strip and text on the photo to position them.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Step 3 — Signature */}
          {subStep === 2 && (
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
              )}
            </div>
          )}

          {/* Sub-step navigation */}
          {!signing && (
            <div className="guided-nav">
              {canGoBack && (
                <button className="btn" onClick={() => setSubStep((s) => s - 1)}>
                  ← Back
                </button>
              )}
              <span className="spacer" />
              {canGoNext && (
                <button className="btn" onClick={() => setSubStep((s) => s + 1)}>
                  {subStep === 0
                    ? attireId ? 'Next →' : 'Skip →'
                    : nameText ? 'Next →' : 'Skip →'}
                </button>
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
          Apply &amp; Export →
        </button>
      </div>
    </section>
  );
}
