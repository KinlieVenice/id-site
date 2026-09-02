import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Image as KImage } from 'react-konva';

// Interactive print-sheet editor: the auto-packed layout (layoutMixedTiles)
// is just the starting point — every tile is draggable, and drags snap to
// the sheet's margin box and to other tiles' edges so lining photos up by
// hand is as easy as the auto-pack itself, without forcing that exact grid.
const SNAP_PX = 8; // view-space snap threshold, independent of sheet resolution

export default function PrintSheetCanvas({ layout, positions, onPositionsChange, maxW = 420 }) {
  const wrapRef = useRef(null);
  const [wrapW, setWrapW] = useState(maxW);
  const [guides, setGuides] = useState({ x: null, y: null });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWrapW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = Math.min(1, Math.min(wrapW, maxW) / layout.sheetW);
  const viewW = Math.round(layout.sheetW * scale);
  const viewH = Math.round(layout.sheetH * scale);
  const threshold = SNAP_PX / scale; // in real (sheet-resolution) px

  // Snap candidates for one tile's left/top edge: the sheet's printable
  // margin box, plus every OTHER tile's edges (flush-against or gap-apart).
  const candidatesFor = useMemo(
    () => (idx) => {
      const { w, h } = layout.placements[idx];
      const xs = [layout.margin, layout.sheetW - layout.margin - w];
      const ys = [layout.margin, layout.sheetH - layout.margin - h];
      positions.forEach((p, i) => {
        if (i === idx) return;
        const other = layout.placements[i];
        xs.push(p.x, p.x - w - layout.gap, p.x + other.w + layout.gap, p.x + other.w - w);
        ys.push(p.y, p.y - h - layout.gap, p.y + other.h + layout.gap, p.y + other.h - h);
      });
      return { xs, ys };
    },
    [layout, positions],
  );

  function nearest(value, candidates) {
    let best = null;
    let bestDist = threshold;
    for (const c of candidates) {
      const d = Math.abs(c - value);
      if (d <= bestDist) {
        best = c;
        bestDist = d;
      }
    }
    return best;
  }

  return (
    <div ref={wrapRef}>
      <Stage width={viewW} height={viewH}>
        <Layer>
          <Rect x={0} y={0} width={viewW} height={viewH} fill="#ffffff" stroke="#e3dfd3" strokeWidth={1} />
          <Rect
            x={layout.margin * scale}
            y={layout.margin * scale}
            width={(layout.sheetW - layout.margin * 2) * scale}
            height={(layout.sheetH - layout.margin * 2) * scale}
            stroke="#d8d3c4"
            dash={[4, 4]}
            listening={false}
          />

          {layout.placements.map((tile, i) => {
            const p = positions[i] || { x: tile.x, y: tile.y };
            return (
              <KImage
                key={i}
                image={tile.canvas}
                x={p.x * scale}
                y={p.y * scale}
                width={tile.w * scale}
                height={tile.h * scale}
                stroke="#10131a"
                strokeWidth={1}
                draggable
                dragBoundFunc={(pos) => {
                  let x = pos.x / scale;
                  let y = pos.y / scale;
                  x = Math.max(0, Math.min(x, layout.sheetW - tile.w));
                  y = Math.max(0, Math.min(y, layout.sheetH - tile.h));

                  const { xs, ys } = candidatesFor(i);
                  const snappedX = nearest(x, xs);
                  const snappedY = nearest(y, ys);
                  if (snappedX !== null) x = snappedX;
                  if (snappedY !== null) y = snappedY;

                  setGuides({
                    x: snappedX !== null ? x * scale : null,
                    y: snappedY !== null ? y * scale : null,
                  });

                  return { x: x * scale, y: y * scale };
                }}
                onDragEnd={(e) => {
                  setGuides({ x: null, y: null });
                  const next = positions.slice();
                  next[i] = { x: e.target.x() / scale, y: e.target.y() / scale };
                  onPositionsChange(next);
                }}
              />
            );
          })}

          {guides.x !== null && (
            <Line points={[guides.x, 0, guides.x, viewH]} stroke="#c0175a" strokeWidth={1} dash={[3, 3]} listening={false} />
          )}
          {guides.y !== null && (
            <Line points={[0, guides.y, viewW, guides.y]} stroke="#c0175a" strokeWidth={1} dash={[3, 3]} listening={false} />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
