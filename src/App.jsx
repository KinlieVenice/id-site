import { lazy, Suspense, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import PhotoStep from './components/PhotoStep.jsx';
import SizeStep from './components/SizeStep.jsx';
import PrintStep from './components/PrintStep.jsx';
import Guide from './components/Guide.jsx';
import { loadImage, cropToCanvas } from './lib/image.js';
import { presetPixels } from './data/presets.js';

const EditStep = lazy(() => import('./components/EditStep.jsx'));

// A centered "cover" crop in the original image's own pixel space — the
// starting point EditStep's Crop tab lets the user refine further, since
// there's no more standalone mandatory Crop step gating entry to Edit.
function defaultCropPixels(imgW, imgH, aspect) {
  const imgAspect = imgW / imgH;
  let w, h;
  if (imgAspect > aspect) {
    h = imgH;
    w = h * aspect;
  } else {
    w = imgW;
    h = w / aspect;
  }
  return { x: (imgW - w) / 2, y: (imgH - h) / 2, width: w, height: h };
}

function railIndexFor(step, editTab) {
  if (step <= 1) return step;
  if (step === 2) return editTab === 'details' ? 3 : 2;
  return 4;
}
function railMaxFor(maxStep) {
  if (maxStep <= 1) return maxStep;
  if (maxStep === 2) return 3;
  return 4;
}

export default function App() {
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [editTab, setEditTab] = useState('background');

  const [imageSrc, setImageSrc] = useState(null);
  const [preset, setPreset] = useState(null);
  const [baseCanvas, setBaseCanvas] = useState(null);
  const [baseCanvasPresetId, setBaseCanvasPresetId] = useState(null);
  const [finalCanvas, setFinalCanvas] = useState(null);

  const editorState = useRef(null);

  function selectPreset(p) {
    setPreset(p);
  }

  async function enterEdit(targetTab) {
    if (!baseCanvas || baseCanvasPresetId !== preset.id) {
      const img = await loadImage(imageSrc);
      const { w: pw, h: ph } = presetPixels(preset);
      const aspect = preset.wmm / preset.hmm;
      const crop = defaultCropPixels(img.width, img.height, aspect);
      const canvas = await cropToCanvas(imageSrc, crop, pw, ph);
      setBaseCanvas(canvas);
      setBaseCanvasPresetId(preset.id);
      editorState.current = null;
    }
    setEditTab(targetTab);
    setStep(2);
    setMaxStep((m) => Math.max(m, 2));
  }

  function goRail(i) {
    if (i === 0) setStep(0);
    else if (i === 1) setStep(1);
    else if (i === 2) enterEdit(editTab === 'details' ? 'background' : editTab);
    else if (i === 3) enterEdit('details');
    else if (i === 4) setStep(3);
  }

  function handleEditDone(canvas) {
    setFinalCanvas(canvas);
    setStep(3);
    setMaxStep((m) => Math.max(m, 3));
  }

  function handleNewPhoto() {
    setStep(0);
    setMaxStep(0);
    setEditTab('background');
    setImageSrc(null);
    setPreset(null);
    setBaseCanvas(null);
    setBaseCanvasPresetId(null);
    setFinalCanvas(null);
    editorState.current = null;
  }

  const subs = [
    imageSrc ? 'Uploaded' : 'Upload your photo',
    preset ? `${Math.round(preset.wmm)} × ${Math.round(preset.hmm)} mm` : 'Choose the right size',
    'Adjust background & light',
    'Outfit, name & signature',
    'Download & print',
  ];

  const primary =
    step === 1 ? { label: 'Continue', disabled: !preset, onClick: () => enterEdit('background') } : null;

  return (
    <div className="app-shell">
      <Sidebar active={railIndexFor(step, editTab)} maxReached={railMaxFor(maxStep)} subs={subs} onGo={goRail} />

      <div className="main-col">
        <TopBar ready={step >= 2} onNewPhoto={handleNewPhoto} primary={primary} />

        <main className="content">
          {step === 0 && (
            <PhotoStep
              onImage={(src) => {
                setImageSrc(src);
                setStep(1);
                setMaxStep((m) => Math.max(m, 1));
              }}
            />
          )}

          {step === 1 && (
            <SizeStep imageSrc={imageSrc} selected={preset} onSelect={selectPreset} onBack={() => setStep(0)} />
          )}

          {step === 2 && baseCanvas && preset && (
            <Suspense fallback={<div className="card mono">Loading editor…</div>}>
              <EditStep
                baseCanvas={baseCanvas}
                preset={preset}
                persisted={editorState}
                tab={editTab}
                onTabChange={setEditTab}
                onBack={() => setStep(1)}
                onDone={handleEditDone}
              />
            </Suspense>
          )}

          {step === 3 && finalCanvas && preset && (
            <PrintStep finalCanvas={finalCanvas} preset={preset} onBack={() => setStep(2)} ready />
          )}

          <Guide />
        </main>

        <footer className="site-footer">
          <span>Runs entirely in your browser · no accounts · no storage</span>
          <span className="mono">mm · px · dpi</span>
        </footer>
      </div>
    </div>
  );
}
