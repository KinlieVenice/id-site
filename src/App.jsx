import { lazy, Suspense, useRef, useState } from 'react';
import Stepper from './components/Stepper.jsx';
import UploadStep from './components/UploadStep.jsx';
import SizeStep from './components/SizeStep.jsx';
import CropStep from './components/CropStep.jsx';
import BackgroundStep from './components/BackgroundStep.jsx';
import ExportStep from './components/ExportStep.jsx';
import Guide from './components/Guide.jsx';
import Icon from './components/Icon.jsx';

const Editor = lazy(() => import('./components/Editor.jsx'));

export default function App() {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);

  const [imageSrc, setImageSrc] = useState(null);
  const [preset, setPreset] = useState(null);
  const [croppedCanvas, setCroppedCanvas] = useState(null);
  const [composedCanvas, setComposedCanvas] = useState(null);
  const [finalCanvas, setFinalCanvas] = useState(null);

  const cropState = useRef(null);
  const bgState = useRef(null);
  const editorState = useRef(null);
  const cropSig = useRef(null);

  function goTo(i) {
    setStep(i);
    setMaxReached((m) => Math.max(m, i));
  }

  function handleCropped(canvas, sig) {
    if (sig && sig === cropSig.current && croppedCanvas) {
      goTo(3);
      return;
    }
    cropSig.current = sig;
    setCroppedCanvas(canvas);
    goTo(3);
  }

  function handleNewPhoto() {
    setStep(0);
    setMaxReached(0);
    setImageSrc(null);
    setPreset(null);
    setCroppedCanvas(null);
    setComposedCanvas(null);
    setFinalCanvas(null);
    cropState.current = null;
    bgState.current = null;
    editorState.current = null;
    cropSig.current = null;
  }

  return (
    <div className="game-shell">
      <aside className="game-rail">
        <span className="rail-logo" aria-hidden="true">
          ✨
        </span>
        <Stepper current={step} maxReached={maxReached} onGo={goTo} />
      </aside>

      <div className="game-main">
      <header className="masthead">
        <div>
          <h1>ID Maker</h1>
          <p>Dress up your photo. Get it ID-ready! ✨</p>
        </div>
        <div className="masthead-actions">
          <span className="privacy-badge">
            <Icon name="lock" /> On-device · nothing uploaded
          </span>
          {step > 0 && (
            <button className="btn new-photo-btn" onClick={handleNewPhoto}>
              <Icon name="add_a_photo" /> New photo
            </button>
          )}
        </div>
      </header>

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
          persisted={cropState}
          onBack={() => goTo(1)}
          onCropped={handleCropped}
        />
      )}

      {step === 3 && croppedCanvas && preset && (
        <BackgroundStep
          croppedCanvas={croppedCanvas}
          preset={preset}
          persisted={bgState}
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
            preset={preset}
            bgColor={bgState.current?.removeBg ? bgState.current?.bgColor : null}
            persisted={editorState}
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
    </div>
  );
}
