// HANG TEN brand assets.
//
// These PNGs are made from the OFFICIAL logo files supplied by HANG TEN (HANG_TEN_LOGO-1/-2.jpg): the black ink was
// turned into transparency and recoloured white / navy. Shape and proportions are untouched, and the game always
// draws them with their original aspect ratio (see drawLogo in level/winter/winterProps.js).
//
// To use different official artwork, replace the four files in assets/brand/ (transparent PNG, same names) and run
// `npm run build`. Nothing else needs to change. See docs/BRAND_AND_COUPON.md.
import footprintWhite from '../../assets/brand/footprint-white.png';
import footprintNavy from '../../assets/brand/footprint-navy.png';
import wordmarkWhite from '../../assets/brand/wordmark-white.png';
import wordmarkNavy from '../../assets/brand/wordmark-navy.png';

export const BRAND = { footprintWhite, footprintNavy, wordmarkWhite, wordmarkNavy };
