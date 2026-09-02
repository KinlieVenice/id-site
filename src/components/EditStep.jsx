import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Image as KImage, Rect, Text, Transformer } from 'react-konva';
import Cropper from 'react-easy-crop';
import Icon from './Icon.jsx';
import AttirePicker from './AttirePicker.jsx';
import SignaturePad from './SignaturePad.jsx';
import MaskBrush from './MaskBrush.jsx';
import useImage from '../lib/useImage.js';
import { ATTIRE } from '../data/attire.js';
import {
  cropToCanvas, loadImage, trimTransparent,
  removeBackground, compositeOnColor, applyAdjustments,
} from '../lib/image.js';
import { presetPixels } from '../data/presets.js';

const FONTS = ['Inter', 'Georgia', 'Times New Roman', 'Courier New'];

// Most common Philippine ID photo background colors — see BackgroundStep's
// original research: white is the strict standard for most PH government
// IDs, blue (#0038A8, the flag blue) the well-documented secondary color.
const BG_OPTIONS = [
  { key: 'original', label: 'Original', icon: 'image' },
  { key: 'remove', label: 'Remove', icon: 'auto_fix_high' },
  { key: 'white', label: 'White', color: '#ffffff' },
  { key: 'lightblue', label: 'Light blue', color: '#bcd4f0' },
  { key: 'royalblue', label: 'Royal blue', color: '#0038a8' },
  { key: 'custom', label: 'Custom' },
];

const TABS = [
  { key: 'background', label: 'Background', icon: 'auto_fix_high' },
  { key: 'retouch', label: 'Retouch', icon: 'eraser' },
  { key: 'crop', label: 'Crop', icon: 'crop' },
  { key: 'light', label: 'Light', icon: 'light_mode' },
  { key: 'details', label: 'Details', icon: 'person' },
];

