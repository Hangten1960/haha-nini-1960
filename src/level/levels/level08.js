// LEVEL 8 – LIGHTHOUSE SUMMIT. Everything together: stones with a moving one, coconuts, two cliffs, two wide gaps,
// moving chains and Star Rush challenges on the way. Checkpoints are close together so every mistake is cheap.
const S = (a) => a.map(([x, y]) => ({ x, y, magic: false }));
const T = (a) => a.map(([x, y]) => ({ x, y }));
export const LEVEL08 = {
  id: 'l8', index: 8, name: 'Lighthouse Summit', teaches: 'Everything together', par: 270, minX: -6, maxX: 252,
  spawn: { x: 2, y: 0 }, finishX: 244,
  sky: { top: '#5a78c8', horizon: '#ffc49a', fog: '#f2c7a8', sun: '#ffc48a', sunI: 2.8 },
  decor: { magicPalm: 231 },
  terrain: [
    { x0: -16, x1: 16, pts: [[-16,0],[16,0]] },
    { x0: 40, x1: 68, pts: [[40,0.8],[57.9,0.8],[58,4.95],[68,4.95]] },
    { x0: 91, x1: 110, pts: [[91,2.0],[96,2.0],[104,4.4],[110,4.4]] },
    { x0: 121.2, x1: 128, pts: [[121.2,4.6],[128,4.6]] },
    { x0: 157.5, x1: 182, pts: [[157.5,3.0],[169.9,3.0],[170,7.15],[182,7.15]] },
    { x0: 202, x1: 212, pts: [[202,3.2],[212,3.2]] },
    { x0: 223.2, x1: 285, pts: [[223.2,3.4],[285,3.4]] },
  ],
  platforms: [
    { id: 'a1', x: 19.4, y: 1.0, w: 2.4 }, { id: 'a2', x: 25.6, y: 1.8, w: 2.6, move: { ax: 1.6, ay: 0, period: 3.8, phase: 0 } }, { id: 'a3', x: 31.8, y: 2.6, w: 2.4 }, { id: 'a4', x: 36.6, y: 1.6, w: 2.4 },
    { id: 'm1', x: 73.5, y: 4.2, w: 3.0, move: { ax: 3.0, ay: 0, period: 4.0, phase: 0.75 } }, { id: 'm2', x: 81.5, y: 3.4, w: 3.0, move: { ax: 0, ay: 1.5, period: 3.6, phase: 0 } }, { id: 'r1', x: 87.5, y: 3.0, w: 2.6 },
    { id: 'b1', x: 131.2, y: 4.0, w: 2.4 }, { id: 'b2', x: 136, y: 5.0, w: 2.2 }, { id: 'b3', x: 140.8, y: 4.0, w: 2.2 },
    { id: 'm3', x: 147, y: 4.6, w: 2.8, move: { ax: 2.4, ay: 0, period: 3.6, phase: 0.75 } }, { id: 'r2', x: 153.6, y: 4.2, w: 2.6 },
    { id: 'd1', x: 185, y: 6.2, w: 2.4 }, { id: 'd2', x: 189.6, y: 5.0, w: 2.4 }, { id: 'd3', x: 194.2, y: 6.0, w: 2.4 }, { id: 'd4', x: 198.8, y: 4.8, w: 2.4 },
  ],
  crabs: [ { id: 'c1', x: 231, y: 3.4, amp: 1.3, period: 5.0, phase: 0 } ],
  fallingCoconuts: [
    { x: 46, top: 6.8, ground: 0.8, period: 2.9, offset: 0.0 }, { x: 51, top: 7.0, ground: 0.8, period: 2.9, offset: 1.4 },
    { x: 153.6, top: 9.6, ground: 4.2, period: 3.3, offset: 0.4 },
  ],
  rollingCoconuts: [ { x0: 103.5, x1: 92.5, speed: 5.0, period: 3.0, offset: 0.0, r: 0.45 } ],
  challenges: [
    { trigger: { x: 62, y: 6.15 }, duration: 12, stars: T([[65,6.2],[67.5,6.2],[73.5,5.5],[81.5,5.2],[87.5,4.3],[92,3.3],[95,3.3]]) },
    { trigger: { x: 174, y: 8.35 }, duration: 10, stars: T([[176.5,8.4],[179.5,8.4],[185,7.5],[189.6,6.3],[194.2,7.3],[198.8,6.1],[203,4.5],[206,4.5]]) },
  ],
  stars: [...S([[5,1.3],[8,1.3],[11,1.3],[19.4,2.4],[22.5,3.0],[25.6,3.2],[28.7,3.6],[31.8,4.0],[34.2,3.6],[36.6,3.0],[38.6,2.6],[43,2.1],[48.5,2.1],[54,2.1],
    [57.3,3.2],[57.5,4.8],[58.6,6.8],[94,3.3],[100,4.6],[107,5.7],[112.6,7.5],[115.2,7.7],[117.6,6.9],[119.8,6.2],[124,5.9],
    [131.2,5.4],[133.6,6.0],[136,6.4],[138.4,6.0],[140.8,5.4],[144,6.0],[147,6.0],[150.4,5.8],[153.6,5.6],[155.8,5.0],[161,4.3],[165,4.3],
    [169.3,5.4],[169.5,7.0],[170.6,9.0],[206,4.5],[209,4.5],[214.6,6.3],[217.2,6.5],[219.6,5.7],[221.8,5.0],[226,4.7],[236,4.7],[239,4.7],[242,4.7]]),
    { x: 231, y: 10.2, magic: true }],
  checkpoints: [ { x: 41.5, y: 0.8 }, { x: 54.6, y: 0.8 }, { x: 64, y: 4.95 }, { x: 92.5, y: 2.0 }, { x: 107.5, y: 4.4 }, { x: 123, y: 4.6 }, { x: 159, y: 3.0 }, { x: 166.5, y: 3.0 }, { x: 178, y: 7.15 }, { x: 203.5, y: 3.2 }, { x: 208, y: 3.2 }, { x: 225, y: 3.4 } ],
  hints: [
    { x0: 10, x1: 16, text: 'The last climb! One of these stones moves – watch it first.' },
    { x0: 53.5, x1: 57.9, text: 'Cliff – HAHA!', char: 'haha' },
    { x0: 59, x1: 62, text: 'A Star Rush over moving platforms. Take a breath, then go!' },
    { x0: 106.5, x1: 110, text: 'Wide water – NINI!', char: 'nini' },
    { x0: 165.5, x1: 169.9, text: 'One more cliff for HAHA.', char: 'haha' },
    { x0: 207, x1: 212, text: 'Last wide gap – NINI, float home!', char: 'nini' },
  ],
};
