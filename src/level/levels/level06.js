// LEVEL 6 – STAR RUSH. Introduces timed collectible challenges: touch a blue ring and grab every blue star before time runs out.
const S = (a) => a.map(([x, y]) => ({ x, y, magic: false }));
const T = (a) => a.map(([x, y]) => ({ x, y }));
export const LEVEL06 = {
  id: 'l6', index: 6, name: 'Star Rush', teaches: 'Timed star challenges', par: 190, minX: -6, maxX: 192,
  spawn: { x: 2, y: 0 }, finishX: 184,
  sky: { top: '#3a8fe0', horizon: '#f6e6c4', fog: '#eadfc6', sun: '#ffe2ae', sunI: 2.7 },
  decor: { magicPalm: 46.5 },
  terrain: [
    { x0: -16, x1: 60, pts: [[-16,0],[36,0],[40,0.8],[44,0],[60,0]] },
    { x0: 64.5, x1: 116, pts: [[64.5,0.6],[99.9,0.6],[100,4.75],[116,4.75]] },
    { x0: 133, x1: 150, pts: [[133,2.0],[150,2.0]] },
    { x0: 161.2, x1: 215, pts: [[161.2,2.2],[215,2.2]] },
  ],
  platforms: [ { id: 'p1', x: 119.5, y: 3.6, w: 3.0 }, { id: 'p2', x: 124.5, y: 2.4, w: 3.0 }, { id: 'p3', x: 129.5, y: 3.4, w: 3.0 } ],
  crabs: [ { id: 'c1', x: 46.5, y: 0, amp: 1.3, period: 5.2, phase: 0 } ],
  fallingCoconuts: [], rollingCoconuts: [],
  challenges: [
    { trigger: { x: 14, y: 1.2 }, duration: 6, stars: T([[17,1.3],[20,1.3],[23,1.3],[26,1.3],[29,1.3],[32,1.3]]) },
    { trigger: { x: 70, y: 1.8 }, duration: 8, stars: T([[73,1.9],[76,3.2],[79,1.9],[82,3.2],[85,1.9],[88,3.2],[91,1.9]]) },
    { trigger: { x: 112, y: 5.95 }, duration: 9, stars: T([[115,6.0],[119.5,4.9],[124.5,3.7],[129.5,4.7],[134,3.3],[137,3.3]]) },
  ],
  stars: [...S([[5,1.3],[8,1.3],[11,1.3],[40,2.2],[46.5,3.0],[46.5,4.4],[46.5,5.8],[52,1.3],[55,1.3],[58,1.3],[62.2,2.6],[66,1.9],[94,1.9],[97,1.9],
    [99.3,3.0],[99.5,4.6],[100.6,6.6],[104,6.1],[107,6.1],[110,6.1],[137,3.3],[140,3.3],[143,3.3],
    [152.6,5.1],[155.2,5.3],[157.6,4.5],[159.8,3.8],[164,3.5],[168,3.5],[172,3.5],[176,3.5],[180,3.5]]),
    { x: 46.5, y: 7.4, magic: true }],
  checkpoints: [ { x: 66, y: 0.6 }, { x: 96, y: 0.6 }, { x: 108, y: 4.75 }, { x: 135, y: 2.0 }, { x: 145, y: 2.0 }, { x: 163, y: 2.2 } ],
  hints: [
    { x0: 8, x1: 14, text: 'Star Rush! Touch the blue ring, then grab every blue star before the timer ends.' },
    { x0: 66, x1: 70, text: 'This one needs hops. Missed some? Touch the ring to try again.' },
    { x0: 95.5, x1: 99.9, text: 'Tall cliff – switch to HAHA.', char: 'haha' },
    { x0: 108.5, x1: 112, text: 'A rush across the platforms. Ready?' },
    { x0: 144.5, x1: 150, text: 'Wide water – NINI floats.', char: 'nini' },
  ],
};
