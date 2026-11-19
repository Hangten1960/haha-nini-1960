// Factory: professional GLB when one is configured, otherwise the temporary bear.
import { TempBearVisual } from './TempBearVisual.js';
import { GLBCharacterVisual } from './GLBCharacterVisual.js';

export async function createCharacterVisual(def, assets, opts = {}) {
  if (def.glb && def.glb.url) {
    try { return await GLBCharacterVisual.load(def); }
    catch (err) { console.warn(`[characters] GLB for ${def.id} failed to load – using the temporary bear instead.`, err); }
  }
  return new TempBearVisual(def, assets, opts);
}
