# HANG TEN – HAHA & NINI · WINTER WONDERLAND ADVENTURE

## 3.0.1 — Coupon link activated
- `COUPON_CLAIM_URL` set to the official link `https://bmai.app/07e21eae` (HANG TEN Taiwan member coupon page).
  The 「立即領取優惠券 · CLAIM YOUR REWARD」 button is now active on the final reward screen and opens this link in a new tab.
- Browser QA: 82 checks pass, including the button linking to exactly this URL.

## 3.0.0 — Winter Edition (separate game)

A separate copy of the tropical game (V2.1). The original project, its files and its published link are unchanged:
all 58 original files were verified byte-identical after this work.

### New
- **Winter world.**
  - Twilight sky with animated Northern Lights (strongest at the Aurora Castle).
  - Snowy mountain range, drifting icebergs and a cold sea with frosty shores.
  - Falling snow, snowy pine forests, a village of wooden houses with warm windows, snowmen.
  - Glossy frozen rivers, ice floes, moving ice bridges, and the Aurora Ice Castle.
- **Four levels**, one new idea at a time:

  | # | Level | Difficulty | New idea | Checkpoints |
  |---|---|---|---|---|
  | 1 | Snowy Village | Beginner | moving, jumping, stars, a snowdrift, one slow snowball | 2 |
  | 2 | Frozen Forest | Beginner Plus | slippery ice, moving wooden rafts, a bridge, slightly longer jumps | 4 |
  | 3 | Iceberg Adventure | Early Intermediate | floating ice chains, moving icebergs, first HAHA cliff + NINI gap | 6 |
  | 4 | Aurora Castle | Intermediate | ice steps up and down, moving ice bridges, both gates, star arch, castle arrival | 8 |

- **Slippery ice**: on frozen rivers the bears speed up and stop slowly; floating ice is mildly slippery.
- **Friendly arctic animals**: waddling penguins (village, forest, courtyard) and seals resting on bobbing ice floes.
  They lift their heads and flap their flippers, and cheer at the finish. They are scenery only: no collisions, no enemies.
- **HANG TEN brand**: the official footprint logo on blue flags, signposts, hidden footprint collectibles
  (+250 each, HUD counter) and the castle emblem. The wordmark signature appears on level-complete screens.
  See `docs/BRAND_AND_COUPON.md`.
- **Optional winter outfits**: HAHA in a blue jacket and scarf, NINI in pink. They are on by default and can be
  switched off in Settings. The cap, HT logo, flowers and face are never covered.
- **Final reward screen**: shown only after Level 4, with the exact copy requested. The claim button reads
  `COUPON_CLAIM_URL` (currently "待補", so the button is disabled and marked awaiting activation). Once earned, the
  reward can be reopened from the menu (🎁 MY REWARD).
- **Winter audio** (synthesised placeholders):
  - D-major music-box and celesta music with sleigh bells, and a soft wind/snow ambience.
  - Crystal ice landing and sliding sounds, footprint chime, penguin chirps and seal calls nearby.
  - A castle fanfare and a reward fanfare.
  - Music and sound effects switch off independently.
- **Full-screen landscape layout**: the game fills the whole screen on phones (100 dvh, no bands, no scrolling).
  Desktop windows wider than 2.4:1 or narrower than 4:3 get a centred landscape frame with dark-navy side bands.
- Separate save (`hangten.hahanini.winter.v1`), so it never mixes with the tropical game's progress.

### Fixed (in the winter copy)
- Settings opened from the Pause menu appeared behind it and could not be used. The newest panel is now always on top.
  The same bug exists in the original game; it was left untouched there as requested.
- The built file keeps Chinese text readable (UTF-8), so "待補" can be found and replaced directly.

### Kept from the original engine
Character controller, physics, checkpoints and respawn, camera, phone performance mode, eye fix (glossy lenses with
highlights, 0.13 s blinks).
