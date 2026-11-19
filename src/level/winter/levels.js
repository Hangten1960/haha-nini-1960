// WINTER WONDERLAND – the four winter levels. Pure data (physics + placement of scenery).
// Difficulty grows one idea at a time:  1 controls → 2 ice + moving wood → 3 floating ice chains + team gates → 4 everything, kindly.
const S = (a) => a.map(([x, y]) => ({ x, y, magic: false }));
const F = (a) => a.map(([x, y]) => ({ x, y }));
const common = { crabs: [], fallingCoconuts: [], challenges: [] };

export const W1 = { ...common,
  id: 'w1', index: 1, name: 'Snowy Village', difficulty: 'Beginner', teaches: 'Moving, jumping and collecting stars', par: 110, minX: -6, maxX: 140,
  spawn: { x: 2, y: 0 }, finishX: 128,
  sky: { top: '#5d8fd6', horizon: '#ffe2c4', fog: '#e9e6ee', sun: '#ffe2bd', sunI: 2.5, aurora: 0.15 },
  decor: { village: [[-8, -6.5, 0], [6, -7.5, 1], [19, -7, 2], [50, -8, 0], [62, -6.8, 1], [108, -7.5, 2], [121, -6.8, 0]], menuZone: [5, 13], gate: true },
  terrain: [
    { x0: -16, x1: 66, pts: [[-16,0],[28,0],[31,0.9],[34,0],[45.9,0],[46,1.0],[56,1.0],[60,0],[66,0]] },
    { x0: 68.2, x1: 100, pts: [[68.2,0],[82,0],[90,1.6],[93,1.6],[97,0.6],[100,0.6]] },
    { x0: 102.6, x1: 150, pts: [[102.6,0.6],[115.9,0.6],[116,1.6],[150,1.6]] },
  ],
  ice: [], platforms: [ { id: 'p1', x: 76, y: 1.8, w: 4.2 } ],
  rollingCoconuts: [ { x0: 92, x1: 80.5, speed: 3.0, period: 6.0, offset: 0, r: 0.5 } ],   // one slow snowball
  stars: [...S([[7,1.3],[10,1.3],[13,1.3],[18,1.6],[19.6,2.6],[21.2,1.6],[25,1.3],[31,2.3],[38,1.3],[41,1.3],[45,2.2],[47.5,2.6],[51,2.3],[54,2.3],[59,1.6],
    [67.1,2.2],[71,1.3],[76,3.2],[76,4.4],[81,1.3],[91,3.0],[94,2.6],[98,2.0],[101.3,2.6],[105,1.9],[108,1.9],[111,1.9],[115.4,3.0],[119,2.9],[122,2.9],[125,2.9]]),
    { x: 76, y: 5.8, magic: true }],
  footprints: F([[31, 3.4], [112.5, 3.9]]),
  checkpoints: [ { x: 57.5, y: 0.7 }, { x: 104, y: 0.6 } ],
  penguins: [ { x: 12, z: -3.6, range: 2.2 }, { x: 40, z: -4.2, range: 2.6 }, { x: 52, z: -3.4, range: 1.6 }, { x: 110, z: -3.8, range: 2.4 } ],
  seals: [ { x: 67.1, z: -5.5 } ],
  flags: [3.5, 44, 63.5, 117], signs: [ { x: 15, text: 'Stars ➜' }, { x: 64.5, text: 'Jump ➜' } ],
  hints: [
    { x0: 3, x1: 14, text: 'Welcome to the winter island! Move with ◀ ▶ and collect the lost stars.' },
    { x0: 16, x1: 24, text: 'Tap JUMP to hop. Hold it longer to jump higher.' },
    { x0: 26, x1: 31, text: 'Hop over the snowdrift.' },
    { x0: 62, x1: 66, text: 'A little frozen pond – run and jump over it.' },
    { x0: 69, x1: 74, text: 'Tap ⇄ to switch bears. HAHA jumps high, NINI can jump twice.' },
    { x0: 78, x1: 86, text: 'A snowball is rolling! Jump over it.' },
    { x0: 31, x1: 33, text: 'Look for hidden HANG TEN footprints!' },
  ],
};

