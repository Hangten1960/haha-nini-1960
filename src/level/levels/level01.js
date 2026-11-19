// LEVEL 1 – FIRST STEPS. Tutorial: walking, jumping, tiny gaps. No hazards, no character gates.
const S = (a) => a.map(([x, y]) => ({ x, y, magic: false }));
export const LEVEL01 = {
  id: 'l1', index: 1, name: 'First Steps', teaches: 'Moving and jumping', par: 100, minX: -6, maxX: 136,
  spawn: { x: 2, y: 0 }, finishX: 128,
  sky: { top: '#3b97e6', horizon: '#d8f3f7', fog: '#cdeef5', sun: '#fff4dc', sunI: 2.4 },
  decor: { surfboards: -4.6, umbrella: 9.5, magicPalm: 75.6, menuZone: [6, 14] },
  terrain: [
    { x0: -16, x1: 66, pts: [[-16,0],[30,0],[34,0.8],[38,0],[45.9,0],[46,1.0],[56,1.0],[60,0],[66,0]] },
    { x0: 68.2, x1: 100, pts: [[68.2,0],[84,0],[88,1.6],[92,1.6],[96,0.6],[100,0.6]] },
    { x0: 102.6, x1: 150, pts: [[102.6,0.6],[115.9,0.6],[116,1.6],[150,1.6]] },
  ],
  platforms: [ { id: 'p1', x: 76, y: 1.8, w: 4.2 } ],
  crabs: [], fallingCoconuts: [], rollingCoconuts: [], challenges: [],
  stars: [...S([[7,1.3],[10,1.3],[13,1.3],[18,1.6],[19.6,2.6],[21.2,1.6],[26,1.3],[34,2.2],[41,1.3],[45,2.2],[47.5,2.6],[51,2.3],[54,2.3],[59,1.6],
    [67.1,2.2],[71,1.3],[76,3.2],[76,4.4],[81,1.3],[88,3.0],[90,3.0],[92,3.0],[97,2.0],[101.3,2.6],[105,1.9],[108,1.9],[111,1.9],[115.4,3.0],[119,2.9],[122,2.9],[125,2.9]]),
    { x: 76, y: 5.7, magic: true }],
  checkpoints: [ { x: 57.5, y: 0.7 }, { x: 104, y: 0.6 } ],
  hints: [
    { x0: 3, x1: 15, text: 'Welcome! Move with ◀ ▶ and collect the lost stars.' },
    { x0: 16, x1: 24, text: 'Tap JUMP to hop. Hold it longer to jump higher.' },
    { x0: 40, x1: 46, text: 'Jump up onto the ledge!' },
    { x0: 62, x1: 66, text: 'A little gap – run and jump over the water.' },
    { x0: 69, x1: 80, text: 'Tap ⇄ to switch bears. HAHA jumps high, NINI can jump twice.' },
    { x0: 118, x1: 128, text: 'Reach the lighthouse to finish!' },
  ],
};
