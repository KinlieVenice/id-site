// Attire library (Decision D4, FR16). Curated transparent overlays placed with
// affine handles — NOT warped or AI-composited. Files live in /public/attire
// (converted to PNG so every entry loads the same way regardless of source
// format — the originals included a couple of .webp files).
//
// Each entry: { id, group, label, src }. `group` is the picker section.

function attire(id, label) {
  // BASE_URL carries the /id-site/ prefix on GitHub Pages, empty locally.
  return {
    id,
    group: id.startsWith('men') ? 'Men' : 'Women',
    label,
    src: `${import.meta.env.BASE_URL}attire/${id}.png`,
  };
}

export const ATTIRE = [
  attire('men1', 'Suit 1'),
  attire('men2', 'Suit 2'),
  attire('men3', 'Suit 3'),
  attire('men4', 'Suit 4'),
  attire('men6', 'Suit 5'),
  attire('men7', 'Suit 6'),
  attire('men8', 'Suit 7'),
  attire('men9', 'Suit 8'),
  attire('women1', 'Suit 1'),
  attire('women2', 'Suit 2'),
  attire('women3', 'Suit 3'),
  attire('women4', 'Suit 4'),
  attire('women5', 'Suit 5'),
  attire('women6', 'Suit 6'),
  attire('women7', 'Suit 7'),
  attire('women8', 'Suit 8'),
  attire('women9', 'Suit 9'),
];

export const ATTIRE_GROUPS = [...new Set(ATTIRE.map((a) => a.group))];