export const W2 = { ...common,
  id: 'w2', index: 2, name: 'Frozen Forest', difficulty: 'Beginner Plus', teaches: 'Slippery ice and moving wooden platforms', par: 150, minX: -6, maxX: 182,
  spawn: { x: 2, y: 0 }, finishX: 170,
  sky: { top: '#3f6fc2', horizon: '#f6d7c8', fog: '#dfe3ef', sun: '#ffd9b8', sunI: 2.4, aurora: 0.3 },
  decor: { forest: 1, gate: true },
  terrain: [
    { x0: -16, x1: 40, pts: [[-16,0],[29,0],[31.5,0.9],[34,0],[40,0]] },
    { x0: 44, x1: 70, pts: [[44,0],[70,0]] },                                                 // 4.0 gap
    { x0: 84, x1: 100, pts: [[84,0.4],[100,0.4]] },
    { x0: 112, x1: 132, pts: [[112,0.4],[132,0.4]] },
    { x0: 146, x1: 195, pts: [[146,0.8],[195,0.8]] },
  ],
  ice: [[14, 25], [49, 61], [117, 128], [152, 160]],                                            // frozen river crossings: slippery
  platforms: [
    { id: 'm1', x: 77, y: 0.6, w: 3.6, move: { ax: 2.5, ay: 0, period: 5.2, phase: 0.75 } },
    { id: 'bridge', x: 106, y: 0.4, w: 12.4, kind: 'bridge' },
    { id: 'm2', x: 136.5, y: 1.2, w: 3.4, move: { ax: 0, ay: 1.0, period: 4.4, phase: 0 } },
    { id: 'm3', x: 141.8, y: 1.4, w: 3.4, move: { ax: 1.6, ay: 0, period: 4.8, phase: 0.25 } },
  ],
  rollingCoconuts: [],
  stars: [...S([[6,1.3],[9,1.3],[12,1.3],[16,1.3],[19,1.3],[22,1.3],[25,1.3],[31.5,2.4],[36,1.3],[41,2.3],[42,2.9],[43,2.3],[47,1.3],[51,1.3],[54,1.3],[57,1.3],[60,1.3],[66,1.3],
    [71.5,2.2],[74.5,1.9],[77,1.9],[79.5,1.9],[82.5,2.4],[87,1.7],[91,1.7],[95,1.7],[100.5,1.7],[103,1.7],[106,2.4],[109,1.7],[111.5,1.7],
    [115,1.7],[119,1.7],[122,1.7],[125,1.7],[129,1.7],[133.5,2.6],[136.5,3.4],[139.2,3.4],[141.8,2.8],[144.5,2.6],[149,2.1],[154,2.1],[158,2.1],[162,2.1]]),
    { x: 106, y: 6.0, magic: true }],
  footprints: F([[36, 3.9], [139.2, 4.9]]),
  checkpoints: [ { x: 46, y: 0 }, { x: 86, y: 0.4 }, { x: 114, y: 0.4 }, { x: 148, y: 0.8 } ],
  penguins: [ { x: 8, z: -3.6, range: 2 }, { x: 64, z: -3.8, range: 2.2 }, { x: 162, z: -3.6, range: 2 } ],
  seals: [ { x: 77, z: -6.0 }, { x: 140, z: -5.4 }, { x: 42, z: -5.8 } ],
  flags: [3.5, 87, 150], signs: [ { x: 11, text: 'Ice ➜' }, { x: 67.5, text: 'River ➜' } ],
  hints: [
    { x0: 9, x1: 15, text: 'Frozen river ahead – ice is slippery! Let go early to stop.' },
    { x0: 36, x1: 40, text: 'A longer jump. Run and jump late.' },
    { x0: 64, x1: 70, text: 'Wait for the moving raft, then hop on.' },
    { x0: 98, x1: 101, text: 'Cross the wooden bridge.' },
    { x0: 129, x1: 132, text: 'Two moving platforms – watch them first.' },
  ],
};

