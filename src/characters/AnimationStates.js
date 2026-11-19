// Animation state names shared by the temporary bears and future GLB rigs.
export const ANIM = { IDLE: 'idle', WALK: 'walk', RUN: 'run', JUMP: 'jump', FALL: 'fall', LAND: 'land', CELEBRATE: 'celebrate', WAVE: 'wave' };

/** Derive the animation state from the physics state. `extra` can force celebrate / wave / land. */
export function deriveAnim(p, runSpeed, extra = {}) {
  if (extra.celebrate) return ANIM.CELEBRATE;
  if (!p.grounded) return p.vy > 0.5 ? ANIM.JUMP : ANIM.FALL;
  if (extra.landTimer > 0) return ANIM.LAND;
  const v = Math.abs(p.vx);
  if (v > runSpeed * 0.62) return ANIM.RUN;
  if (v > 0.25) return ANIM.WALK;
  return extra.wave ? ANIM.WAVE : ANIM.IDLE;
}
