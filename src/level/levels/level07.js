// LEVEL 7 – WINDY CROSSING. Combines what was learned: faster moving platforms back to back, coconuts, longer jumps.
const S = (a) => a.map(([x, y]) => ({ x, y, magic: false }));
export const LEVEL07 = {
  id: 'l7', index: 7, name: 'Windy Crossing', teaches: 'Moving platforms + obstacles + long jumps', par: 220, minX: -6, maxX: 214,
  spawn: { x: 2, y: 0 }, finishX: 206,
  sky: { top: '#4b86d6', horizon: '#ffd9a8', fog: '#f1d6b4', sun: '#ffd29a', sunI: 2.7 },
  decor: { magicPalm: 191 },
  terrain: [
    { x0: -16, x1: 20, pts: [[-16,0],[20,0]] },
    { x0: 26, x1: 44, pts: [[26,0.4],[44,0.4]] },                                              // 6.0 gap
    { x0: 75, x1: 116, pts: [[75,1.0],[90,1.0],[100,3.4],[103.9,3.4],[104,7.55],[116,7.55]] },  // slope with rolling coconuts, then HAHA cliff
    { x0: 142, x1: 156, pts: [[142,2.0],[156,2.0]] },
    { x0: 167.2, x1: 178, pts: [[167.2,2.2],[178,2.2]] },                                       // NINI gap
    { x0: 184.5, x1: 240, pts: [[184.5,1.6],[240,1.6]] },                                       // 6.5 gap
  ],
  platforms: [
    { id: 'm1', x: 50.5, y: 1.6, w: 3.2, move: { ax: 3.2, ay: 0, period: 4.4, phase: 0.75 } },
    { id: 'm2', x: 59.5, y: 2.4, w: 3.0, move: { ax: 0, ay: 1.4, period: 4.0, phase: 0 } },
    { id: 'm3', x: 68, y: 2.2, w: 3.2, move: { ax: 3.4, ay: 0, period: 4.2, phase: 0.25 } },
    { id: 'm4', x: 122.5, y: 6.4, w: 3.0, move: { ax: 3.3, ay: 0, period: 4.0, phase: 0.75 } },
    { id: 'r1', x: 130.5, y: 5.2, w: 3.2 },
    { id: 'm5', x: 137.5, y: 3.6, w: 3.0, move: { ax: 0, ay: 1.6, period: 3.8, phase: 0.5 } },
  ],
  crabs: [ { id: 'c1', x: 191, y: 1.6, amp: 1.3, period: 5.0, phase: 0 } ],
  fallingCoconuts: [
    { x: 32, top: 6.4, ground: 0.4, period: 3.0, offset: 0.0 }, { x: 38, top: 6.6, ground: 0.4, period: 3.0, offset: 1.5 },
    { x: 130.5, top: 10.6, ground: 5.2, period: 3.4, offset: 0.6 },
  ],
  rollingCoconuts: [ { x0: 99.5, x1: 77, speed: 5.0, period: 3.3, offset: 0.0, r: 0.45 } ],
  challenges: [],
  stars: [...S([[5,1.3],[8,1.3],[11,1.3],[15,1.3],[21.5,3.0],[23,3.6],[24.5,3.0],[29,1.7],[35,1.7],[41,1.7],
    [47.5,3.0],[50.5,3.2],[53.5,3.0],[56.6,4.2],[59.5,5.2],[62.4,4.2],[65,3.6],[68,3.8],[71,3.6],[73.8,3.2],
    [80,2.3],[86,2.3],[93,3.2],[97,4.2],[103.3,5.8],[103.5,7.4],[104.6,9.4],[108,8.9],[111,8.9],[114,8.9],
    [119,8.0],[122.5,7.8],[126,7.8],[130.5,6.6],[134,6.2],[137.5,6.4],[140.2,5.0],[146,3.3],[150,3.3],
    [158.6,5.1],[161.2,5.3],[163.6,4.5],[165.8,3.8],[170,3.5],[174,3.5],[179.5,4.6],[181.2,5.0],[183,4.6],[196,2.9],[199,2.9],[202,2.9]]),
    { x: 191, y: 8.4, magic: true }],
  checkpoints: [ { x: 27.5, y: 0.4 }, { x: 42, y: 0.4 }, { x: 76.5, y: 1.0 }, { x: 102, y: 3.4 }, { x: 112, y: 7.55 }, { x: 144, y: 2.0 }, { x: 151.5, y: 2.0 }, { x: 169, y: 2.2 }, { x: 186, y: 1.6 } ],
  hints: [
    { x0: 15, x1: 20, text: 'A long jump! HAHA clears it in one; NINI needs her double jump.' },
    { x0: 40, x1: 44, text: 'Three moving platforms in a row – wait for each one.' },
    { x0: 77, x1: 88, text: 'Rolling coconuts on the hill – jump over them!' },
    { x0: 100.5, x1: 103.9, text: 'Cliff ahead – HAHA!', char: 'haha' },
    { x0: 151, x1: 156, text: 'Wide water – NINI!', char: 'nini' },
  ],
};
