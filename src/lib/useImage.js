import { useEffect, useState } from 'react';

// Minimal image loader for react-konva <Image> sources (avoids an extra dep).
// Accepts a URL/data-URL string; returns the HTMLImageElement once loaded.
export default function useImage(src) {
  // Track which src the loaded image actually belongs to, not just the
  // image itself. Switching src (e.g. picking a different suit) doesn't
  // wait for the new one to load before this hook is called again with the
  // new src — without the match check below, callers would keep getting
  // the PREVIOUS src's image back for a render or two, which is enough for
  // "use this image's dimensions to position it" logic elsewhere to fire on
  // stale data and never get a second chance once the real image arrives.
  const [state, setState] = useState({ src: null, image: null });
  useEffect(() => {
    if (!src) {
      setState({ src, image: null });
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    let active = true;
    img.onload = () => active && setState({ src, image: img });
    img.src = src;
    return () => {
      active = false;
    };
  }, [src]);
  return state.src === src ? state.image : null;
}
