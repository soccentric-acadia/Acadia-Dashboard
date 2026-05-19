/**
 * src/data/sim/rng.ts
 *
 * Seeded RNG using seedrandom for deterministic simulation.
 * Falls back to Math.random() when no seed is set.
 */

import seedrandom from "seedrandom";

let _rng: (() => number) = Math.random;
let _seed: string = "";

export function setRngSeed(seed: string) {
    _seed = seed;
    _rng = seed ? seedrandom(seed) : Math.random;
}

export function getRngSeed(): string {
    return _seed;
}

export function rand(): number {
    return _rng();
}

/** Returns a float in [min, max] */
export function randFloat(min: number, max: number): number {
    return min + rand() * (max - min);
}

/** Returns an integer in [min, max] */
export function randInt(min: number, max: number): number {
    return Math.floor(min + rand() * (max - min + 1));
}

/** Returns a random element from an array */
export function randChoice<T>(arr: T[]): T {
    return arr[Math.floor(rand() * arr.length)];
}

/** Returns true with probability p */
export function randBool(p = 0.5): boolean {
    return rand() < p;
}
