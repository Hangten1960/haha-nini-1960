// LEVEL 5 – STEPPING STONES. Consecutive jumps: chains of small stones with no place to rest, stairs up and down.
const S = (a) => a.map(([x, y]) => ({ x, y, magic: false }));
export const LEVEL05 = {
  id: 'l5', index: 5, name: 'Stepping Stones', teaches: 'Jump after jump', par: 180, minX: -6, maxX: 204,
  spawn: { x: 2, y: 0 }, finishX: 196,
  sky: { top: '#2a86e2', horizon: '#ccefec', fog: '#c2ebe9', sun: '#fff0cf', sunI: 2.6 },
  decor: { magicPalm: 144.5 },
  terrain: [
    { x0: -16, x1: 14, pts: [[-16,0],[14,0]] },
    { x0: 47.4, x1: 72, pts: [[47.4,1.2],[59.9,1.2],[60,5.35],[72,5.35]] },
    { x0: 96.5, x1: 128, pts: [[96.5,3.0],[108,3.0],[116,0.6],[128,0.6]] },
    { x0: 139.2, x1: 150, pts: [[139.2,0.8],[150,0.8]] },
    { x0: 179, x1: 225, pts: [[179,1.0],[225,1.0]] },
  ],
  platforms: [
    { id: 'a1', x: 17.6, y: 1.0, w: 2.4 }, { id: 'a2', x: 22.6, y: 1.8, w: 2.4 }, { id: 'a3', x: 27.6, y: 1.0, w: 2.4 }, { id: 'a4', x: 32.8, y: 2.0, w: 2.4 }, { id: 'a5', x: 38, y: 2.8, w: 2.4 }, { id: 'a6', x: 43.2, y: 2.0, w: 2.4 },
    { id: 'b1', x: 75, y: 4.4, w: 2.4 }, { id: 'b2', x: 79.5, y: 3.2, w: 2.4 }, { id: 'b3', x: 84, y: 4.2, w: 2.4 }, { id: 'b4', x: 88.5, y: 5.2, w: 2.4 }, { id: 'b5', x: 93, y: 4.2, w: 2.4 },
    { id: 'c1', x: 153, y: 1.6, w: 2.2 }, { id: 'c2', x: 157.6, y: 2.6, w: 2.2 }, { id: 'c3', x: 162.2, y: 3.6, w: 2.2 }, { id: 'c4', x: 166.8, y: 2.6, w: 2.2 }, { id: 'c5', x: 171.4, y: 1.6, w: 2.2 }, { id: 'c6', x: 176, y: 2.4, w: 2.2 },
  ],
  crabs: [ { id: 'c1', x: 144.5, y: 0.8, amp: 1.2, period: 5.0, phase: 0 } ],
  fallingCoconuts: [], rollingCoconuts: [], challenges: [],
  stars: [...S([[5,1.3],[8,1.3],[11,1.3],[17.6,2.4],[20.1,3.0],[22.6,3.2],[25.1,3.0],[27.6,2.4],[30.2,3.2],[32.8,3.4],[35.4,4.0],[38,4.2],[40.6,4.0],[43.2,3.4],[45.6,3.2],
    [51,2.5],[54,2.5],[59.3,3.6],[59.5,5.2],[60.6,7.2],[64,6.7],[67,6.7],[70,6.7],[75,5.8],[77.2,5.4],[79.5,4.6],[81.8,5.2],[84,5.6],[86.2,6.2],[88.5,6.6],[90.8,6.2],[93,5.6],
    [100,4.3],[104,4.3],[112,3.2],[119,1.9],[122,1.9],[130.6,3.7],[133.2,3.9],[135.6,3.1],[137.8,2.4],
    [153,3.0],[155.3,3.8],[157.6,4.0],[159.9,4.8],[162.2,5.0],[164.5,4.8],[166.8,4.0],[169.1,3.8],[171.4,3.0],[173.7,3.6],[176,3.8],[182,2.3],[186,2.3],[190,2.3]]),
    { x: 144.5, y: 7.6, magic: true }],
  checkpoints: [ { x: 49, y: 1.2 }, { x: 56.4, y: 1.2 }, { x: 68, y: 5.35 }, { x: 98, y: 3.0 }, { x: 123, y: 0.6 }, { x: 141, y: 0.8 }, { x: 181, y: 1.0 } ],
  hints: [
    { x0: 8, x1: 14, text: 'Stepping stones! Keep hopping – there is no room to stop.' },
    { x0: 55.5, x1: 59.9, text: 'Tall cliff – HAHA time!', char: 'haha' },
    { x0: 68, x1: 72, text: 'Down and up the stairs. Look before each hop.' },
    { x0: 122.5, x1: 128, text: 'Wide water – NINI can float across.', char: 'nini' },
    { x0: 146, x1: 150, text: 'One more chain of stones. You can do it!' },
  ],
};
