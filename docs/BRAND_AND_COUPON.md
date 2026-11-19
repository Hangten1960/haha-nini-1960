# HANG TEN logo & coupon link – how to update

## 1. Official HANG TEN logo

**Where the logo is used in the game**

| Placement | What is shown | File used |
|---|---|---|
| Blue winter flags (every level, both sides of each finish, castle courtyard) | white footprint on HANG TEN blue | `footprint-white.png` |
| Wooden signposts | small navy footprint in the corner of each sign | `footprint-navy.png` |
| Hidden footprint collectibles (2–3 per level, near golden stars) | blue badge with the white footprint | `footprint-white.png` |
| Aurora Castle (Level 4) | large glowing emblem above the main gate | `footprint-white.png` |
| Level-complete screen | small, faded HANG TEN wordmark signature | `wordmark-navy.png` |
| Main menu, final reward screen, HUD footprint counter | wordmark / footprint | `wordmark-navy.png`, `wordmark-white.png`, `footprint-navy.png` |

**Where the files come from.** The four PNGs in `assets/brand/` were made from the logo files you supplied
(`HANG_TEN_LOGO-1.jpg` wordmark, `HANG_TEN_LOGO-2.jpg` footprint). The black ink was turned into transparency and
recoloured white or navy. Shape and proportions are untouched, and the game always draws them with their original
aspect ratio (`drawLogo` in `src/level/winter/winterProps.js`). Nothing was redrawn.

**To insert a newer or official master file**

1. Export transparent PNGs (logo artwork only, no background). Any size works; about 500–1500 px wide is plenty.
2. Replace the files in `assets/brand/`, keeping the exact names:
   `footprint-white.png`, `footprint-navy.png`, `wordmark-white.png`, `wordmark-navy.png`.
3. Run `npm run build`. The logo appears automatically in every placement above.

`src/assets/brand.js` is the single place the game reads these files from.

## 2. Coupon claim link (final reward)

The reward screen appears only after Level 4 is completed. Its button reads the link from one line in
**`src/reward/rewardConfig.js`**:

```js
export const COUPON_CLAIM_URL = "待補";
```

Replace `待補` with the official https link, then run `npm run build`:

```js
export const COUPON_CLAIM_URL = "https://your-official-coupon-page.example";
```

**Quick edit without rebuilding.** The built single file `dist/index.html` contains the text `"待補"` exactly once.
Replacing it in a text editor with the quoted https link also works.

**Behaviour**

| `COUPON_CLAIM_URL` | Reward screen | Claim button |
|---|---|---|
| `"待補"` or anything that is not an `https://` link | shown normally | disabled, labelled 「優惠券領取連結即將開放 · Awaiting activation」 |
| a valid `https://` link | shown normally | opens exactly that link in a new tab |

The game never invents a link and never says a coupon was issued or redeemed. It only opens the page you configure.
Whether each player can claim once, and checking that they finished the game, have to be handled by that page or
coupon system. The game cannot verify this: progress is stored only in the player's own browser.
