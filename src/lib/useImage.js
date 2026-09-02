import { useEffect, useState } from 'react';

// Minimal image loader for react-konva <Image> sources (avoids an extra dep).
// Accepts a URL/data-URL string; returns the HTMLImageElement once loaded.
export default function useImage(src) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    let active = true;
    img.onload = () => active && setImage(img);
    img.src = src;
    return () => {
      active = false;
    };
  }, [src]);
  return image;
}
