// LEVEL 4 – LIGHTHOUSE RUN (the original Sunny Beach level, unchanged). Pure level data: everything the simulation and the
// scene builders need. Dynamic objects are pure functions of time (see physics/World.js).
const stars = [
  [8,1.3],[11,1.3],[14,1.3],[19,1.7],[20.5,2.7],[22,1.7],
  [31,3.0],[35,3.9],[39,2.9],[45,3.3],[45,4.7],[45,6.1],[50.5,2.9],
  [59.8,2.3],
  [69.5,2.4],[75.5,3.3],[78.6,3.9],[81.5,2.6],[87,3.6],[89.9,3.4],
  [94,2.0],[98,1.7],[108.3,1.7],[111.8,1.7],[119.2,2.6],[119.4,4.3],[120.6,6.4],
  [125,5.9],[128,5.9],[131,5.9],
  [146,5.6],[151.4,5.7],[155,6.6],[163,4.2],[168.9,3.5],
  [176,1.9],[181,3.4],[185,4.6],[188.5,4.4],
  [198.6,5.3],[201.2,5.5],[203.6,4.7],[205.8,3.9],
  [212,2.9],[225,2.2],[228,2.2],[231,2.2],[237.5,4.4],[237.5,5.9],[240.6,4.3],[244.4,5.9],[248,3.7],
].map(([x, y]) => ({ x, y, magic: false }));

export const LEVEL04 = {
  id: 'l4', index: 4, name: 'Lighthouse Run', teaches: 'Moving platforms', par: 240, minX: -6, maxX: 258,
  decor: { surfboards: -4.6, umbrella: 9.5, magicPalm: 101.0, menuZone: [6, 14] },
  spawn: { x: 2, y: 0 },
  finishX: 252.5,
  // Sand islands: piecewise-linear height profiles along the play lane.
  terrain: [
    { x0: -16, x1: 58, pts: [[-16,0],[26,0],[31,1.6],[35,2.4],[39,1.4],[43,0.4],[47,0.4],[50,1.4],[53,1.2],[55,0.6],[58,0.6]] },
    { x0: 61.5, x1: 66, pts: [[61.5,0.6],[66,0.6]] },
    { x0: 91, x1: 139, pts: [[91,1.0],[96,0.4],[119.9,0.4],[120,4.55],[139,4.55]] },   // 4.15 cliff: HAHA's high jump
    { x0: 170, x1: 196, pts: [[170,1.2],[174,0.6],[178,0.6],[186,3.0],[190,3.0],[193,2.2],[196,2.2]] },
    { x0: 207.2, x1: 222, pts: [[207.2,2.4],[212,1.4],[216,0.8],[222,0.8]] },            // 11.2 gap before it: NINI's float
    { x0: 234, x1: 270, pts: [[234,0.8],[244,0.8],[247,1.6],[250,2.4],[270,2.4]] },
  ],
  // One-way wooden platforms (land on top, pass through from below).
  platforms: [
    { id: 'p1', x: 69.5, y: 1.0, w: 4.0 }, { id: 'p2', x: 75.5, y: 1.9, w: 4.0 },
    { id: 'p3', x: 81.5, y: 1.2, w: 3.5 }, { id: 'p4', x: 87.0, y: 2.2, w: 3.5 },
    { id: 'm1', x: 146, y: 4.0, w: 3.6, move: { ax: 3.5, ay: 0, period: 5.0, phase: 0.75 } },
    { id: 'm2', x: 155, y: 3.2, w: 3.4, move: { ax: 0, ay: 1.6, period: 4.5, phase: 0 } },
    { id: 'm3', x: 163, y: 2.6, w: 3.6, move: { ax: 3.2, ay: 0, period: 5.5, phase: 0.25 } },
    { id: 'bridge', x: 228, y: 0.8, w: 12.6, kind: 'bridge' },
    { id: 's1', x: 240.6, y: 2.7, w: 3.0 }, { id: 's2', x: 244.4, y: 4.3, w: 3.0 },
  ],
  crabs: [
    { id: 'c1', x: 45, y: 0.4, amp: 1.4, period: 5.0, phase: 0 },
    { id: 'c2', x: 101.5, y: 0.4, amp: 1.5, period: 5.6, phase: 0.3 },
    { id: 'c3', x: 237.5, y: 0.8, amp: 1.3, period: 4.8, phase: 0.1 },
  ],
  // Coconuts dropping from palms: hang (telegraph) → fall → rest → regrow.
  fallingCoconuts: [
    { x: 106.5, top: 6.4, ground: 0.4, period: 3.4, offset: 0.0 },
    { x: 110.0, top: 6.8, ground: 0.4, period: 3.4, offset: 1.2 },
    { x: 113.5, top: 6.4, ground: 0.4, period: 3.4, offset: 2.3 },
  ],
  // Coconuts rolling down a dune towards the player.
  rollingCoconuts: [
    { x0: 186.5, x1: 174.6, speed: 4.4, period: 3.7, offset: 0.0, r: 0.45 },
  ],
  stars: [...stars, { x: 101.5, y: 7.3, magic: true }],   // hidden in the big palm's crown – bounce on the crab below
  checkpoints: [ { x: 63.8, y: 0.6 }, { x: 116.4, y: 0.4 }, { x: 134, y: 4.55 }, { x: 191, y: 2.73 }, { x: 219, y: 0.8 } ],
  hints: [
    { x0: 3, x1: 14, text: 'Collect the lost stars to bring the colours back!' },
    { x0: 15, x1: 25, text: 'Tap ⇄ to switch between HAHA and NINI anytime.' },
    { x0: 40.5, x1: 49, text: 'Crabs are friends – hop on one for a big bounce!' },
    { x0: 104, x1: 115, text: 'Watch the wobbling coconuts!' },
    { x0: 115.5, x1: 119.9, text: 'A tall cliff! HAHA jumps the highest.', char: 'haha' },
    { x0: 190.5, x1: 196, text: 'A wide gap! NINI can double-jump, then hold JUMP to float.', char: 'nini' },
    { x0: 176, x1: 186, text: 'Jump over the rolling coconuts!' },
  ],
};
