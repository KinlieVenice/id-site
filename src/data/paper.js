// Photo-paper sizes for the tile/print sheet (Decision D7, FR8). Plain data so
// new paper sizes are trivial to add. Dimensions in millimetres.

export const PAPERS = [
  { id: '4r', label: '4R (4×6 in)', wmm: 96.52, hmm: 147.32 },
  { id: '5r', label: '5R (5×7 in)', wmm: 121.92, hmm: 172.72 },
  { id: '3r', label: '3R (3.5×5 in)', wmm: 83.82, hmm: 121.92 },
  { id: 'a6', label: 'A6 (105×148 mm)', wmm: 105, hmm: 148 },
  { id: 'a5', label: 'A5 (148×210 mm)', wmm: 148, hmm: 210 },
  { id: 'a4', label: 'A4 (210×297 mm)', wmm: 204.92, hmm: 291.92 },
  { id: 'letter', label: 'Letter (8.5×11 in)', wmm: 216, hmm: 279 },
];
