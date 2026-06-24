import { lazy, Suspense, useState } from 'react';
import Stepper from './components/Stepper.jsx';
import UploadStep from './components/UploadStep.jsx';
import SizeStep from './components/SizeStep.jsx';
import CropStep from './components/CropStep.jsx';
import BackgroundStep from './components/BackgroundStep.jsx';
import ExportStep from './components/ExportStep.jsx';
import Guide from './components/Guide.jsx';

// The Konva-based editor (attire/name/signature) is the heaviest dependency and
// an optional add-on — load it only when the user reaches the Extras step.
const Editor = lazy(() => import('./components/Editor.jsx'));

// App owns the whole flow state and renders the active step. No backend, no
// router yet — a single linear pipeline (architecture note, Decision D1).
export default function App() {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);

  const [imageSrc, setImageSrc] = useState(null);
  const [preset, setPreset] = useState(null);
  const [croppedCanvas, setCroppedCanvas] = useState(null);
  const [composedCanvas, setComposedCanvas] = useState(null);
  const [finalCanvas, setFinalCanvas] = useState(null);

  function goTo(i) {
    setStep(i);
    setMaxReached((m) => Math.max(m, i));
  }

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <h1>ID &amp; Passport Photo Maker</h1>
          <p>Crop, clean up, and tile print-ready ID photos — start to finish.</p>
        </div>
        <span className="privacy-badge">On-device · nothing uploaded</span>
      </header>

      <Stepper current={step} maxReached={maxReached} onGo={goTo} />

      {step === 0 && (
        <UploadStep
          onImage={(src) => {
            setImageSrc(src);
            goTo(1);
          }}
        />
      )}

      {step === 1 && (
        <SizeStep
          selected={preset}
          onSelect={setPreset}
          onBack={() => goTo(0)}
          onNext={() => goTo(2)}
        />
      )}

      {step === 2 && imageSrc && preset && (
        <CropStep
          imageSrc={imageSrc}
          preset={preset}
          onBack={() => goTo(1)}
          onCropped={(canvas) => {
            setCroppedCanvas(canvas);
            goTo(3);
          }}
        />
      )}

      {step === 3 && croppedCanvas && preset && (
        <BackgroundStep
          croppedCanvas={croppedCanvas}
          preset={preset}
          onBack={() => goTo(2)}
          onDone={(canvas) => {
            setComposedCanvas(canvas);
            setFinalCanvas(canvas);
            goTo(4);
          }}
        />
      )}

      {step === 4 && composedCanvas && (
        <Suspense fallback={<div className="panel mono">Loading editor…</div>}>
          <Editor
            baseCanvas={composedCanvas}
            onBack={() => goTo(3)}
            onDone={(canvas) => {
              setFinalCanvas(canvas);
              goTo(5);
            }}
          />
        </Suspense>
      )}

      {step === 5 && finalCanvas && preset && (
        <ExportStep finalCanvas={finalCanvas} preset={preset} onBack={() => goTo(4)} />
      )}

      <Guide />

      <footer className="site-footer">
        <span>Runs entirely in your browser · no accounts · no storage</span>
        <span className="mono">mm · px · dpi</span>
      </footer>
    </div>
  );
}
