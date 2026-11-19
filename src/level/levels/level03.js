// LEVEL 3 – TWO FRIENDS. Longer jumps and smaller platforms; introduces the two team-work spots:
// a tall cliff only HAHA can jump and a wide gap only NINI can float across.
const S = (a) => a.map(([x, y]) => ({ x, y, magic: false }));
export const LEVEL03 = {
  id: 'l3', index: 3, name: 'Two Friends', teaches: 'Longer, more precise jumps', par: 160, minX: -6, maxX: 176,
  spawn: { x: 2, y: 0 }, finishX: 168,
  decor: { magicPalm: 70.5 },
  terrain: [
    { x0: -16, x1: 22, pts: [[-16,0],[22,0]] },
    { x0: 27, x1: 40, pts: [[27,0],[40,0]] },                                       // 5.0 gap before it
    { x0: 62, x1: 100, pts: [[62,1.0],[83.9,1.0],[84,5.15],[100,5.15]] },             // 4.15 cliff → HAHA
    { x0: 113, x1: 130, pts: [[113,0.6],[130,0.6]] },
    { x0: 141.2, x1: 190, pts: [[141.2,0.8],[190,0.8]] },                             // 11.2 gap → NINI
  ],
  platforms: [
    { id: 'p1', x: 43, y: 1.0, w: 2.8 }, { id: 'p2', x: 48, y: 1.8, w: 2.8 }, { id: 'p3', x: 53, y: 1.2, w: 2.8 }, { id: 'p4', x: 58, y: 2.2, w: 2.8 },
    { id: 'p5', x: 104, y: 3.4, w: 3.0 }, { id: 'p6', x: 109.5, y: 2.0, w: 3.0 },
    { id: 's1', x: 150, y: 2.4, w: 2.6 }, { id: 's2', x: 154.6, y: 3.9, w: 2.6 },
  ],
  crabs: [ { id: 'c1', x: 70.5, y: 1.0, amp: 1.3, period: 5.4, phase: 0 } ],
  fallingCoconuts: [], rollingCoconuts: [], challenges: [],
  stars: [...S([[6,1.3],[9,1.3],[12,1.3],[16,1.3],[23,2.6],[24.5,3.0],[26,2.6],[30,1.3],[33,1.3],[36,1.3],
    [43,2.4],[45.5,3.2],[48,3.2],[50.5,3.2],[53,2.6],[55.5,3.4],[58,3.6],[60.7,3.6],[65,2.3],[77,2.3],[80,2.3],[83.3,3.4],[83.5,5.0],[84.6,7.0],
    [88,6.5],[91,6.5],[94,6.5],[97,6.5],[101.5,5.6],[104,4.8],[106.8,4.4],[109.5,3.4],[112,2.8],[117,1.9],[120,1.9],[123,1.9],
    [132.6,3.7],[135.2,3.9],[137.6,3.1],[139.8,2.4],[144,2.1],[147,2.1],[150,3.8],[152.3,4.8],[154.6,5.3],[158,3.2],[161,2.1],[164,2.1]]),
    { x: 70.5, y: 7.8, magic: true }],
  checkpoints: [ { x: 28.5, y: 0 }, { x: 64, y: 1.0 }, { x: 80.4, y: 1.0 }, { x: 96, y: 5.15 }, { x: 125, y: 0.6 }, { x: 143, y: 0.8 } ],
  hints: [
    { x0: 16, x1: 22, text: 'A bigger gap! Run, jump late, and hold JUMP.' },
    { x0: 36, x1: 41, text: 'Small platforms – take them one hop at a time.' },
    { x0: 79.5, x1: 83.9, text: 'A tall cliff! Only HAHA jumps this high – tap ⇄.', char: 'haha' },
    { x0: 124.5, x1: 130, text: 'Too wide to jump! NINI: double-jump, then hold JUMP to float.', char: 'nini' },
  ],
};