export const W3 = { ...common,
  id: 'w3', index: 3, name: 'Iceberg Adventure', difficulty: 'Early Intermediate', teaches: 'Floating ice, jump after jump, and teamwork', par: 180, minX: -6, maxX: 182,
  spawn: { x: 2, y: 0 }, finishX: 170,
  sky: { top: '#2f5fb4', horizon: '#cfe3f3', fog: '#d6e4f0', sun: '#fff1de', sunI: 2.6, aurora: 0.45 },
  decor: { icebergs: 1, gate: true },
  terrain: [
    { x0: -16, x1: 20, pts: [[-16,0],[20,0]] },
    { x0: 41.5, x1: 66, pts: [[41.5,1.0],[55.9,1.0],[56,5.15],[66,5.15]] },                   // 4.15 snowy cliff → HAHA
    { x0: 81, x1: 100, pts: [[81,0.6],[100,0.6]] },
    { x0: 119.5, x1: 130, pts: [[119.5,0.8],[130,0.8]] },
    { x0: 141.2, x1: 195, pts: [[141.2,0.8],[195,0.8]] },                                     // 11.2 open water → NINI
  ],
  ice: [[84, 92]],
  platforms: [
    { id: 'f1', x: 23.6, y: 0.9, w: 2.8, ice: true, kind: 'floe', move: { ax: 0, ay: 0.25, period: 3.2, phase: 0 } },
    { id: 'f2', x: 28.4, y: 1.6, w: 2.8, ice: true, kind: 'floe', move: { ax: 0, ay: 0.25, period: 3.4, phase: 0.3 } },
    { id: 'f3', x: 33.2, y: 1.0, w: 2.8, ice: true, kind: 'floe', move: { ax: 0, ay: 0.25, period: 3.0, phase: 0.6 } },
    { id: 'f4', x: 38, y: 1.8, w: 2.8, ice: true, kind: 'floe', move: { ax: 0, ay: 0.25, period: 3.6, phase: 0.1 } },
    { id: 'm1', x: 70.3, y: 4.0, w: 3.0, ice: true, kind: 'floe', move: { ax: 2.4, ay: 0, period: 4.8, phase: 0.75 } },
    { id: 'm2', x: 77, y: 2.8, w: 3.0, ice: true, kind: 'floe', move: { ax: 0, ay: 1.2, period: 4.2, phase: 0 } },
    { id: 'f5', x: 103.4, y: 1.4, w: 2.8, ice: true, kind: 'floe', move: { ax: 0, ay: 0.25, period: 3.2, phase: 0.2 } },
    { id: 'f6', x: 107.8, y: 2.2, w: 2.8, ice: true, kind: 'floe', move: { ax: 0, ay: 0.25, period: 3.4, phase: 0.5 } },
    { id: 'f7', x: 112.2, y: 1.4, w: 2.8, ice: true, kind: 'floe', move: { ax: 0, ay: 0.25, period: 3.0, phase: 0.8 } },
    { id: 'f8', x: 116.6, y: 2.0, w: 2.8, ice: true, kind: 'floe', move: { ax: 0, ay: 0.25, period: 3.6, phase: 0.1 } },
  ],
  rollingCoconuts: [],
  stars: [...S([[6,1.3],[9,1.3],[12,1.3],[16,1.3],[23.6,2.4],[26,3.1],[28.4,3.1],[30.8,3.1],[33.2,2.5],[35.6,3.3],[38,3.3],[40,3.1],[45,2.3],[49,2.3],[53,2.3],
    [55.3,3.4],[55.5,5.0],[56.6,7.0],[60,6.5],[63,6.5],[67.5,5.9],[70.3,5.5],[73.6,4.8],[77,4.6],[79.5,3.4],[84,1.9],[88,1.9],[92,1.9],[96,1.9],
    [103.4,2.9],[105.6,3.6],[107.8,3.7],[110,3.6],[112.2,2.9],[114.4,3.4],[116.6,3.5],[122,2.1],[125,2.1],[132.6,3.7],[135.2,3.9],[137.6,3.1],[139.8,2.4],
    [146,2.1],[150,2.1],[154,2.1],[158,2.1],[162,2.1],[166,2.1]]),
    { x: 107.8, y: 6.4, magic: true }],
  footprints: F([[63, 8.2], [150, 4.6], [28.4, 4.6]]),
  checkpoints: [ { x: 43, y: 1.0 }, { x: 52, y: 1.0 }, { x: 62, y: 5.15 }, { x: 83, y: 0.6 }, { x: 121, y: 0.8 }, { x: 143, y: 0.8 } ],
  penguins: [ { x: 9, z: -3.6, range: 2 }, { x: 95, z: -3.6, range: 2.4 }, { x: 160, z: -3.8, range: 2.6 } ],
  seals: [ { x: 30, z: -6.2 }, { x: 110, z: -6.0 }, { x: 135, z: -6.4 } ],
  flags: [3.5, 64, 98, 156], signs: [ { x: 16.5, text: 'Icebergs ➜' }, { x: 126.5, text: 'Float ➜', char: 'nini' }, { x: 52.5, text: 'High jump', char: 'haha' } ],
  hints: [
    { x0: 14, x1: 20, text: 'Floating ice! Hop from floe to floe – they bob and are a little slippery.' },
    { x0: 51.5, x1: 55.9, text: 'A snowy cliff! Only HAHA jumps this high – tap ⇄.', char: 'haha' },
    { x0: 62, x1: 66, text: 'Moving icebergs – time your jumps.' },
    { x0: 124.5, x1: 130, text: 'Open water! NINI: double-jump, then hold JUMP to float.', char: 'nini' },
  ],
};

