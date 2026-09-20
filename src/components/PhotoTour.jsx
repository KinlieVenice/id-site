import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const find = (name) => document.querySelector(`[data-tour="${name}"]`);

export function tourInstruction(started, step, hasPreset, detail = 0) {
  if (!started) return { target: 'new-photo', title: 'Start with a new photo', text: 'Click New photo to begin. This clears any photo you are currently editing.' };
  if (step === 0) return { target: 'upload', title: 'Choose your photo', text: 'Click Choose photo or drop a JPG or PNG here. The guide will wait until your photo has loaded.' };
  if (step === 1) return hasPreset
    ? { target: 'size-next', title: 'Ready to crop', text: 'You can still change your size. Click Crop when you are ready.' }
    : { target: 'size', title: 'Pick a size', text: 'Choose an ID size, a passport country, or enter a custom size. Then click Crop.' };
  if (step === 2) return { target: 'crop', title: 'Frame your photo', text: 'Drag your photo to center your face and use the zoom slider to adjust the framing. Click Apply crop below when it looks right.', next: 'crop-next', label: 'Show Apply crop' };
  if (step === 3) return { target: 'background', title: 'Background & touch-up', optional: true, text: 'You can remove the background, choose a color, refine its edges, or adjust brightness, contrast, and smoothing. Keep everything as it is if you do not need changes.', next: 'background-next' };
  if (step === 4) {
    const titles = ['Add clothing', 'Add your name', 'Add a signature'];
    const descriptions = ['Choose an outfit or upload your own, then drag and resize it on the photo.', 'Type a name and adjust its font and alignment. Drag the name strip to position it.', 'Draw or upload a signature, then move and resize it on the photo.'];
    return { target: `details-${detail}`, title: titles[detail], text: `${descriptions[detail]} You can leave this empty.`, optional: true, next: detail < 2 ? 'details-next' : 'editor-next' };
  }
  return { target: 'export', title: 'Download & print', text: 'Download a single photo, or choose paper size and copies for a print sheet. The cutting guide is optional. Print at 100% / actual size.', finish: true };
}

export default function PhotoTour({ active, started, step, hasPreset, onToggle, onClose }) {
  const [detail, setDetail] = useState(0);
  const [rect, setRect] = useState(null);
  const [canContinue, setCanContinue] = useState(false);
  const buttonRef = useRef(null);
  const instruction = tourInstruction(started, step, hasPreset, detail);

  useEffect(() => {
    if (!active) return;
    document.body.classList.add('tour-open');
    const closeOnEscape = (event) => { if (event.key === 'Escape') { onClose(); buttonRef.current?.focus(); } };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('tour-open');
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [active, onClose]);

  useEffect(() => {
    if (!active) return;
    let previousTarget;
    // Also handles lazy editor loading, optional substeps, and temporary brush/crop views.
    const update = () => {
      for (let i = 0; i < 3; i++) if (find(`details-${i}`)) setDetail(i);
      const target = find(instruction.target);
      const next = instruction.next && find(instruction.next);
      setCanContinue(!!next && !next.disabled);
      if (target && previousTarget !== target) {
        target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
      }
      previousTarget = target;
      if (!target) { setRect(null); return; }
      const bounds = target.getBoundingClientRect();
      const nextRect = { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
      setRect((old) => old && Object.keys(nextRect).every((key) => old[key] === nextRect[key]) ? old : nextRect);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.querySelector('.game-main'), { subtree: true, childList: true, attributes: true, attributeFilter: ['data-tour', 'disabled'] });
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    const resize = new ResizeObserver(update);
    resize.observe(document.querySelector('.game-main'));
    return () => {
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [active, instruction.target, instruction.next]);

  function continueTour() {
    const next = find(instruction.next);
    if (!next || next.disabled) return;
    if (step === 2) {
      next.scrollIntoView({ block: 'center', behavior: 'smooth' });
      next.focus({ preventScroll: true });
    } else next.click();
  }

  return (
    <>
      <button ref={buttonRef} className="tour-info" aria-label={active ? 'Close photo guide' : 'Start photo guide'}
        title="Step-by-step photo guide" aria-expanded={active} aria-controls={active ? 'photo-tour' : undefined} onClick={onToggle}>
        <span aria-hidden="true">i</span>
      </button>
      {active && <>
        {rect && <div className="tour-highlight" style={rect} aria-hidden="true">
          <svg className="tour-cursor" width="34" height="42" viewBox="0 0 34 42"><path d="M3 2v30l8-8 7 15 7-4-7-14h12Z" fill="var(--gold)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" /></svg>
        </div>}
        <section id="photo-tour" className="tour-card" aria-label="Photo guide">
          <div className="tour-card-head"><span>{instruction.optional ? 'Optional step' : 'Photo guide'}</span>
            <button aria-label="Close guide" onClick={() => { onClose(); buttonRef.current?.focus(); }}>×</button>
          </div>
          <div aria-live="polite" aria-atomic="true">
            <h2>{instruction.title}</h2><p>{instruction.text}</p>
          </div>
          {!rect && <p className="tour-wait">Finish or cancel the current tool to resume this step.</p>}
          {instruction.next && <button className="btn primary" disabled={!canContinue} onClick={continueTour}>
            {instruction.label || 'Continue without changes'} <Icon name="arrow_forward" />
          </button>}
          {instruction.optional && <small>Made changes? This keeps them too.</small>}
          {instruction.finish && <button className="btn primary" onClick={onClose}>Finish guide</button>}
        </section>
      </>}
    </>
  );
}
