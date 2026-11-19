// Global tuning constants. Pure data – safe to import from Node tests.
export const PHYS = {
  G: 30,              // gravity (units / s²)
  MAX_FALL: 24,
  STEP: 1 / 120,      // fixed physics step
  COYOTE: 0.1,        // grace period after leaving a ledge
  BUFFER: 0.13,       // jump input buffer
  STEP_UP: 0.35,      // tallest lip the bears walk over without jumping
  HALF_W: 0.42,       // collider half width
  HEIGHT: 1.9,        // collider height
  JUMP_CUT: 5.5,      // releasing jump early caps upward speed (variable jump height)
  CRAB_BOUNCE: 19,    // trampoline speed from a friendly crab
  KILL_Y: -2.4,       // below this the bear has fallen in the sea
  RESPAWN_DELAY: 0.9,
};
export const WATER_Y = -1.0;
export const SAVE_KEY = 'hangten.hahanini.winter.v1';   // separate from the tropical game's save
