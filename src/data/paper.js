// Photo-paper sizes for the tile/print sheet (Decision D7, FR8). Plain data so
// new paper sizes are trivial to add. Dimensions in millimetres.

export const PAPERS = [
  { id: '4r', label: '4R (4×6 in)', wmm: 102, hmm: 152 },
  { id: '5r', label: '5R (5×7 in)', wmm: 127, hmm: 178 },
  { id: 'a6', label: 'A6 (105×148 mm)', wmm: 105, hmm: 148 },
  { id: 'a5', label: 'A5 (148×210 mm)', wmm: 148, hmm: 210 },
  { id: 'a4', label: 'A4 (210×297 mm)', wmm: 210, hmm: 297 },
  { id: 'letter', label: 'Letter (8.5×11 in)', wmm: 216, hmm: 279 },
];
