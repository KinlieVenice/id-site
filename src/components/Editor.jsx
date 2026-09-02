import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Image as KImage, Rect, Text, Transformer } from 'react-konva';
import Cropper from 'react-easy-crop';
import CropMarks from './CropMarks.jsx';
import Icon from './Icon.jsx';
import AttirePicker from './AttirePicker.jsx';
import SignaturePad from './SignaturePad.jsx';
import MaskBrush from './MaskBrush.jsx';
import useImage from '../lib/useImage.js';
import { ATTIRE } from '../data/attire.js';
import { cropToCanvas, loadImage, trimTransparent } from '../lib/image.js';
import { presetPixels } from '../data/presets.js';

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

export default function Editor({ baseCanvas, preset, bgColor, persisted, onDone, onBack }) {
  const saved = persisted?.current || {};

  // The uploaded photo, as edited so far — starts as the canvas handed in
  // from Background step, but can be re-cropped / edge-refined again here
  // without losing attire/name/signature progress. A re-crop must still land
  // on the preset's exact pixel size — a free crop box would silently resize
  // the final photo away from the chosen ID/passport format.
  const [photoCanvas, setPhotoCanvas] = useState(saved.photoCanvas ?? baseCanvas);
  // A stable pre-erasure baseline for the "Restore" brush — separate from
  // photoCanvas so repeated refine sessions can still recover what an EARLIER
  // session erased, not just what the current session just painted over.
  // Replaced only when the photo's actual content changes (a re-crop), never
  // by refine-edges itself.
  const [originalPhoto, setOriginalPhoto] = useState(saved.originalPhoto ?? saved.photoCanvas ?? baseCanvas);
  const baseW = photoCanvas.width;
  const baseH = photoCanvas.height;
  const { w: presetW, h: presetH } = presetPixels(preset);
  const presetAspect = preset.wmm / preset.hmm;

  const [photoCropping, setPhotoCropping] = useState(false);
  const [photoCropSrc, setPhotoCropSrc] = useState(null);
  const [photoCrop, setPhotoCrop] = useState({ x: 0, y: 0 });
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoAreaPixels, setPhotoAreaPixels] = useState(null);
  const [photoBrushing, setPhotoBrushing] = useState(false);
  const [photoBrushSource, setPhotoBrushSource] = useState(null);
  const [brushGuide, setBrushGuide] = useState(null);

  const onPhotoCropComplete = useCallback((_, pixels) => setPhotoAreaPixels(pixels), []);

  // Crop/refine only ever touch the plain photo — attire/name/signature are
  // never baked in, so they stay exactly where they were (still draggable)
  // once you're done. The composite (photo + suit/name/signature) is still
  // shown as a reference while cropping, so framing accounts for where the
  // suit sits, but it's never what actually gets kept.
  function snapshotStage() {
    return stageRef.current.toCanvas({ pixelRatio: 1 / scale });
  }

  function startPhotoCrop() {
    setPhotoCropSrc(snapshotStage().toDataURL('image/png'));
    setPhotoCrop({ x: 0, y: 0 });
    setPhotoZoom(1);
    setPhotoAreaPixels(null);
    setPhotoCropping(true);
  }

  async function applyPhotoCrop() {
    if (!photoAreaPixels) return;
    const canvas = await cropToCanvas(photoCanvas.toDataURL('image/png'), photoAreaPixels, presetW, presetH);
    setPhotoCanvas(canvas);
    setOriginalPhoto(canvas);
    setPhotoCropping(false);
  }

  // A faint, non-editable reference showing where the suit sits — drawn at
  // full photo resolution so it lines up with the brush's working canvas.
  function buildAttireGuide() {
    if (!attireImg || !attireT) return null;
    const canvas = document.createElement('canvas');
    canvas.width = photoCanvas.width;
    canvas.height = photoCanvas.height;
    const ctx = canvas.getContext('2d');
    const inv = 1 / scale;
    ctx.save();
    ctx.translate(attireT.x * inv, attireT.y * inv);
    ctx.rotate(((attireT.rotation || 0) * Math.PI) / 180);
    ctx.drawImage(attireImg, 0, 0, attireImg.width * attireT.scaleX * inv, attireImg.height * attireT.scaleY * inv);
    ctx.restore();
    return canvas;
  }

  function startPhotoBrush() {
    setPhotoBrushSource(photoCanvas);
    setBrushGuide(buildAttireGuide());
    setPhotoBrushing(true);
  }

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
  const [customAttireSrc, setCustomAttireSrc] = useState(saved.customAttireSrc ?? null);
  const [sigUrl, setSigUrl] = useState(saved.sigUrl ?? null);
  const [signing, setSigning] = useState(false);

  const attireSrc =
    attireId === 'custom' ? customAttireSrc : attireId ? ATTIRE.find((a) => a.id === attireId)?.src : null;
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

  // 32px = 16px padding × 2 sides in .preview-frame. Capped tall so there's
  // still room for handles/toolbars, but big enough to actually line up a
  // suit overlay precisely.
  const scale = useMemo(
    () => Math.min((canvasColW - 32) / baseW, 720 / baseH, 1),
    [canvasColW, baseW, baseH],
  );
  const viewW = Math.round(baseW * scale);
  const viewH = Math.round(baseH * scale);

  const [selected, setSelected] = useState(saved.selected ?? null);
  const [attireT, setAttireT] = useState(saved.attireT ?? null);
  const [sigT, setSigT] = useState(saved.sigT ?? null);

  // Moving between sub-steps (Back/Next) otherwise leaves whatever was
  // selected on the PREVIOUS sub-step still showing its Transformer handles
  // on top of the new one — e.g. the suit's bounding box still visible after
  // clicking Next into Name. Skips the very first run so a restored
  // selection (saved.selected, from navigating back into the Editor step)
  // isn't wiped out on mount.
  const subStepMounted = useRef(false);
  useEffect(() => {
    if (!subStepMounted.current) {
      subStepMounted.current = true;
      return;
    }
    setSelected(null);
  }, [subStep]);

  const stageRef = useRef(null);
  const trRef = useRef(null);
  const attireRef = useRef(null);
  const sigRef = useRef(null);
  const stripRef = useRef(null);
  const textRef = useRef(null);
  const sigFileRef = useRef(null);

  // Re-runs whenever attireT is cleared (not just when the image first
  // loads), so anything that resets the transform without changing the
  // image gets a fresh placement instead of leaving the suit un-rendered.
  useEffect(() => {
    if (attireImg && !attireT) {
      const s = viewW / attireImg.width;
      setAttireT({ x: 0, y: viewH - attireImg.height * s, scaleX: s, scaleY: s, rotation: 0 });
      setSelected('attire');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attireImg, attireT]);

  // Same fix as the attire effect above: re-place the signature whenever its
  // transform is cleared, not only on first load.
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
  }, [sigImg, sigT]);

  function chooseAttire(id) {
    setAttireId(id);
    setAttireT(null);
    if (id !== 'custom') setCustomAttireSrc(null);
  }
  function uploadCustomAttire(dataUrl) {
    setCustomAttireSrc(dataUrl);
    setAttireId('custom');
    setAttireT(null);
  }
  function setSignature(url) {
    setSigUrl(url);
    setSigT(null);
  }

  async function uploadSignature(file) {
    if (!file || !/^image\//.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const img = await loadImage(reader.result);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      // Trims to the ink/mark's bounding box, same as a drawn signature —
      // no-op for an opaque (no-alpha) photo of a signature on paper.
      setSignature(trimTransparent(canvas).toDataURL('image/png'));
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (persisted) {
      persisted.current = {
        subStep, strip, nameText, font, align, stripT, textT,
        attireId, customAttireSrc, sigUrl, attireT, sigT, selected,
        photoCanvas, originalPhoto,
      };
    }
  }, [
    persisted, subStep, strip, nameText, font, align, stripT, textT,
    attireId, customAttireSrc, sigUrl, attireT, sigT, selected,
    photoCanvas, originalPhoto,
  ]);

  // Auto-place strip + text the first time strip is turned on, and re-place
  // it whenever stripT is cleared without strip itself going false —
  // otherwise the name strip would stay permanently un-rendered. Default
  // placement is a full-width bar flush with the bottom edge, like a real
  // ID photo's name tag — still just the starting point, fully draggable
  // and resizable afterward like any other overlay.
  useEffect(() => {
    if (strip && !stripT) {
      const sw = viewW;
      const sh = viewH * 0.15;
      const sx = 0;
      const sy = viewH - sh;
      setStripT({ x: sx, y: sy, width: sw, height: sh, rotation: 0 });
      setTextT({ x: sx, y: sy + sh * 0.26, width: sw, fontSize: sh * 0.4, rotation: 0 });
      setSelected('strip');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strip, stripT]);

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
  // Attire gets free (non-uniform) stretch — edge handles for pure horizontal/
  // vertical scale, corner handles for both at once — same as the name strip.
  // Signature stays uniform so handwriting doesn't distort.
  const freeStretch = selected === 'strip' || selected === 'attire';
  const uniform = !freeStretch;

  const stepInfo = SUB_STEPS[subStep];
  const canGoBack = subStep > 0;
  const canGoNext = subStep < 2;
  const editingPhoto = photoCropping || photoBrushing;

  return (
    <section className="panel">
      <CropMarks />
      <h2>Add attire, name &amp; signature</h2>
      <p className="sub">All optional — skip any section you don&apos;t need.</p>

      <div className={`editor-row row ${editingPhoto ? '' : 'workspace'}`}>
        {/* Canvas column */}
        <div className="col editor-canvas-col" ref={canvasColRef}>
          {photoCropping ? (
            <>
              <div className="crop-stage">
                <Cropper
                  image={photoCropSrc}
                  crop={photoCrop}
                  zoom={photoZoom}
                  aspect={presetAspect}
                  onCropChange={setPhotoCrop}
                  onZoomChange={setPhotoZoom}
                  onCropComplete={onPhotoCropComplete}
                  restrictPosition
                  zoomWithScroll
                />
              </div>
              <div className="control-row">
                <label htmlFor="photo-zoom">
                  <Icon name="zoom_in" /> Zoom
                </label>
                <input
                  id="photo-zoom"
                  type="range"
                  min={1}
                  max={4}
                  step={0.01}
                  value={photoZoom}
                  onChange={(e) => setPhotoZoom(Number(e.target.value))}
                />
                <span className="mono" style={{ minWidth: 48 }}>
                  {photoZoom.toFixed(2)}×
                </span>
              </div>
              <div className="btn-row">
                <button className="btn" onClick={() => setPhotoCropping(false)}>
                  Cancel
                </button>
                <span className="spacer" />
                <button className="btn primary" disabled={!photoAreaPixels} onClick={applyPhotoCrop}>
                  Apply crop
                </button>
              </div>
            </>
          ) : photoBrushing && photoBrushSource ? (
            <MaskBrush
              cutout={photoBrushSource}
              original={originalPhoto}
              eraseColor={bgColor}
              guide={brushGuide}
              onApply={(canvas) => {
                setPhotoCanvas(canvas);
                setPhotoBrushing(false);
              }}
              onCancel={() => setPhotoBrushing(false)}
            />
          ) : (
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
                  {/* Fills the whole stage, so it — not the bare Stage —
                      is what actually receives a click on the photo away
                      from the suit/name/signature. Deselect here too, or
                      the onMouseDown/onTouchStart check below (which only
                      fires for clicks that miss every shape) never runs. */}
                  <KImage
                    image={photoCanvas}
                    x={0}
                    y={0}
                    width={viewW}
                    height={viewH}
                    onClick={() => setSelected(null)}
                    onTap={() => setSelected(null)}
                  />

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
                    enabledAnchors={freeStretch ? stripAnchors : cornerAnchors}
                    anchorStroke="#003d9b"
                    anchorFill="#fff"
                    borderStroke="#003d9b"
                    boundBoxFunc={(oldBox, newBox) =>
                      newBox.width < 8 || newBox.height < 8 ? oldBox : newBox
                    }
                  />
                </Layer>
              </Stage>
            </div>
          )}
          {!editingPhoto && selected && (
            <p className="hint" style={{ marginTop: 8 }}>
              Tap to select · drag to move · corners to scale · top handle to rotate
            </p>
          )}
          {!editingPhoto && (
            <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn" onClick={startPhotoCrop}>
                <Icon name="crop" /> Crop photo
              </button>
              <button className="btn" onClick={startPhotoBrush}>
                <Icon name="brush" /> Refine edges
              </button>
            </div>
          )}
        </div>

        {/* Guided controls column — hidden while cropping/refining so the
            photo gets the whole panel width, same as the standalone Crop step. */}
        {!editingPhoto && (
        <div className="col editor-controls-col">
          <>
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
                <AttirePicker
                  selectedId={attireId}
                  customSrc={customAttireSrc}
                  onSelect={chooseAttire}
                  onUploadCustom={uploadCustomAttire}
                />
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
                      <button
                        className="btn"
                        style={{ marginTop: 10 }}
                        onClick={() => {
                          setNameText('');
                          setStrip(false);
                          setStripT(null);
                          setTextT(null);
                          if (selected === 'strip' || selected === 'name') setSelected(null);
                        }}
                      >
                        <Icon name="undo" /> Remove name
                      </button>
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
                        <Icon name="draw" /> {sigUrl ? 'Redraw signature' : 'Draw signature'}
                      </button>
                      <button className="btn" onClick={() => sigFileRef.current?.click()}>
                        <Icon name="upload" /> Upload signature
                      </button>
                      <input
                        ref={sigFileRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => e.target.files?.[0] && uploadSignature(e.target.files[0])}
                      />
                      {sigUrl && (
                        <button
                          className="btn"
                          onClick={() => {
                            setSigUrl(null);
                            setSigT(null);
                          }}
                        >
                          <Icon name="delete" /> Remove
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
                      <Icon name="arrow_back" /> Back
                    </button>
                  )}
                  <span className="spacer" />
                  {canGoNext && (
                    <button className="btn" onClick={() => setSubStep((s) => s + 1)}>
                      {subStep === 0
                        ? (attireId ? 'Next' : 'Skip')
                        : (nameText ? 'Next' : 'Skip')}{' '}
                      <Icon name="arrow_forward" />
                    </button>
                  )}
                </div>
              )}
            </>
        </div>
        )}
      </div>

      {!editingPhoto && (
        <div className="btn-row">
          <button className="btn" onClick={onBack}>
            <Icon name="arrow_back" /> Back
          </button>
          <span className="spacer" />
          <button className="btn primary" onClick={apply}>
            Apply &amp; Export <Icon name="arrow_forward" />
          </button>
        </div>
      )}
    </section>
  );
}
