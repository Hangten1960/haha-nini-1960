// Gameplay stats for the two mascots. Pure data (no rendering imports).
export const CHARACTER_STATS = {
  haha: {
    id: 'haha', name: 'HAHA BEAR',
    speed: 8.4, accel: 70, airAccel: 26,
    jumpHeight: 4.5,            // one big jump
    doubleJump: false, doubleHeight: 0, floatFall: 0,
  },
  nini: {
    id: 'nini', name: 'NINI BEAR',
    speed: 6.2, accel: 85, airAccel: 55,   // precise, strong air control
    jumpHeight: 2.3,
    doubleJump: true, doubleHeight: 1.2,
    floatFall: 2.4,             // hold jump while falling: petals slow her descent
  },
};
export const OTHER = { haha: 'nini', nini: 'haha' };
