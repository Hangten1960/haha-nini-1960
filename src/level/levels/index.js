// WINTER EDITION: the level list is the four winter levels (the tropical levels stay in the original project).
import { WINTER_LEVELS } from '../winter/levels.js';
export const LEVELS = WINTER_LEVELS;
export const levelById = (id) => LEVELS.find((l) => l.id === id);
