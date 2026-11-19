# HANG TEN – HAHA & NINI · Winter Wonderland Adventure

> Separate winter edition of *HAHA & NINI – The Little Island Adventure*. The tropical original is a different project and URL.
> Logo and coupon setup: `docs/BRAND_AND_COUPON.md`. What's new: `CHANGELOG.md`.

Mobile-first 3D platform adventure (Three.js / WebGL): **four winter levels** with a gradual difficulty curve and a final HANG TEN reward.

## Run it

**Just play:** open `dist/index.html` in a modern browser. It is one self-contained file (no server, no network).
To play on a phone, host that single file anywhere (any static host) and open it in landscape.

**Develop:**

```bash
npm install
npm run dev      # builds, watches and serves http://localhost:8080
npm run build    # writes dist/index.html
npm test         # headless gameplay tests (physics, gates, full-level bot run)
```

Optional tooling (needs Python + Playwright + Chrome, and ffmpeg for video):

```bash
python3 scripts/qa_winter.py              # winter browser QA (levels, reward, coupon, logo, eyes, mobile layout)
node tests/reach.mjs                      # every hidden footprint / magic star is reachable
python3 scripts/record_preview.py out.mp4 # four-level gameplay preview
python3 scripts/play_levels.py out_dir 1,2,3,4        # the bot plays the levels in the browser
python3 scripts/play_levels_phone.py 1,2,3,4          # …in phone mode
python3 scripts/eyes.py out_dir           # face close-ups in every animation state
python3 scripts/perf_phone.py file.html 4 # startup time + draw calls on an emulated phone (CPU slowed 4x)
python3 scripts/record_demo.py demo.mp4   # records an autoplay demo
```

URL switches: `?autoplay` (bot plays), `?skipintro`, `?level=N` (start at level N, all unlocked), `?unlock`, `?capture` (manual frame stepping).

## Controls

| Action | Touch | Keyboard |
|---|---|---|
| Move | ◀ ▶ | ← → or A / D |
| Jump (hold for higher; NINI: hold to float) | JUMP | Space, ↑ or W |
| NINI double jump | JUMP again in the air | Space again |
| Switch bear | ⇄ | S, ↓, Shift, X or Tab |
| Pause | ❚❚ | P or Esc |

## The two bears

| | HAHA BEAR | NINI BEAR |
|---|---|---|
| Ground speed | 8.4 | 6.2 |
| Jump | one jump, 4.5 high | 2.3 + double jump 1.2 |
| Air | normal | strong air control, petal float while JUMP is held |
| Needed for | the tall cliff (4.15) | the wide gap (11.2) |

## Project layout

```
index.html                 HTML shell (UI markup)
src/main.js                entry: creates the systems
src/config.js              physics constants
src/core/                  Game (engine + state machine), Simulation, Input, SaveSystem
src/physics/World.js       collision world (terrain, platforms, crabs, coconuts)
src/characters/            CharacterController (physics), stats, animation states,
                           TempBearVisual (temporary), GLBCharacterVisual (future rigs), factory
src/level/                 LevelManager, levels/level01…08 data + index, worlds list, builders/ (sky, ocean, terrain, flora, props, actors), Effects
src/camera/                CameraController
src/ui/                    UISystem + ui.css
src/audio/                 AudioSystem (Web Audio, synth placeholders, file slots)
src/assets/                AssetManager, character asset registry
src/dev/Bot.js             look-ahead autoplay bot (QA + demo recording)
assets/                    mascot artwork cut-outs, depth maps, font
tests/, scripts/           headless tests, build, browser QA, demo recorder
docs/                      technical report, GLB integration guide
```

## Replacing temporary assets

- **Characters → rigged GLB:** see `docs/GLB_INTEGRATION.md`.
- **Audio:** every sound has a name (`jump`, `doubleJump`, `land`, `star`, `magicStar`, `switch`, `bounce`, `bonk`, `bump`, `splash`, `checkpoint`, `click`, `victory`, `music`).
  Put files in `assets/audio/` and register them in `SOUND_FILES` at the top of `src/audio/AudioSystem.js`
  (or call `audio.registerFile(name, url)`). A registered file replaces the synthesised placeholder; `music` is looped.

Font: Fredoka (SIL Open Font License, see `assets/fonts`).
