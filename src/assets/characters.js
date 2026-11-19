// Character asset registry.
//
// Each mascot has a TEMPORARY visual (original 2D head artwork on a soft relief +
// a simple primitive body) and an optional professional GLB slot.
// To integrate a rigged model, set `glb.url` (see docs/GLB_INTEGRATION.md) – nothing
// else in the game needs to change.
import hahaHead from '../../assets/characters/haha_portrait.png';
import hahaAux from '../../assets/characters/haha_aux.png';
import niniHead from '../../assets/characters/nini_portrait.png';
import niniAux from '../../assets/characters/nini_aux.png';
import meta from '../../assets/characters/meta.json';

export const CHARACTER_ASSETS = {
  haha: {
    id: 'haha', name: 'HAHA BEAR', personality: 'Friendly & adventurous',
    abilities: ['Fast runner', 'One BIG high jump', 'Climbs tall cliffs'],
    portrait: hahaHead,
    temp: { head: hahaHead, aux: hahaAux, meta: meta.haha, headWidth: 1.34,
            fur: '#8e4d2c', furLight: '#c27a49', cream: '#f3f0e4',
            winter: { jacket: '#2f63b8', jacketLight: '#4a80d4', trim: '#f4f1ea', zip: '#1f2a44', scarf: '#5aa2f0', scarfStripe: '#e9f3ff' } },
    glb: {
      url: null,                    // e.g. new URL('../../assets/characters/haha.glb', import.meta.url).href
      height: 2.0,                  // model is scaled so its bounding box has this height (world units)
      yawOffset: 0,                 // radians, if the model does not face +Z
      clips: { idle: 'Idle', walk: 'Walk', run: 'Run', jump: 'Jump', fall: 'Fall', land: 'Land', celebrate: 'Celebrate', wave: 'Wave' },
    },
  },
  nini: {
    id: 'nini', name: 'NINI BEAR', personality: 'Sweet & curious',
    abilities: ['Double jump', 'Petal float – hold JUMP', 'Precise air control'],
    portrait: niniHead,
    temp: { head: niniHead, aux: niniAux, meta: meta.nini, headWidth: 1.19,
            fur: '#a9552f', furLight: '#cf8351', cream: '#efeadd',
            winter: { jacket: '#f19bb4', jacketLight: '#f7bccd', trim: '#fffaf6', zip: '#c9587a', scarf: '#e5577f', scarfStripe: '#ffe3ec' } },
    glb: {
      url: null, height: 1.9, yawOffset: 0,
      clips: { idle: 'Idle', walk: 'Walk', run: 'Run', jump: 'Jump', fall: 'Fall', land: 'Land', celebrate: 'Celebrate', wave: 'Wave' },
    },
  },
};