export const W4 = { ...common,
  id: 'w4', index: 4, name: 'Aurora Castle', difficulty: 'Intermediate', teaches: 'Everything together – reach the castle!', par: 210, minX: -6, maxX: 214,
  spawn: { x: 2, y: 0 }, finishX: 192,
  sky: { top: '#16285e', horizon: '#6b77b8', fog: '#7d86b8', sun: '#cfe0ff', sunI: 1.9, hemi: 0.95, aurora: 1 },
  decor: { castle: 196.5, gate: false },
  terrain: [
    { x0: -16, x1: 18, pts: [[-16,0],[18,0]] },
    { x0: 33.5, x1: 50, pts: [[33.5,3.6],[50,3.6]] },                                         // high snowy plateau
    { x0: 53, x1: 64, pts: [[53,0.8],[64,0.8]] },                                             // ...and down again
    { x0: 83, x1: 120, pts: [[83,1.0],[95.9,1.0],[96,5.15],[104,5.15],[112,2.6],[120,2.6]] },  // HAHA cliff, snowball slope
    { x0: 131.2, x1: 230, pts: [[131.2,2.8],[230,2.8]] },                                     // NINI gap, then the castle courtyard
  ],
  ice: [[136, 146]],
  platforms: [
    { id: 's1', x: 21.2, y: 1.2, w: 3.0, kind: 'icestep' }, { id: 's2', x: 25.6, y: 2.4, w: 3.0, kind: 'icestep' }, { id: 's3', x: 30, y: 3.4, w: 3.0, kind: 'icestep' },
    { id: 'b1', x: 69, y: 1.2, w: 4.0, ice: true, kind: 'icebridge', move: { ax: 2.5, ay: 0, period: 5.0, phase: 0.75 } },
    { id: 'b2', x: 77.6, y: 1.6, w: 4.0, ice: true, kind: 'icebridge', move: { ax: 2.5, ay: 0, period: 5.0, phase: 0.25 } },
  ],
  rollingCoconuts: [ { x0: 105, x1: 118.5, speed: 3.6, period: 5.0, offset: 0, r: 0.5 } ],
  stars: [...S([[6,1.3],[9,1.3],[12,1.3],[16,1.3],[21.2,2.6],[23.4,3.4],[25.6,3.8],[27.8,4.6],[30,4.8],[36,4.9],[40,4.9],[44,4.9],[48,4.9],[51.5,3.6],[56,2.1],[60,2.1],
    [66,2.9],[69,2.6],[73.3,3.4],[77.6,3.0],[81,2.6],[86,2.3],[90,2.3],[95.3,3.4],[95.5,5.0],[96.6,7.0],[100,6.5],[103,6.5],[108,5.2],[114,3.9],[118,3.9],
    [122.6,5.1],[125.2,5.3],[127.6,4.5],[129.8,3.8],[134,4.1],[138,4.1],[142,4.1],[146,4.1],
    // final magical star collection: an arch of stars in front of the castle
    [152,4.6],[155,5.8],[158,6.6],[161,7.0],[164,6.6],[167,5.8],[170,4.6],[176,4.1],[180,4.1],[184,4.1],[188,4.1]]),
    { x: 161, y: 8.6, magic: true }],
  footprints: F([[44, 6.9], [103, 8.2], [184, 6.2]]),
  checkpoints: [ { x: 35, y: 3.6 }, { x: 55, y: 0.8 }, { x: 85, y: 1.0 }, { x: 92.5, y: 1.0 }, { x: 101, y: 5.15 }, { x: 116, y: 2.6 }, { x: 133, y: 2.8 }, { x: 150, y: 2.8 } ],
  penguins: [ { x: 9, z: -3.8, range: 2 }, { x: 58, z: -3.6, range: 2 }, { x: 150, z: -4.2, range: 3 }, { x: 175, z: -4.0, range: 3 } ],
  seals: [ { x: 74, z: -6.2 }, { x: 125, z: -6.0 } ],
  flags: [3.5, 46, 87, 148, 186], signs: [ { x: 14.5, text: 'Castle ➜' }, { x: 92, text: 'High jump', char: 'haha' }, { x: 117, text: 'Float ➜', char: 'nini' } ],
  hints: [
    { x0: 13, x1: 18, text: 'Climb the ice steps up to the snowy plateau.' },
    { x0: 61, x1: 64, text: 'Moving ice bridges – wait, then jump on.' },
    { x0: 91.5, x1: 95.9, text: 'The last cliff – HAHA!', char: 'haha' },
    { x0: 106, x1: 112, text: 'Jump over the rolling snowball.' },
    { x0: 116.5, x1: 120, text: 'Last open water – NINI, float to the castle!', char: 'nini' },
    { x0: 150, x1: 160, text: 'Collect the magical stars under the Northern Lights!' },
  ],
};

export const WINTER_LEVELS = [W1, W2, W3, W4];
for (const L of WINTER_LEVELS) { L.challenges = L.challenges || []; L.decor = L.decor || {}; }
