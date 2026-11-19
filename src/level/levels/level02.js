// LEVEL 2 – COCONUT GROVE. Introduces simple obstacles one at a time: first friendly crabs, later falling coconuts.
const S = (a) => a.map(([x, y]) => ({ x, y, magic: false }));
export const LEVEL02 = {
  id: 'l2', index: 2, name: 'Coconut Grove', teaches: 'Crabs and coconuts', par: 130, minX: -6, maxX: 160,
  spawn: { x: 2, y: 0 }, finishX: 152,
  decor: { surfboards: -4.6, magicPalm: 111.5 },
  terrain: [
    { x0: -16, x1: 48, pts: [[-16,0],[26,0],[30,0.9],[33,0],[35.9,0],[36,1.2],[48,1.2]] },
    { x0: 51, x1: 64, pts: [[51,0.4],[64,0.4]] },
    { x0: 85, x1: 130, pts: [[85,0.4],[118,0.4],[124,2.0],[130,2.0]] },
    { x0: 133.5, x1: 175, pts: [[133.5,1.2],[175,1.2]] },
  ],
  platforms: [ { id: 'p1', x: 68.5, y: 1.0, w: 4.0 }, { id: 'p2', x: 74.5, y: 1.6, w: 4.0 }, { id: 'p3', x: 80.5, y: 1.0, w: 4.0 } ],
  crabs: [ { id: 'c1', x: 20, y: 0, amp: 1.4, period: 5.2, phase: 0 }, { id: 'c2', x: 112, y: 0.4, amp: 1.4, period: 5.6, phase: 0.3 } ],
  fallingCoconuts: [ { x: 95, top: 6.4, ground: 0.4, period: 4.2, offset: 0.0 }, { x: 102, top: 6.6, ground: 0.4, period: 4.2, offset: 2.0 } ],
  rollingCoconuts: [], challenges: [],
  stars: [...S([[6,1.3],[9,1.3],[12,1.3],[20,3.0],[20,4.4],[20,5.8],[26,1.4],[30,2.4],[35.4,2.6],[39,2.5],[42,2.5],[45,2.5],[49.5,2.8],
    [54,1.7],[57,1.7],[60,1.7],[68.5,2.4],[71.5,3.0],[74.5,3.0],[77.5,3.0],[80.5,2.4],[83.6,2.6],[88,1.7],[91,1.7],[98.5,1.7],[105.5,1.7],[108.5,1.7],
    [120,2.6],[123,3.4],[127,3.3],[131.8,3.6],[136,2.5],[139,2.5],[142,2.5],[145,2.5],[148,2.5]]),
    { x: 112, y: 7.3, magic: true }],
  checkpoints: [ { x: 53, y: 0.4 }, { x: 87, y: 0.4 }, { x: 116.5, y: 0.4 } ],
  hints: [
    { x0: 14, x1: 25, text: 'Crabs are friends – hop on one for a big bounce!' },
    { x0: 31, x1: 36, text: 'Jump up the ledge.' },
    { x0: 62, x1: 67, text: 'Hop across the wooden platforms.' },
    { x0: 89, x1: 104, text: 'Wobbling coconuts are about to fall – wait, then walk under.' },
  ],
};
