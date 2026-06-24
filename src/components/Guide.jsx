// Lightweight surrounding content (Decision D9): helps ad-program approval and
// is the SEO that brings traffic. Kept short and honest; expand per-country later.
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

      <div className="cols">
        <div>
          <h3>Getting a good result</h3>
          <p>
            Use even, front-on lighting with no harsh shadows behind you. Keep a
            neutral expression and open eyes. If your background is busy, turn on
            background removal and pick the colour your document requires —
            white and light grey are the most common.
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
        notes shown here are a starting point, not legal guidance.
      </p>
    </section>
  );
}
