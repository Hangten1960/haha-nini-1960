# Technical report — World 01: Sunny Beach (V2: eight levels)

> V2 changes (eye fix, eight levels, Star Rush, level select) are listed in `CHANGELOG.md`. The sections below describe
> the engine and still apply; test counts for V2 are 68 headless and 72 browser checks.

## What was built

A playable 2.5D platform adventure: a full 3D world rendered with Three.js, with movement along one lane so it can be
played with left / right / jump / switch on a phone. Everything ships as one 1.35 MB HTML file with no network requests.

### Characters
- The uploaded mascot artwork is the head of each bear: it is cut out of the reference image and mapped onto a soft relief
  so it takes light and can turn slightly. Faces, fur texture, the navy cap with the HT logo and the flower accessories are
  the original pixels, not a redraw.
- **Temporary parts (not from the reference):** the bodies, arms, legs and paws are simple 3D primitives in the artwork's fur
  colours, and blinking uses fur-coloured lids over the original eyes. The head is still a flat illustration seen from the
  front or three-quarter view, not a 3D head.
- All eight animation states exist as procedural (code-driven) animation: idle, walk, run, jump, fall, land, celebrate, wave.
  Step length follows distance travelled to avoid foot sliding.
- A GLB adapter with skeletal-clip cross-fading sits behind the same interface (`docs/GLB_INTEGRATION.md`).

### Gameplay
- HAHA: faster (8.4 vs 6.2), one 4.5-high jump. NINI: 2.3 jump + 1.2 double jump, strong air control, and a slow "petal
  float" while JUMP is held (added to make "better air control" matter).
- Two places need a specific bear: a 4.15 cliff (HAHA only) and an 11.2 gap (NINI only). Both have a signpost and an on-screen hint.
- The other bear follows as a companion; switching swaps who leads.
- World 01 contains: start beach, sandy hills, wooden pier platforms, three moving platforms, a rope bridge, falling and
  rolling coconuts (a soft bonk and knock-back, no damage), three friendly crabs (bounce pads), 52 stars, one hidden magic
  star (in the big palm's crown above the second crab), five checkpoints, and the lighthouse finish.
- Variable jump height, coyote time and jump buffering for forgiving controls. Falling in the sea respawns at the last checkpoint.
- Score = stars ×100 + magic star 1000 + time bonus − small penalties for bonks and falls; 1–3 star rating.
- The scene's colour saturation rises as stars are collected ("the island gets its colours back").

### Presentation
- Ocean shader (shore foam, shallow/deep colour, moving light), gradient sky with sun glow, drifting clouds, distant islands
  with fog, sand with grain and ripples, 3D palms that sway, bushes, ferns, flowers, rocks, surfboards, real-time soft shadows.
- Camera: follow with look-ahead and speed dolly, establishing sweep at level start, orbit shot at the lighthouse.
- UI: main menu, character selection, gameplay HUD (star counter, progress bar, pause, touch pads), level complete, plus
  settings, pause and a five-world list (worlds 2–5 shown as "coming soon"). Portrait phones get a rotate prompt.
- Audio: Web Audio graph with separate music / effects buses, a generative music loop and 13 synthesised effects, each
  replaceable by a file (see README).
- Save: settings, selected bear and best results in `localStorage` (memory fallback if storage is blocked).

## What was tested

**Headless gameplay tests (`npm test`, 26 checks, all pass):** movement and speeds, jump heights, double jump, variable jump,
float, both character gates (exhaustive attempts: HAHA clears the cliff and NINI cannot; NINI crosses the gap and HAHA
cannot), star collection and score, switching, respawn, checkpoints, moving-platform carry, crab bounce, coconut bonk, and
a look-ahead bot finishing the whole level from either starting bear (it has to use both bears).

**Browser tests (`scripts/qa.py`, 54 checks, all pass)** on the real build in Chrome with real key and pointer events:
menu → character select → settings → play → skip intro; keyboard move/jump/double jump/float/switch; HUD star counter;
pause by button and key, resume, restart; checkpoint, fall and respawn; level completion screen and score; save written
and restored after reload; world list; touch pads on an emulated phone including move + jump together; and HUD / menu /
character panel fitting without overlap at 667×375, 740×360, 844×390, 932×430, 1024×768, 1280×720 and 1920×1080.
No console errors in either run.

The bot also played the built game start to finish in the browser (41 of 52 stars, 49 s, no falls); that run is the demo video.

## Not tested, and known limitations

- **No real devices.** Everything ran in desktop Chrome with a software renderer and touch emulation. Frame rate on phones,
  iOS Safari behaviour and real finger ergonomics are unmeasured. The scene is modest (about 130 draw calls and 69k
  triangles per frame, one shadow light), and there is an automatic quality step-down, but that scaler has not been
  exercised on hardware.
- **Audio was never listened to.** The audio code runs without errors, but nobody has heard the result; treat the music and
  effects as unreviewed placeholders.
- **Level length is under target.** The bot finishes in 46–49 s running non-stop. No human playtest was done; a first run
  is likely nearer 1.5–2 minutes than the 2–3 minute target. The level is data-driven (`src/level/world01.js`), so adding
  sections is straightforward.
- **The GLB path is unproven:** implemented, never run with a real model.
- The companion replays the leader's path, so it can be seen making jumps its own stats would not allow.
- Colour restoration uses a CSS filter on the canvas (disabled in Low graphics).
- Worlds 2–5 are names in a list only.
- No fullscreen or orientation lock; no analytics, accounts or online features.
- Branding is text only ("HANG TEN presents"); no official logo artwork is used beyond the HT cap in the mascot art.
