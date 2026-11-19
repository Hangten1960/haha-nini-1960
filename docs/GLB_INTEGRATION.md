# Integrating professional GLB characters

The game never talks to a character model directly. It talks to a **character visual** with this interface:

```js
{ root: THREE.Group,        // origin at the feet, added to the scene by the Game
  height: number,
  update(dt, state),        // state = { anim, vx, vy, facing, speedRef, gliding, landImpact }
  popIn(),                  // small scale pop used when swapping bears
  dispose() }
```

`state.anim` is one of: `idle, walk, run, jump, fall, land, celebrate, wave` (`src/characters/AnimationStates.js`).

Two implementations exist:

- `TempBearVisual` — the current stand-in (original 2D head artwork on a relief + primitive body).
- `GLBCharacterVisual` — loads a rigged GLB, plays skeletal clips with cross-fades.

`createCharacterVisual()` picks the GLB when one is configured and falls back to the temporary bear if loading fails.

## Steps

1. Export each mascot as **GLB** (glTF 2.0 binary): one skinned mesh + skeleton, Y-up, facing **+Z**, feet at the origin,
   animations baked as named clips. Recommended: under ~30k triangles and one 1024–2048 px texture set per bear.
2. Name the clips, or map your names in step 4. Wanted: `Idle, Walk, Run, Jump, Fall, Land, Celebrate, Wave`.
   Loops: Idle, Walk, Run, Fall, Celebrate, Wave. One-shots: Jump, Land.
   Missing clips fall back automatically (run→walk→idle, fall→jump, land→idle, wave/celebrate→idle).
3. Put the files in `assets/characters/` (e.g. `haha.glb`, `nini.glb`).
4. In `src/assets/characters.js` set the `glb` block of each bear:

   ```js
   import hahaGlb from '../../assets/characters/haha.glb';   // bundled into the single HTML file
   glb: { url: hahaGlb, height: 2.0, yawOffset: 0,
          clips: { idle: 'Idle', walk: 'Walk', run: 'Run', jump: 'Jump', fall: 'Fall', land: 'Land', celebrate: 'Celebrate', wave: 'Wave' } }
   ```

   `height` scales the model (world units; the collider is 1.9 tall), `yawOffset` fixes models that do not face +Z.
5. `npm run build`. Nothing else changes: physics, camera, UI and the companion logic are unaffected.

## Notes

- Walk/run playback speed is matched to ground speed, so author those cycles at roughly 6–8 units/s of travel to avoid foot sliding.
- The portraits used in the UI (`portrait` in the same file) are independent of the 3D model.
- Draco / Meshopt compressed GLBs need the matching decoder added to the `GLTFLoader` in `GLBCharacterVisual.js`.
- **Status:** this path is implemented but has not been run with a real mascot model yet, because none exists. Expect a short
  tuning pass (scale, facing, clip names, fade times) with the first real file.
