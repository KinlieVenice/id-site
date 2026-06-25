import { PRESETS, PRESET_GROUPS, presetPixels } from '../data/presets.js';

// Lightweight surrounding content (Decision D9): helps ad-program approval and
// is the SEO that brings traffic. The reference table is generated from the same
// preset data the tool uses, so the guide can never drift out of sync.
export default function Guide() {
  return (
    <section className="guide">
      <h2>About ID &amp; passport photos</h2>
      <p>
        Most ID, passport, and visa photos share the same handful of rules: a
        fixed size in millimetres or inches, a plain background, your face
        centred and looking straight at the camera with a neutral expression,
        and a high enough resolution to print sharply (usually 300&nbsp;dpi).
        This tool handles the size, background, and print layout for you — and
        does all of it in your browser, so your photo never leaves your device.
      </p>

      <h2 style={{ marginTop: 28 }}>Passport &amp; ID photo size guide — by country</h2>
      <p>
        Passport photo sizes are <b>not interchangeable</b> across countries.
        Most of the world uses the ICAO standard of 35×45&nbsp;mm, but major
        exceptions exist — the USA uses 51×51&nbsp;mm (2×2&nbsp;in), Canada uses
        50×70&nbsp;mm, Brazil uses 30×40&nbsp;mm. A 35×45&nbsp;mm photo cannot be
        used for a US passport, and a US-format photo will be rejected for a
        Schengen visa. Always confirm the exact size for the specific country and
        document you are applying for. Every size below is selectable in the tool
        (pixels shown at 300&nbsp;dpi).
      </p>

      <div className="ref-table-wrap">
        <table className="ref-table">
          <thead>
            <tr>
              <th>Format</th>
              <th>Size (W×H)</th>
              <th>Inches</th>
              <th>Pixels @ 300 dpi</th>
            </tr>
          </thead>
          <tbody>
            {PRESET_GROUPS.map((group) => (
              <GroupRows key={group} group={group} />
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--ink-3)' }}>
        This list is not exhaustive, and requirements change and vary by
        consulate. Need something not listed? Use the <b>Custom size</b> option to
        enter any width and height in mm, cm, or inches.
      </p>

      <div className="cols" style={{ marginTop: 24 }}>
        <div>
          <h3>Converting mm, inches &amp; pixels</h3>
          <p>
            <b>mm → inches:</b> divide by 25.4 (35&nbsp;mm = 1.38&nbsp;in).{' '}
            <b>mm → pixels at 300&nbsp;dpi:</b> multiply by 11.81 (35&nbsp;mm =
            413&nbsp;px). The US &ldquo;2×2&nbsp;inch&rdquo; format equals exactly
            50.8×50.8&nbsp;mm, i.e. 600×600&nbsp;px at 300&nbsp;dpi.
          </p>
        </div>
        <div>
          <h3>Getting a good result</h3>
          <p>
            Use even, front-on lighting with no harsh shadows. Keep a neutral
            expression and open eyes. If your background is busy, turn on
            background removal and pick the colour your document requires — white
            and light grey are the most common.
          </p>
        </div>
        <div>
          <h3>Printing at home or at a shop</h3>
          <p>
            Use the print sheet to tile several copies onto standard photo paper
            (4R, 5R, A4, Letter). Print at 100% / actual size — never &ldquo;fit
            to page&rdquo;, which rescales and breaks the measurements. Then cut
            along the guide border.
          </p>
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: '0.8rem', color: 'var(--ink-3)' }}>
        Requirements change and vary by consulate. Always confirm the current
        official specification for your document before submitting. The size
        notes here are a starting point, not legal guidance.
      </p>
    </section>
  );
}

function GroupRows({ group }) {
  const rows = PRESETS.filter((p) => p.group === group);
  return (
    <>
      <tr className="grouprow">
        <td colSpan={4}>{group}</td>
      </tr>
      {rows.map((p) => {
        const { w, h } = presetPixels(p);
        const inW = (p.wmm / 25.4).toFixed(2);
        const inH = (p.hmm / 25.4).toFixed(2);
        return (
          <tr key={p.id}>
            <td>{p.label}</td>
            <td className="num">
              {Math.round(p.wmm)}×{Math.round(p.hmm)} mm
            </td>
            <td className="num">
              {inW}×{inH} in
            </td>
            <td className="num">
              {w}×{h} px
            </td>
          </tr>
        );
      })}
    </>
  );
}