export default function EditStep({ baseCanvas, preset, persisted, tab, onTabChange, onBack, onDone }) {
  const saved = persisted?.current || {};

  // ---- photo + crop -----------------------------------------------------
  const [photoCanvas, setPhotoCanvas] = useState(saved.photoCanvas ?? baseCanvas);
  const [originalPhoto, setOriginalPhoto] = useState(saved.originalPhoto ?? saved.photoCanvas ?? baseCanvas);
  const baseW = photoCanvas.width;
  const baseH = photoCanvas.height;
  const { w: presetW, h: presetH } = presetPixels(preset);
  const presetAspect = preset.wmm / preset.hmm;

  const [photoCrop, setPhotoCrop] = useState({ x: 0, y: 0 });
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoAreaPixels, setPhotoAreaPixels] = useState(null);
  const photoCropSrc = useMemo(() => photoCanvas.toDataURL('image/png'), [photoCanvas]);
  const onPhotoCropComplete = useCallback((_, pixels) => setPhotoAreaPixels(pixels), []);

  async function applyPhotoCrop() {
    if (!photoAreaPixels) return;
    const canvas = await cropToCanvas(photoCanvas.toDataURL('image/png'), photoAreaPixels, presetW, presetH);
    setPhotoCanvas(canvas);
    setOriginalPhoto(canvas);
    onTabChange('background');
  }

  // ---- background removal + color + touch-up -----------------------------
  const [removeBg, setRemoveBg] = useState(saved.removeBg ?? false);
  const [cutout, setCutout] = useState(saved.cutout ?? null);
  const [bgColor, setBgColor] = useState(saved.bgColor !== undefined ? saved.bgColor : (preset.defaultBg ?? '#ffffff'));
  const [smooth, setSmooth] = useState(saved.smooth ?? 80);
  const [brightness, setBrightness] = useState(saved.brightness ?? 1);
  const [contrast, setContrast] = useState(saved.contrast ?? 1);
  const [autoEnhance, setAutoEnhance] = useState(saved.autoEnhance ?? false);
  const [bgProgress, setBgProgress] = useState(null);
  const [bgError, setBgError] = useState('');
  const [displayCanvas, setDisplayCanvas] = useState(photoCanvas);

  // A re-crop changes the photo's pixels, so any earlier cutout no longer
  // lines up — recompute it against the new crop instead of showing a stale
  // (wrongly-framed) mask.
  const prevPhotoRef = useRef(photoCanvas);
  useEffect(() => {
    if (prevPhotoRef.current !== photoCanvas) {
      prevPhotoRef.current = photoCanvas;
      setCutout(null);
    }
  }, [photoCanvas]);

  useEffect(() => {
    let cancelled = false;
    if (removeBg && !cutout) {
      setBgError('');
      setBgProgress({ pct: 0 });
      removeBackground(photoCanvas, (pct) => {
        if (!cancelled) setBgProgress({ pct });
      })
        .then((c) => {
          if (!cancelled) {
            setCutout(c);
            setBgProgress(null);
          }
        })
        .catch((e) => {
          if (!cancelled) {
            setBgError(`Background removal failed: ${e.message}`);
            setRemoveBg(false);
            setBgProgress(null);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [removeBg, cutout, photoCanvas]);

  useEffect(() => {
    let base = photoCanvas;
    if (removeBg && cutout) base = bgColor ? compositeOnColor(cutout, bgColor) : cutout;
    base = applyAdjustments(base, { brightness, contrast, smooth: (smooth / 100) * 2 });
    setDisplayCanvas(base);
  }, [photoCanvas, removeBg, cutout, bgColor, brightness, contrast, smooth]);

  const bgSelectedKey = !removeBg
    ? 'original'
    : bgColor === null
    ? 'remove'
    : BG_OPTIONS.find((o) => o.color === bgColor)?.key || 'custom';

  function pickBgOption(key) {
    if (key === 'original') {
      setRemoveBg(false);
    } else if (key === 'remove') {
      setRemoveBg(true);
      setBgColor(null);
    } else if (key === 'custom') {
      setRemoveBg(true);
      customColorRef.current?.click();
    } else {
      const opt = BG_OPTIONS.find((o) => o.key === key);
      setRemoveBg(true);
      setBgColor(opt.color);
    }
  }
  const customColorRef = useRef(null);

  function toggleAutoEnhance(on) {
    setAutoEnhance(on);
    if (on) {
      setBrightness(1.05);
      setContrast(1.08);
    } else {
      setBrightness(1);
      setContrast(1);
    }
  }

  // ---- retouch (mask brush) ----------------------------------------------
  const [photoBrushSource, setPhotoBrushSource] = useState(null);
  const [retouchMode, setRetouchMode] = useState('photo');

  function startRetouch() {
    if (removeBg && cutout) {
      setRetouchMode('cutout');
      setPhotoBrushSource(cutout);
    } else {
      setRetouchMode('photo');
      setPhotoBrushSource(photoCanvas);
    }
  }
  function applyRetouch(canvas) {
    if (retouchMode === 'cutout') setCutout(canvas);
    else setPhotoCanvas(canvas);
    setPhotoBrushSource(null);
    onTabChange('background');
  }

  useEffect(() => {
    if (tab === 'retouch' && !photoBrushSource) startRetouch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ---- attire / name / signature (unchanged from the previous Editor) ----
  const [strip, setStrip] = useState(saved.strip ?? false);
  const [nameText, setNameText] = useState(saved.nameText ?? '');
  const [font, setFont] = useState(saved.font ?? 'Inter');
  const [align, setAlign] = useState(saved.align ?? 'center');
  const [stripT, setStripT] = useState(saved.stripT ?? null);
  const [textT, setTextT] = useState(saved.textT ?? null);

  const [attireId, setAttireId] = useState(saved.attireId ?? null);
  const [customAttireSrc, setCustomAttireSrc] = useState(saved.customAttireSrc ?? null);
  const [sigUrl, setSigUrl] = useState(saved.sigUrl ?? null);
  const [signing, setSigning] = useState(false);

  const attireSrc =
    attireId === 'custom' ? customAttireSrc : attireId ? ATTIRE.find((a) => a.id === attireId)?.src : null;
  const attireImg = useImage(attireSrc);
  const sigImg = useImage(sigUrl);

  const canvasColRef = useRef(null);
  const [canvasColW, setCanvasColW] = useState(440);

  useEffect(() => {
    const el = canvasColRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCanvasColW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = useMemo(
    () => Math.min((canvasColW - 32) / baseW, 640 / baseH, 1),
    [canvasColW, baseW, baseH],
  );
  const viewW = Math.round(baseW * scale);
  const viewH = Math.round(baseH * scale);

  const [selected, setSelected] = useState(saved.selected ?? null);
  const [attireT, setAttireT] = useState(saved.attireT ?? null);
  const [sigT, setSigT] = useState(saved.sigT ?? null);

  const tabMounted = useRef(false);
  useEffect(() => {
    if (!tabMounted.current) {
      tabMounted.current = true;
      return;
    }
    setSelected(null);
  }, [tab]);

  const stageRef = useRef(null);
  const trRef = useRef(null);
  const attireRef = useRef(null);
  const sigRef = useRef(null);
  const stripRef = useRef(null);
  const textRef = useRef(null);
  const sigFileRef = useRef(null);

  useEffect(() => {
    if (attireId && attireImg && !attireT) {
      const s = viewW / attireImg.width;
      setAttireT({ x: 0, y: viewH - attireImg.height * s, scaleX: s, scaleY: s, rotation: 0 });
      setSelected('attire');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attireId, attireImg, attireT]);

  useEffect(() => {
    if (sigUrl && sigImg && !sigT) {
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
  }, [sigUrl, sigImg, sigT]);

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
      setSignature(trimTransparent(canvas).toDataURL('image/png'));
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (persisted) {
      persisted.current = {
        strip, nameText, font, align, stripT, textT,
        attireId, customAttireSrc, sigUrl, attireT, sigT, selected,
        photoCanvas, originalPhoto, removeBg, cutout, bgColor,
        smooth, brightness, contrast, autoEnhance,
      };
    }
  }, [
    persisted, strip, nameText, font, align, stripT, textT,
    attireId, customAttireSrc, sigUrl, attireT, sigT, selected,
    photoCanvas, originalPhoto, removeBg, cutout, bgColor,
    smooth, brightness, contrast, autoEnhance,
  ]);

  useEffect(() => {
    if (strip && !stripT) {
      const sw = viewW;
      const sh = viewH * 0.15;
      const sx = 0;
      const sy = viewH - sh;
      setStripT({ x: sx, y: sy, width: sw, height: sh, rotation: 0 });
      setTextT({ x: sx, y: sy, width: sw, height: sh, fontSize: sh * 0.4, rotation: 0 });
      setSelected('strip');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strip, stripT]);

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
    const h = Math.max(10, node.height() * s);
    node.scaleX(1);
    node.scaleY(1);
    node.fontSize(fs);
    node.width(w);
    node.height(h);
    setTextT((t) => ({ ...t, x: node.x(), y: node.y(), width: w, height: h, fontSize: fs, rotation: node.rotation() }));
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
  const freeStretch = selected === 'strip' || selected === 'attire';
  const uniform = !freeStretch;

  const showCheckerboard = removeBg && cutout && !bgColor;
  const working = bgProgress !== null;
  const pct = Math.round((bgProgress?.pct || 0) * 100);

  return (
    <>
      <div className="edit-layout">
        <div className="card edit-canvas-card">
          <h1>{tab === 'details' ? 'Details' : 'Edit your photo'}</h1>
          <p className="sub">
            {tab === 'details' ? 'Add outfit, name, and signature. All optional.' : 'Make it perfect for your ID photo.'}
          </p>

          <div ref={canvasColRef}>
            {tab === 'crop' ? (
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
                <div className="canvas-toolbar">
                  <label htmlFor="photo-zoom" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
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
                  <span className="mono" style={{ minWidth: 44 }}>
                    {photoZoom.toFixed(2)}×
                  </span>
                </div>
                <div className="btn-row">
                  <button className="btn" onClick={() => onTabChange('background')}>
                    Cancel
                  </button>
                  <span className="spacer" />
                  <button className="btn primary" disabled={!photoAreaPixels} onClick={applyPhotoCrop}>
                    Apply crop
                  </button>
                </div>
              </>
            ) : tab === 'retouch' && photoBrushSource ? (
              <MaskBrush
                cutout={photoBrushSource}
                original={retouchMode === 'cutout' ? photoCanvas : originalPhoto}
                eraseColor={bgColor}
                onApply={applyRetouch}
                onCancel={() => {
                  setPhotoBrushSource(null);
                  onTabChange('background');
                }}
              />
            ) : (
              <>
                <div
                  className="preview-frame"
                  style={{
                    minHeight: 0,
                    padding: 16,
                    backgroundImage: showCheckerboard ? 'var(--checkerboard)' : 'none',
                    background: showCheckerboard ? undefined : 'var(--line)',
                  }}
                >
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
                      <KImage
                        image={displayCanvas}
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
                          height={textT.height}
                          verticalAlign="middle"
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
                        anchorStroke="#e91e63"
                        anchorFill="#fff"
                        borderStroke="#e91e63"
                        boundBoxFunc={(oldBox, newBox) =>
                          newBox.width < 8 || newBox.height < 8 ? oldBox : newBox
                        }
                      />
                    </Layer>
                  </Stage>
                </div>

                <div className="canvas-toolbar">
                  <button className="icon-btn" disabled title="Undo (coming soon)">
                    <Icon name="undo" />
                  </button>
                  <button className="icon-btn" disabled title="Redo (coming soon)" style={{ transform: 'scaleX(-1)' }}>
                    <Icon name="undo" />
                  </button>
                  <span style={{ flex: 1 }} />
                  <div className="zoom-group">
                    <button className="icon-btn" disabled title="Zoom controls are automatic">
                      <Icon name="chevron_left" style={{ fontSize: 14 }} />
                    </button>
                    <span className="zoom-readout">{Math.round(scale * 100)}%</span>
                  </div>
                  <button className="btn">
                    <Icon name="fit_screen" /> Fit
                  </button>
                </div>

                {selected && (
                  <p className="hint" style={{ marginTop: 8 }}>
                    Tap to select · drag to move · corners to scale · top handle to rotate
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="card edit-panel">
          <div className="edit-panel-head">
            <h2>{TABS.find((t) => t.key === tab)?.label}</h2>
            <Icon name="help" style={{ color: 'var(--ink-3)' }} />
          </div>

          {tab === 'background' && (
            <>
              <div className="bg-grid">
                {BG_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    className={`bg-option ${bgSelectedKey === o.key ? 'selected' : ''}`}
                    onClick={() => pickBgOption(o.key)}
                  >
                    {bgSelectedKey === o.key && (
                      <span className="check-badge">
                        <Icon name="check" />
                      </span>
                    )}
                    <span
                      className="bg-option-swatch"
                      style={o.color ? { background: o.color, backgroundImage: 'none' } : undefined}
                    >
                      {!o.color && <Icon name={o.key === 'custom' ? 'tune' : o.icon} />}
                    </span>
                    <span className="bg-option-label">{o.label}</span>
                    {o.key === 'custom' && (
                      <input
                        ref={customColorRef}
                        type="color"
                        value={bgColor || '#ffffff'}
                        onChange={(e) => {
                          setRemoveBg(true);
                          setBgColor(e.target.value);
                        }}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {working && (
                <div className="progress">
                  <span className="progress-label">
                    {pct > 0 ? `Removing background… ${pct}%` : 'Preparing…'}
                  </span>
                  <div className="bar">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
              {bgError && <p className="error">{bgError}</p>}

              <div className="control-block">
                <div className="control-block-head">
                  <span className="control-block-title">Refine cutout</span>
                  <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-3)' }}>
                    {Math.round(smooth)}%
                  </span>
                </div>
                <p className="control-block-sub">Smoothen edges for a cleaner look.</p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={smooth}
                  onChange={(e) => setSmooth(Number(e.target.value))}
                />
              </div>

              <div className="control-block">
                <label className="pill-toggle">
                  <span className="pt-copy">
                    <span className="pt-title">Auto enhance</span>
                    <span className="pt-sub">Adjusts brightness/contrast for a cleaner ID-photo look.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={autoEnhance}
                    onChange={(e) => toggleAutoEnhance(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <span className={`pill-switch ${autoEnhance ? 'on' : ''}`} role="presentation" aria-hidden="true" />
                </label>
              </div>
            </>
          )}

          {tab === 'retouch' && (
            <p className="control-note">
              Erase leftover background, or restore parts that were removed, using the brush in the
              main view.
            </p>
          )}

          {tab === 'crop' && (
            <p className="control-note">
              Drag to pan, use the zoom slider to scale, then Apply crop when the framing looks right.
              Locked to {Math.round(preset.wmm)}×{Math.round(preset.hmm)} mm.
            </p>
          )}

          {tab === 'light' && (
            <div className="control-block">
              <span className="control-block-title">Adjust</span>
              <div className="slider-row">
                <label htmlFor="brightness">
                  <Icon name="light_mode" /> Brightness
                </label>
                <input
                  id="brightness"
                  type="range"
                  min={0.7}
                  max={1.3}
                  step={0.01}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                />
                <span className="val">{Math.round(brightness * 100)}%</span>
              </div>
              <div className="slider-row">
                <label htmlFor="contrast">
                  <Icon name="contrast" /> Contrast
                </label>
                <input
                  id="contrast"
                  type="range"
                  min={0.7}
                  max={1.3}
                  step={0.01}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                />
                <span className="val">{Math.round(contrast * 100)}%</span>
              </div>
              {(brightness !== 1 || contrast !== 1) && (
                <button
                  className="reset-link"
                  onClick={() => {
                    setBrightness(1);
                    setContrast(1);
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {tab === 'details' && (
            <>
              <div className="details-section">
                <div className="details-section-title">
                  <Icon name="apparel" /> Outfit
                </div>
                <AttirePicker
                  selectedId={attireId}
                  customSrc={customAttireSrc}
                  onSelect={chooseAttire}
                  onUploadCustom={uploadCustomAttire}
                />
              </div>

              <div className="details-section">
                <div className="details-section-title">
                  <Icon name="badge" /> Add name
                </div>
                <textarea
                  value={nameText}
                  placeholder="Enter full name"
                  rows={2}
                  onChange={handleNameChange}
                  onFocus={() => nameText && setSelected('name')}
                  className="name-input"
                  style={{ marginBottom: 10 }}
                />
                {nameText && strip && (
                  <>
                    <div className="field" style={{ marginBottom: 10 }}>
                      <select value={font} onChange={(e) => setFont(e.target.value)}>
                        {FONTS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="seg" style={{ marginBottom: 10 }}>
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
                    <div className="seg" style={{ marginBottom: 10 }}>
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
                    <button
                      className="btn"
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

              <div className="details-section">
                <div className="details-section-title">
                  <Icon name="draw" /> Add signature
                </div>
                {signing ? (
                  <SignaturePad
                    onDone={(url) => {
                      setSignature(url);
                      setSigning(false);
                    }}
                    onCancel={() => setSigning(false)}
                  />
                ) : sigUrl ? (
                  <div className="btn-row" style={{ marginTop: 0 }}>
                    <button className="btn" onClick={() => setSigning(true)}>
                      <Icon name="draw" /> Redraw
                    </button>
                    <button className="btn" onClick={() => sigFileRef.current?.click()}>
                      <Icon name="upload" /> Replace
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        setSigUrl(null);
                        setSigT(null);
                      }}
                    >
                      <Icon name="delete" /> Remove
                    </button>
                  </div>
                ) : (
                  <button className="sig-upload-zone" style={{ width: '100%' }} onClick={() => sigFileRef.current?.click()}>
                    <Icon name="upload" /> Upload signature
                    <span className="sub">PNG, JPG · Max 2MB</span>
                  </button>
                )}
                <input
                  ref={sigFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => e.target.files?.[0] && uploadSignature(e.target.files[0])}
                />
                {!sigUrl && !signing && (
                  <button className="btn" style={{ marginTop: 10 }} onClick={() => setSigning(true)}>
                    <Icon name="draw" /> or draw it instead
                  </button>
                )}
              </div>

              <div className="control-note">
                <Icon name="sparkles" /> You can move and resize the name or signature on the final
                print sheet.
              </div>
            </>
          )}
        </div>
      </div>

      <div className="edit-tabbar" style={{ marginTop: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`edit-tabbar-btn ${tab === t.key ? 'on' : ''}`}
            onClick={() => onTabChange(t.key)}
          >
            <Icon name={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      <div className="btn-row">
        <button className="btn" onClick={onBack}>
          <Icon name="arrow_back" /> Back
        </button>
        <span className="spacer" />
        <button className="btn primary" onClick={apply}>
          Continue <Icon name="arrow_forward" />
        </button>
      </div>
    </>
  );
}
